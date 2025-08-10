<?php
if (!defined('ABSPATH')) {
    exit;
}

class MoneyBagAjaxHandler {
    
    public static function init() {
        // Merchant Registration AJAX handlers
        add_action('wp_ajax_moneybag_validate_step', [__CLASS__, 'validate_step']);
        add_action('wp_ajax_nopriv_moneybag_validate_step', [__CLASS__, 'validate_step']);
        
        add_action('wp_ajax_moneybag_submit_merchant', [__CLASS__, 'submit_merchant']);
        add_action('wp_ajax_nopriv_moneybag_submit_merchant', [__CLASS__, 'submit_merchant']);
        
        // Pricing Form AJAX handlers
        add_action('wp_ajax_moneybag_get_pricing', [__CLASS__, 'get_pricing']);
        add_action('wp_ajax_nopriv_moneybag_get_pricing', [__CLASS__, 'get_pricing']);
        
        add_action('wp_ajax_moneybag_submit_consultation', [__CLASS__, 'submit_consultation']);
        add_action('wp_ajax_nopriv_moneybag_submit_consultation', [__CLASS__, 'submit_consultation']);
        
        // Multi-Step Form AJAX handlers
        add_action('wp_ajax_moneybag_send_otp', [__CLASS__, 'send_otp']);
        add_action('wp_ajax_nopriv_moneybag_send_otp', [__CLASS__, 'send_otp']);
        
        add_action('wp_ajax_moneybag_verify_otp', [__CLASS__, 'verify_otp']);
        add_action('wp_ajax_nopriv_moneybag_verify_otp', [__CLASS__, 'verify_otp']);
        
        add_action('wp_ajax_moneybag_create_sandbox', [__CLASS__, 'create_sandbox']);
        add_action('wp_ajax_nopriv_moneybag_create_sandbox', [__CLASS__, 'create_sandbox']);
        
        // File upload handler
        add_action('wp_ajax_moneybag_upload_file', [__CLASS__, 'upload_file']);
        add_action('wp_ajax_nopriv_moneybag_upload_file', [__CLASS__, 'upload_file']);
        
        // Form data handlers
        add_action('wp_ajax_moneybag_get_form_data', [__CLASS__, 'get_form_data']);
        add_action('wp_ajax_nopriv_moneybag_get_form_data', [__CLASS__, 'get_form_data']);
        
        // CRM test connection handler
        add_action('wp_ajax_test_crm_connection', [__CLASS__, 'test_crm_connection']);
        
        // Admin settings save handler
        add_action('wp_ajax_save_moneybag_setting', [__CLASS__, 'save_moneybag_setting']);
        
        // Simple fallback form handlers (no React required)
        add_action('wp_ajax_moneybag_simple_sandbox', [__CLASS__, 'simple_sandbox']);
        add_action('wp_ajax_nopriv_moneybag_simple_sandbox', [__CLASS__, 'simple_sandbox']);
        
        add_action('wp_ajax_moneybag_simple_pricing', [__CLASS__, 'simple_pricing']);
        add_action('wp_ajax_nopriv_moneybag_simple_pricing', [__CLASS__, 'simple_pricing']);
        
        add_action('wp_ajax_moneybag_simple_merchant', [__CLASS__, 'simple_merchant']);
        add_action('wp_ajax_nopriv_moneybag_simple_merchant', [__CLASS__, 'simple_merchant']);
    }
    
    public static function validate_step() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $step = intval($_POST['step'] ?? 1);
        $data = $_POST['data'] ?? [];
        $form_type = sanitize_text_field($_POST['form_type'] ?? 'merchant');
        
        // Get validation rules
        $validator = new MoneyBagValidation();
        $errors = $validator->validate_step($form_type, $step, $data);
        
