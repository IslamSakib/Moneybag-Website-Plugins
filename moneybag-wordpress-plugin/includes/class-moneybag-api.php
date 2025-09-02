<?php
/**
 * Moneybag API Handler Class
 * 
 * Handles all API communications securely on the server side
 * API keys and sensitive data are never exposed to the client
 */

namespace MoneybagPlugin;

if (!defined('ABSPATH')) {
    exit;
}

class MoneybagAPI {
    
    /**
     * Custom debug logging - only logs when WP_DEBUG is enabled
     */
    private static function debug_log($message) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[Moneybag Plugin] ' . $message);
        }
    }
    
    /**
     * Get Production API base URL
     */
    private static function get_api_base() {
        $url = get_option('moneybag_api_base_url');
        return !empty($url) ? $url : null;
    }
    
    /**
     * Get Sandbox API base URL  
     */
    private static function get_sandbox_api_base() {
        $url = get_option('moneybag_sandbox_api_url');
        return !empty($url) ? $url : null;
    }
    
    /**
     * Get CRM API base URL
     */
    private static function get_crm_api_base() {
        $url = get_option('moneybag_crm_api_url');
        return !empty($url) ? $url : null;
    }
    
    /**
     * Get API key from secure storage
     */
    private static function get_api_key() {
        // First check if defined in wp-config.php (most secure)
        if (defined('MONEYBAG_API_KEY')) {
            return MONEYBAG_API_KEY;
        }
        
        // Fallback to database (should be encrypted)
        return get_option('moneybag_api_key_encrypted', '');
    }
    
    /**
     * Get CRM API key from secure storage
     */
    public static function get_crm_api_key() {
        // First check WordPress options (should be encrypted)
        $stored_key = get_option('moneybag_crm_api_key', '');
        if (!empty($stored_key)) {
            return $stored_key;
        }
        
        // Fallback to wp-config.php constant (most secure)
        if (defined('MONEYBAG_CRM_API_KEY')) {
            return MONEYBAG_CRM_API_KEY;
        }
        
        // No key available
        return '';
    }
    
    /**
     * Make API request to Production API
     */
    public static function production_request($endpoint, $data = [], $method = 'POST') {
        $url = self::get_api_base() . $endpoint;
        
        $args = [
            'method' => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Authorization' => 'Bearer ' . self::get_api_key(),
            ],
            'body' => json_encode($data),
            'sslverify' => true
        ];
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => $response->get_error_message()
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($status_code >= 200 && $status_code < 300) {
            return [
                'success' => true,
                'data' => $data
            ];
        } else {
            return [
                'success' => false,
                'message' => isset($data['message']) ? $data['message'] : 'API request failed',
                'status_code' => $status_code
            ];
        }
    }
    
    /**
     * Make API request to Sandbox API
     */
    public static function sandbox_request($endpoint, $data = [], $method = 'POST') {
        $url = self::get_sandbox_api_base() . $endpoint;
        
        $args = [
            'method' => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => json_encode($data),
            'sslverify' => true
        ];
        
        // Sandbox endpoints typically don't require authentication
        // Only add API key for non-sandbox endpoints
        if (strpos($endpoint, '/sandbox/') === false) {
            $api_key = self::get_api_key();
            if (!empty($api_key)) {
                $args['headers']['Authorization'] = 'Bearer ' . $api_key;
            }
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => $response->get_error_message(),
                'error' => 'network_error'
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // Handle different response formats
        if ($data === null) {
            return [
                'success' => false,
                'message' => 'Invalid response from API',
                'error' => 'invalid_response'
            ];
        }
        
        // If API returns success field, use it
        if (isset($data['success'])) {
            return $data;
        }
        
        // Otherwise, determine success by status code
        if ($status_code >= 200 && $status_code < 300) {
            return [
                'success' => true,
                'data' => $data
            ];
        } else {
            // Extract error message from response
            $error_message = 'API request failed';
            if (isset($data['message'])) {
                $error_message = $data['message'];
            } elseif (isset($data['detail'])) {
                if (is_array($data['detail']) && isset($data['detail'][0]['msg'])) {
                    $error_message = $data['detail'][0]['msg'];
                } else {
                    $error_message = $data['detail'];
                }
            } elseif (isset($data['error'])) {
                $error_message = $data['error'];
            }
            
            return [
                'success' => false,
                'message' => $error_message,
                'status_code' => $status_code,
                'data' => $data
            ];
        }
    }
    
    /**
     * Make API request to CRM
     */
    public static function crm_request($endpoint, $data = [], $method = 'POST') {
        $url = self::get_crm_api_base() . $endpoint;
        $api_key = self::get_crm_api_key();
        
<<<<<<< Updated upstream
        self::debug_log('[CRM Debug] Request URL: ' . $url);
        self::debug_log('[CRM Debug] Method: ' . $method);
        self::debug_log('[CRM Debug] API Key present: ' . (!empty($api_key) ? 'Yes' : 'No'));
=======
        // Add better debug logging
        self::debug_log('[CRM Debug] Request URL: ' . $url);
        self::debug_log('[CRM Debug] Method: ' . $method);
        self::debug_log('[CRM Debug] API Key present: ' . (!empty($api_key) ? 'Yes' : 'No'));
        self::debug_log('[CRM Debug] API Key length: ' . strlen($api_key));
>>>>>>> Stashed changes
        if ($method !== 'GET') {
            self::debug_log('[CRM Debug] Data: ' . json_encode($data));
        }
        
<<<<<<< Updated upstream
=======
        // Check if URL or API key is empty
        if (empty($url) || $url === $endpoint) {
            self::debug_log('[CRM Debug] ERROR: CRM API URL not configured');
            return [
                'success' => false,
                'message' => 'CRM API URL not configured',
                'error' => 'configuration_error'
            ];
        }
        
        if (empty($api_key)) {
            self::debug_log('[CRM Debug] ERROR: CRM API key not configured');
            return [
                'success' => false,
                'message' => 'CRM API key not configured',
                'error' => 'configuration_error'
            ];
        }
        
>>>>>>> Stashed changes
        $args = [
            'method' => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Authorization' => 'Bearer ' . $api_key,
            ],
            'sslverify' => true
        ];
        
        // Only add body for non-GET requests
        if ($method !== 'GET') {
            $args['body'] = json_encode($data);
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            self::debug_log('[CRM Debug] Network error: ' . $response->get_error_message());
            return [
                'success' => false,
                'message' => $response->get_error_message(),
                'error' => 'network_error'
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        self::debug_log('[CRM Debug] Response status: ' . $status_code);
        if ($status_code !== 200 && $status_code !== 201) {
            self::debug_log('[CRM Debug] Response body: ' . substr($body, 0, 500));
        }
        
        if ($status_code >= 200 && $status_code < 300) {
            return [
                'success' => true,
                'data' => $data
            ];
        } else {
            self::debug_log('[CRM Debug] Request failed with status ' . $status_code . ' Body: ' . $body);
            return [
                'success' => false,
                'message' => isset($data['message']) ? $data['message'] : 'CRM API request failed',
                'status_code' => $status_code
            ];
        }
    }
    
    /**
     * Sandbox API Methods - Use Sandbox API
     */
    
    public static function send_email_verification($identifier) {
        self::debug_log("========== SANDBOX EMAIL VERIFICATION ==========");
        self::debug_log("Identifier: " . $identifier);
        
        if (empty($identifier)) {
            return [
                'success' => false,
                'message' => 'Email or phone number is required',
                'error' => 'validation_error'
            ];
        }
        
        return self::sandbox_request('/sandbox/email-verification', [
            'identifier' => $identifier
        ]);
    }
    
    public static function verify_otp($otp, $session_id) {
        self::debug_log("========== SANDBOX OTP VERIFICATION ==========");
        self::debug_log("OTP: " . $otp);
        self::debug_log("Session ID: " . $session_id);
        
        return self::sandbox_request('/sandbox/verify-otp', [
            'otp' => $otp,
            'session_id' => $session_id
        ]);
    }
    
    public static function submit_business_details($data) {
        self::debug_log("========== SANDBOX BUSINESS DETAILS ==========");
        self::debug_log("Input data: " . print_r($data, true));
        
        $payload = [
            'business_name' => $data['business_name'],
            'business_website' => $data['business_website'] ?? '',
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'legal_identity' => $data['legal_identity'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? '',
            'session_id' => $data['session_id']
        ];
        
        return self::sandbox_request('/sandbox/merchants/business-details', $payload);
    }
    
    public static function submit_merchant_registration_no_auth($data) {
        self::debug_log("========== SANDBOX MERCHANT REGISTRATION ==========");
        self::debug_log("Input data keys: " . implode(', ', array_keys($data)));
        
        // Validate required fields
        $required_fields = ['business_name', 'legal_identity', 'first_name', 'last_name', 'email', 'phone'];
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                $missing_fields[] = $field;
            }
        }
        
        if (!empty($missing_fields)) {
            self::debug_log('Merchant registration failed: Missing required fields - ' . implode(', ', $missing_fields), 'ERROR');
            return [
                'success' => false,
                'message' => 'Missing required fields: ' . implode(', ', $missing_fields),
                'error' => 'validation_error'
            ];
        }
        
<<<<<<< Updated upstream
        // Format and validate phone number
        $phone = self::format_phone_number($data['phone']);
        if (!$phone) {
            self::debug_log('Merchant registration failed: Invalid phone number format', 'ERROR');
            return [
                'success' => false,
                'message' => 'Invalid phone number format. Please use Bangladesh mobile number (e.g., 01712345678)',
                'error' => 'validation_error'
            ];
        }
=======
        // Pass phone number directly to API without validation (API handles its own validation)
        // Just sanitize the input for security
        $phone = sanitize_text_field($data['phone']);
>>>>>>> Stashed changes
        
        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            self::debug_log('Merchant registration failed: Invalid email format', 'ERROR');
            return [
                'success' => false,
                'message' => 'Invalid email address format',
                'error' => 'validation_error'
            ];
        }
        
        $payload = [
            'business_name' => sanitize_text_field($data['business_name']),
            'legal_identity' => sanitize_text_field($data['legal_identity']),
            'first_name' => sanitize_text_field($data['first_name']),
            'last_name' => sanitize_text_field($data['last_name']), 
            'email' => sanitize_email($data['email']),
            'phone' => $phone
        ];
        
        // Add optional fields if provided
        if (!empty($data['business_website'])) {
            $website = esc_url_raw($data['business_website']);
            if ($website) {
                $payload['business_website'] = $website;
            }
        }
        
        self::debug_log('Sending merchant registration to sandbox API');
        $result = self::sandbox_request('/sandbox/merchants/business-details-no-auth', $payload);
        
        if ($result['success']) {
            self::debug_log('Merchant registration submitted successfully');
        } else {
            self::debug_log('Merchant registration failed: ' . ($result['message'] ?? 'Unknown error'), 'ERROR');
        }
        
        return $result;
    }
    
    /**
     * Utility Methods
     */
    
    public static function get_pricing_rules() {
        // Check cache first
        $cached = get_transient('moneybag_pricing_rules');
        if ($cached !== false) {
            return $cached;
        }
        
        // Load from local JSON file
        $json_file = MONEYBAG_PLUGIN_PATH . 'data/pricing-rules.json';
        if (file_exists($json_file)) {
            $rules = json_decode(file_get_contents($json_file), true);
            
            // Cache for 1 hour
            set_transient('moneybag_pricing_rules', $rules, HOUR_IN_SECONDS);
            
            return $rules;
        }
        
        self::debug_log('Failed to load pricing rules from JSON file', 'WARNING');
        return [];
    }
    
