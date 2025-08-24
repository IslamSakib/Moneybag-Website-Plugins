<?php
/**
 * Plugin Name: Moneybag WordPress Plugin
 * Description: Elementor widgets for Moneybag payment integration with React.js forms
 * Version: 1.0.0
 * Author: Sakib islam
 * Text Domain: moneybag-plugin
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('MONEYBAG_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MONEYBAG_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('MONEYBAG_PLUGIN_VERSION', '1.0.0');

// API Configuration
define('MONEYBAG_API_BASE_URL', 'https://crm.moneybag.com.bd/rest');
define('MONEYBAG_API_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNmVjMjllMS1jNjg5LTRhZmItODViNi0xNWI3NzA2Mzk4MjAiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMDZlYzI5ZTEtYzY4OS00YWZiLTg1YjYtMTViNzcwNjM5ODIwIiwiaWF0IjoxNzU1NDEyODEzLCJleHAiOjQ5MDkwMTI4MTIsImp0aSI6IjliZGEwMDY4LTFmODAtNDAwMS1iN2E0LWRiNTVhMGRmYTQ4MSJ9.HOPJJTd3mXz2HbcWxDnNc2eaWEW9FbM-K-6DmlezeIo');

class MoneybagPlugin {
    
    public function __construct() {
        add_action('init', [$this, 'init']);
        add_action('plugins_loaded', [$this, 'check_elementor']);
        add_action('elementor/widgets/widgets_registered', [$this, 'register_widgets']);
        add_action('elementor/elements/categories_registered', [$this, 'register_categories']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('elementor/editor/before_enqueue_scripts', [$this, 'enqueue_editor_scripts']);
        
        // Initialize admin functionality
        if (is_admin()) {
            $this->init_admin();
        }
        
        // Add AJAX handlers for reCAPTCHA validation
        add_action('wp_ajax_verify_recaptcha', [$this, 'verify_recaptcha']);
        add_action('wp_ajax_nopriv_verify_recaptcha', [$this, 'verify_recaptcha']);
        
        // Add AJAX handlers for merchant registration
        add_action('wp_ajax_moneybag_submit_merchant_registration', [$this, 'submit_merchant_registration']);
        add_action('wp_ajax_nopriv_moneybag_submit_merchant_registration', [$this, 'submit_merchant_registration']);
        
        // Block Elementor fonts on pages with merchant registration widget
        add_action('wp_enqueue_scripts', [$this, 'maybe_block_elementor_fonts'], 999);
        
        // Add security headers to prevent mixed content
        add_action('send_headers', [$this, 'add_security_headers']);
    }
    
    public function init() {
        load_plugin_textdomain('moneybag-plugin', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
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
    }
    
    public function init_admin() {
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/admin/admin-settings.php');
        new \MoneybagPlugin\Admin\AdminSettings();
    }
    
    public function register_widgets() {
        if (class_exists('Elementor\Widget_Base')) {
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\SandboxFormWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\PricingPlanWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\MerchantRegistrationWidget());
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
        
        wp_enqueue_style(
            'moneybag-sandbox-form',
            MONEYBAG_PLUGIN_URL . 'assets/css/sandbox-form.css',
            [],
            MONEYBAG_PLUGIN_VERSION
        );
        
        // Pricing Plan Scripts
        wp_enqueue_script(
            'moneybag-pricing-plan',
            MONEYBAG_PLUGIN_URL . 'assets/js/pricing-plan.js',
            ['wp-element'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
        
        wp_enqueue_style(
            'moneybag-pricing-plan',
            MONEYBAG_PLUGIN_URL . 'assets/css/pricing-plan.css',
            [],
            MONEYBAG_PLUGIN_VERSION
        );
        
        // Localize scripts
        wp_localize_script('moneybag-sandbox-form', 'moneybagAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_nonce'),
            'apiBase' => 'https://sandbox.api.moneybag.com.bd/api/v2'
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
        
        wp_enqueue_style(
            'moneybag-merchant-registration',
            MONEYBAG_PLUGIN_URL . 'assets/css/merchant-registration.css',
            [],
            MONEYBAG_PLUGIN_VERSION
        );
        
        wp_localize_script('moneybag-merchant-registration', 'moneybagMerchantAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_merchant_nonce')
        ]);
    }
    
    public function enqueue_editor_scripts() {
        wp_enqueue_script(
            'moneybag-editor',
            MONEYBAG_PLUGIN_URL . 'assets/js/editor.js',
            ['elementor-editor'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
    }
    
    public function verify_recaptcha() {
        // Verify nonce for security
        if (!wp_verify_nonce($_POST['nonce'], 'moneybag_nonce')) {
            wp_send_json_error('Security check failed');
            return;
        }
        
        $recaptcha_response = sanitize_text_field($_POST['recaptcha_response'] ?? '');
        $secret_key = get_option('moneybag_recaptcha_secret_key', '');
        
        if (empty($recaptcha_response)) {
            wp_send_json_error('reCAPTCHA response is required');
            return;
        }
        
        if (empty($secret_key)) {
            wp_send_json_error('reCAPTCHA secret key not configured');
            return;
        }
        
        // Verify reCAPTCHA with Google
        $verify_url = 'https://www.google.com/recaptcha/api/siteverify';
        $verify_data = [
            'secret' => $secret_key,
            'response' => $recaptcha_response,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ];
        
        $response = wp_remote_post($verify_url, [
            'body' => $verify_data,
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            wp_send_json_error('Failed to verify reCAPTCHA: ' . $response->get_error_message());
            return;
        }
        
        $response_body = wp_remote_retrieve_body($response);
        $result = json_decode($response_body, true);
        
        if ($result['success']) {
            wp_send_json_success([
                'message' => 'reCAPTCHA verified successfully',
                'score' => $result['score'] ?? null
            ]);
        } else {
            $error_codes = $result['error-codes'] ?? ['unknown-error'];
            wp_send_json_error([
                'message' => 'reCAPTCHA verification failed',
                'error_codes' => $error_codes
            ]);
        }
    }
    
    public function submit_merchant_registration() {
        // Debug: Log received data
        error_log('Received AJAX request for merchant registration');
        error_log('POST data: ' . print_r($_POST, true));
        
        // Verify nonce for security
        if (!wp_verify_nonce($_POST['nonce'], 'moneybag_merchant_nonce')) {
            error_log('Nonce verification failed');
            wp_send_json_error('Security check failed');
            return;
        }
        
        $merchant_data = json_decode(stripslashes($_POST['merchant_data']), true);
        
        if (!$merchant_data) {
            error_log('Invalid merchant data received');
            wp_send_json_error('Invalid merchant data');
            return;
        }
        
        // Debug: Log processed data
        error_log('Processed merchant data: ' . print_r($merchant_data, true));
        
        // Validate required fields for simplified company structure
        $required_fields = ['name', 'email', 'phone'];
        foreach ($required_fields as $field) {
            if (empty($merchant_data[$field])) {
                error_log("Missing required field: $field");
                wp_send_json_error("Missing required field: $field");
                return;
            }
        }
        
        // Validate custom fields exist
        if (empty($merchant_data['customFields']) || !is_array($merchant_data['customFields'])) {
            error_log("Missing or invalid customFields data");
            wp_send_json_error("Missing custom fields information");
            return;
        }
        
        // Store merchant data in WordPress database instead of CRM API
        error_log('Storing merchant registration data locally');
        
        try {
            // Generate a unique registration ID
            $registration_id = 'MB_' . strtoupper(uniqid());
            
            // Prepare submission data
            $submission_data = [
                'registration_id' => $registration_id,
                'merchant_name' => $merchant_data['name'],
                'domain_name' => $merchant_data['domainName'],
                'email' => $merchant_data['email'],
                'phone' => $merchant_data['phone'],
                'custom_fields' => $merchant_data['customFields'],
                'submission_date' => current_time('mysql'),
                'status' => 'pending_review'
            ];
            
            // Store in WordPress options table (or custom table if available)
            $stored = add_option('moneybag_registration_' . $registration_id, $submission_data);
            
            // Also store in a list of all registrations
            $all_registrations = get_option('moneybag_all_registrations', []);
            $all_registrations[] = [
                'id' => $registration_id,
                'name' => $merchant_data['name'],
                'email' => $merchant_data['email'],
                'date' => current_time('mysql')
            ];
            update_option('moneybag_all_registrations', $all_registrations);
            
            // Send notification email to admin
            $admin_email = get_option('admin_email');
            $subject = 'New Merchant Registration: ' . $merchant_data['name'];
            $message = $this->generate_merchant_note($merchant_data);
            $message .= "\n\nRegistration ID: " . $registration_id;
            $message .= "\n\nView in WordPress Admin: " . admin_url('admin.php?page=moneybag-registrations');
            
            wp_mail($admin_email, $subject, $message);
            
            // Send confirmation email to merchant
            $merchant_subject = 'Registration Received - Moneybag';
            $merchant_message = "Dear " . $merchant_data['customFields']['contactName'] . ",\n\n";
            $merchant_message .= "Thank you for registering with Moneybag. Your application has been received and is under review.\n\n";
            $merchant_message .= "Registration ID: " . $registration_id . "\n";
            $merchant_message .= "Business Name: " . $merchant_data['name'] . "\n\n";
            $merchant_message .= "Our team will review your application and contact you within 1-3 business days.\n\n";
            $merchant_message .= "For any inquiries, please contact:\n";
            $merchant_message .= "Phone: +880 1958 109 228\n";
            $merchant_message .= "Email: info@moneybag.com.bd\n\n";
            $merchant_message .= "Best regards,\nMoneybag Team";
            
            wp_mail($merchant_data['email'], $merchant_subject, $merchant_message);
            
            error_log('Merchant registration stored successfully with ID: ' . $registration_id);
            
            // Success response
            wp_send_json_success([
                'message' => 'Merchant registration submitted successfully',
                'registration_id' => $registration_id,
                'email_sent' => true
            ]);
            
        } catch (Exception $e) {
            error_log('Merchant registration error: ' . $e->getMessage());
            wp_send_json_error($e->getMessage());
        }
    }
    
    private function generate_merchant_note($merchant_data) {
        $custom = $merchant_data['customFields'];
        $documents_status = !empty($custom['documents']) ? 'Files uploaded' : 'No files uploaded';
        $current_time = current_time('Y-m-d H:i:s');
        
        return "## Merchant Onboarding Application

### Business Information
- **Legal Identity:** " . ($custom['legalIdentity'] ?? 'Not specified') . "
- **Business Category:** " . ($custom['businessCategory'] ?? 'Not specified') . "
- **Monthly Volume:** " . ($custom['monthlyVolume'] ?? 'Not specified') . "
- **Max Single Transaction:** " . ($custom['maxTransactionAmount'] ?? 'Not specified') . "
- **Currency:** " . ($custom['currency'] ?? 'BDT') . "
- **Services Needed:** " . (is_array($custom['serviceTypes'] ?? []) ? implode(', ', $custom['serviceTypes']) : 'All') . "

### Online Presence
- **Merchant Name:** " . ($merchant_data['name'] ?? 'Not specified') . "
- **Trading Name:** " . ($custom['tradingName'] ?? 'Not specified') . "
- **Domain:** " . ($merchant_data['domainName'] ?? 'Not specified') . "

### Contact Information
- **Name:** " . ($custom['contactName'] ?? 'Not specified') . "
- **Designation:** " . ($custom['designation'] ?? 'Not specified') . "
- **Email:** " . ($merchant_data['email'] ?? 'Not specified') . "
- **Mobile:** " . ($merchant_data['phone'] ?? 'Not specified') . "
- **Office Phone:** " . ($custom['officePhone'] ?? 'N/A') . "

### Documents Status
" . $documents_status . "

### Submission Details
- **Submitted At:** " . $current_time . "
- **Session ID:** " . ($custom['sessionId'] ?? 'N/A') . "
- **Source:** " . ($custom['source'] ?? 'WordPress Plugin') . "
- **Application Status:** Pending Review";
    }
    
    public function maybe_block_elementor_fonts() {
        // Check if current page likely has merchant registration widget
        global $post;
        
        if (!$post) return;
        
        // Check if post content contains merchant registration widget
        if (strpos($post->post_content, 'moneybag-merchant-registration') !== false) {
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
            wp_add_inline_style('moneybag-merchant-registration', '
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
}

new MoneybagPlugin();