<?php
/**
 * Plugin Name: Moneybag WordPress Plugin
 * Description: Configuration-driven Elementor widgets for payment gateway integration with React.js forms. Works with any API provider.
 * Version: 2.3.8
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
define('MONEYBAG_PLUGIN_VERSION', '2.3.5');                 // Plugin version for cache busting

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
class MoneybagPlugin {
    
    /**
     * Plugin constructor
     * 
     * Initializes the plugin by setting up WordPress hooks,
     * Elementor integration, and admin interfaces.
     */
    public function __construct() {
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
    private function init_wordpress_integration() {
        add_action('init', [$this, 'init']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('wp_enqueue_scripts', [$this, 'maybe_block_elementor_fonts'], 999);
    }
    
    /**
     * Initialize Elementor Integration
     * 
     * Sets up Elementor-specific hooks and widget registration
     */
    private function init_elementor_integration() {
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
    private function init_ajax_hooks() {
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
    }
    
    /**
     * Initialize Admin Interface
     * 
     * Sets up admin-specific functionality including settings pages,
     * admin scripts, and security headers.
     */
    private function init_admin() {
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
    public function init() {
        load_plugin_textdomain('moneybag-plugin', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Check Elementor Dependency
     * 
     * Verifies that Elementor is installed and activated.
     * Shows admin notice if Elementor is missing.
     */
    
    public function check_elementor() {
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
    
    public function admin_notice_missing_elementor() {
        $message = sprintf(
            esc_html__('"%1$s" requires "%2$s" to be installed and activated.', 'moneybag-plugin'),
            '<strong>' . esc_html__('Moneybag Plugin', 'moneybag-plugin') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'moneybag-plugin') . '</strong>'
        );
        
        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }
    
    public function admin_notice_minimum_elementor_version() {
        $message = sprintf(
            esc_html__('"%1$s" requires "%2$s" version %3$s or greater.', 'moneybag-plugin'),
            '<strong>' . esc_html__('Moneybag Plugin', 'moneybag-plugin') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'moneybag-plugin') . '</strong>',
            '3.0.0'
        );
        
        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }
    
    public function includes() {
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/sandbox-form-widget.php');
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/pricing-plan-widget.php');
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/merchant-registration-widget.php');
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/widgets/contact-form-widget.php');
    }
    
    public function register_widgets() {
        if (class_exists('Elementor\Widget_Base')) {
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\SandboxFormWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\PricingPlanWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\MerchantRegistrationWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\Contact_Form_Widget());
        }
    }
    
    public function register_categories($elements_manager) {
        $elements_manager->add_category(
            'moneybag',
            [
                'title' => __('Moneybag', 'moneybag-plugin'),
                'icon' => 'fa fa-money',
            ]
        );
    }
    
    public function enqueue_scripts() {
        // Preconnect to Google Fonts for better performance
        add_action('wp_head', function() {
            echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
            echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
        }, 1);
        // Sandbox Form Scripts
        wp_enqueue_script(
            'moneybag-sandbox-form',
            MONEYBAG_PLUGIN_URL . 'assets/js/sandbox-form.js',
            ['wp-element', 'wp-api-fetch'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        
        
        // Global Form Validator Script
        wp_enqueue_script(
            'moneybag-form-validator',
            MONEYBAG_PLUGIN_URL . 'assets/js/form-validator.js',
            [],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        
        // Pricing Plan Scripts
        wp_enqueue_script(
            'moneybag-pricing-plan',
            MONEYBAG_PLUGIN_URL . 'assets/js/pricing-plan.js',
            ['wp-element', 'moneybag-form-validator'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        
        // Contact Form Scripts
        wp_enqueue_script(
            'moneybag-contact-form',
            MONEYBAG_PLUGIN_URL . 'assets/js/contact-form.js',
            ['wp-element', 'moneybag-form-validator'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        
        // Enqueue global styles (includes all widget styles)
        wp_enqueue_style(
            'moneybag-global',
            MONEYBAG_PLUGIN_URL . 'assets/css/moneybag-global.css',
            [],
            MONEYBAG_PLUGIN_VERSION
        );
        
        // Localize scripts - API calls now go through WordPress backend
        wp_localize_script('moneybag-sandbox-form', 'moneybagAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_nonce')
        ]);
        
        wp_localize_script('moneybag-pricing-plan', 'moneybagPricingAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_pricing_nonce'),
            'pluginUrl' => MONEYBAG_PLUGIN_URL
        ]);
        
        // Merchant Registration Scripts (WordPress React)
        wp_enqueue_script(
            'moneybag-merchant-registration',
            MONEYBAG_PLUGIN_URL . 'assets/js/merchant-registration-wp.js',
            ['wp-element', 'jquery'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        
        
        wp_localize_script('moneybag-merchant-registration', 'moneybagMerchantAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_merchant_nonce')
        ]);
    }
    
    public function enqueue_editor_scripts() {
        // Editor scripts removed - widgets use no Elementor controls
        return;
    }
    
    /**
     * Enqueue admin scripts only on relevant admin pages
     */
    public function enqueue_admin_scripts($hook) {
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
    
    public function verify_recaptcha() {
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
    
    
    public function maybe_block_elementor_fonts() {
        // Check if current page likely has any Moneybag widget
        global $post;
        
        if (!$post) return;
        
        // Check if post content contains any Moneybag widget
        if (strpos($post->post_content, 'moneybag-merchant-registration') !== false ||
            strpos($post->post_content, 'moneybag-sandbox-form') !== false ||
            strpos($post->post_content, 'moneybag-pricing-plan') !== false) {
            // Block Elementor Google Fonts
            add_filter('elementor/frontend/print_google_fonts', '__return_false');
            
            // Dequeue Elementor font styles that might conflict
            $elementor_font_handles = [
                'elementor-frontend-google-fonts',
                'google-fonts-1',
                'elementor-icons-fa-solid',
                'elementor-icons-fa-regular',
                'elementor-icons-fa-brands'
            ];
            
            foreach ($elementor_font_handles as $handle) {
                wp_dequeue_style($handle);
                wp_deregister_style($handle);
            }
            
            // Add inline style to override any remaining font loading
            wp_add_inline_style('moneybag-global', '
                /* Force override Elementor fonts */
                .moneybag-merchant-form-wrapper,
                .moneybag-merchant-form-wrapper * {
                    font-family: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                }
                
                /* Block mixed content font loading */
                @font-face {
                    font-family: "Poppins";
                    font-display: swap;
                    src: url("https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2") format("woff2");
                }
            ');
        }
    }
    
    public function override_elementor_fonts() {
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
    
    public function add_security_headers() {
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
    public function handle_sandbox_api() {
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
                // No validation - let API handle everything
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
            
            // Log error details for debugging but don't show to users
            if (isset($response['error']) && defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[Moneybag API] Error type: ' . $response['error']);
            }
            
            // For development - log the full response
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[Moneybag Sandbox API Error] Full response: ' . json_encode($response));
            }
            
            wp_send_json_error($error_message);
        }
    }
    
    
    public function handle_contact_form() {
        try {
            // Verify nonce for security
            if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'moneybag_contact_nonce')) {
                wp_send_json_error(['message' => 'Security check failed']);
                return;
            }
            
            // Prepare contact form data for global CRM system
            $form_data = [
                'name' => $_POST['name'] ?? '',
                'email' => $_POST['email'] ?? '',
                'phone' => $_POST['phone'] ?? '',
                'company' => $_POST['company'] ?? '',
                'inquiry_type' => $_POST['inquiry_type'] ?? 'General Inquiry',
                'other_subject' => $_POST['other_subject'] ?? '',
                'message' => $_POST['message'] ?? ''
            ];
            
            // Validate required fields
            $sanitized_data = [
                'name' => sanitize_text_field($form_data['name']),
                'email' => sanitize_email($form_data['email']),
                'phone' => sanitize_text_field($form_data['phone']),
                'company' => sanitize_text_field($form_data['company']),
                'inquiry_type' => sanitize_text_field($form_data['inquiry_type']),
                'other_subject' => sanitize_text_field($form_data['other_subject']),
                'message' => sanitize_textarea_field($form_data['message'])
            ];
            
            if (empty($sanitized_data['name']) || empty($sanitized_data['email']) || 
                empty($sanitized_data['phone']) || empty($sanitized_data['company'])) {
                wp_send_json_error(['message' => 'Please fill in all required fields.']);
                return;
            }
            
            // If inquiry type is "Other", require the subject field
            if ($sanitized_data['inquiry_type'] === 'Other' && empty($sanitized_data['other_subject'])) {
                wp_send_json_error(['message' => 'Please specify the subject for "Other" inquiry type.']);
                return;
            }
            
            // Build note content for contact form
            $opportunity_subject = $sanitized_data['inquiry_type'] === 'Other' 
                ? $sanitized_data['other_subject'] 
                : $sanitized_data['inquiry_type'];
            
            $note_content = "**Contact Form Submission**\n\n" .
                "- **Name:** {$sanitized_data['name']}\n" .
                "- **Email:** {$sanitized_data['email']}\n" .
                "- **Phone:** {$sanitized_data['phone']}\n" .
                "- **Company:** {$sanitized_data['company']}\n" .
                "- **Inquiry Type:** {$opportunity_subject}\n\n";
            
            if (!empty($sanitized_data['message'])) {
                $note_content .= "**Message:**\n{$sanitized_data['message']}";
            }
            
            // Use global CRM system
            $result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name' => $sanitized_data['name'],
                'email' => $sanitized_data['email'],
                'phone' => $sanitized_data['phone'],
                'company' => $sanitized_data['company'],
                'opportunity_title' => 'Contact Form: ' . $opportunity_subject . 
                                     (!empty($sanitized_data['company']) ? ' - ' . $sanitized_data['company'] : ''),
                'opportunity_stage' => 'NEW',
                'opportunity_value' => 0,
                'note_title' => 'Contact Form Submission',
                'note_content' => $note_content,
                'widget_type' => 'contact_form'
            ]);
            
            if ($result['success']) {
                wp_send_json_success([
                    'success' => true,
                    'message' => 'Thank you for contacting us! We will get back to you soon.',
                    'person_id' => $result['person_id'],
                    'opportunity_id' => $result['opportunity_id'],
                    'note_id' => $result['note_id']
                ]);
            } else {
                wp_send_json_error($result);
            }
            
        } catch (Exception $e) {
            error_log('[Moneybag CRM Debug] Fatal exception in handle_pricing_crm: ' . $e->getMessage());
            error_log('[Moneybag CRM Debug] Exception trace: ' . $e->getTraceAsString());
            wp_send_json_error([
                'message' => 'An unexpected error occurred. Please check the debug log.',
                'error_code' => 'fatal_exception',
                'debug_info' => [
                    'exception_message' => $e->getMessage(),
                    'exception_file' => $e->getFile() . ':' . $e->getLine()
                ]
            ]);
        }
    }
    
    public function handle_pricing_crm() {
        try {
            // Verify nonce for security - accept both pricing and merchant nonces
            $nonce_valid = false;
            if (isset($_POST['nonce'])) {
                $nonce_valid = wp_verify_nonce($_POST['nonce'], 'moneybag_pricing_nonce') || 
                               wp_verify_nonce($_POST['nonce'], 'moneybag_merchant_nonce');
                
                // TEMPORARY: Allow debug testing with test nonces
                if (!$nonce_valid && ($_POST['nonce'] === 'test_nonce' || $_POST['nonce'] === 'debug_nonce')) {
                    error_log('[Moneybag CRM Debug] Using test nonce - bypassing verification for debugging');
                    $nonce_valid = true;
                }
            }
            
            if (!$nonce_valid) {
                error_log('[Moneybag CRM Debug] Security check failed - nonce: ' . ($_POST['nonce'] ?? 'not provided'));
                wp_send_json_error('Security check failed');
                return;
            }
            
            $action = sanitize_text_field($_POST['crm_action'] ?? '');
            $data = json_decode(stripslashes($_POST['data'] ?? '{}'), true);
            
            
            // Check if JSON decode was successful
            if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
                wp_send_json_error('Invalid JSON data provided');
                return;
            }
            $response = null;
            
            switch ($action) {
                case 'test_config':
                    // Test configuration action for diagnostics
                    $crm_api_key = \MoneybagPlugin\MoneybagAPI::get_crm_api_key();
                    $crm_api_url = get_option('moneybag_crm_api_url');
                    
                    wp_send_json_success([
                        'crm_configured' => !empty($crm_api_key) && !empty($crm_api_url),
                        'api_key_set' => !empty($crm_api_key),
                        'api_url_set' => !empty($crm_api_url),
                        'api_key_length' => strlen($crm_api_key ?? ''),
                        'api_url' => $crm_api_url ? '***configured***' : 'not set',
                        'message' => 'Configuration status retrieved'
                    ]);
                    return;
                
                case 'search_person':
                    $response = $this->search_crm_person($data);
                    // For search_person, always return success even if person not found
                    wp_send_json_success($response['data'] ?? []);
                    return;
                    
                case 'submit_all':
                    // New unified handler for pricing form
                    $response = $this->handle_pricing_crm_submission($data);
                    break;
                    
                case 'create_note_target':
                    $response = $this->create_crm_note_target($data);
                    break;
                    
                default:
                    wp_send_json_error('Invalid CRM action: ' . $action);
                    return;
            }
            
            if ($response && isset($response['success']) && $response['success']) {
                wp_send_json_success($response['data'] ?? $response);
            } else {
                // Provide more specific error message
                $error_message = $response['message'] ?? 'CRM operation failed';
                
                // If it's a generic "CRM API request failed", check status code
                if ($error_message === 'CRM API request failed' && isset($response['status_code'])) {
                    if ($response['status_code'] === 401) {
                        $error_message = 'CRM authentication failed. Please check API key configuration.';
                    } else if ($response['status_code'] === 404) {
                        $error_message = 'CRM endpoint not found. Please check API URL configuration.';
                    } else if ($response['status_code'] >= 500) {
                        $error_message = 'CRM service is temporarily unavailable. Please try again later.';
                    }
                }
                
                wp_send_json_error(['message' => $error_message]);
            }
            
        } catch (\Exception $e) {
            wp_send_json_error('CRM operation failed. Please try again.');
        } catch (\Throwable $t) {
            wp_send_json_error('An unexpected error occurred. Please try again.');
        }
    }
    
    private function search_crm_person($data) {
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
    
    private function handle_pricing_crm_submission($data) {
        // DEBUG: Log the received data to understand what merchant registration is sending
        error_log('[Moneybag CRM Debug] handle_pricing_crm_submission received data: ' . json_encode($data));
        
        // Check if it's a merchant registration or pricing form
        if (isset($data['businessName']) && isset($data['legalIdentity'])) {
            // Merchant Registration Form
            $note_content = sprintf(
                "**Merchant Registration Details**\n\n" .
                "- **Business Name:** %s\n" .
                "- **Legal Identity:** %s\n" .
                "- **Business Category:** %s\n" .
                "- **Service Types:** %s\n" .
                "- **Monthly Volume:** %s\n" .
                "- **Max Amount:** %s\n" .
                "- **Currency:** %s\n" .
                "- **Domain:** %s\n" .
                "- **Contact:** %s – %s – %s",
                sanitize_text_field($data['businessName'] ?? ''),
                sanitize_text_field($data['legalIdentity'] ?? ''),
                sanitize_text_field($data['businessCategory'] ?? 'Not specified'),
                sanitize_text_field($data['serviceTypes'] ?? 'Not specified'),
                sanitize_text_field($data['monthlyVolume'] ?? 'Not specified'),
                sanitize_text_field($data['maxAmount'] ?? '0'),
                sanitize_text_field($data['currency'] ?? 'BDT'),
                sanitize_text_field($data['domainName'] ?? 'Not provided'),
                sanitize_text_field($data['name'] ?? ''),
                sanitize_email($data['email'] ?? ''),
                sanitize_text_field($data['mobile'] ?? '')
            );
            
            $result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name' => $data['name'] ?? '',
                'email' => $data['email'] ?? '',
                'phone' => $data['mobile'] ?? '',
                'company' => $data['businessName'] ?? '',
                'opportunity_title' => 'Merchant Registration: ' . ($data['businessName'] ?? 'New Merchant'),
                'opportunity_stage' => 'NEW',
                'opportunity_value' => 0,
                'note_title' => 'Merchant Registration Form Submission',
                'note_content' => $note_content,
                'widget_type' => 'merchant_registration'
            ]);
        } else {
            // Pricing Form
            $note_content = sprintf(
                "**Pricing Form Submission**\n\n" .
                "- **Industry:** %s\n" .
                "- **Legal identity:** %s\n" .
                "- **Business category:** %s\n" .
                "- **Monthly Volume:** %s\n" .
                "- **Domain:** %s\n" .
                "- **Contact:** %s – %s – %s\n" .
                "- **Selected Pricing:** %s\n" .
                "- **Services:** %s",
                sanitize_text_field($data['businessCategory'] ?? 'Not specified'),
                sanitize_text_field($data['legalIdentity'] ?? 'Not specified'),
                sanitize_text_field($data['businessCategory'] ?? 'Not specified'),
                sanitize_text_field($data['monthlyVolume'] ?? 'Not specified'),
                sanitize_text_field($data['domainName'] ?? 'Not provided'),
                sanitize_text_field($data['name'] ?? ''),
                sanitize_email($data['email'] ?? ''),
                sanitize_text_field($data['mobile'] ?? ''),
                sanitize_text_field($data['selectedPricing'] ?? 'Standard Plan'),
                sanitize_text_field($data['services'] ?? 'Standard rates')
            );
            
            $result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name' => $data['name'] ?? '',
                'email' => $data['email'] ?? '',
                'phone' => $data['mobile'] ?? '',
                'company' => $data['domainName'] ?? '',
                'opportunity_title' => 'Pricing Plan: ' . ($data['selectedPricing'] ?? 'Standard'),
                'opportunity_stage' => 'NEW',
                'opportunity_value' => 0,
                'note_title' => 'Pricing Form Submission',
                'note_content' => $note_content,
                'widget_type' => 'pricing_form'
            ]);
        }
        
        return $result;
    }
    
    
    
    private function create_crm_note_target($data) {
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
    
    public function handle_merchant_api() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_merchant_nonce')) {
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
    
    private function get_registration_options() {
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
    
    private function handle_merchant_registration_submission($data) {
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
    private function submit_merchant_registration_to_crm($data, $api_response) {
        try {
            // Check if CRM is configured before attempting submission
            $crm_api_key = \MoneybagPlugin\MoneybagAPI::get_crm_api_key();
            $crm_api_url = get_option('moneybag_crm_api_url');
            
            if (empty($crm_api_key) || empty($crm_api_url)) {
                // CRM not configured - skip CRM submission (don't fail the main process)
                error_log('[Moneybag] CRM not configured, skipping merchant registration CRM submission');
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
            
            // Submit to CRM using the global CRM handler
            $crm_result = \MoneybagPlugin\MoneybagAPI::submit_to_crm([
                'name' => $full_name,
                'email' => $data['email'] ?? '',
                'phone' => $data['mobile'] ?? '',
                'company' => $data['businessName'] ?? '',
                'opportunity_title' => 'Merchant Registration: ' . ($data['businessName'] ?? 'New Merchant'),
                'opportunity_stage' => 'NEW',
                'opportunity_value' => 0, // Initial value - can be updated later
                'note_title' => 'Merchant Registration Submission',
                'note_content' => $note_content,
                'widget_type' => 'merchant_registration'
            ]);
            
            if ($crm_result['success']) {
                error_log('[Moneybag] Merchant registration CRM submission successful - Person ID: ' . ($crm_result['person_id'] ?? 'unknown'));
            } else {
                error_log('[Moneybag] Merchant registration CRM submission failed: ' . ($crm_result['message'] ?? 'unknown error'));
            }
            
        } catch (Exception $e) {
            // Log error but don't fail the main registration process
            error_log('[Moneybag] Exception during merchant registration CRM submission: ' . $e->getMessage());
        } catch (Throwable $t) {
            // Log error but don't fail the main registration process  
            error_log('[Moneybag] Error during merchant registration CRM submission: ' . $t->getMessage());
        }
    }
    
    
    /**
     * Plugin activation
     */
    public function activate() {
        // API configuration is now entirely user-driven through admin settings
        // Users must configure all API URLs and keys manually for security and flexibility
        
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
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
    public static function uninstall() {
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
        
        // Remove upload directory (optional - commented for safety)
        // $upload_dir = wp_upload_dir();
        // $moneybag_dir = $upload_dir['basedir'] . '/moneybag-documents';
        // if (file_exists($moneybag_dir)) {
        //     $files = glob($moneybag_dir . '/*');
        //     foreach ($files as $file) {
        //         if (is_file($file)) {
        //             unlink($file);
        //         }
        //     }
        //     rmdir($moneybag_dir);
        // }
    }
}

new MoneybagPlugin();