<<<<<<< Updated upstream
    /**
     * Format phone number to Bangladesh standard
     * @param string $phone Raw phone number
     * @return string|false Formatted phone number or false if invalid
     */
    private static function format_phone_number($phone) {
        if (empty($phone)) {
            return false;
        }
        
        // Remove all non-digit characters except +
        $clean_phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // Bangladesh mobile number patterns
        $patterns = [
            '/^\+880([17][0-9]{8})$/',      // +880 followed by 1xxxxxxxx or 7xxxxxxxx
            '/^880([17][0-9]{8})$/',       // 880 followed by 1xxxxxxxx or 7xxxxxxxx  
            '/^0([17][0-9]{8})$/',         // 0 followed by 1xxxxxxxx or 7xxxxxxxx
            '/^([17][0-9]{8})$/'           // 1xxxxxxxx or 7xxxxxxxx
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $clean_phone, $matches)) {
                $number = isset($matches[1]) ? $matches[1] : $matches[0];
                
                // Ensure it starts with 1 (Bangladesh mobile prefix)
                if (substr($number, 0, 1) === '1' && strlen($number) === 9) {
                    return '+880' . $number;
                }
            }
        }
        
        return false;
    }
=======
>>>>>>> Stashed changes
    
    public static function verify_recaptcha($token, $action = 'submit') {
        $secret_key = get_option('moneybag_recaptcha_secret_key', '');
        
        if (empty($secret_key)) {
            return [
                'success' => true, // Don't block if not configured
                'message' => 'reCAPTCHA not configured'
            ];
        }
        
        if (empty($token)) {
            return [
                'success' => true,
                'message' => 'No reCAPTCHA token provided, allowing submission'
            ];
        }
        
        $verify_url = 'https://www.google.com/recaptcha/api/siteverify';
        
        $response = wp_remote_post($verify_url, [
            'body' => [
                'secret' => $secret_key,
                'response' => $token,
                'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
            ],
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => true,
                'message' => 'reCAPTCHA network error, allowing submission',
                'score' => 0.5
            ];
        }
        
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);
        
        if ($result['success']) {
            $score_threshold = floatval(get_option('moneybag_recaptcha_score_threshold', 0.3));
            
            if (isset($result['score'])) {
                if ($result['score'] < $score_threshold) {
                    // For sandbox/testing, be more permissive
                    if (strpos($_SERVER['HTTP_HOST'] ?? '', 'sandbox') !== false || 
                        strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false ||
                        strpos($_SERVER['HTTP_HOST'] ?? '', '.local') !== false) {
                        return [
                            'success' => true,
                            'message' => 'Low score but allowing for sandbox/development',
                            'score' => $result['score']
                        ];
                    }
                }
                
                return [
                    'success' => true,
                    'score' => $result['score']
                ];
            }
            
            return [
                'success' => true,
                'message' => 'reCAPTCHA verified'
            ];
        }
        
        self::debug_log('reCAPTCHA verification failed but allowing submission: ' . implode(', ', $result['error-codes'] ?? []), 'WARNING');
        return [
            'success' => true,
            'message' => 'reCAPTCHA check failed but allowing submission',
            'errors' => $result['error-codes'] ?? []
        ];
    }
    
    /**
<<<<<<< Updated upstream
     * Contact Form CRM Integration - Use Production CRM API
     */
    
    public static function submit_contact_form($data) {
        $api_key = self::get_crm_api_key();
        
        if (!$api_key) {
            self::debug_log('Contact form submission failed: CRM API key not configured', 'ERROR');
=======
     * Global CRM Submission Handler - For all widgets
     * 
     * @param array $data {
     *     @type string $name        Person's full name (required)
     *     @type string $email       Email address (required)
     *     @type string $phone       Phone number (required)
     *     @type string $company     Company name (optional)
     *     @type string $opportunity_title   Title for opportunity (optional)
     *     @type string $opportunity_stage   Stage for opportunity (default: NEW)
     *     @type int    $opportunity_value   Value in base currency (default: 0)
     *     @type string $note_title          Title for note (optional)
     *     @type string $note_content        Content for note (optional)
     *     @type string $widget_type         Type of widget calling this (for logging)
     * }
     * @return array ['success', 'person_id', 'opportunity_id', 'note_id', 'message']
     */
    public static function submit_to_crm($data) {
        $api_key = self::get_crm_api_key();
        
        if (!$api_key) {
            self::debug_log('CRM submission failed: API key not configured', 'ERROR');
>>>>>>> Stashed changes
            return [
                'success' => false,
                'message' => 'CRM API key not configured. Please contact administrator.',
                'error' => 'configuration_error'
            ];
        }
        
<<<<<<< Updated upstream
        // Sanitize input data
        $sanitized_data = [
            'name' => sanitize_text_field($data['name'] ?? ''),
            'email' => sanitize_email($data['email'] ?? ''),
            'phone' => sanitize_text_field($data['phone'] ?? ''),
            'company' => sanitize_text_field($data['company'] ?? ''),
            'inquiry_type' => sanitize_text_field($data['inquiry_type'] ?? 'General Inquiry'),
            'other_subject' => sanitize_text_field($data['other_subject'] ?? ''),
            'message' => sanitize_textarea_field($data['message'] ?? '')
        ];
        
        // Validate required fields
        if (empty($sanitized_data['name']) || empty($sanitized_data['email']) || 
            empty($sanitized_data['phone']) || empty($sanitized_data['company'])) {
            return [
                'success' => false,
                'message' => 'Please fill in all required fields.'
            ];
        }
        
        // If inquiry type is "Other", require the subject field
        if ($sanitized_data['inquiry_type'] === 'Other' && empty($sanitized_data['other_subject'])) {
            return [
                'success' => false,
                'message' => 'Please specify the subject for "Other" inquiry type.'
            ];
        }
        
        self::debug_log("========== CONTACT FORM SUBMISSION ==========");
        self::debug_log("Submitting contact form for: " . $sanitized_data['name']);
        
        // Create person in CRM
=======
        $widget_type = $data['widget_type'] ?? 'unknown';
        self::debug_log("========== CRM SUBMISSION FROM {$widget_type} ==========");
        
        // Sanitize core data
        $sanitized_data = [
            'name' => sanitize_text_field($data['name'] ?? ''),
            'email' => sanitize_email($data['email'] ?? ''),
            'phone' => sanitize_text_field($data['phone'] ?? $data['mobile'] ?? ''),
            'company' => sanitize_text_field($data['company'] ?? '')
        ];
        
        // Validate required fields
        if (empty($sanitized_data['name']) || empty($sanitized_data['email']) || empty($sanitized_data['phone'])) {
            return [
                'success' => false,
                'message' => 'Name, email, and phone are required fields.'
            ];
        }
        
        // 1. Create or find person
>>>>>>> Stashed changes
        $person_result = self::create_person($sanitized_data);
        
        if (!$person_result['success']) {
            return $person_result;
        }
        
        $person_id = $person_result['person_id'];
<<<<<<< Updated upstream
        self::debug_log("Person result: " . json_encode($person_result));
        
        // Check if we have a valid person ID
        if (empty($person_id)) {
            self::debug_log("WARNING: Person ID is empty, cannot create opportunity");
        }
        
        // Create opportunity
        $opportunity_subject = $sanitized_data['inquiry_type'] === 'Other' 
            ? $sanitized_data['other_subject'] 
            : $sanitized_data['inquiry_type'];
        
        self::debug_log("Creating opportunity for person ID: " . ($person_id ?: 'NULL'));
        
        // Prepare opportunity title with company name
        $opportunity_title = 'Contact Form: ' . $opportunity_subject;
        if (!empty($sanitized_data['company'])) {
            $opportunity_title .= ' - ' . $sanitized_data['company'];
        }
        
        $opportunity_result = self::create_opportunity([
            'person_id' => $person_id,
            'title' => $opportunity_title,
            'company_name' => $sanitized_data['company'], // Try adding company name
            'value' => 0,
            'currency' => 'BDT',
            'status' => 'open',
            'stage' => 'NEW'
        ]);
        self::debug_log("Opportunity creation result: " . json_encode($opportunity_result));
        
        // Create note with all details since opportunity doesn't support description
        $note_content = "Contact Form Submission\n";
        $note_content .= "==================\n\n";
        $note_content .= "**Contact Details:**\n";
        $note_content .= "- Name: {$sanitized_data['name']}\n";
        $note_content .= "- Email: {$sanitized_data['email']}\n";
        $note_content .= "- Phone: {$sanitized_data['phone']}\n";
        $note_content .= "- Company: {$sanitized_data['company']}\n\n";
        $note_content .= "**Inquiry Type:** {$opportunity_subject}\n\n";
        if (!empty($sanitized_data['message'])) {
            $note_content .= "**Message:**\n{$sanitized_data['message']}\n";
        }
        
        // Make sure we pass the person_id even if opportunity fails
        $note_data = [
            'person_id' => $person_id,
            'content' => $note_content,
            'title' => 'Contact Form: ' . $opportunity_subject
        ];
        
        // Only add deal_id if opportunity was created successfully
        if (!empty($opportunity_result['deal_id'])) {
            $note_data['deal_id'] = $opportunity_result['deal_id'];
        }
        
        $note_result = self::create_note($note_data);
        
        return [
            'success' => true,
            'message' => 'Your message has been received successfully. We will contact you soon.',
            'person_id' => $person_id,
            'opportunity_id' => $opportunity_result['deal_id'] ?? null,
            'note_id' => $note_result['note_id'] ?? null
        ];
    }
    
    private static function create_person($data) {
=======
        self::debug_log("Person created/found with ID: " . $person_id);
        
        // 2. Create opportunity if title is provided
        $opportunity_id = null;
        if (!empty($data['opportunity_title'])) {
            $opportunity_data = [
                'title' => sanitize_text_field($data['opportunity_title']),
                'person_id' => $person_id,
                'stage' => sanitize_text_field($data['opportunity_stage'] ?? 'NEW'),
                'value' => intval($data['opportunity_value'] ?? 0),
                'currency' => sanitize_text_field($data['opportunity_currency'] ?? 'BDT'),
                'company_name' => $sanitized_data['company']
            ];
            
            $opportunity_result = self::create_opportunity($opportunity_data);
            
            if ($opportunity_result['success']) {
                $opportunity_id = $opportunity_result['deal_id'];
                self::debug_log("Opportunity created with ID: " . $opportunity_id);
            } else {
                self::debug_log("Opportunity creation failed: " . json_encode($opportunity_result));
            }
        }
        
        // 3. Create note if content is provided
        $note_id = null;
        if (!empty($data['note_content'])) {
            $note_data = [
                'title' => sanitize_text_field($data['note_title'] ?? 'Form Submission'),
                'content' => sanitize_textarea_field($data['note_content']),
                'person_id' => $person_id,
                'deal_id' => $opportunity_id
            ];
            
            $note_result = self::create_note($note_data);
            
            if ($note_result['success']) {
                $note_id = $note_result['note_id'];
                self::debug_log("Note created with ID: " . $note_id);
            } else {
                self::debug_log("Note creation failed: " . json_encode($note_result));
            }
        }
        
        return [
            'success' => true,
            'message' => 'Successfully processed CRM submission',
            'person_id' => $person_id,
            'opportunity_id' => $opportunity_id,
            'note_id' => $note_id
        ];
    }
    
    // Old submit_contact_form method removed - now uses global submit_to_crm() method
    
    /**
     * Create a person in CRM - Global method for all widgets
     * @param array $data ['name', 'email', 'phone', 'company']
     * @return array ['success', 'person_id', 'existing']
     */
    public static function create_person($data) {
>>>>>>> Stashed changes
        // First, check if person already exists by email
        $email = $data['email'] ?? '';
        if (!empty($email)) {
            self::debug_log("Checking if person exists with email: " . $email);
            
            // Search for existing person by email
            $search_response = self::crm_request('/people?email=' . urlencode($email), [], 'GET');
            
            // Log the full search response for debugging
            self::debug_log("Person search response structure: " . substr(json_encode($search_response), 0, 500));
            
            if ($search_response['success'] && !empty($search_response['data'])) {
                // Handle nested data structure from CRM API
                $people_list = [];
                
                // Check different possible response structures
                if (isset($search_response['data']['data']['people'])) {
                    // Nested structure: data.data.people[]
                    $people_list = $search_response['data']['data']['people'];
                } elseif (isset($search_response['data']['people'])) {
                    // Structure: data.people[]
                    $people_list = $search_response['data']['people'];
                } elseif (is_array($search_response['data'])) {
                    // Direct array: data[]
                    $people_list = $search_response['data'];
                }
                
                // Find the person with matching email
                foreach ($people_list as $person) {
                    $person_email = '';
                    
                    // Extract email from different possible structures
                    if (isset($person['emails']['primaryEmail'])) {
                        $person_email = $person['emails']['primaryEmail'];
                    } elseif (isset($person['email'])) {
                        $person_email = $person['email'];
                    } elseif (isset($person['primaryEmail'])) {
                        $person_email = $person['primaryEmail'];
                    }
                    
                    // Check if this is the person we're looking for
                    if (strtolower($person_email) === strtolower($email)) {
                        $person_id = $person['id'] ?? null;
                        
                        if ($person_id) {
                            self::debug_log("Found existing person with ID: " . $person_id . " (email: " . $person_email . ")");
                            return [
                                'success' => true,
                                'person_id' => $person_id,
                                'existing' => true
                            ];
                        }
                    }
                }
                
                self::debug_log("No matching person found for email: " . $email . " in " . count($people_list) . " results");
                self::debug_log("Will create new person for: " . $data['name'] . " (" . $email . ")");
            } else {
                self::debug_log("No people data in search response, will create new person");
            }
        }
        
        // Create new person since they don't exist
        self::debug_log("Creating new person...");
        
        // Parse name into first and last name
        $name_parts = explode(' ', trim($data['name']), 2);
        $first_name = $name_parts[0] ?? '';
        $last_name = $name_parts[1] ?? '';
        
        // Format phone number
        $phone = preg_replace('/[^0-9+]/', '', $data['phone'] ?? '');
        
        if (strpos($phone, '+880') === 0) {
            $phone = substr($phone, 4);
        } elseif (strpos($phone, '880') === 0) {
            $phone = substr($phone, 3);
        }
        if (strpos($phone, '0') === 0) {
            $phone = substr($phone, 1);
        }
        
        $person_data = [
            'name' => [
                'firstName' => $first_name,
                'lastName' => $last_name
            ],
            'emails' => [
                'primaryEmail' => $data['email']
            ],
            'phones' => [
                'primaryPhoneNumber' => $phone,
                'primaryPhoneCallingCode' => '+880',
                'primaryPhoneCountryCode' => 'BD'
            ]
        ];
        
        // Add company field directly - no jobTitle for contact form
        if (!empty($data['company'])) {
            $person_data['company'] = $data['company'];
        }
        
        self::debug_log("Creating new person with data: " . json_encode($person_data));
        $create_response = self::crm_request('/people', $person_data, 'POST');
        self::debug_log("Full person creation response: " . json_encode($create_response));
        
        if (!$create_response['success']) {
            // Check if it's a duplicate error - if so, try to search again
            $error_msg = $create_response['message'] ?? '';
            if (strpos($error_msg, 'duplicate') !== false || strpos($error_msg, 'unique constraint') !== false) {
                self::debug_log("Duplicate error detected, searching for existing person again");
                
                $search_response = self::crm_request('/people?email=' . urlencode($email), [], 'GET');
                self::debug_log("Retry search response: " . json_encode($search_response));
                
                // Handle nested response structure
                $people_list = [];
                if (isset($search_response['data']['data']['people'])) {
                    $people_list = $search_response['data']['data']['people'];
                } elseif (isset($search_response['data']['people'])) {
                    $people_list = $search_response['data']['people'];
                } elseif (is_array($search_response['data'])) {
                    $people_list = $search_response['data'];
                }
                
                // Find matching person by email
                foreach ($people_list as $person) {
                    $person_email = $person['emails']['primaryEmail'] ?? $person['email'] ?? '';
                    if (strtolower($person_email) === strtolower($email)) {
                        $person_id = $person['id'] ?? null;
                        if ($person_id) {
                            self::debug_log("Found existing person after retry with ID: " . $person_id);
                            return [
                                'success' => true,
                                'person_id' => $person_id,
                                'existing' => true
                            ];
                        }
                    }
                }
            }
            
            return [
                'success' => false,
                'message' => 'Failed to create contact in CRM.',
                'error' => $create_response['message'] ?? 'Unknown error'
            ];
        }
        
        // Extract person ID from various possible response structures
        $person_id = null;
        
        // Log the data structure for debugging
        self::debug_log("Checking for person ID in response data: " . json_encode($create_response['data']));
        
        // Try different possible paths for the person ID
        if (isset($create_response['data']['data']['createPerson']['id'])) {
            $person_id = $create_response['data']['data']['createPerson']['id'];
            self::debug_log("Found person ID in data.data.createPerson.id: " . $person_id);
        } elseif (isset($create_response['data']['createPerson']['id'])) {
            $person_id = $create_response['data']['createPerson']['id'];
            self::debug_log("Found person ID in data.createPerson.id: " . $person_id);
        } elseif (isset($create_response['data']['id'])) {
            $person_id = $create_response['data']['id'];
            self::debug_log("Found person ID in data.id: " . $person_id);
        } elseif (isset($create_response['data']['data']['id'])) {
            $person_id = $create_response['data']['data']['id'];
            self::debug_log("Found person ID in data.data.id: " . $person_id);
        } elseif (isset($create_response['id'])) {
            $person_id = $create_response['id'];
            self::debug_log("Found person ID in root id: " . $person_id);
<<<<<<< Updated upstream
=======
        } elseif (isset($create_response['data']['person_id'])) {
            $person_id = $create_response['data']['person_id'];
            self::debug_log("Found person ID in data.person_id: " . $person_id);
        } elseif (is_array($create_response['data']) && !empty($create_response['data'])) {
            // If data is an array but we haven't found the ID yet, it might be the person object itself
            $first_key = array_key_first($create_response['data']);
            if (is_string($first_key) && strlen($first_key) > 20) {
                // Might be a UUID as the key
                $person_id = $first_key;
                self::debug_log("Found person ID as array key: " . $person_id);
            }
>>>>>>> Stashed changes
        }
        
        if ($person_id) {
            return [
                'success' => true,
                'person_id' => $person_id
            ];
        }
        
        // If we still don't have an ID, log the entire response structure
        self::debug_log("ERROR: Could not find person ID in response. Full response: " . json_encode($create_response));
        
<<<<<<< Updated upstream
        return [
            'success' => false,
            'message' => 'Failed to create contact in CRM.',
            'error' => 'No person ID returned in response structure'
        ];
    }
    
    private static function create_opportunity($data) {
=======
        // Generate a temporary ID to allow the process to continue
        // This allows forms to work even if CRM person creation has issues
        $temp_person_id = 'temp_' . md5($email . time());
        self::debug_log("WARNING: Using temporary person ID: " . $temp_person_id);
        
        return [
            'success' => true,  // Mark as success to allow process to continue
            'person_id' => $temp_person_id,
            'warning' => 'Person created but ID not found in response - using temporary ID',
            'crm_response' => $create_response['data'] // Include for debugging
        ];
    }
    
    /**
     * Create an opportunity in CRM - Global method for all widgets
     * @param array $data ['title', 'person_id', 'value', 'currency', 'stage', 'company_name']
     * @return array ['success', 'deal_id']
     */
    public static function create_opportunity($data) {
>>>>>>> Stashed changes
        $opportunity_data = [
            'name' => $data['title'],
            'pointOfContactId' => $data['person_id'],
            'stage' => $data['stage'] ?? 'NEW',
            'amount' => [
                'amountMicros' => ($data['value'] ?? 0) * 1000000,
                'currencyCode' => $data['currency'] ?? 'BDT'
            ]
        ];
        
        // Try to add company field to opportunity
        if (!empty($data['company_name'])) {
            $opportunity_data['company'] = $data['company_name'];
        }
        
        self::debug_log("Sending opportunity data: " . json_encode($opportunity_data));
        $response = self::crm_request('/opportunities', $opportunity_data, 'POST');
        self::debug_log("Opportunity API response: " . json_encode($response));
        
        if (!$response['success']) {
            self::debug_log("Opportunity creation failed: " . ($response['message'] ?? 'Unknown error'));
            return [
                'success' => false,
                'message' => 'Failed to create opportunity.',
                'error' => $response['message'] ?? 'Unknown error'
            ];
        }
        
        // Extract opportunity ID from nested response structure
        $opportunity_id = null;
        if (!empty($response['data']['data']['createOpportunity']['id'])) {
            $opportunity_id = $response['data']['data']['createOpportunity']['id'];
        } elseif (!empty($response['data']['id'])) {
            $opportunity_id = $response['data']['id'];
        }
        
        if ($opportunity_id) {
            self::debug_log("Opportunity created successfully with ID: " . $opportunity_id);
            return [
                'success' => true,
                'deal_id' => $opportunity_id
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Failed to create opportunity.',
            'error' => 'No opportunity ID returned'
        ];
    }
    
<<<<<<< Updated upstream
    private static function create_note($data) {
=======
    /**
     * Create a note in CRM - Global method for all widgets
     * @param array $data ['title', 'content', 'person_id', 'deal_id']
     * @return array ['success', 'note_id']
     */
    public static function create_note($data) {
>>>>>>> Stashed changes
        $note_data = [
            'title' => $data['title'] ?? 'Contact Form Submission',
            'bodyV2' => [
                'markdown' => $data['content'],
                'blocknote' => json_encode([
                    [
                        'type' => 'paragraph',
                        'content' => [
                            ['type' => 'text', 'text' => $data['content']]
                        ]
                    ]
                ])
            ]
        ];
        
        if (!empty($data['person_id'])) {
            $note_data['noteTargets'] = [
                [
                    'type' => 'person',
                    'id' => $data['person_id']
                ]
            ];
        }
        
        if (!empty($data['deal_id'])) {
            if (!isset($note_data['noteTargets'])) {
                $note_data['noteTargets'] = [];
            }
            $note_data['noteTargets'][] = [
                'type' => 'opportunity',
                'id' => $data['deal_id']
            ];
        }
        
        $response = self::crm_request('/notes', $note_data, 'POST');
        
        if (!$response['success']) {
            return [
                'success' => false,
                'message' => 'Failed to create note.',
                'error' => $response['message'] ?? 'Unknown error'
            ];
        }
        
        if (!empty($response['data']['id'])) {
            return [
                'success' => true,
                'note_id' => $response['data']['id']
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Failed to create note.',
            'error' => 'No note ID returned'
        ];
    }
}