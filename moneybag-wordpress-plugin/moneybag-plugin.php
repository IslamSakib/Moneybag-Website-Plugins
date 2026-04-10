<?php

/**
 * Plugin Name: Moneybag WordPress Plugin
 * Description: Configuration-driven Elementor widgets for payment gateway integration with React.js forms. Works with any API provider.
 * Version: 2.5.4
 * Author: Sakib Islam
 * Contact: +8801950025990
 * Text Domain: moneybag-wordpress-plugin
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * 
 * This plugin provides a flexible, configuration-driven approach to payment gateway integration.
 * All API endpoints, credentials, and service configurations are managed through WordPress admin.
 * No hardcoded URLs or credentials - works with any compatible API provider.
 */

// Prevent direct access to this file
if (!defined('ABSPATH')) {
    exit('Direct access denied.');
}

/**
 * Plugin Constants
 * These constants define the plugin's basic configuration and file paths
 */
define('MONEYBAG_PLUGIN_URL', plugin_dir_url(__FILE__));     // Plugin URL for assets
define('MONEYBAG_PLUGIN_PATH', plugin_dir_path(__FILE__));   // Plugin path for includes
define('MONEYBAG_PLUGIN_VERSION', '2.5.4');                 // Plugin version for cache busting

// ============================================================================
// NONCE GENERATOR - Added to fix cached nonce issues
// ============================================================================

if (!function_exists('moneybag_get_fresh_nonce')) {

    add_action('wp_ajax_moneybag_get_nonce', 'moneybag_get_fresh_nonce');
    add_action('wp_ajax_nopriv_moneybag_get_nonce', 'moneybag_get_fresh_nonce');

    function moneybag_get_fresh_nonce()
    {
        $nonce_type = isset($_POST['nonce_type']) ? sanitize_text_field($_POST['nonce_type']) : 'contact';

        $nonce_actions = array(
            'contact'    => 'moneybag_contact_nonce',
            'merchant'   => 'moneybag_nonce',
            'sandbox'    => 'moneybag_nonce',
            'pricing'    => 'moneybag_pricing_nonce',
            'calculator' => 'moneybag_nonce',
        );

        $nonce_action = isset($nonce_actions[$nonce_type]) ? $nonce_actions[$nonce_type] : 'moneybag_nonce';
        $nonce = wp_create_nonce($nonce_action);

        wp_send_json_success(array(
            'nonce' => $nonce,
            'nonce_type' => $nonce_type,
            'generated_at' => current_time('mysql'),
        ));
    }

    add_action('send_headers', 'moneybag_prevent_nonce_caching');

    function moneybag_prevent_nonce_caching()
    {
        if (isset($_REQUEST['action']) && $_REQUEST['action'] === 'moneybag_get_nonce') {
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
        }
    }
}

/**
 * Security and Configuration Notice
 * 
 * This plugin follows a configuration-driven architecture:
 * - No hardcoded API URLs or credentials
 * - All sensitive data stored in WordPress options (encrypted when possible)
 * - API endpoints configured through WordPress admin interface
 * - Works with any compatible payment gateway API provider
 */

// Load core API handler class
require_once(MONEYBAG_PLUGIN_PATH . 'includes/class-moneybag-api.php');

/**
 * Main Plugin Class
 * 
 * Handles plugin initialization, WordPress hooks, Elementor integration,
 * AJAX endpoints, and admin functionality.
 * 
 * @since 2.0.0
 */
class MoneybagPlugin
{

    /**
     * Plugin constructor
     * 
     * Initializes the plugin by setting up WordPress hooks,
     * Elementor integration, and admin interfaces.
     */
    public function __construct()
    {
        // Initialize plugin components
        $this->init_wordpress_integration();
        $this->init_elementor_integration();
        $this->init_ajax_hooks();
        $this->init_admin();

        // Set up plugin lifecycle hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        register_uninstall_hook(__FILE__, [__CLASS__, 'uninstall']);
    }

