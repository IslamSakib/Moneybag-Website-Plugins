<?php
if (!defined('ABSPATH')) {
    exit;
}

class MoneyBagCrmIntegration {
    
    private static $api_key;
    private static $base_url;
    
    public static function init() {
        self::$api_key = get_option('moneybag_crm_api_key', '');
        self::$base_url = get_option('moneybag_crm_base_url', '');
    }
    
    public static function sync_merchant($data) {
        if (!self::is_enabled()) {
            return false;
        }
        
        // Create person in CRM
        $person_id = self::create_person([
            'name' => $data['contactName'] ?? '',
            'email' => $data['email'] ?? '',
            'phone' => $data['mobile'] ?? '',
            'company' => $data['merchantName'] ?? ''
        ]);
        
        if (!$person_id) {
            return false;
        }
        
        // Create opportunity
        $opportunity_id = self::create_opportunity([
            'title' => sprintf('Merchant Registration - %s', $data['merchantName'] ?? 'Unknown'),
            'person_id' => $person_id,
            'stage' => 'new',
            'amount' => $data['maxAmount'] ?? 0,
            'probability' => 70,
            'expected_close_date' => date('Y-m-d', strtotime('+30 days'))
        ]);
        
        if (!$opportunity_id) {
            return false;
        }
        
        // Add note with full details
        self::add_note($opportunity_id, self::format_merchant_details($data));
        
        return true;
    }
    
    public static function sync_consultation($data) {
        if (!self::is_enabled()) {
            return false;
        }
        
        // Create person in CRM
        $person_id = self::create_person([
            'name' => $data['name'] ?? '',
            'email' => $data['email'] ?? '',
            'phone' => $data['mobile'] ?? '',
            'company' => $data['businessName'] ?? ''
        ]);
        
        if (!$person_id) {
            return false;
        }
        
        // Create opportunity
        $opportunity_id = self::create_opportunity([
            'title' => sprintf('Consultation Request - %s', $data['businessName'] ?? 'Unknown'),
            'person_id' => $person_id,
            'stage' => 'qualified',
            'amount' => $data['estimatedAmount'] ?? 0,
            'probability' => 50,
            'expected_close_date' => date('Y-m-d', strtotime('+14 days'))
        ]);
        
        if (!$opportunity_id) {
            return false;
        }
        
        // Add note with consultation details
        self::add_note($opportunity_id, self::format_consultation_details($data));
        
        return true;
    }
    
    private static function is_enabled() {
        return !empty(self::$api_key) && !empty(self::$base_url);
    }
    
