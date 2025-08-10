<?php
if (!defined('ABSPATH')) {
    exit;
}

class MoneyBagApiManager {
    
    private $base_url;
    private $environment;
    
    public function __construct() {
        $this->environment = get_option('moneybag_environment', 'staging');
        $this->base_url = $this->get_base_url();
    }
    
    public static function init() {
        // Register REST API endpoints
        add_action('rest_api_init', [__CLASS__, 'register_rest_routes']);
    }
    
    private function get_base_url() {
        if ($this->environment === 'production') {
            return 'https://api.moneybag.com.bd/api/v2';
        }
        return 'https://staging.api.moneybag.com.bd/api/v2';
    }
    
    public function send_otp($email) {
        $endpoint = $this->base_url . '/sandbox/email-verification';
        
        $response = wp_remote_post($endpoint, [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ],
            'body' => wp_json_encode([
                'email' => $email
            ]),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => 'Network error: ' . $response->get_error_message()
            ];
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code === 200 || $status_code === 201) {
            return [
                'success' => true,
                'session_id' => $body['session_id'] ?? '',
                'message' => $body['message'] ?? 'OTP sent successfully'
            ];
        }
        
        return [
            'success' => false,
            'message' => $body['message'] ?? 'Failed to send OTP'
        ];
    }
    
    public function verify_otp($session_id, $otp) {
        $endpoint = $this->base_url . '/sandbox/verify-otp';
        
        $response = wp_remote_post($endpoint, [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ],
            'body' => wp_json_encode([
                'session_id' => $session_id,
                'otp' => $otp
            ]),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => 'Network error: ' . $response->get_error_message()
            ];
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code === 200) {
            return [
                'success' => true,
                'token' => $body['token'] ?? '',
                'message' => 'OTP verified successfully'
            ];
        }
        
        return [
            'success' => false,
            'message' => $body['message'] ?? 'Invalid OTP'
        ];
    }
    
    public function create_sandbox_account($data, $token = '') {
        $endpoint = $this->base_url . '/sandbox/merchants/business-details';
        
        // Complete data mapping based on discovered API structure
        $request_data = [
            'token' => $token,
            'first_name' => sanitize_text_field($data['firstName']),
            'last_name' => sanitize_text_field($data['lastName']),
            'phone' => sanitize_text_field($data['mobile']), // API expects 'phone'
            'legal_identity' => sanitize_text_field($data['legalIdentity']),
            'business_name' => sanitize_text_field($data['businessName']),
            'password' => $data['password'],
            'email' => sanitize_email($data['email']),
            'business_email' => sanitize_email($data['email']), // Additional email field
            'business_phone' => sanitize_text_field($data['mobile']), // Business phone
            'business_type' => 'other', // Default value
            'business_address' => 'Not specified', // Default value
            'terms_accepted' => true // Terms acceptance
        ];
        
        // Handle website URL
        $website = $data['website'] ?? '';
        if (empty($website) || $website === 'http://' || $website === 'https://') {
            $request_data['business_website'] = 'https://example.com'; // Default if required
        } else {
            $request_data['business_website'] = esc_url($website);
        }
        
        $response = wp_remote_post($endpoint, [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
                // No Authorization header needed for sandbox
            ],
            'body' => wp_json_encode($request_data),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            error_log('MoneyBag API Error: ' . $response->get_error_message());
            return [
                'success' => false,
                'message' => 'Network error: ' . $response->get_error_message()
            ];
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        $status_code = wp_remote_retrieve_response_code($response);
        
        // Log response for debugging
        error_log('MoneyBag API Response: ' . wp_json_encode($body));
        error_log('MoneyBag API HTTP Code: ' . $status_code);
        
        if ($status_code >= 200 && $status_code < 300 && !isset($body['detail'])) {
            // Try to extract credentials from various possible response structures
            $result_data = isset($body['data']) ? $body['data'] : $body;
            
            $credentials = [
                'merchant_id' => $result_data['merchant_id'] ?? $result_data['merchantId'] ?? $result_data['id'] ?? '',
                'api_key' => $result_data['api_key'] ?? $result_data['apiKey'] ?? $result_data['key'] ?? '',
                'secret_key' => $result_data['secret_key'] ?? $result_data['secretKey'] ?? $result_data['secret'] ?? '',
                'sandbox_url' => $result_data['sandbox_url'] ?? 'https://staging.api.moneybag.com.bd'
            ];
            
            // If no credentials in response, it might be sent via email
            if (!$credentials['merchant_id'] && !$credentials['api_key']) {
                $credentials['email_sent'] = true;
                $message = 'Sandbox account created! Check your email for credentials.';
            } else {
                $message = $body['message'] ?? 'Sandbox account created successfully';
            }
            
            return [
                'success' => true,
                'credentials' => $credentials,
                'message' => $message
            ];
        } else {
            // Handle API errors
            $error_message = 'Failed to create sandbox account';
            if (isset($body['detail']) && is_array($body['detail'])) {
                $errors = array_map(function($err) {
                    return $err['loc'][1] . ': ' . $err['msg'];
                }, $body['detail']);
                $error_message = implode(', ', $errors);
            } elseif (isset($body['message'])) {
                $error_message = $body['message'];
            }
            
            return [
                'success' => false,
                'message' => $error_message
            ];
        }
    }
    
    public static function register_rest_routes() {
        register_rest_route('moneybag-multirole/v1', '/validate', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_validate'],
            'permission_callback' => '__return_true'
        ]);
        
        register_rest_route('moneybag-multirole/v1', '/form-config', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_form_config'],
            'permission_callback' => '__return_true'
        ]);
    }
    
    public static function handle_validate($request) {
        $field = $request->get_param('field');
        $value = $request->get_param('value');
        $type = $request->get_param('type');
        
        $validator = new MoneyBagValidation();
        $errors = $validator->validate_field($field, $value, $type);
        
        if (empty($errors)) {
            return new WP_REST_Response(['valid' => true], 200);
        }
        
        return new WP_REST_Response([
            'valid' => false,
            'errors' => $errors
        ], 200);
    }
    
    public static function get_form_config($request) {
        $form_type = $request->get_param('type');
        
        $config_file = MONEYBAG_MULTIROLE_PATH . "data/forms/{$form_type}-config.json";
        
        if (!file_exists($config_file)) {
            return new WP_REST_Response([
                'error' => 'Configuration not found'
            ], 404);
        }
        
        $config = json_decode(file_get_contents($config_file), true);
        
        return new WP_REST_Response($config, 200);
    }
}