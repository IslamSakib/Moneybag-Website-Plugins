<?php

/**
 * Plugin Name: Multi-Step Form Widget
 * Description: A multi-step form widget for Elementor with MoneyBag API integration
 * Version: 1.0.0
 * Author: Your Name
 * Text Domain: multi-step-form-widget
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MSFM_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MSFM_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('MSFM_PLUGIN_VERSION', '1.0.0');

// Load the plugin
class MultiStepFormWidget
{

    private static $instance = null;

    public static function get_instance()
    {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct()
    {
        add_action('init', [$this, 'init']);
        add_action('elementor/widgets/widgets_registered', [$this, 'register_widgets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('elementor/editor/before_enqueue_scripts', [$this, 'enqueue_editor_scripts']);

        // AJAX handlers
        add_action('wp_ajax_msfm_email_verification', [$this, 'handle_email_verification']);
        add_action('wp_ajax_nopriv_msfm_email_verification', [$this, 'handle_email_verification']);
        add_action('wp_ajax_msfm_verify_otp', [$this, 'handle_verify_otp']);
        add_action('wp_ajax_nopriv_msfm_verify_otp', [$this, 'handle_verify_otp']);
        add_action('wp_ajax_msfm_submit_business_details', [$this, 'handle_business_details']);
        add_action('wp_ajax_nopriv_msfm_submit_business_details', [$this, 'handle_business_details']);
    }

    public function init()
    {
        // Load text domain
        load_plugin_textdomain('multi-step-form-widget', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    public function register_widgets($widgets_manager)
    {
        require_once MSFM_PLUGIN_PATH . 'widgets/multi-step-form.php';
        $widgets_manager->register_widget_type(new \MSFM_Multi_Step_Form_Widget());
    }

    public function enqueue_scripts()
    {
        if ($this->is_elementor_editor()) {
            return;
        }

        wp_enqueue_script(
            'msfm-app',
            MSFM_PLUGIN_URL . 'build/index.js',
            ['wp-element'],
            MSFM_PLUGIN_VERSION,
            true
        );

        wp_enqueue_style(
            'msfm-styles',
            MSFM_PLUGIN_URL . 'build/styles.css',
            [],
            MSFM_PLUGIN_VERSION
        );

        wp_localize_script('msfm-app', 'msfm_ajax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('msfm_nonce'),
            'api_base' => 'https://staging.api.moneybag.com.bd/api/v2/sandbox'
        ]);
    }

    public function enqueue_editor_scripts()
    {
        wp_enqueue_script(
            'msfm-editor',
            MSFM_PLUGIN_URL . 'build/index.js',
            ['wp-element'],
            MSFM_PLUGIN_VERSION,
            true
        );

        wp_enqueue_style(
            'msfm-styles',
            MSFM_PLUGIN_URL . 'build/styles.css',
            [],
            MSFM_PLUGIN_VERSION
        );
    }

    private function is_elementor_editor()
    {
        return isset($_GET['elementor-preview']);
    }

    // API Handlers
    public function handle_email_verification()
    {
        check_ajax_referer('msfm_nonce', 'nonce');

        $email = sanitize_email($_POST['email']);

        if (!is_email($email)) {
            wp_send_json_error(['message' => 'Invalid email address']);
        }

        $response = wp_remote_post('https://staging.api.moneybag.com.bd/api/v2/sandbox/email-verification', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ],
            'body' => json_encode(['email' => $email])
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'API request failed']);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Extract session_id from the response
        $session_id = isset($data['data']['session_id']) ? $data['data']['session_id'] : null;

        wp_send_json_success([
            'message' => $data['message'] ?? 'Email sent',
            'session_id' => $session_id,
            'raw_data' => $data
        ]);
    }

    public function handle_verify_otp()
    {
        check_ajax_referer('msfm_nonce', 'nonce');

        $session_id = sanitize_text_field($_POST['session_id']);
        $otp = sanitize_text_field($_POST['otp']);

        $response = wp_remote_post('https://staging.api.moneybag.com.bd/api/v2/sandbox/verify-otp', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ],
            'body' => json_encode([
                'session_id' => $session_id,
                'otp' => $otp
            ])
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'API request failed']);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Return the session_id along with the verification result
        wp_send_json_success([
            'verified' => isset($data['data']['verified']) ? $data['data']['verified'] : false,
            'session_id' => $session_id,
            'raw_data' => $data
        ]);
    }

    public function handle_business_details()
    {
        check_ajax_referer('msfm_nonce', 'nonce');

        // Map legal identity type
        $legal_identity_value = sanitize_text_field($_POST['legal_identity_type']);
        // Keep the value as-is since we don't know the exact mapping

        // Map our field names to API field names
        $business_data = [
            'session_id' => sanitize_text_field($_POST['session_id']),
            'first_name' => sanitize_text_field($_POST['first_name']),
            'last_name' => sanitize_text_field($_POST['last_name']),
            'phone' => sanitize_text_field($_POST['mobile_number']), // API expects 'phone'
            'legal_identity' => $legal_identity_value, // API expects 'legal_identity'
            'business_name' => sanitize_text_field($_POST['business_name']),
            'password' => $_POST['password'],
            'email' => sanitize_email($_POST['email']),
            'business_email' => sanitize_email($_POST['email']), // Add business_email
            'business_phone' => sanitize_text_field($_POST['mobile_number']), // Add business_phone
            'business_type' => 'other', // Default value
            'business_address' => 'Not specified', // Default value
            'terms_accepted' => true // Add terms acceptance
        ];

        // Handle empty website
        $website = $_POST['website_address'] ?? '';
        if (empty($website) || $website === 'http://' || $website === 'https://') {
            $business_data['business_website'] = 'https://example.com'; // Default value if required
        } else {
            $business_data['business_website'] = esc_url($website);
        }

        $response = wp_remote_post('https://staging.api.moneybag.com.bd/api/v2/sandbox/merchants/business-details', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ],
            'body' => json_encode($business_data)
        ]);

        if (is_wp_error($response)) {
            error_log('MoneyBag API Error: ' . $response->get_error_message());
            wp_send_json_error(['message' => 'API request failed']);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Log the raw API response for debugging
        error_log('MoneyBag API Response: ' . print_r($data, true));

        // Check if the API returned success
        $http_code = wp_remote_retrieve_response_code($response);
        error_log('MoneyBag API HTTP Code: ' . $http_code);

        if ($http_code >= 200 && $http_code < 300 && !isset($data['detail'])) {
            // Try to extract credentials from various possible response structures
            $result_data = isset($data['data']) ? $data['data'] : $data;

            $credentials = [
                'merchantId' => $result_data['merchant_id'] ?? $result_data['merchantId'] ?? $result_data['id'] ?? null,
                'apiKey' => $result_data['api_key'] ?? $result_data['apiKey'] ?? $result_data['key'] ?? null,
                'secretKey' => $result_data['secret_key'] ?? $result_data['secretKey'] ?? $result_data['secret'] ?? null,
                'message' => $data['message'] ?? 'Account created successfully',
                'success' => true,
                'raw_response' => $data // Include raw response for debugging
            ];

            // If no credentials in response, it might be sent via email
            if (!$credentials['merchantId'] && !$credentials['apiKey']) {
                $credentials['email_sent'] = true;
                $credentials['message'] = 'Sandbox account created! Check your email for credentials.';
            }

            wp_send_json_success($credentials);
        } else {
            $error_message = 'Failed to create account';
            if (isset($data['detail']) && is_array($data['detail'])) {
                $errors = array_map(function ($err) {
                    return $err['loc'][1] . ': ' . $err['msg'];
                }, $data['detail']);
                $error_message = implode(', ', $errors);
            } elseif (isset($data['message'])) {
                $error_message = $data['message'];
            }
            wp_send_json_error(['message' => $error_message]);
        }
    }
}

// Initialize the plugin
MultiStepFormWidget::get_instance();