    private static function create_person($data) {
        $endpoint = self::$base_url . '/api/people';
        
        $response = wp_remote_post($endpoint, [
            'headers' => [
                'Authorization' => 'Bearer ' . self::$api_key,
                'Content-Type' => 'application/json'
            ],
            'body' => wp_json_encode([
                'name' => [
                    'firstName' => explode(' ', $data['name'])[0] ?? '',
                    'lastName' => explode(' ', $data['name'])[1] ?? ''
                ],
                'emails' => [
                    ['email' => $data['email'], 'primary' => true]
                ],
                'phones' => [
                    ['number' => $data['phone'], 'primary' => true]
                ],
                'company' => [
                    'name' => $data['company']
                ]
            ]),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            error_log('CRM Person Creation Error: ' . $response->get_error_message());
            return false;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        return $body['data']['id'] ?? false;
    }
    
    private static function create_opportunity($data) {
        $endpoint = self::$base_url . '/api/opportunities';
        
        $response = wp_remote_post($endpoint, [
            'headers' => [
                'Authorization' => 'Bearer ' . self::$api_key,
                'Content-Type' => 'application/json'
            ],
            'body' => wp_json_encode([
                'title' => $data['title'],
                'personId' => $data['person_id'],
                'stage' => $data['stage'],
                'amount' => [
                    'amountMicros' => $data['amount'] * 1000000,
                    'currencyCode' => 'BDT'
                ],
                'probability' => $data['probability'],
                'closeDate' => $data['expected_close_date']
            ]),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            error_log('CRM Opportunity Creation Error: ' . $response->get_error_message());
            return false;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        return $body['data']['id'] ?? false;
    }
    
    private static function add_note($opportunity_id, $content) {
        $endpoint = self::$base_url . '/api/notes';
        
        $response = wp_remote_post($endpoint, [
            'headers' => [
                'Authorization' => 'Bearer ' . self::$api_key,
                'Content-Type' => 'application/json'
            ],
            'body' => wp_json_encode([
                'opportunityId' => $opportunity_id,
                'content' => $content,
                'createdAt' => current_time('c')
            ]),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            error_log('CRM Note Creation Error: ' . $response->get_error_message());
            return false;
        }
        
        return true;
    }
    
    private static function format_merchant_details($data) {
        $content = "**Merchant Registration Details**\n\n";
        
        $content .= "**Business Information:**\n";
        $content .= "- Legal Identity: " . ($data['legalIdentity'] ?? 'N/A') . "\n";
        $content .= "- Business Category: " . ($data['businessCategory'] ?? 'N/A') . "\n";
        $content .= "- Monthly Transaction Volume: " . ($data['monthlyVolume'] ?? 'N/A') . "\n";
        $content .= "- Maximum Transaction Amount: " . ($data['maxAmount'] ?? 'N/A') . "\n";
        $content .= "- Currency Type: " . ($data['currencyType'] ?? 'N/A') . "\n";
        $content .= "- Service Types: " . implode(', ', $data['serviceTypes'] ?? []) . "\n\n";
        
        $content .= "**Online Presence:**\n";
        $content .= "- Merchant Name: " . ($data['merchantName'] ?? 'N/A') . "\n";
        $content .= "- Trading Name: " . ($data['tradingName'] ?? 'N/A') . "\n";
        $content .= "- Domain: " . ($data['domainName'] ?? 'N/A') . "\n\n";
        
        $content .= "**Contact Information:**\n";
        $content .= "- Contact Name: " . ($data['contactName'] ?? 'N/A') . "\n";
        $content .= "- Designation: " . ($data['designation'] ?? 'N/A') . "\n";
        $content .= "- Email: " . ($data['email'] ?? 'N/A') . "\n";
        $content .= "- Mobile: " . ($data['mobile'] ?? 'N/A') . "\n";
        $content .= "- Phone: " . ($data['phone'] ?? 'N/A') . "\n\n";
        
        $content .= "**Documents Uploaded:**\n";
        $content .= "- Logo: " . (!empty($data['logo']) ? 'Yes' : 'No') . "\n";
        $content .= "- Trade License: " . (!empty($data['tradeLicense']) ? 'Yes' : 'No') . "\n";
        $content .= "- ID Document: " . (!empty($data['idDocument']) ? 'Yes' : 'No') . "\n";
        $content .= "- TIN Certificate: " . (!empty($data['tinCertificate']) ? 'Yes' : 'No') . "\n";
        
        return $content;
    }
    
    private static function format_consultation_details($data) {
        $content = "**Consultation Request Details**\n\n";
        
        $content .= "**Business Information:**\n";
        $content .= "- Business Name: " . ($data['businessName'] ?? 'N/A') . "\n";
        $content .= "- Domain: " . ($data['domain'] ?? 'N/A') . "\n";
        $content .= "- Legal Identity: " . ($data['legalIdentity'] ?? 'N/A') . "\n";
        $content .= "- Business Category: " . ($data['businessCategory'] ?? 'N/A') . "\n\n";
        
        $content .= "**Transaction Details:**\n";
        $content .= "- Monthly Volume: " . ($data['monthlyVolume'] ?? 'N/A') . "\n";
        $content .= "- Maximum Amount: " . ($data['maxAmount'] ?? 'N/A') . "\n";
        $content .= "- Service Type: " . ($data['serviceType'] ?? 'N/A') . "\n\n";
        
        $content .= "**Contact Information:**\n";
        $content .= "- Name: " . ($data['name'] ?? 'N/A') . "\n";
        $content .= "- Email: " . ($data['email'] ?? 'N/A') . "\n";
        $content .= "- Mobile: " . ($data['mobile'] ?? 'N/A') . "\n\n";
        
        if (!empty($data['pricingDetails'])) {
            $content .= "**Recommended Pricing:**\n";
            $content .= "- Card Rate: " . ($data['pricingDetails']['cardRate'] ?? 'N/A') . "\n";
            $content .= "- Wallet Rate: " . ($data['pricingDetails']['walletRate'] ?? 'N/A') . "\n";
            $content .= "- Setup Fee: " . ($data['pricingDetails']['setupFee'] ?? 'N/A') . "\n";
        }
        
        return $content;
    }
}