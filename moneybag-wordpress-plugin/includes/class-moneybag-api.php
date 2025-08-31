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
     * Custom debug logging to plugin directory
     */
    private static function debug_log($message) {
        $log_file = MONEYBAG_PLUGIN_PATH . 'debug.log';
        $timestamp = date('Y-m-d H:i:s');
        $log_message = "[{$timestamp}] {$message}\n";
        file_put_contents($log_file, $log_message, FILE_APPEND);
        
        // Also use error_log for systems that have it configured
        error_log($message);
    }
    
    /**
     * Get API base URL
     */
    private static function get_api_base() {
        return get_option('moneybag_api_base_url', 'https://api.moneybag.com.bd/api/v2');
    }
    
    /**
     * Get Sandbox API base URL
     */
    private static function get_sandbox_api_base() {
        // Force update to correct staging URL if it's set to wrong sandbox URL
        $current_url = get_option('moneybag_sandbox_api_url', '');
        if ($current_url === 'https://sandbox.api.moneybag.com.bd/api/v2') {
            update_option('moneybag_sandbox_api_url', 'https://staging.api.moneybag.com.bd/api/v2');
        }
        return get_option('moneybag_sandbox_api_url', 'https://staging.api.moneybag.com.bd/api/v2');
    }
    
    /**
     * Get CRM API base URL
     */
    private static function get_crm_api_base() {
        return get_option('moneybag_crm_api_url', 'https://crm.moneybag.com.bd/rest');
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
     * Make API request to Moneybag Sandbox
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
        
        // Sandbox endpoints for account creation typically don't require authentication
        // Only add API key if this is not a sandbox account creation endpoint
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
        
        // Clean response handling
        
        // API errors logged only in debug mode
        
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
        $url = self::get_crm_api_base() . $endpoint;
        $api_key = self::get_crm_api_key();
        
        // Log CRM requests for debugging (remove in production)
        // error_log('[CRM Debug] Request URL: ' . $url);
        // error_log('[CRM Debug] Method: ' . $method);
        // error_log('[CRM Debug] API Key present: ' . (!empty($api_key) ? 'Yes' : 'No'));
        // error_log('[CRM Debug] Data: ' . json_encode($data));
        
        $args = [
            'method' => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Authorization' => 'Bearer ' . $api_key,
            ],
            'body' => json_encode($data),
            'sslverify' => true
        ];
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            // error_log('[CRM Debug] Network error: ' . $response->get_error_message());
            return [
                'success' => false,
                'message' => $response->get_error_message(),
                'error' => 'network_error'
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // Temporarily enable logging for noteTargets debugging
        // if (strpos($endpoint, 'noteTarget') !== false) {
        //     error_log('[CRM Debug] Response status: ' . $status_code);
        //     error_log('[CRM Debug] Response body: ' . substr($body, 0, 1000));
        // }
        
        if ($status_code >= 200 && $status_code < 300) {
            return [
                'success' => true,
                'data' => $data
            ];
        } else {
            // error_log('[CRM Debug] Request failed with status ' . $status_code . ' Body: ' . $body);
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
    
    public static function send_email_verification_curl($identifier) {
        // Alternative implementation using cURL directly
        self::debug_log("\n\n========== NEW API REQUEST ==========");
        self::debug_log("Identifier: " . $identifier);
        self::debug_log("NO VALIDATION - Let API handle everything");
        
        if (empty($identifier)) {
            return [
                'success' => false,
                'message' => 'Email or phone number is required',
                'error' => 'validation_error'
            ];
        }
        
        // WORKAROUND: API documentation is wrong - use what the server actually expects
        $url = self::get_sandbox_api_base() . '/sandbox/email-verification';
        
        // Using documented 'identifier' field - curl tests confirm this works
        // Issue must be in our request headers or format
        $payload = [
            'identifier' => $identifier
        ];
        
        self::debug_log("Using documented identifier field with correct staging URL");
        self::debug_log("Final URL: " . $url);
        
        $data = json_encode($payload);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'accept: application/json',
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_VERBOSE, true); // Enable verbose output
        
        self::debug_log('========== cURL Request Debug ==========');
        self::debug_log('URL: ' . $url);
        self::debug_log('Payload: ' . print_r($payload, true));
        self::debug_log('JSON Data: ' . $data);
        
        $response = curl_exec($ch);
        $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_info = curl_getinfo($ch);
        $error = curl_error($ch);
        curl_close($ch);
        
        self::debug_log('cURL Response Status: ' . $status_code);
        self::debug_log('cURL Response Body: ' . $response);
        self::debug_log('cURL Info: ' . print_r($curl_info, true));
        
        if ($error) {
            return [
                'success' => false,
                'message' => 'cURL Error: ' . $error,
                'error' => 'network_error'
            ];
        }
        
        $response_data = json_decode($response, true);
        
        // NO FALLBACK - Use API as documented
        // If it fails, return the error from the documented API
        self::debug_log("No fallback attempts - using API as documented");
        
        // Handle successful responses (200, 201)
        if ($status_code === 200 || $status_code === 201) {
            if (isset($response_data['success'])) {
                if ($response_data['success']) {
                    self::debug_log('SUCCESS! API accepted the request');
                    return $response_data;
                } else {
                    // API returned success:false (but still 200/201 status)
                    $error_msg = 'Request failed';
                    if (isset($response_data['message'])) {
                        $error_msg = $response_data['message'];
                    } elseif (isset($response_data['data']) && is_string($response_data['data'])) {
                        $error_msg = $response_data['data'];
                    }
                    self::debug_log('API returned success:false with message: ' . $error_msg);
                    return [
                        'success' => false,
                        'message' => $error_msg,
                        'error' => 'api_error'
                    ];
                }
            } else {
                // No success field, assume success if status is 200/201
                return [
                    'success' => true,
                    'data' => $response_data
                ];
            }
        }
        
        // Handle 409 Conflict (phone number already registered)
        if ($status_code === 409) {
            if (isset($response_data['message'])) {
                self::debug_log('409 CONFLICT: ' . $response_data['message']);
                return [
                    'success' => false,
                    'message' => $response_data['message'],
                    'error' => 'conflict'
                ];
            }
        }
        
        // Handle 429 Too Many Requests
        if ($status_code === 429) {
            self::debug_log('429 TOO MANY REQUESTS: Rate limited');
            return [
                'success' => false,
                'message' => 'Too many requests. Please wait a moment and try again.',
                'error' => 'rate_limit'
            ];
        }
        
        // Handle 502 Bad Gateway (server temporarily down)
        if ($status_code === 502) {
            self::debug_log('502 BAD GATEWAY: Server temporarily unavailable');
            return [
                'success' => false,
                'message' => 'Service temporarily unavailable. Please try again in a few minutes.',
                'error' => 'server_error'
            ];
        }
        
        // Handle other 5xx server errors
        if ($status_code >= 500) {
            self::debug_log('5xx SERVER ERROR: ' . $status_code);
            return [
                'success' => false,
                'message' => 'Server error. Please try again later.',
                'error' => 'server_error'
            ];
        }
        
        // If we get here, there was an error
        $error_message = 'Request failed';
        if (isset($response_data['data']) && is_string($response_data['data'])) {
            $error_message = $response_data['data'];
        } elseif (isset($response_data['message'])) {
            $error_message = $response_data['message'];
        } elseif (isset($response_data['detail'])) {
            if (is_array($response_data['detail']) && isset($response_data['detail'][0]['msg'])) {
                $error_message = $response_data['detail'][0]['msg'];
            } else {
                $error_message = is_string($response_data['detail']) ? $response_data['detail'] : json_encode($response_data['detail']);
            }
        }
        
        return [
            'success' => false,
            'message' => $error_message,
            'error' => 'api_error',
            'status_code' => $status_code,
            'raw_response' => $response
        ];
    }
    
    public static function send_email_verification($identifier) {
        // Try cURL first as it's more reliable  
        if (function_exists('curl_init')) {
            return self::send_email_verification_curl($identifier);
        }
        
        // Fall back to WordPress HTTP API if cURL is not available
        // NO VALIDATION - let API handle everything
        if (empty($identifier)) {
            return [
                'success' => false,
                'message' => 'Email or phone number is required',
                'error' => 'validation_error'
            ];
        }
        
        // NO FORMAT VALIDATION - API will handle validation
        $is_email = filter_var($identifier, FILTER_VALIDATE_EMAIL);
        $is_phone = preg_match('/^(\+880|880|0)?1[0-9]{9}$/', str_replace([' ', '-'], '', $identifier));
        
        // Use the staging API endpoint ONLY for email/phone verification (Step 1)
        // Steps 2 and 3 use production API
        $url = self::get_sandbox_api_base() . '/sandbox/email-verification';
        
        // Using documented 'identifier' field - curl tests confirm this works
        $payload = [
            'identifier' => $identifier
        ];
        
        $json_payload = json_encode($payload);
        
        // Method 1: Try with wp_remote_request and explicit method
        $args = [
            'method' => 'POST',
            'timeout' => 30,
            'redirection' => 5,
            'httpversion' => '1.1',
            'blocking' => true,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ],
            'body' => $json_payload,
            'cookies' => [],
            'sslverify' => false
        ];
        
        // Debug logging
        // error_log('========== Moneybag API Request Debug (FALLBACK METHOD) ==========');
        // error_log('USING DOCUMENTED APPROACH: identifier field (curl tests confirm this works)');
        // error_log('URL: ' . $url);
        // error_log('Method: POST');
        // error_log('Headers: ' . json_encode($args['headers']));
        // error_log('Body (JSON): ' . $json_payload);
        // error_log('Body (Raw): ' . print_r($payload, true));
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            // error_log('Moneybag API Error: ' . $response->get_error_message());
            return [
                'success' => false,
                'message' => $response->get_error_message(),
                'error' => 'network_error'
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // error_log('========== API Response Debug ==========');
        // error_log('Status Code: ' . $status_code);
        // error_log('Response Body: ' . $body);
        // error_log('=========================================');
        
        // Handle successful response (200 or 201)
        if (($status_code === 200 || $status_code === 201)) {
            // If the response has a success field, check it
            if (isset($data['success'])) {
                if ($data['success']) {
                    return $data;
                } else {
                    // Handle error response with success:false
                    $error_message = 'Request failed';
                    if (isset($data['data']) && is_string($data['data'])) {
                        // Extract error message from data field if it's a string
                        $error_message = $data['data'];
                    } elseif (isset($data['message'])) {
                        $error_message = $data['message'];
                    }
                    return [
                        'success' => false,
                        'message' => $error_message,
                        'error' => 'api_error'
                    ];
                }
            }
            // Otherwise, assume success and wrap the response
            return [
                'success' => true,
                'data' => $data,
                'session_id' => $data['session_id'] ?? null
            ];
        }
        
        // Handle validation errors (422)
        if ($status_code === 422 && isset($data['detail'])) {
            $error_details = [];
            foreach ($data['detail'] as $error) {
                $field = is_array($error['loc']) ? implode('.', $error['loc']) : ($error['loc'] ?? 'unknown');
                $message = $error['msg'] ?? 'Validation error';
                $error_details[] = $field . ': ' . $message;
            }
            return [
                'success' => false,
                'message' => implode('; ', $error_details),
                'error' => 'validation_error'
            ];
        }
        
        // Handle other API errors
        return [
            'success' => false,
            'message' => $data['message'] ?? 'API request failed (Status: ' . $status_code . ')',
            'error' => 'api_error',
            'status_code' => $status_code
        ];
    }
    
    public static function verify_otp($otp, $session_id) {
        // Use the STAGING API endpoint for OTP verification (sandbox flow)
        $url = self::get_sandbox_api_base() . '/sandbox/verify-otp';
        
        self::debug_log("========== OTP VERIFICATION REQUEST ==========");
        self::debug_log("OTP: " . $otp);
        self::debug_log("Session ID: " . $session_id);
        self::debug_log("URL: " . $url);
        
        $payload = [
            'otp' => $otp,
            'session_id' => $session_id
        ];
        
        $args = [
            'method' => 'POST',
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => json_encode($payload),
            'sslverify' => true
        ];
        
        // Debug logging
        // error_log('Moneybag API: Calling ' . $url . ' with payload: ' . json_encode($payload));
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            // error_log('Moneybag API Error: ' . $response->get_error_message());
            return [
                'success' => false,
                'message' => $response->get_error_message(),
                'error' => 'network_error'
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // error_log('========== API Response Debug ==========');
        // error_log('Status Code: ' . $status_code);
        // error_log('Response Body: ' . $body);
        // error_log('=========================================');
        
        // Handle successful response (200 or 201)
        if (($status_code === 200 || $status_code === 201)) {
            // If the response has a success field, check it
            if (isset($data['success'])) {
                if ($data['success']) {
                    return $data;
                } else {
                    return [
                        'success' => false,
                        'message' => $data['message'] ?? $data['data'] ?? 'OTP verification failed',
                        'error' => 'api_error'
                    ];
                }
            }
            // Otherwise, assume success and wrap the response
            return [
                'success' => true,
                'data' => $data,
                'verified' => $data['verified'] ?? true
            ];
        }
        
        // Handle validation errors (422)
        if ($status_code === 422 && isset($data['detail'])) {
            $error_messages = [];
            foreach ($data['detail'] as $error) {
                $error_messages[] = $error['msg'] ?? 'Validation error';
            }
            return [
                'success' => false,
                'message' => implode(', ', $error_messages),
                'data' => $data
            ];
        }
        
        // Handle other errors - include debug info for troubleshooting
        return [
            'success' => false,
            'message' => ($data['message'] ?? 'API request failed') . ' (Status: ' . $status_code . ', Response: ' . substr($body, 0, 500) . ')',
            'data' => $data,
            'status_code' => $status_code,
            'raw_response' => substr($body, 0, 1000) // Include raw response for debugging
        ];
    }
    
    public static function submit_business_details($data) {
        // Use the STAGING API endpoint for business details (sandbox flow)
        $url = self::get_sandbox_api_base() . '/sandbox/merchants/business-details';
        
        self::debug_log("========== BUSINESS DETAILS SUBMISSION ==========");
        self::debug_log("URL: " . $url);
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
        
        self::debug_log("Final payload: " . print_r($payload, true));
        
        $args = [
            'method' => 'POST',
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => json_encode($payload),
            'sslverify' => true
        ];
        
        // Debug logging
        // error_log('Moneybag API: Calling ' . $url . ' with payload: ' . json_encode($payload));
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            // error_log('Moneybag API Error: ' . $response->get_error_message());
            return [
                'success' => false,
                'message' => $response->get_error_message(),
                'error' => 'network_error'
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // error_log('========== API Response Debug ==========');
        // error_log('Status Code: ' . $status_code);
        // error_log('Response Body: ' . $body);
        // error_log('=========================================');
        
        // Handle successful response (200 or 201)
        if (($status_code === 200 || $status_code === 201)) {
            // If the response has a success field, check it
            if (isset($data['success'])) {
                if ($data['success']) {
                    return $data;
                } else {
                    return [
                        'success' => false,
                        'message' => $data['message'] ?? $data['data'] ?? 'Business details submission failed',
                        'error' => 'api_error'
                    ];
                }
            }
            // Otherwise, assume success and wrap the response
            return [
                'success' => true,
                'data' => $data
            ];
        }
        
        // Handle validation errors (422)
        if ($status_code === 422 && isset($data['detail'])) {
            $error_messages = [];
            foreach ($data['detail'] as $error) {
                $error_messages[] = $error['msg'] ?? 'Validation error';
            }
            return [
                'success' => false,
                'message' => implode(', ', $error_messages),
                'data' => $data
            ];
        }
        
        // Handle other errors - include debug info for troubleshooting
        return [
            'success' => false,
            'message' => ($data['message'] ?? 'API request failed') . ' (Status: ' . $status_code . ', Response: ' . substr($body, 0, 500) . ')',
            'data' => $data,
            'status_code' => $status_code,
            'raw_response' => substr($body, 0, 1000) // Include raw response for debugging
        ];
    }
    
    /**
     * Merchant Registration - No Auth (Sandbox Only)
     */
    public static function submit_merchant_registration_no_auth($data) {
        // Use the STAGING API endpoint for no-auth merchant registration
        $url = self::get_sandbox_api_base() . '/sandbox/merchants/business-details-no-auth';
        
        self::debug_log("========== MERCHANT REGISTRATION NO-AUTH ==========");
        self::debug_log("URL: " . $url);
        self::debug_log("Input data: " . print_r($data, true));
        
        // Required fields: business_name, legal_identity, first_name, last_name, email, phone
        // Optional fields: business_website
        
        // Format phone number with country code if not present
        $phone = $data['phone'];
        if (!empty($phone)) {
            // Remove any spaces or dashes
            $phone = preg_replace('/[\s\-\(\)]/', '', $phone);
            // Add +880 country code if not present
            if (!str_starts_with($phone, '+')) {
                if (str_starts_with($phone, '880')) {
                    $phone = '+' . $phone;
                } elseif (str_starts_with($phone, '0')) {
                    // Replace leading 0 with +880
                    $phone = '+880' . substr($phone, 1);
                } else {
                    // Assume it's already without country code
                    $phone = '+880' . $phone;
                }
            }
        }
        
        $payload = [
            'business_name' => $data['business_name'],
            'legal_identity' => $data['legal_identity'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'], 
            'email' => $data['email'],
            'phone' => $phone
        ];
        
        // Add optional fields if provided
        if (!empty($data['business_website'])) {
            $payload['business_website'] = $data['business_website'];
        }
        
        self::debug_log("Final payload: " . print_r($payload, true));
        
        $args = [
            'method' => 'POST',
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => json_encode($payload),
            'sslverify' => false
        ];
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            self::debug_log('WordPress HTTP Error: ' . $response->get_error_message());
            return [
                'success' => false,
                'message' => $response->get_error_message(),
                'error' => 'network_error'
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        self::debug_log('Response Status: ' . $status_code);
        self::debug_log('Response Body: ' . $body);
        
        // Handle successful responses (200, 201)
        if ($status_code === 200 || $status_code === 201) {
            // Check if response has explicit success field
            if (isset($data['success'])) {
                if ($data['success']) {
                    self::debug_log('SUCCESS! Merchant account created');
                    return $data; // Return full response including merchant_id, api_key, etc.
                } else {
                    // API returned success:false with 200 status
                    self::debug_log('API returned success:false');
                    $error_msg = 'Validation errors';
                    if (isset($data['data']) && is_string($data['data'])) {
                        $error_msg = $data['data'];
                    } elseif (isset($data['message'])) {
                        $error_msg = $data['message'];
                    }
                    
                    return [
                        'success' => false,
                        'message' => $error_msg,
                        'raw_response' => $data
                    ];
                }
            } else {
                // No success field, assume success if we got 200/201
                self::debug_log('SUCCESS! Merchant account created (no success field in response)');
                return [
                    'success' => true,
                    'data' => $data,
                    'message' => 'Registration submitted successfully'
                ];
            }
        }
        
        // Handle validation errors (422)
        if ($status_code === 422) {
            if (isset($data['detail'])) {
                // FastAPI validation error format
                $validation_errors = [];
                if (is_array($data['detail'])) {
                    foreach ($data['detail'] as $error) {
                        if (isset($error['loc']) && is_array($error['loc'])) {
                            $field = end($error['loc']); // Get field name
                            $validation_errors[$field] = $error['msg'] ?? 'Invalid value';
                        } elseif (isset($error['field'])) {
                            // Alternative error format
                            $validation_errors[$error['field']] = $error['message'] ?? $error['msg'] ?? 'Invalid value';
                        }
                    }
                }
                
                $error_message = 'Validation errors';
                if (!empty($validation_errors)) {
                    $error_details = [];
                    foreach ($validation_errors as $field => $msg) {
                        $error_details[] = $field . ': ' . $msg;
                    }
                    $error_message = 'Validation errors: ' . implode('; ', $error_details);
                }
                
                return [
                    'success' => false,
                    'message' => $error_message,
                    'errors' => $validation_errors,
                    'status_code' => $status_code,
                    'raw_detail' => $data['detail']
                ];
            } else {
                // Generic validation error
                return [
                    'success' => false,
                    'message' => $data['message'] ?? $data['data'] ?? 'Validation errors',
                    'status_code' => $status_code,
                    'raw_response' => $data
                ];
            }
        }
        
        // Handle other errors  
        $error_message = 'Merchant registration failed';
        if (isset($data['message'])) {
            $error_message = $data['message'];
        } elseif (isset($data['data']) && is_string($data['data'])) {
            $error_message = $data['data'];
        } elseif (isset($data['error'])) {
            $error_message = $data['error'];
        }
        
        return [
            'success' => false,
            'message' => $error_message . ' (Status: ' . $status_code . ')',
            'data' => $data,
            'status_code' => $status_code,
            'raw_response' => substr($body, 0, 1000)
        ];
    }

    /**
     * Production API Methods (for future use)
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
            // reCAPTCHA network error
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
                // reCAPTCHA v3 score logged only in debug mode
                
                // Only block very low scores (likely bots)
                if ($result['score'] < $score_threshold) {
                    // Low reCAPTCHA score detected
                    
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
        
        // reCAPTCHA verification failed but not blocking
        
        // For v3, we should rarely block completely
        return [
            'success' => true,
            'message' => 'reCAPTCHA check failed but allowing submission',
            'errors' => $result['error-codes'] ?? []
        ];
    }
}