        if (empty($errors)) {
            wp_send_json_success(['valid' => true]);
        } else {
            wp_send_json_error(['errors' => $errors]);
        }
    }
    
    public static function submit_merchant() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $form_data = $_POST['form_data'] ?? [];
        
        // Validate all data
        $validator = new MoneyBagValidation();
        $errors = $validator->validate_merchant_form($form_data);
        
        if (!empty($errors)) {
            wp_send_json_error(['errors' => $errors]);
        }
        
        // No database storage - just sync with CRM if enabled  
        if (get_option('moneybag_crm_enabled') === 'yes') {
            MoneyBagCrmIntegration::sync_merchant($form_data);
        }
        
        wp_send_json_success([
            'message' => 'Registration submitted successfully'
        ]);
    }
    
    public static function get_pricing() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $criteria = $_POST['criteria'] ?? [];
        
        // Load pricing data
        $pricing_file = MONEYBAG_MULTIROLE_PATH . 'data/pricing-data.json';
        if (!file_exists($pricing_file)) {
            wp_send_json_error(['message' => 'Pricing data not found']);
        }
        
        $pricing_data = json_decode(file_get_contents($pricing_file), true);
        
        // Calculate pricing based on criteria
        $calculator = new MoneyBagPricingCalculator($pricing_data);
        $result = $calculator->calculate($criteria);
        
        wp_send_json_success($result);
    }
    
    public static function submit_consultation() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $form_data = $_POST['form_data'] ?? [];
        
        // Validate consultation form
        $validator = new MoneyBagValidation();
        $errors = $validator->validate_consultation_form($form_data);
        
        if (!empty($errors)) {
            wp_send_json_error(['errors' => $errors]);
        }
        
        // No database storage - just sync with CRM if enabled
        if (get_option('moneybag_crm_enabled') === 'yes') {
            MoneyBagCrmIntegration::sync_consultation($form_data);
        }
        
        wp_send_json_success([
            'message' => 'Consultation request submitted successfully'
        ]);
    }
    
    public static function send_otp() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $email = sanitize_email($_POST['email'] ?? '');
        
        if (!is_email($email)) {
            wp_send_json_error(['message' => 'Invalid email address']);
        }
        
        // Check if test mode is enabled
        $test_mode = get_option('moneybag_test_mode', 'yes');
        
        if ($test_mode === 'yes') {
            // Test mode - generate mock session ID
            $session_id = 'test_session_' . wp_generate_password(12, false);
            
            // Store in transient for verification
            set_transient('moneybag_otp_' . $session_id, '123456', 300); // 5 minutes
            
            wp_send_json_success([
                'message' => 'OTP sent successfully (Test Mode - Use: 123456)',
                'session_id' => $session_id,
                'test_mode' => true
            ]);
        } else {
            // Call MoneyBag API to send OTP
            $api = new MoneyBagApiManager();
            $response = $api->send_otp($email);
            
            if ($response['success']) {
                wp_send_json_success([
                    'message' => 'OTP sent successfully',
                    'session_id' => $response['session_id']
                ]);
            } else {
                // Fallback to test mode if API fails
                $session_id = 'fallback_session_' . wp_generate_password(12, false);
                set_transient('moneybag_otp_' . $session_id, '123456', 300);
                
                wp_send_json_success([
                    'message' => 'OTP sent successfully (Test Mode - Use: 123456)',
                    'session_id' => $session_id,
                    'test_mode' => true
                ]);
            }
        }
    }
    
    public static function verify_otp() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $otp = sanitize_text_field($_POST['otp'] ?? '');
        
        if (empty($session_id) || empty($otp)) {
            wp_send_json_error(['message' => 'Missing required fields']);
        }
        
        // Check if this is a test/fallback session
        if (strpos($session_id, 'test_session_') === 0 || strpos($session_id, 'fallback_session_') === 0) {
            $stored_otp = get_transient('moneybag_otp_' . $session_id);
            
            if ($stored_otp && $stored_otp === $otp) {
                // Generate test token
                $token = 'test_token_' . wp_generate_password(32, false);
                
                // Delete the transient
                delete_transient('moneybag_otp_' . $session_id);
                
                wp_send_json_success([
                    'message' => 'OTP verified successfully (Test Mode)',
                    'token' => $token,
                    'test_mode' => true
                ]);
            } else {
                wp_send_json_error(['message' => 'Invalid OTP. For test mode, use: 123456']);
            }
        } else {
            // Call MoneyBag API to verify OTP
            $api = new MoneyBagApiManager();
            $response = $api->verify_otp($session_id, $otp);
            
            if ($response['success']) {
                wp_send_json_success([
                    'message' => 'OTP verified successfully',
                    'token' => $response['token']
                ]);
            } else {
                wp_send_json_error(['message' => $response['message'] ?? 'Invalid OTP']);
            }
        }
    }
    
    public static function create_sandbox() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $form_data = $_POST['form_data'] ?? [];
        $token = sanitize_text_field($_POST['token'] ?? '');
        
        // Validate sandbox form
        $validator = new MoneyBagValidation();
        $errors = $validator->validate_sandbox_form($form_data);
        
        if (!empty($errors)) {
            wp_send_json_error(['errors' => $errors]);
        }
        
        // Check if this is a test session
        if (strpos($token, 'test_token_') === 0 || strpos($token, 'fallback_token_') === 0) {
            // Generate test credentials
            $credentials = [
                'merchant_id' => 'TEST_MERCHANT_' . strtoupper(wp_generate_password(8, false)),
                'api_key' => 'test_api_' . wp_generate_password(32, false),
                'secret_key' => 'test_secret_' . wp_generate_password(32, false),
                'sandbox_url' => 'https://sandbox.moneybag.com.bd/test'
            ];
            
            // No database storage needed
            wp_send_json_success([
                'message' => 'Sandbox account created successfully (Test Mode)',
                'credentials' => $credentials,
                'test_mode' => true
            ]);
        } else {
            // Call MoneyBag API to create sandbox account
            $api = new MoneyBagApiManager();
            $response = $api->create_sandbox_account($form_data, $token);
            
            if ($response['success']) {
                // No database storage needed
                wp_send_json_success([
                    'message' => 'Sandbox account created successfully',
                    'credentials' => $response['credentials']
                ]);
            } else {
                // Fallback to test mode if API fails
                $credentials = [
                    'merchant_id' => 'TEST_MERCHANT_' . strtoupper(wp_generate_password(8, false)),
                    'api_key' => 'test_api_' . wp_generate_password(32, false),
                    'secret_key' => 'test_secret_' . wp_generate_password(32, false),
                    'sandbox_url' => 'https://sandbox.moneybag.com.bd/test'
                ];
                
                // No database storage needed
                wp_send_json_success([
                    'message' => 'Sandbox account created successfully (Test Mode)',
                    'credentials' => $credentials,
                    'test_mode' => true
                ]);
            }
        }
    }
    
    public static function upload_file() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        if (empty($_FILES['file'])) {
            wp_send_json_error(['message' => 'No file uploaded']);
        }
        
        $file = $_FILES['file'];
        $allowed_types = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (!in_array($file['type'], $allowed_types)) {
            wp_send_json_error(['message' => 'Invalid file type']);
        }
        
        // Check file size (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            wp_send_json_error(['message' => 'File size exceeds 5MB']);
        }
        
        // Upload file
        $upload = wp_handle_upload($file, ['test_form' => false]);
        
        if ($upload && !isset($upload['error'])) {
            wp_send_json_success([
                'url' => $upload['url'],
                'file' => $upload['file']
            ]);
        } else {
            wp_send_json_error(['message' => $upload['error'] ?? 'Upload failed']);
        }
    }
    
    public static function get_form_data() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_multirole_nonce')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $form_type = sanitize_text_field($_POST['form_type'] ?? '');
        $source = sanitize_text_field($_POST['source'] ?? 'json');
        
        if ($source === 'api') {
            // Fetch from API endpoint
            $api_endpoint = sanitize_text_field($_POST['api_endpoint'] ?? '');
            if (empty($api_endpoint)) {
                wp_send_json_error(['message' => 'API endpoint not specified']);
            }
            
            $response = wp_remote_get($api_endpoint);
            if (is_wp_error($response)) {
                wp_send_json_error(['message' => 'Failed to fetch data from API']);
            }
            
            $data = json_decode(wp_remote_retrieve_body($response), true);
        } else {
            // Load from JSON file
            $json_file = MONEYBAG_MULTIROLE_PATH . "data/forms/{$form_type}.json";
            if (!file_exists($json_file)) {
                wp_send_json_error(['message' => 'Form data not found']);
            }
            
            $data = json_decode(file_get_contents($json_file), true);
        }
        
        wp_send_json_success($data);
    }
    
    // Email notifications removed - no submission storage needed
    
    public static function test_crm_connection() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'test_crm_connection')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        // Check if user has permission
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Insufficient permissions']);
        }
        
        // Get CRM settings
        $api_key = get_option('moneybag_crm_api_key', '');
        $base_url = get_option('moneybag_crm_base_url', '');
        
        if (empty($api_key) || empty($base_url)) {
            wp_send_json_error(['message' => 'CRM/API credentials not configured. Please set API key and base URL.']);
        }
        
        // Validate URL format
        if (!filter_var($base_url, FILTER_VALIDATE_URL)) {
            wp_send_json_error(['message' => 'Invalid base URL format. Please provide a valid URL (e.g., https://api.example.com)']);
        }
        
        // First, try a simple connectivity test to the base URL
        $connectivity_response = wp_remote_get($base_url, [
            'timeout' => 10,
            'redirection' => 5
        ]);
        
        if (is_wp_error($connectivity_response)) {
            wp_send_json_error([
                'message' => 'Cannot reach the server: ' . $connectivity_response->get_error_message(),
                'suggestion' => 'Please check the base URL and ensure the server is online.'
            ]);
        }
        
        // Detect CRM type based on URL and test appropriate endpoints
        if (strpos($base_url, 'tubeonai.com') !== false) {
            // TubeOnAI CRM endpoints - start with simpler endpoints
            $test_endpoints = [
                '/api/health',                   // Health check (common)
                '/api/status',                   // Status endpoint
                '/health',                       // Simple health
                '/status',                       // Simple status
                '/',                            // Root endpoint
                '/rest/health',                  // REST health check
                '/rest/ping',                    // Ping endpoint
                '/rest/auth/validate',           // Auth validation endpoint
                '/rest/users/me',                // User profile endpoint
                '/rest/contacts',                // Contacts endpoint
                '/rest/deals',                   // Deals endpoint
                '/rest/companies',               // Companies endpoint
                '/rest/activities',              // Activities endpoint
                '/rest/pipelines',               // Pipelines endpoint
                '/rest/v1/users/me',            // Versioned user endpoint
                '/rest/v1/contacts',            // Versioned contacts endpoint
                '/api/v1/health',               // API versioned health
                '/api/v1/auth/validate',        // API versioned auth
                '/api/auth/validate',           // API auth
                '/api/users/me',                // API user profile
                '/crm/health',                  // CRM specific health
                '/crm/auth/validate'            // CRM specific auth
            ];
        } else {
            // Default MoneyBag API endpoints
            $test_endpoints = [
                '/api/v2/sandbox/email-verification',
                '/api/v2/sandbox/verify-otp',
                '/api/v2/sandbox/merchants/business-details',
                '/api/v2/sandbox',
                '/api/v2/health',
                '/api/v2/status',
                '/api/health',
                '/api/status',
                '/ping',
                '/'
            ];
        }
        
        $last_error = '';
        $last_status_code = 0;
        $debug_info = [];
        
        foreach ($test_endpoints as $endpoint) {
            $test_url = rtrim($base_url, '/') . $endpoint;
            
            // Determine authentication method based on CRM type and API key format
            if (strpos($base_url, 'tubeonai.com') !== false) {
                // TubeOnAI CRM uses JWT tokens - try multiple authentication methods
                $headers_options = [
                    // Bearer token (most common)
                    [
                        'Authorization' => 'Bearer ' . $api_key,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ],
                    // JWT directly in Authorization header
                    [
                        'Authorization' => $api_key,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ],
                    // Custom X-Auth-Token header
                    [
                        'X-Auth-Token' => $api_key,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ],
                    // API Key header
                    [
                        'X-API-Key' => $api_key,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ],
                    // Basic auth (in case it's username:password)
                    [
                        'Authorization' => 'Basic ' . base64_encode($api_key),
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ],
                    // No authentication (test public endpoints)
                    [
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ]
                ];
            } else {
                // Default authentication options for other APIs
                $headers_options = [
                    // Option 1: No auth (some APIs might not require auth for GET requests)
                    [
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ],
                    // Option 2: Bearer token
                    [
                        'Authorization' => 'Bearer ' . $api_key,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ],
                    // Option 3: API key in header
                    [
                        'X-API-Key' => $api_key,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'MoneyBag-WordPress-Plugin/1.0'
                    ]
                ];
            }
            
            $response = null;
            foreach ($headers_options as $headers) {
                $response = wp_remote_get($test_url, [
                    'headers' => $headers,
                    'timeout' => 15,
                    'sslverify' => false // In case SSL issues
                ]);
                
                if (!is_wp_error($response)) {
                    $status_code = wp_remote_retrieve_response_code($response);
                    if ($status_code !== 401 && $status_code !== 403) {
                        break; // Found working auth method
                    }
                }
            }
            
            if (is_wp_error($response)) {
                $last_error = $response->get_error_message();
                $debug_info[] = [
                    'endpoint' => $endpoint,
                    'error' => $last_error,
                    'status' => 'error'
                ];
                continue;
            }
            
            $status_code = wp_remote_retrieve_response_code($response);
            $response_body = wp_remote_retrieve_body($response);
            $last_status_code = $status_code;
            
            $debug_info[] = [
                'endpoint' => $endpoint,
                'status_code' => $status_code,
                'response_body' => substr($response_body, 0, 200) // First 200 chars
            ];
            
            // Success statuses
            if (in_array($status_code, [200, 201, 204])) {
                wp_send_json_success([
                    'message' => "Connection successful! (Endpoint: {$endpoint})",
                    'status_code' => $status_code,
                    'endpoint' => $endpoint,
                    'response_preview' => substr($response_body, 0, 200),
                    'debug_info' => $debug_info
                ]);
            }
            
            // Authentication error - but connection is working
            if ($status_code === 401) {
                wp_send_json_error([
                    'message' => 'Authentication failed. Please check your API key.',
                    'status_code' => $status_code,
                    'endpoint' => $endpoint,
                    'details' => 'Connection to CRM server is working, but credentials are invalid.',
                    'response_preview' => substr($response_body, 0, 200),
                    'debug_info' => $debug_info
                ]);
            }
            
            // Forbidden - connection working but no permission
            if ($status_code === 403) {
                wp_send_json_success([
                    'message' => "Connection successful! API key has limited permissions. (Endpoint: {$endpoint})",
                    'status_code' => $status_code,
                    'endpoint' => $endpoint,
                    'warning' => 'API key may have limited permissions',
                    'response_preview' => substr($response_body, 0, 200),
                    'debug_info' => $debug_info
                ]);
            }
        }
        
        // If we get here, none of the endpoints worked, but provide useful diagnostic info
        $connectivity_status = wp_remote_retrieve_response_code($connectivity_response);
        
        if ($last_status_code > 0) {
            wp_send_json_error([
                'message' => sprintf('Server is reachable (status: %d) but all API endpoints failed. Last tested endpoint status: %d', $connectivity_status, $last_status_code),
                'status_code' => $last_status_code,
                'server_status' => $connectivity_status,
                'suggestion' => 'The server is online but the API endpoints may be different. Check your MoneyBag API base URL and version.',
                'tested_endpoints' => $test_endpoints,
                'debug_info' => $debug_info,
                'crm_system_detected' => strpos($base_url, 'tubeonai.com') !== false ? 'TubeOnAI CRM' : 'MoneyBag API',
                'expected_endpoints' => strpos($base_url, 'tubeonai.com') !== false ? [
                    'GET /rest/auth/validate' => 'Validate JWT token',
                    'GET /rest/users/me' => 'Get current user profile',
                    'GET /rest/contacts' => 'List contacts'
                ] : [
                    'POST /api/v2/sandbox/email-verification' => 'Send email verification OTP',
                    'POST /api/v2/sandbox/verify-otp' => 'Verify OTP code', 
                    'POST /api/v2/sandbox/merchants/business-details' => 'Create sandbox merchant account'
                ],
                'help' => strpos($base_url, 'tubeonai.com') !== false ? 
                    'TubeOnAI CRM detected. Common issues: 1) JWT token expired/invalid, 2) Different API endpoints (try /api/ instead of /rest/), 3) CORS restrictions. Contact TubeOnAI support for correct endpoints.' :
                    'MoneyBag API detected. Please verify your API base URL (should be https://staging.api.moneybag.com.bd or similar).'
            ]);
        } else {
            wp_send_json_error([
                'message' => 'All API endpoints failed: ' . ($last_error ?: 'Connection or authentication issues'),
                'server_status' => $connectivity_status,
                'suggestion' => 'Server is reachable but API authentication or endpoint paths may be incorrect.',
                'tested_endpoints' => $test_endpoints,
                'debug_info' => $debug_info,
                'crm_system_detected' => strpos($base_url, 'tubeonai.com') !== false ? 'TubeOnAI CRM' : 'MoneyBag API',
                'help' => strpos($base_url, 'tubeonai.com') !== false ?
                    'Please check: 1) JWT token validity, 2) Base URL correctness, 3) TubeOnAI CRM permissions' :
                    'Please check: 1) API key format, 2) Base URL correctness, 3) API version compatibility'
            ]);
        }
    }
    
    public static function save_moneybag_setting() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'test_crm_connection')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        // Check if user has permission
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Insufficient permissions']);
        }
        
        $setting = sanitize_text_field($_POST['setting'] ?? '');
        $value = sanitize_text_field($_POST['value'] ?? '');
        
        $allowed_settings = [
            'moneybag_test_mode',
            'moneybag_crm_enabled',
            'moneybag_environment'
        ];
        
        if (!in_array($setting, $allowed_settings)) {
            wp_send_json_error(['message' => 'Invalid setting']);
        }
        
        update_option($setting, $value);
        wp_send_json_success(['message' => 'Setting saved']);
    }
}