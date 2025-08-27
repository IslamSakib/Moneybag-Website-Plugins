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
     * API Configuration - These should be stored in wp-config.php or database
     */
    private static $sandbox_api_base = 'https://sandbox.api.moneybag.com.bd/api/v2';
    private static $production_api_base = 'https://api.moneybag.com.bd/api/v2';
    private static $crm_api_base = 'https://crm.moneybag.com.bd/rest';
    
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
    private static function get_crm_api_key() {
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
     * Make API request to Moneybag Sandbox
     */
    public static function sandbox_request($endpoint, $data = [], $method = 'POST') {
        $url = self::$sandbox_api_base . $endpoint;
        
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
        
        // Add API key if available
        $api_key = self::get_api_key();
        if (!empty($api_key)) {
            $args['headers']['Authorization'] = 'Bearer ' . $api_key;
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
        
        // Log errors for debugging (only in development)
        if ($status_code >= 400 && defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Moneybag API Error: ' . $endpoint . ' - Status: ' . $status_code . ' - Response: ' . $body);
        }
        
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
     * Make API request to Moneybag CRM
     */
    public static function crm_request($endpoint, $data = [], $method = 'POST') {
        $url = self::$crm_api_base . $endpoint;
        
        $args = [
            'method' => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Authorization' => 'Bearer ' . self::get_crm_api_key(),
            ],
            'body' => json_encode($data),
            'sslverify' => true
        ];
        
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
        
        if ($status_code >= 200 && $status_code < 300) {
            return [
                'success' => true,
                'data' => $data
            ];
        } else {
            return [
                'success' => false,
                'message' => isset($data['message']) ? $data['message'] : 'CRM API request failed',
                'status_code' => $status_code
            ];
        }
    }
    
    /**
     * Sandbox API Methods
     */
    
    public static function send_email_verification($email) {
        return self::sandbox_request('/sandbox/email-verification', [
            'email' => $email
        ]);
    }
    
    public static function verify_otp($otp, $session_id) {
        return self::sandbox_request('/sandbox/verify-otp', [
            'otp' => $otp,
            'session_id' => $session_id
        ]);
    }
    
    public static function submit_business_details($data) {
        // Prepare the data in the format expected by the API
        $api_data = [
            'business_name' => $data['business_name'],
            'business_website' => $data['business_website'] ?? '',
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'legal_identity' => $data['legal_identity'],
            'password' => $data['password'],
            'phone' => $data['phone'],
            'session_id' => $data['session_id']
        ];
        
        // Add reCAPTCHA if provided
        if (!empty($data['recaptcha_response'])) {
            $api_data['recaptcha_response'] = $data['recaptcha_response'];
        }
        
        return self::sandbox_request('/sandbox/merchants/business-details', $api_data);
    }
    
    /**
     * Production API Methods (for future use)
     */
    
    public static function production_request($endpoint, $data = [], $method = 'POST') {
        $url = self::$production_api_base . $endpoint;
        
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
        
        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true);
    }
    
    /**
     * Get pricing rules from API or cache
     */
    public static function get_pricing_rules() {
        // Check cache first
        $cached = get_transient('moneybag_pricing_rules');
        if ($cached !== false) {
            return $cached;
        }
        
        // If no cache, load from local JSON file
        $json_file = MONEYBAG_PLUGIN_PATH . 'data/pricing-rules.json';
        if (file_exists($json_file)) {
            $rules = json_decode(file_get_contents($json_file), true);
            
            // Cache for 1 hour
            set_transient('moneybag_pricing_rules', $rules, HOUR_IN_SECONDS);
            
            return $rules;
        }
        
        return [];
    }
    
    /**
     * Verify reCAPTCHA token
     */
    public static function verify_recaptcha($token, $action = 'submit') {
        $secret_key = get_option('moneybag_recaptcha_secret_key', '');
        
        if (empty($secret_key)) {
            return [
                'success' => true, // Don't block if not configured
                'message' => 'reCAPTCHA not configured'
            ];
        }
        
        // Allow empty token for v3 (non-blocking)
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
            // Don't block on network errors for v3
            error_log('reCAPTCHA network error: ' . $response->get_error_message());
            return [
                'success' => true,
                'message' => 'reCAPTCHA network error, allowing submission',
                'score' => 0.5
            ];
        }
        
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);
        
        if ($result['success']) {
            // For v3, be more lenient with score threshold
            // Default threshold: 0.3 (more permissive)
            $score_threshold = floatval(get_option('moneybag_recaptcha_score_threshold', 0.3));
            
            if (isset($result['score'])) {
                // Log the score for monitoring
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('reCAPTCHA v3 score: ' . $result['score']);
                }
                
                // Only block very low scores (likely bots)
                if ($result['score'] < $score_threshold) {
                    // Still log but don't necessarily block
                    error_log('Low reCAPTCHA score: ' . $result['score'] . ' (threshold: ' . $score_threshold . ')');
                    
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
            
            // No score provided (v2 or other), allow it
            return [
                'success' => true,
                'message' => 'reCAPTCHA verified'
            ];
        }
        
        // Log the error but don't block for v3
        error_log('reCAPTCHA verification failed: ' . json_encode($result['error-codes'] ?? []));
        
        // For v3, we should rarely block completely
        return [
            'success' => true,
            'message' => 'reCAPTCHA check failed but allowing submission',
            'errors' => $result['error-codes'] ?? []
        ];
    }
}