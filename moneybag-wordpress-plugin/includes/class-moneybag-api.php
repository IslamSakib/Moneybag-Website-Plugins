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
     * Make API request to Sandbox API
     */
    public static function sandbox_request($endpoint, $data = [], $method = 'POST') {
        $base_url = rtrim(self::get_sandbox_api_base(), '/');
        $endpoint = ltrim($endpoint, '/');
        $url = $base_url . '/' . $endpoint;
        
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
        
        // Add better debug logging
        self::debug_log('[CRM Debug] Request URL: ' . $url);
        self::debug_log('[CRM Debug] Method: ' . $method);
        self::debug_log('[CRM Debug] API Key present: ' . (!empty($api_key) ? 'Yes' : 'No'));
        self::debug_log('[CRM Debug] API Key length: ' . strlen($api_key));
        if ($method !== 'GET') {
            self::debug_log('[CRM Debug] Data: ' . json_encode($data));
        }
        
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
                'status_code' => $status_code,
                'error_body' => $body,  // Preserve the full error response body
                'error_data' => $data   // Preserve parsed error data
            ];
        }
    }
    
    /**
     * Sandbox API Methods - Use Sandbox API
     */
    
    public static function send_email_verification($identifier) {
        
        if (empty($identifier)) {
            return [
                'success' => false,
                'message' => 'Email or phone number is required',
                'error' => 'validation_error'
            ];
        }
        
        // Check if API base URL is configured
        $base_url = self::get_sandbox_api_base();
        if (empty($base_url)) {
            return [
                'success' => false,
                'message' => 'Sandbox API URL is not configured. Please configure it in WordPress admin settings.',
                'error' => 'configuration_error'
            ];
        }
        
        self::debug_log('Sending email verification for identifier: ' . $identifier);
        self::debug_log('Using sandbox API base URL: ' . $base_url);
        
        // Use the standard sandbox endpoint
        $endpoint = 'sandbox/email-verification';
        
        $result = self::sandbox_request('/' . ltrim($endpoint, '/'), [
            'identifier' => $identifier
        ]);
        
        // Log the result for debugging
        self::debug_log('Email verification result: ' . json_encode($result));
        
        // If it failed, provide detailed error information
        if (!$result['success']) {
            // Log the full result for debugging
            self::debug_log('Email verification failed. Full API response: ' . json_encode($result));
            
            if (isset($result['status_code'])) {
                if ($result['status_code'] === 404) {
                    return [
                        'success' => false,
                        'message' => 'Email verification endpoint not found. The API endpoint may have changed.',
                        'error' => 'endpoint_not_found'
                    ];
                } elseif ($result['status_code'] === 500) {
                    return [
                        'success' => false,
                        'message' => 'The sandbox API is experiencing issues. This may be a temporary problem with the staging environment. Please try again in a few minutes or contact support.',
                        'error' => 'server_error'
                    ];
                } elseif ($result['status_code'] === 400) {
                    return [
                        'success' => false,
                        'message' => 'Bad request. The API rejected the email verification request. Please check the email format.',
                        'error' => 'bad_request',
                        'details' => $result['message'] ?? 'No additional details'
                    ];
                } elseif ($result['status_code'] === 422) {
                    return [
                        'success' => false,
                        'message' => 'Validation error. ' . ($result['message'] ?? 'Please check the email format and try again.'),
                        'error' => 'validation_error'
                    ];
                }
            }
            
            // If there's a specific message from API, use it
            if (!empty($result['message']) && $result['message'] !== 'An error occurred during email verification.') {
                return [
                    'success' => false,
                    'message' => $result['message'],
                    'error' => $result['error'] ?? 'api_error'
                ];
            }
            
            // Return with more debugging info
            return [
                'success' => false,
                'message' => 'Email verification failed. Please check if the email is valid and try again.',
                'error' => $result['error'] ?? 'unknown_error',
                'debug_info' => [
                    'status_code' => $result['status_code'] ?? 'not_set',
                    'api_message' => $result['message'] ?? 'no_message',
                    'full_response' => defined('WP_DEBUG') && WP_DEBUG ? $result : 'enable WP_DEBUG to see full response'
                ]
            ];
        }
        
        return $result;
    }
    
    public static function verify_otp($otp, $session_id) {
        
        // Use the standard sandbox endpoint
        $endpoint = 'sandbox/verify-otp';
        
        return self::sandbox_request('/' . ltrim($endpoint, '/'), [
            'otp' => $otp,
            'session_id' => $session_id
        ]);
    }
    
    public static function submit_business_details($data) {
        
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
        
        // Use the standard sandbox endpoint
        $endpoint = 'sandbox/merchants/business-details';
        
        return self::sandbox_request('/' . ltrim($endpoint, '/'), $payload);
    }
    
    public static function submit_merchant_registration_no_auth($data) {
        
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
        
        // Pass phone number directly to API without validation (API handles its own validation)
        // Just sanitize the input for security
        $phone = sanitize_text_field($data['phone']);
        
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
        
        // Use the standard sandbox endpoint
        $endpoint = 'sandbox/merchants/business-details-no-auth';
        
        $result = self::sandbox_request('/' . ltrim($endpoint, '/'), $payload);
        
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
            return [
                'success' => false,
                'message' => 'CRM API key not configured. Please contact administrator.',
                'error' => 'configuration_error'
            ];
        }
        
        $widget_type = $data['widget_type'] ?? 'unknown';
        
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
        $person_result = self::create_person($sanitized_data);
        
        if (!$person_result['success']) {
            return $person_result;
        }
        
        $person_id = $person_result['person_id'];
        self::debug_log("Person created/found with ID: " . $person_id);
        
        // 2. Create opportunity if title is provided
        $opportunity_id = null;
        if (!empty($data['opportunity_title'])) {
            self::debug_log("[CRM Debug] Starting opportunity creation with title: " . $data['opportunity_title']);
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
                self::debug_log("[CRM Debug] ✅ Opportunity created successfully with ID: " . $opportunity_id);
            } else {
                self::debug_log("[CRM Debug] ❌ Opportunity creation failed!");
                self::debug_log("[CRM Debug] Opportunity error details: " . json_encode($opportunity_result));
                self::debug_log("[CRM Debug] Original opportunity data sent: " . json_encode($opportunity_data));
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
        
        $final_result = [
            'success' => true,
            'message' => 'Successfully processed CRM submission',
            'person_id' => $person_id,
            'opportunity_id' => $opportunity_id,
            'note_id' => $note_id
        ];
        
        self::debug_log("[CRM Debug] 📊 Final submit_to_crm result: " . json_encode($final_result));
        
        return $final_result;
    }
    
    
    /**
     * Create a person in CRM - Global method for all widgets
     * @param array $data ['name', 'email', 'phone', 'company']
     * @return array ['success', 'person_id', 'existing']
     */
    public static function create_person($data) {
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
        }
        
        if ($person_id) {
            return [
                'success' => true,
                'person_id' => $person_id
            ];
        }
        
        // If we still don't have an ID, log the entire response structure
        self::debug_log("ERROR: Could not find person ID in response. Full response: " . json_encode($create_response));
        
        // Try one more approach - maybe the person was created but we need to search for it
        if (!empty($email)) {
            self::debug_log("Attempting to find person by email after creation: " . $email);
            
            // Search for the person we just created
            $search_response = self::crm_request('/people?email=' . urlencode($email), [], 'GET');
            
            if ($search_response['success'] && !empty($search_response['data'])) {
                // Handle nested data structure from CRM API
                $people_list = [];
                
                if (isset($search_response['data']['data']['people'])) {
                    $people_list = $search_response['data']['data']['people'];
                } elseif (isset($search_response['data']['people'])) {
                    $people_list = $search_response['data']['people'];
                } elseif (is_array($search_response['data'])) {
                    $people_list = $search_response['data'];
                }
                
                // Find the person with matching email
                foreach ($people_list as $person) {
                    $person_email = '';
                    
                    if (isset($person['emails']['primaryEmail'])) {
                        $person_email = $person['emails']['primaryEmail'];
                    } elseif (isset($person['email'])) {
                        $person_email = $person['email'];
                    } elseif (isset($person['primaryEmail'])) {
                        $person_email = $person['primaryEmail'];
                    }
                    
                    if (strtolower($person_email) === strtolower($email)) {
                        $found_person_id = $person['id'] ?? null;
                        
                        if ($found_person_id) {
                            self::debug_log("SUCCESS: Found person via search after creation: " . $found_person_id);
                            return [
                                'success' => true,
                                'person_id' => $found_person_id,
                                'found_via_search' => true
                            ];
                        }
                    }
                }
            }
        }
        
        // If all attempts fail, this is a real error - don't use temporary ID
        self::debug_log("CRITICAL ERROR: Person creation failed completely. Cannot extract person ID from response and search failed.");
        
        return [
            'success' => false,
            'message' => 'Person creation failed. Could not extract person ID from CRM response.',
            'error' => 'person_id_extraction_failed',
            'crm_response' => $create_response['data'] ?? null
        ];
    }
    
    /**
     * Create an opportunity in CRM - Global method for all widgets
     * @param array $data ['title', 'person_id', 'value', 'currency', 'stage', 'company_name']
     * @return array ['success', 'deal_id']
     */
    public static function create_opportunity($data) {
        self::debug_log("[OPPORTUNITY DEBUG] create_opportunity() called with data: " . json_encode($data));
        
        // Validate person_id - don't create opportunity with temporary person IDs
        $person_id = $data['person_id'] ?? '';
        self::debug_log("[OPPORTUNITY DEBUG] person_id received: " . var_export($person_id, true));
        
        if (empty($person_id)) {
            self::debug_log("[OPPORTUNITY DEBUG] ❌ VALIDATION FAILED: No person_id provided");
            return [
                'success' => false,
                'message' => 'Cannot create opportunity without person_id.',
                'error' => 'missing_person_id'
            ];
        }
        
        // Check if person_id is a temporary ID (created when person creation partially failed)
        if (strpos($person_id, 'temp_') === 0) {
            self::debug_log("[OPPORTUNITY DEBUG] ❌ VALIDATION FAILED: Temporary person_id detected: " . $person_id);
            return [
                'success' => false,
                'message' => 'Cannot create opportunity with temporary person_id. Person creation may have failed.',
                'error' => 'temporary_person_id',
                'person_id' => $person_id
            ];
        }
        
        self::debug_log("[OPPORTUNITY DEBUG] ✅ person_id validation passed: " . $person_id);
        
        // Based on TwentyOne CRM API documentation, try common stage values
        // If "NEW" doesn't work, try other common CRM stage names
        $stage_options = ['NEW', 'PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
        $requested_stage = $data['stage'] ?? 'NEW';
        
        // For now, let's try the original stage, but we'll implement fallback if it fails
        $opportunity_stage = $requested_stage;
        
        self::debug_log("[OPPORTUNITY DEBUG] 🎯 Using opportunity stage: '" . $opportunity_stage . "'");
        
        // Create opportunity data structure as per TwentyOne CRM API docs
        $opportunity_data = [
            'name' => $data['title'],
            'pointOfContactId' => $person_id,
            'stage' => $opportunity_stage,
            'amount' => [
                'amountMicros' => ($data['value'] ?? 0) * 1000000,
                'currencyCode' => $data['currency'] ?? 'BDT'
            ]
        ];
        
        // Try to add company field to opportunity
        if (!empty($data['company_name'])) {
            $opportunity_data['company'] = $data['company_name'];
        }
        
        self::debug_log("[OPPORTUNITY DEBUG] 📤 Sending opportunity data to TwentyOne CRM: " . json_encode($opportunity_data, JSON_PRETTY_PRINT));
        self::debug_log("[OPPORTUNITY DEBUG] 🔗 API endpoint: /opportunities");
        
        $response = self::crm_request('/opportunities', $opportunity_data, 'POST');
        
        self::debug_log("[OPPORTUNITY DEBUG] 📥 Raw CRM API response: " . json_encode($response, JSON_PRETTY_PRINT));
        self::debug_log("[OPPORTUNITY DEBUG] 📊 Response success flag: " . var_export($response['success'] ?? 'not set', true));
        
        // Store the original response for retry logic
        $original_response = $response;
        
        if (!$response['success']) {
            self::debug_log("[OPPORTUNITY DEBUG] ❌ CRM API request failed!");
            self::debug_log("[OPPORTUNITY DEBUG] Status code: " . ($response['status_code'] ?? 'unknown'));
            self::debug_log("[OPPORTUNITY DEBUG] Error message: " . ($response['message'] ?? 'Unknown error'));
            
            // If it's a stage enum error, try alternative stage values
            if (isset($response['status_code']) && $response['status_code'] === 400) {
                // Check the detailed error body for stage enum error
                $error_body = $response['error_body'] ?? '';
                $error_data = $response['error_data'] ?? [];
                
                self::debug_log("[OPPORTUNITY DEBUG] 🔍 Checking detailed error body: " . substr($error_body, 0, 300));
                
                $has_stage_error = (strpos($error_body, 'opportunity_stage_enum') !== false) || 
                                  (is_array($error_data) && isset($error_data['messages']) && 
                                   is_array($error_data['messages']) && 
                                   !empty(array_filter($error_data['messages'], function($msg) {
                                       return strpos($msg, 'opportunity_stage_enum') !== false;
                                   })));
                
                if ($has_stage_error) {
                    self::debug_log("[OPPORTUNITY DEBUG] 🚨 Stage enum error detected! Current stage: " . $opportunity_stage);
                    
                    // Try a comprehensive list of common CRM stage values
                    $alternative_stages = [
                        'PROSPECT', 'LEAD', 'QUALIFIED', 'CONTACT', 'DISCOVERY',
                        'PRESENTATION', 'PROPOSAL', 'QUOTATION', 'NEGOTIATION', 
                        'VERBAL_COMMITMENT', 'CONTRACT', 'WON', 'LOST',
                        'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD', 'NURTURING'
                    ];
                    
                    foreach ($alternative_stages as $alt_stage) {
                        if ($alt_stage !== $opportunity_stage) {
                            self::debug_log("[OPPORTUNITY DEBUG] 🔄 Retrying with alternative stage: " . $alt_stage);
                            
                            // Update the opportunity data with new stage
                            $opportunity_data['stage'] = $alt_stage;
                            
                            // Retry the request
                            $retry_response = self::crm_request('/opportunities', $opportunity_data, 'POST');
                            
                            if ($retry_response['success']) {
                                self::debug_log("[OPPORTUNITY DEBUG] ✅ SUCCESS with alternative stage: " . $alt_stage);
                                self::debug_log("[OPPORTUNITY DEBUG] 🎉 Found working stage for TwentyOne CRM: " . $alt_stage);
                                $response = $retry_response; // Use the successful response
                                break;
                            } else {
                                self::debug_log("[OPPORTUNITY DEBUG] ❌ Alternative stage '" . $alt_stage . "' also failed");
                            }
                        }
                    }
                }
            }
            
            // If still failed after retries, return error
            if (!$response['success']) {
                return [
                    'success' => false,
                    'message' => 'Failed to create opportunity - CRM API error',
                    'error' => $response['message'] ?? 'Unknown error',
                    'debug_info' => [
                        'status_code' => $response['status_code'] ?? null,
                        'requested_stage' => $requested_stage,
                        'final_stage' => $opportunity_data['stage'] ?? $opportunity_stage
                    ]
                ];
            }
        }
        
        // Extract opportunity ID from nested response structure  
        $opportunity_id = null;
        
        self::debug_log("[OPPORTUNITY DEBUG] 🔍 Attempting to extract opportunity ID from response...");
        
        // Extract opportunity ID according to TwentyOne CRM API documentation
        // Expected structure: response["data"]["createOpportunity"]["id"]
        if (!empty($response['data']['data']['createOpportunity']['id'])) {
            $opportunity_id = $response['data']['data']['createOpportunity']['id'];
            self::debug_log("[OPPORTUNITY DEBUG] ✅ Found opportunity ID in data.data.createOpportunity.id: " . $opportunity_id);
        } elseif (!empty($response['data']['createOpportunity']['id'])) {
            $opportunity_id = $response['data']['createOpportunity']['id'];
            self::debug_log("[OPPORTUNITY DEBUG] ✅ Found opportunity ID in data.createOpportunity.id: " . $opportunity_id);
        } elseif (!empty($response['data']['id'])) {
            // Fallback: direct ID in data
            $opportunity_id = $response['data']['id'];
            self::debug_log("[OPPORTUNITY DEBUG] ✅ Found opportunity ID in data.id: " . $opportunity_id);
        } else {
            self::debug_log("[OPPORTUNITY DEBUG] ❌ No opportunity ID found in expected response structure");
            self::debug_log("[OPPORTUNITY DEBUG] 📋 Available response data keys: " . json_encode(array_keys($response['data'] ?? [])));
            
            // If data exists, show its structure for debugging
            if (!empty($response['data'])) {
                self::debug_log("[OPPORTUNITY DEBUG] 📊 Full response data structure: " . json_encode($response['data'], JSON_PRETTY_PRINT));
            }
        }
        
        if ($opportunity_id) {
            self::debug_log("[OPPORTUNITY DEBUG] 🎉 SUCCESS: Opportunity created with ID: " . $opportunity_id);
            return [
                'success' => true,
                'deal_id' => $opportunity_id
            ];
        }
        
        self::debug_log("[OPPORTUNITY DEBUG] ❌ FAILED: No opportunity ID could be extracted from CRM response");
        return [
            'success' => false,
            'message' => 'Failed to create opportunity - no ID returned from CRM',
            'error' => 'No opportunity ID returned',
            'debug_response_keys' => array_keys($response['data'] ?? [])
        ];
    }
    
    /**
     * Create a note in CRM - Global method for all widgets
     * @param array $data ['title', 'content', 'person_id', 'deal_id']
     * @return array ['success', 'note_id']
     */
    public static function create_note($data) {
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
        
        // Extract note ID according to TwentyOne CRM API documentation
        // Expected structure: response["data"]["createNote"]["id"]
        $note_id = null;
        
        if (!empty($response['data']['data']['createNote']['id'])) {
            $note_id = $response['data']['data']['createNote']['id'];
            self::debug_log("[NOTE DEBUG] ✅ Found note ID in data.data.createNote.id: " . $note_id);
        } elseif (!empty($response['data']['createNote']['id'])) {
            $note_id = $response['data']['createNote']['id'];
            self::debug_log("[NOTE DEBUG] ✅ Found note ID in data.createNote.id: " . $note_id);
        } elseif (!empty($response['data']['id'])) {
            $note_id = $response['data']['id'];
            self::debug_log("[NOTE DEBUG] ✅ Found note ID in data.id: " . $note_id);
        } else {
            self::debug_log("[NOTE DEBUG] ❌ No note ID found in expected response structure");
            self::debug_log("[NOTE DEBUG] 📋 Available response data keys: " . json_encode(array_keys($response['data'] ?? [])));
            
            if (!empty($response['data'])) {
                self::debug_log("[NOTE DEBUG] 📊 Full response data structure: " . json_encode($response['data'], JSON_PRETTY_PRINT));
            }
        }
        
        if ($note_id) {
            return [
                'success' => true,
                'note_id' => $note_id
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Failed to create note - no ID returned from CRM',
            'error' => 'No note ID returned',
            'debug_response_keys' => array_keys($response['data'] ?? [])
        ];
    }
}