    /**
     * Initialize WordPress Integration
     * 
     * Sets up core WordPress hooks and functionality
     */
    private function init_wordpress_integration()
    {
        add_action('init', [$this, 'init']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('wp_enqueue_scripts', [$this, 'maybe_block_elementor_fonts'], 999);
    }

    /**
     * Initialize Elementor Integration
     * 
     * Sets up Elementor-specific hooks and widget registration
     */
    private function init_elementor_integration()
    {
        add_action('plugins_loaded', [$this, 'check_elementor']);
        add_action('elementor/widgets/widgets_registered', [$this, 'register_widgets']);
        add_action('elementor/elements/categories_registered', [$this, 'register_categories']);
        add_action('elementor/editor/before_enqueue_scripts', [$this, 'enqueue_editor_scripts']);
    }

    /**
     * Initialize AJAX Hooks
     * 
     * Registers all AJAX endpoints for form submissions and API interactions.
     * All endpoints are available for both logged-in and non-logged-in users.
     */
    private function init_ajax_hooks()
    {
        // reCAPTCHA validation endpoint
        add_action('wp_ajax_verify_recaptcha', [$this, 'verify_recaptcha']);
        add_action('wp_ajax_nopriv_verify_recaptcha', [$this, 'verify_recaptcha']);


        // Modern API endpoints
        add_action('wp_ajax_moneybag_merchant_api', [$this, 'handle_merchant_api']);
        add_action('wp_ajax_nopriv_moneybag_merchant_api', [$this, 'handle_merchant_api']);

        add_action('wp_ajax_moneybag_sandbox_api', [$this, 'handle_sandbox_api']);
        add_action('wp_ajax_nopriv_moneybag_sandbox_api', [$this, 'handle_sandbox_api']);

        add_action('wp_ajax_moneybag_pricing_crm', [$this, 'handle_pricing_crm']);
        add_action('wp_ajax_nopriv_moneybag_pricing_crm', [$this, 'handle_pricing_crm']);

        add_action('wp_ajax_moneybag_contact_form', [$this, 'handle_contact_form']);
        add_action('wp_ajax_nopriv_moneybag_contact_form', [$this, 'handle_contact_form']);

        add_action('wp_ajax_handle_calculator_lead', [$this, 'handle_calculator_lead']);
        add_action('wp_ajax_nopriv_handle_calculator_lead', [$this, 'handle_calculator_lead']);
    }

    /**
     * Initialize Admin Interface
     * 
     * Sets up admin-specific functionality including settings pages,
     * admin scripts, and security headers.
     */
    private function init_admin()
    {
        if (!is_admin()) {
            return;
        }

        // Load admin settings class
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/admin/admin-settings.php');
        new \MoneybagPlugin\Admin\AdminSettings();

        // Admin-specific hooks
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_action('elementor/frontend/after_enqueue_styles', [$this, 'override_elementor_fonts'], 999);
        add_action('send_headers', [$this, 'add_security_headers']);
    }

    /**
     * Initialize Plugin
     * 
     * Loads text domain for internationalization support.
     * Called on WordPress 'init' hook.
     */
    public function init()
    {
        load_plugin_textdomain('moneybag-plugin', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    /**
     * Check Elementor Dependency
     * 
     * Verifies that Elementor is installed and activated.
     * Shows admin notice if Elementor is missing.
     */

    public function check_elementor()
    {
        if (!did_action('elementor/loaded')) {
            add_action('admin_notices', [$this, 'admin_notice_missing_elementor']);
            return;
        }

        if (!version_compare(ELEMENTOR_VERSION, '3.0.0', '>=')) {
            add_action('admin_notices', [$this, 'admin_notice_minimum_elementor_version']);
            return;
        }

        // Load includes only when Elementor is fully loaded
        add_action('elementor/init', [$this, 'includes']);
    }

    public function admin_notice_missing_elementor()
    {
        $message = sprintf(
            esc_html__('"%1$s" requires "%2$s" to be installed and activated.', 'moneybag-plugin'),
            '<strong>' . esc_html__('Moneybag Plugin', 'moneybag-plugin') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'moneybag-plugin') . '</strong>'
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

    public function admin_notice_minimum_elementor_version()
    {
        $message = sprintf(
            esc_html__('"%1$s" requires "%2$s" version %3$s or greater.', 'moneybag-plugin'),
            '<strong>' . esc_html__('Moneybag Plugin', 'moneybag-plugin') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'moneybag-plugin') . '</strong>',
            '3.0.0'
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

    public function includes()
    {
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/sandbox-form-widget.php');
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/pricing-plan-widget.php');
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/merchant-registration-widget.php');
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/contact-form-widget.php');
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/price-comparison-calculator-widget.php');
    }

    public function register_widgets()
    {
        if (class_exists('Elementor\Widget_Base')) {
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\SandboxFormWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\PricingPlanWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\MerchantRegistrationWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\Contact_Form_Widget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\PriceComparisonCalculatorWidget());
        }
    }

    public function register_categories($elements_manager)
    {
        $elements_manager->add_category(
            'moneybag',
            [
                'title' => __('Moneybag', 'moneybag-plugin'),
                'icon' => 'fa fa-money',
            ]
        );
    }

    public function enqueue_scripts()
    {
        // -----------------------------------------------------------------------
        // REGISTER ONLY — never enqueue globally.
        // Elementor reads each widget's get_style_depends() / get_script_depends()
        // and enqueues only the handles needed on pages that contain that widget.
        // -----------------------------------------------------------------------

        // Global stylesheet — registered here, enqueued by each widget via get_style_depends()
        wp_register_style(
            'moneybag-global',
            MONEYBAG_PLUGIN_URL . 'assets/css/moneybag-global.css',
            [],
            MONEYBAG_PLUGIN_VERSION
        );

        // Form validator utility — registered here, listed as dependency by each form script
        wp_register_script(
            'moneybag-form-validator',
            MONEYBAG_PLUGIN_URL . 'assets/js/form-validator.js',
            [],
            MONEYBAG_PLUGIN_VERSION,
            true
        );

        // Contact Form
        wp_register_script(
            'moneybag-contact-form',
            MONEYBAG_PLUGIN_URL . 'assets/js/contact-form.js',
            ['wp-element', 'moneybag-form-validator'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );

        // Merchant Registration
        wp_register_script(
            'moneybag-merchant-registration',
            MONEYBAG_PLUGIN_URL . 'assets/js/merchant-registration-wp.js',
            ['wp-element', 'jquery'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        wp_localize_script('moneybag-merchant-registration', 'moneybagMerchantAjax', [
            'ajaxurl'   => admin_url('admin-ajax.php'),
            'pluginUrl' => MONEYBAG_PLUGIN_URL,
        ]);

        // Pricing Plan
        wp_register_script(
            'moneybag-pricing-plan',
            MONEYBAG_PLUGIN_URL . 'assets/js/pricing-plan.js',
            ['wp-element', 'moneybag-form-validator'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        wp_localize_script('moneybag-pricing-plan', 'moneybagPricingAjax', [
            'ajaxurl'   => admin_url('admin-ajax.php'),
            'pluginUrl' => MONEYBAG_PLUGIN_URL,
        ]);

        // Sandbox Form
        wp_register_script(
            'moneybag-sandbox-form',
            MONEYBAG_PLUGIN_URL . 'assets/js/sandbox-form.js',
            ['wp-element', 'wp-api-fetch'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        wp_localize_script('moneybag-sandbox-form', 'moneybagAjax', [
            'ajaxurl'   => admin_url('admin-ajax.php'),
            'pluginUrl' => MONEYBAG_PLUGIN_URL,
        ]);

        // Price Comparison Calculator
        wp_register_script(
            'moneybag-price-comparison-calculator',
            MONEYBAG_PLUGIN_URL . 'assets/js/price-comparison-calculator.js',
            ['wp-element'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );

        // -----------------------------------------------------------------------
        // reCAPTCHA — only load on pages that actually have a Moneybag widget.
        // We check _elementor_data (the full Elementor widget tree) for any of
        // our widget names, exactly the same way Elementor itself detects widgets.
        // -----------------------------------------------------------------------
        $recaptcha_site_key = get_option('moneybag_recaptcha_site_key', '');
        if (!empty($recaptcha_site_key) && $this->current_page_has_moneybag_widget()) {
            wp_enqueue_script(
                'google-recaptcha',
                'https://www.google.com/recaptcha/api.js?render=' . esc_attr($recaptcha_site_key),
                [],
                null,
                true
            );
        }
    }

    /**
     * Returns true if the current page contains at least one Moneybag Elementor widget.
     * Used to gate reCAPTCHA loading so it only fires on pages with our forms.
     */
    private function current_page_has_moneybag_widget(): bool
    {
        $post = get_post();
        if (!$post) {
            return false;
        }

        $elementor_data = (string) get_post_meta($post->ID, '_elementor_data', true);
        if (empty($elementor_data)) {
            return false;
        }

        $widget_names = [
            'moneybag-contact-form',
            'moneybag-merchant-registration',
            'moneybag-pricing-plan',
            'moneybag-sandbox-form',
            'moneybag-price-comparison-calculator',
        ];

        foreach ($widget_names as $name) {
            if (str_contains($elementor_data, $name)) {
                return true;
            }
        }

        return false;
    }

    public function enqueue_editor_scripts()
    {
        // Editor scripts removed - widgets use no Elementor controls
        return;
    }

    /**
     * Enqueue admin scripts only on relevant admin pages
     */
    public function enqueue_admin_scripts($hook)
    {
        // Only load admin scripts on plugin's admin pages
        if (strpos($hook, 'moneybag') === false && $hook !== 'settings_page_moneybag') {
            return;
        }

        wp_enqueue_script(
            'moneybag-admin-crm',
            MONEYBAG_PLUGIN_URL . 'assets/js/admin-crm.js',
            ['jquery'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );

        wp_localize_script('moneybag-admin-crm', 'moneybagAdmin', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_admin_nonce'),
            'pluginUrl' => MONEYBAG_PLUGIN_URL
        ]);
    }

    public function verify_recaptcha()
    {
        // Verify nonce for security
        if (!wp_verify_nonce($_POST['nonce'], 'moneybag_nonce')) {
            wp_send_json_error('Security check failed');
            return;
        }

        $recaptcha_response = sanitize_text_field($_POST['recaptcha_response'] ?? '');

        if (empty($recaptcha_response)) {
            wp_send_json_error('reCAPTCHA response is required');
            return;
        }

        // Use centralized API class for reCAPTCHA verification
        $result = \MoneybagPlugin\MoneybagAPI::verify_recaptcha($recaptcha_response);

        if ($result['success']) {
            wp_send_json_success([
                'message' => 'reCAPTCHA verified successfully',
                'score' => $result['score'] ?? null
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['message'] ?? 'reCAPTCHA verification failed',
                'errors' => $result['errors'] ?? []
            ]);
        }
    }


    public function maybe_block_elementor_fonts()
    {
        if (!$this->current_page_has_moneybag_widget()) {
            return;
        }

        // Block Elementor Google Fonts on pages with Moneybag widgets
        add_filter('elementor/frontend/print_google_fonts', '__return_false');

        $elementor_font_handles = [
            'elementor-frontend-google-fonts',
            'google-fonts-1',
            'elementor-icons-fa-solid',
            'elementor-icons-fa-regular',
            'elementor-icons-fa-brands',
        ];

        foreach ($elementor_font_handles as $handle) {
            wp_dequeue_style($handle);
            wp_deregister_style($handle);
        }

        wp_add_inline_style('moneybag-global', '
            .moneybag-merchant-form-wrapper,
            .moneybag-merchant-form-wrapper * {
                font-family: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }
            @font-face {
                font-family: "Poppins";
                font-display: swap;
                src: url("https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2") format("woff2");
            }
        ');
    }

    public function override_elementor_fonts()
    {
        // Remove any Elementor font CSS that might load from external domains
        global $post;

        if (!$post) return;

        // Check if page has any Moneybag widget
        if (strpos($post->post_content, 'moneybag-') !== false) {
            // Remove Elementor's Poppins font stylesheet if it exists
            wp_dequeue_style('elementor-google-fonts-poppins');
            wp_deregister_style('elementor-google-fonts-poppins');

            // Remove any stylesheet with 'poppins' in the handle
            global $wp_styles;
            if (isset($wp_styles->registered)) {
                foreach ($wp_styles->registered as $handle => $style) {
                    if (stripos($handle, 'poppins') !== false && $handle !== 'moneybag-global') {
                        wp_dequeue_style($handle);
                        wp_deregister_style($handle);
                    }
                }
            }
        }
    }

    public function add_security_headers()
    {
        global $post;

        // Only add headers on pages with merchant registration widget
        if ($post && strpos($post->post_content, 'moneybag-merchant-registration') !== false) {
            // Upgrade insecure requests to HTTPS
            if (!headers_sent()) {
                header('Content-Security-Policy: upgrade-insecure-requests');
            }
        }
    }

    /**
     * Handle sandbox API requests securely through WordPress
     */
    public function handle_sandbox_api()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_nonce')) {
            wp_send_json_error('Security check failed');
            return;
        }

        $action = sanitize_text_field($_POST['api_action'] ?? '');
        $data = json_decode(stripslashes($_POST['data'] ?? '{}'), true);

        if (!$action || !is_array($data)) {
            wp_send_json_error('Invalid request');
            return;
        }

        // Use the MoneybagAPI class to make secure API calls
        $response = null;

        switch ($action) {
            case 'email_verification':
                // No validation - let API handle everything
                // Handle both email and phone identifiers
                $identifier = sanitize_text_field($data['identifier'] ?? '');

                // Debug logging

                if (empty($identifier)) {
                    wp_send_json_error('Identifier is required');
                    return;
                }

                $response = \MoneybagPlugin\MoneybagAPI::send_email_verification($identifier);
                break;

            case 'verify_otp':
                // No validation - let API handle everything
                $otp = sanitize_text_field($data['otp'] ?? '');
                $session_id = sanitize_text_field($data['session_id'] ?? '');
                $response = \MoneybagPlugin\MoneybagAPI::verify_otp($otp, $session_id);
                break;

            case 'business_details':

                $sanitized = [
                    'business_name' => sanitize_text_field($data['business_name'] ?? ''),
                    'business_website' => esc_url_raw($data['business_website'] ?? ''),
                    'first_name' => sanitize_text_field($data['first_name'] ?? ''),
                    'last_name' => sanitize_text_field($data['last_name'] ?? ''),
                    'legal_identity' => sanitize_text_field($data['legal_identity'] ?? ''),
                    'phone' => sanitize_text_field($data['phone'] ?? ''),
                    'email' => sanitize_email($data['email'] ?? ''),
                    'session_id' => sanitize_text_field($data['session_id'] ?? '')
                ];

                // Password field removed - no longer required by new API

                $response = \MoneybagPlugin\MoneybagAPI::submit_business_details($sanitized);

                // If sandbox submission successful, also submit to CRM
                if ($response && $response['success']) {
                    $this->submit_sandbox_to_crm($sanitized, $response);
                }
                break;

            default:
                wp_send_json_error('Invalid API action');
                return;
        }

        // Return the API response
        if ($response && $response['success']) {
            // If the response has a nested data field, return it directly
            // Otherwise return the whole response minus the success field
            if (isset($response['data'])) {
                wp_send_json_success($response['data']);
            } else {
                // Remove success field and return the rest
                unset($response['success']);
                wp_send_json_success($response);
            }
        } else {
            // Clean error message for users
            $error_message = $response['message'] ?? 'API request failed';


            wp_send_json_error($error_message);
        }
    }


    public function handle_contact_form()
    {
        try {
            // 1. Verify Security Nonce
            $nonce = $_POST['nonce'] ?? '';

            // Note: Ensure 'moneybag_contact_nonce' matches the action used in your fresh nonce generator
            if (!wp_verify_nonce($nonce, 'moneybag_contact_nonce')) {
                wp_send_json_error([
                    'success' => false,
                    'message' => 'Security check failed. Please refresh the page.',
                    'debug_received_nonce' => $nonce
                ]);
                return;
            }

            // 2. Retrieve API Key with multiple fallbacks
            // Check 1: The API Class method
            $api_key = \MoneybagPlugin\MoneybagAPI::get_crm_api_key();

            // Check 2: Direct Database Option (if class method returned empty)
            if (empty($api_key)) {
                $api_key = get_option('moneybag_crm_api_key');
            }

            // Check 3: The actual $_POST data (as sent by contact-form.js)
            if (empty($api_key) && isset($_POST['apiKey'])) {
                $api_key = sanitize_text_field($_POST['apiKey']);
            }

            if (empty($api_key)) {
                wp_send_json_error([
                    'success' => false,
                    'message' => 'CRM API key not configured.',
                    'error' => 'configuration_error'
                ]);
                return;
            }

            // 3. Sanitize Input Data
            // Note: JS sends 'inquiryType' (camelCase), PHP uses it to set 'inquiry_type'
            $data = [
                'name'         => sanitize_text_field($_POST['name'] ?? ''),
                'email'        => sanitize_email($_POST['email'] ?? ''),
                'phone'        => sanitize_text_field($_POST['phone'] ?? ''),
                'company'      => sanitize_text_field($_POST['company'] ?? ''),
                'inquiry_type' => sanitize_text_field($_POST['inquiryType'] ?? 'General Inquiry'),
                'message'      => sanitize_textarea_field($_POST['message'] ?? ''),
            ];

            // 4. Format the note content for the CRM
            $note_content = sprintf(
                "**Contact Form Submission**\n\n" .
                    "- **Name:** %s\n" .
                    "- **Email:** %s\n" .
                    "- **Phone:** %s\n" .
                    "- **Company:** %s\n" .
                    "- **Inquiry Type:** %s\n\n" .
                    "**Message:**\n%s",
                $data['name'],
                $data['email'],
                $data['phone'],
                $data['company'],
                $data['inquiry_type'],
                $data['message']
            );

            // 5. Submit to CRM via the API Class
            $result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name'              => $data['name'],
                'email'             => $data['email'],
                'phone'             => $data['phone'],
                'company'           => $data['company'],
                'opportunity_title' => 'Contact Lead: ' . $data['name'],
                'opportunity_stage' => 'NEW',
                'note_title'        => 'Contact Us Form Submission',
                'note_content'      => $note_content,
                'widget_type'       => 'contact_form'
            ]);

            // 6. Return Response
            if ($result && isset($result['success']) && $result['success']) {
                wp_send_json_success($result['data'] ?? ['message' => 'Submitted successfully']);
            } else {
                $error_msg = $result['message'] ?? 'CRM submission failed';
                wp_send_json_error(['message' => $error_msg]);
            }
        } catch (\Exception $e) {
            wp_send_json_error(['message' => 'System Error: ' . $e->getMessage()]);
        }
    }

    public function handle_pricing_crm()
    {
        try {
            // 1. Verify the specific Pricing Nonce
            $nonce = $_POST['nonce'] ?? '';
            if (!wp_verify_nonce($nonce, 'moneybag_pricing_nonce')) {
                wp_send_json_error([
                    'success' => false,
                    'message' => 'Security check failed. Please refresh the page.',
                    'debug_received_nonce' => $nonce
                ]);
                return;
            }

            // 2. Retrieve API Key (using the same robust check as the contact form)
            $api_key = \MoneybagPlugin\MoneybagAPI::get_crm_api_key();
            if (empty($api_key)) {
                $api_key = get_option('moneybag_crm_api_key');
            }

            if (empty($api_key)) {
                wp_send_json_error([
                    'success' => false,
                    'message' => 'CRM API key not configured.',
                    'error' => 'configuration_error'
                ]);
                return;
            }

            // 3. Process Data
            $crm_action = sanitize_text_field($_POST['crm_action'] ?? '');
            $raw_data = isset($_POST['data']) ? json_decode(stripslashes($_POST['data']), true) : [];

            if (empty($raw_data)) {
                wp_send_json_error(['message' => 'No data received']);
                return;
            }

            // Format data for CRM submission
            $note_content = sprintf(
                "**Pricing Plan Submission**\n\n" .
                    "- **Name:** %s\n" .
                    "- **Email:** %s\n" .
                    "- **Phone:** %s\n" .
                    "- **Domain:** %s\n" .
                    "- **Category:** %s\n" .
                    "- **Identity:** %s\n" .
                    "- **Volume:** %s\n" .
                    "- **Plan:** %s\n" .
                    "- **Services:** %s",
                $raw_data['name'] ?? '',
                $raw_data['email'] ?? '',
                $raw_data['mobile'] ?? '',
                $raw_data['domainName'] ?? '',
                $raw_data['businessCategory'] ?? '',
                $raw_data['legalIdentity'] ?? '',
                $raw_data['monthlyVolume'] ?? '',
                $raw_data['selectedPricing'] ?? '',
                $raw_data['services'] ?? ''
            );

            $result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name'              => $raw_data['name'] ?? '',
                'email'             => $raw_data['email'] ?? '',
                'phone'             => $raw_data['mobile'] ?? '',
                'company'           => $raw_data['domainName'] ?? '',
                'opportunity_title' => 'Pricing Lead: ' . ($raw_data['name'] ?? 'Unknown'),
                'opportunity_stage' => 'NEW',
                'note_title'        => 'Pricing Plan Form Submission',
                'note_content'      => $note_content,
                'widget_type'       => 'pricing_form',
                'recaptcha_token'   => $raw_data['recaptcha_token'] ?? null
            ]);

            if ($result && isset($result['success']) && $result['success']) {
                wp_send_json_success($result['data'] ?? ['message' => 'Submitted successfully']);
            } else {
                wp_send_json_error(['message' => $result['message'] ?? 'CRM submission failed']);
            }
        } catch (\Exception $e) {
            wp_send_json_error(['message' => 'System Error: ' . $e->getMessage()]);
        }
    }

    private function search_crm_person($data)
    {
        try {
            $email = sanitize_email($data['email'] ?? '');

            if (empty($email)) {
                // Return empty result for empty email
                return [
                    'success' => true,
                    'data' => []
                ];
            }

            // Try to search for person in CRM
            $response = \MoneybagPlugin\MoneybagAPI::crm_request("/people?email=" . urlencode($email), [], 'GET');

            // If successful and has data, return it
            if ($response && isset($response['success']) && $response['success'] && !empty($response['data'])) {
                return $response;
            }

            // Otherwise return empty result (person not found is not an error)
            return [
                'success' => true,
                'data' => []
            ];
        } catch (\Exception $e) {
            // Return empty result - search failures should not break the flow
            return [
                'success' => true,
                'data' => []
            ];
        } catch (\Throwable $t) {
            // Return empty result for any errors
            return [
                'success' => true,
                'data' => []
            ];
        }
    }

    private function handle_pricing_crm_submission($data)
    {
        // FORCE SYNC: Ensure API Key is loaded
        $api_key = \MoneybagPlugin\MoneybagAPI::get_crm_api_key() ?: get_option('moneybag_crm_api_key');

        if (empty($api_key)) {
            return [
                'success' => false,
                'message' => 'CRM API key not configured. Please contact administrator.',
                'error' => 'configuration_error'
            ];
        }

        // Determine if Merchant or Pricing
        if (isset($data['businessName']) && isset($data['legalIdentity'])) {
            $note_content = sprintf(
                "**Merchant Registration Details**\n\n- **Business:** %s\n- **Legal:** %s\n- **Category:** %s\n- **Contact:** %s (%s)",
                sanitize_text_field($data['businessName'] ?? ''),
                sanitize_text_field($data['legalIdentity'] ?? ''),
                sanitize_text_field($data['businessCategory'] ?? ''),
                sanitize_text_field($data['name'] ?? ''),
                sanitize_email($data['email'] ?? '')
            );

            return \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name' => $data['name'] ?? '',
                'email' => $data['email'] ?? '',
                'phone' => $data['mobile'] ?? '',
                'company' => $data['businessName'] ?? '',
                'opportunity_title' => 'Merchant Registration: ' . ($data['businessName'] ?? 'New'),
                'widget_type' => 'merchant_registration',
                'note_content' => $note_content
            ]);
        } else {
            $note_content = sprintf(
                "**Pricing Form Submission**\n\n- **Industry:** %s\n- **Volume:** %s\n- **Plan:** %s\n- **Contact:** %s (%s)",
                sanitize_text_field($data['businessCategory'] ?? ''),
                sanitize_text_field($data['monthlyVolume'] ?? ''),
                sanitize_text_field($data['selectedPricing'] ?? 'Standard'),
                $data['name'] ?? '',
                $data['email'] ?? ''
            );

            return \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name' => $data['name'] ?? '',
                'email' => $data['email'] ?? '',
                'phone' => $data['mobile'] ?? '',
                'company' => $data['domainName'] ?? '',
                'opportunity_title' => 'Pricing Plan: ' . ($data['selectedPricing'] ?? 'Standard'),
                'widget_type' => 'pricing_form',
                'note_content' => $note_content
            ]);
        }
    }



    private function create_crm_note_target($data)
    {
        // Let API handle all validation - just sanitize data
        $note_target_data = [
            'noteId' => sanitize_text_field($data['noteId'] ?? ''),
            'targetType' => sanitize_text_field($data['targetType'] ?? 'OPPORTUNITY'),
            'targetId' => sanitize_text_field($data['targetId'] ?? $data['opportunityId'] ?? '')
        ];

        // Try different possible endpoints for note targeting
        $endpoints_to_try = ['/noteTargets', '/note-targets', '/notes/targets'];

        foreach ($endpoints_to_try as $endpoint) {
            $response = \MoneybagPlugin\MoneybagAPI::crm_request($endpoint, $note_target_data);
            if ($response && $response['success']) {
                return $response;
            }
        }

        // If all endpoints fail, return the last response
        return $response ?? [
            'success' => false,
            'message' => 'Note target endpoint not found'
        ];
    }

    public function handle_merchant_api()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_nonce')) {
            wp_send_json_error('Security check failed');
            return;
        }

        $action = sanitize_text_field($_POST['api_action'] ?? '');
        $data = json_decode(stripslashes($_POST['data'] ?? '{}'), true);

        if (!$action || !is_array($data)) {
            wp_send_json_error('Invalid request');
            return;
        }

        switch ($action) {
            case 'get_registration_options':
                $this->get_registration_options();
                break;

            case 'submit_merchant_registration':
                $this->handle_merchant_registration_submission($data);
                break;


            default:
                wp_send_json_error('Invalid action');
                break;
        }
    }

    private function get_registration_options()
    {
        $options_file = MONEYBAG_PLUGIN_PATH . 'data/merchant-registration-options.json';

        if (!file_exists($options_file)) {
            wp_send_json_error('Registration options not found');
            return;
        }

        $options_json = file_get_contents($options_file);
        $options = json_decode($options_json, true);

        if (!$options) {
            wp_send_json_error('Invalid registration options data');
            return;
        }

        wp_send_json_success($options);
    }

    private function handle_merchant_registration_submission($data)
    {
        // Sanitize and validate input data for no-auth API (updated field mapping)
        $sanitized = [
            'business_name' => sanitize_text_field($data['businessName'] ?? ''),
            'business_website' => esc_url_raw($data['domainName'] ?? ''),
            'first_name' => sanitize_text_field($data['firstName'] ?? ''),
            'last_name' => sanitize_text_field($data['lastName'] ?? ''),
            'legal_identity' => sanitize_text_field($data['legalIdentity'] ?? ''),
            'email' => sanitize_email($data['email'] ?? ''),
            'phone' => sanitize_text_field($data['mobile'] ?? '')
        ];

        // Validate required fields for the no-auth API
        $required_fields = ['business_name', 'first_name', 'last_name', 'legal_identity', 'email', 'phone'];
        $missing_fields = [];

        foreach ($required_fields as $field) {
            if (empty($sanitized[$field])) {
                $missing_fields[] = $field;
            }
        }

        if (!empty($missing_fields)) {
            wp_send_json_error('Missing required fields: ' . implode(', ', $missing_fields));
            return;
        }

        // Call the new no-auth API method
        $response = \MoneybagPlugin\MoneybagAPI::submit_merchant_registration_no_auth($sanitized);

        if ($response['success']) {
            // SUCCESS: Also submit to CRM for lead tracking
            $this->submit_merchant_registration_to_crm($data, $response);

            // Return the API response with merchant_id, api_key, etc.
            wp_send_json_success($response);
        } else {
            // Error - return the error message
            wp_send_json_error($response['message'] ?? 'Merchant registration failed', $response);
        }
    }

    /**
     * Submit merchant registration data to CRM for lead tracking
     * This runs AFTER successful sandbox API submission
     */
    private function submit_merchant_registration_to_crm($data, $api_response)
    {
        try {
            // Check if CRM is configured before attempting submission
            $crm_api_key = \MoneybagPlugin\MoneybagAPI::get_crm_api_key();
            $crm_api_url = get_option('moneybag_crm_api_url');

            if (empty($crm_api_key) || empty($crm_api_url)) {
                // CRM not configured - skip CRM submission (don't fail the main process)
                return;
            }

            // Build comprehensive note content for merchant registration
            $service_types = '';
            if (isset($data['customFields']['serviceTypes']) && is_array($data['customFields']['serviceTypes'])) {
                $service_types = implode(', ', $data['customFields']['serviceTypes']);
            } elseif (isset($data['serviceTypes'])) {
                $service_types = is_array($data['serviceTypes']) ? implode(', ', $data['serviceTypes']) : $data['serviceTypes'];
            }

            $note_content = sprintf(
                "**Merchant Registration Submission**\n\n" .
                    "- **Business Name:** %s\n" .
                    "- **Legal Identity:** %s\n" .
                    "- **Business Category:** %s\n" .
                    "- **Service Types:** %s\n" .
                    "- **Monthly Volume:** %s\n" .
                    "- **Max Amount:** %s\n" .
                    "- **Currency:** %s\n" .
                    "- **Business Website:** %s\n" .
                    "- **Contact:** %s %s\n" .
                    "- **Email:** %s\n" .
                    "- **Phone:** %s\n\n" .
                    "**API Response:**\n" .
                    "- **Status:** Registration Successful\n" .
                    "- **Merchant ID:** %s\n" .
                    "- **Registration Date:** %s",
                sanitize_text_field($data['businessName'] ?? ''),
                sanitize_text_field($data['legalIdentity'] ?? ''),
                sanitize_text_field($data['customFields']['businessCategory'] ?? $data['businessCategory'] ?? 'Not specified'),
                $service_types ?: 'Not specified',
                sanitize_text_field($data['customFields']['monthlyVolume'] ?? $data['monthlyVolume'] ?? 'Not specified'),
                sanitize_text_field($data['customFields']['maxAmount'] ?? $data['maxAmount'] ?? '0'),
                sanitize_text_field($data['customFields']['currency'] ?? $data['currencyType'] ?? 'BDT'),
                sanitize_text_field($data['domainName'] ?? 'Not provided'),
                sanitize_text_field($data['firstName'] ?? ''),
                sanitize_text_field($data['lastName'] ?? ''),
                sanitize_email($data['email'] ?? ''),
                sanitize_text_field($data['mobile'] ?? ''),
                sanitize_text_field($api_response['data']['merchant_id'] ?? $api_response['merchant_id'] ?? 'Unknown'),
                current_time('mysql')
            );

            // Combine first and last name for CRM
            $full_name = trim(($data['firstName'] ?? '') . ' ' . ($data['lastName'] ?? ''));

            // Submit to CRM using the global CRM handler - FIELD MAPPING
            $crm_result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                // PERSON FIELDS
                'name' => $full_name,                    // firstName + lastName → Person name
                'email' => $data['email'] ?? '',         // email → Person email
                'phone' => $data['mobile'] ?? '',        // mobile → Person phone (+880 format)

                // COMPANY FIELDS
                'company' => $data['businessName'] ?? '', // businessName → Company name

                // OPPORTUNITY FIELDS
                'opportunity_title' => 'Merchant Registration: ' . ($data['businessName'] ?? 'New Merchant'),
                'opportunity_stage' => 'NEW',
                'opportunity_value' => $this->calculate_opportunity_value($data['monthlyVolume'] ?? ''),

                // NOTE FIELDS - All form data
                'note_title' => 'Merchant Registration Details',
                'note_content' => $note_content,

                'widget_type' => 'merchant_registration'
            ]);

            // CRM submission completed

        } catch (Exception $e) {
            // Log error but don't fail the main registration process
        } catch (Throwable $t) {
            // Log error but don't fail the main registration process
        }
    }

    /**
     * Submit sandbox form data to CRM after successful sandbox API submission
     * This runs AFTER successful sandbox API submission
     */
    private function submit_sandbox_to_crm($data, $api_response)
    {
        try {
            // Check if CRM is configured before attempting submission
            $crm_api_key = \MoneybagPlugin\MoneybagAPI::get_crm_api_key();

            if (!$crm_api_key) {
                // CRM not configured, skip submission
                return;
            }

            // Build note content from the sandbox form data
            $note_content = "**Sandbox Registration Submission**\n\n";
            $note_content .= "- **Business Name:** " . ($data['business_name'] ?? '') . "\n";
            $note_content .= "- **Legal Identity:** " . ($data['legal_identity'] ?? '') . "\n";
            $note_content .= "- **Business Website:** " . ($data['business_website'] ?? '') . "\n";
            $note_content .= "- **Contact:** " . ($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '') . "\n";
            $note_content .= "- **Email:** " . ($data['email'] ?? '') . "\n";
            $note_content .= "- **Phone:** " . ($data['phone'] ?? '') . "\n";

            // Add API response details if available
            if (isset($api_response['data'])) {
                $note_content .= "\n**API Response:**\n";
                if (isset($api_response['data']['merchant_id'])) {
                    $note_content .= "- **Merchant ID:** " . $api_response['data']['merchant_id'] . "\n";
                }
                if (isset($api_response['data']['sandbox_url'])) {
                    $note_content .= "- **Sandbox URL:** " . $api_response['data']['sandbox_url'] . "\n";
                }
                $note_content .= "- **Registration Date:** " . date('Y-m-d H:i:s');
            }

            // Combine first and last name for CRM
            $full_name = trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''));

            // Submit to CRM using the global CRM handler with proper field mapping
            $crm_result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                // PERSON FIELDS
                'name' => $full_name,                      // first_name + last_name → Person name
                'email' => $data['email'] ?? '',           // email → Person email
                'phone' => $data['phone'] ?? '',           // phone → Person phone (+880 format)

                // COMPANY FIELDS
                'company' => $data['business_name'] ?? '', // business_name → Company name

                // OPPORTUNITY FIELDS
                'opportunity_title' => 'Sandbox Registration: ' . ($data['business_name'] ?? 'New Business'),
                'opportunity_stage' => 'NEW',
                'opportunity_value' => 100000, // Default value for sandbox registrations

                // NOTE FIELDS - All form data
                'note_title' => 'Sandbox Registration Details',
                'note_content' => $note_content,

                'widget_type' => 'sandbox_registration'
            ]);

            // CRM submission completed

        } catch (Exception $e) {
            // Log error but don't fail the main registration process
        } catch (Throwable $t) {
            // Log error but don't fail the main registration process
        }
    }

    /**
     * Calculate opportunity value from monthly volume range
     *
     * @param string $monthly_volume Monthly volume range from form
     * @return int Estimated opportunity value
     */
    private function calculate_opportunity_value($monthly_volume)
    {
        // Map monthly volume ranges to estimated annual values
        $volume_map = [
            'Below 10,000' => 120000,        // 10k * 12 months
            '10,000 - 50,000' => 360000,     // 30k avg * 12 months
            '50,000 - 100,000' => 900000,    // 75k avg * 12 months
            '100,000 - 500,000' => 3600000,  // 300k avg * 12 months
            '500,000 - 1,000,000' => 9000000, // 750k avg * 12 months
            'Above 1,000,000' => 15000000    // 1.25M avg * 12 months
        ];

        // Return the mapped value or a default
        return $volume_map[$monthly_volume] ?? 600000; // Default to 50k/month if unknown
    }

    /**
     * Handle calculator lead submission
     */
    public function handle_calculator_lead()
    {
        try {
            // Verify nonce for security
            if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'moneybag_nonce')) {
                wp_send_json_error(['message' => 'Security check failed']);
                return;
            }

            // Prepare calculator lead data
            $form_data = [
                'monthly_volume' => $_POST['monthly_volume'] ?? 0,
                'current_gateway' => $_POST['current_gateway'] ?? '',
                'estimated_savings' => $_POST['estimated_savings'] ?? 0
            ];

            // Sanitize data
            $sanitized_data = [
                'monthly_volume' => intval($form_data['monthly_volume']),
                'current_gateway' => sanitize_text_field($form_data['current_gateway']),
                'estimated_savings' => floatval($form_data['estimated_savings'])
            ];

            // Build note content for calculator lead
            $note_content = "**Price Comparison Calculator Lead**\n\n" .
                "- **Monthly Volume:** ৳" . number_format($sanitized_data['monthly_volume']) . "\n" .
                "- **Current Gateway:** {$sanitized_data['current_gateway']}\n" .
                "- **Estimated Annual Savings:** ৳" . number_format($sanitized_data['estimated_savings']) . "\n\n" .
                "**Lead Source:** Price Comparison Calculator Widget";

            // Use global CRM system
            $result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name' => 'Calculator Lead',
                'email' => 'lead@calculator.pending',
                'phone' => '0000000000',
                'company' => 'Pending',
                'opportunity_title' => 'Calculator Lead - ৳' . number_format($sanitized_data['estimated_savings']) . ' Potential Savings',
                'opportunity_stage' => 'NEW',
                'opportunity_value' => $sanitized_data['estimated_savings'],
                'note_title' => 'Price Calculator Lead',
                'note_content' => $note_content,
                'widget_type' => 'price_calculator'
            ]);

            if ($result['success']) {
                wp_send_json_success([
                    'success' => true,
                    'message' => 'Lead captured successfully',
                    'redirect_url' => '/contact'
                ]);
            } else {
                wp_send_json_error($result);
            }
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => 'An error occurred while processing your request.'
            ]);
        }
    }


    /**
     * Plugin activation
     */
    public function activate()
    {
        // API configuration is now entirely user-driven through admin settings
        // Users must configure all API URLs and keys manually for security and flexibility


        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate()
    {
        // Clear any caches or transients
        delete_transient('moneybag_pricing_rules');
        delete_transient('moneybag_registration_options');

        // Clear scheduled events (if any)
        wp_clear_scheduled_hook('moneybag_cleanup_old_registrations');

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin uninstall - static method
     */
    public static function uninstall()
    {
        // Only run if current user can manage options
        if (!current_user_can('manage_options')) {
            return;
        }

        // Clean up plugin options on deactivation
        delete_option('moneybag_api_base_url');
        delete_option('moneybag_sandbox_api_url');
        delete_option('moneybag_crm_api_url');
        delete_option('moneybag_crm_api_key');
        delete_option('moneybag_recaptcha_site_key');
        delete_option('moneybag_recaptcha_secret_key');
        delete_option('moneybag_default_redirect_url');
        delete_option('moneybag_crm_opportunity_name');

        // Clean up merchant registration data
        $registrations = get_option('moneybag_all_registrations', []);
        foreach ($registrations as $reg) {
            delete_option('moneybag_registration_' . $reg['id']);
        }
        delete_option('moneybag_all_registrations');

        // Remove transients
        delete_transient('moneybag_pricing_rules');
        delete_transient('moneybag_registration_options');
    }
}

new MoneybagPlugin();
