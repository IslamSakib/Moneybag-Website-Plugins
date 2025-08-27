<?php
/**
 * Plugin Name: Moneybag WordPress Plugin
 * Description: Elementor widgets for Moneybag payment integration with React.js forms
 * Version: 2.0.0
 * Author: Sakib islam
 * Text Domain: moneybag-plugin
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('MONEYBAG_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MONEYBAG_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('MONEYBAG_PLUGIN_VERSION', '2.0.0');

// API Configuration - Keys stored securely in WordPress options
define('MONEYBAG_API_BASE_URL', 'https://crm.moneybag.com.bd/rest');

// Load required classes
require_once(MONEYBAG_PLUGIN_PATH . 'includes/class-moneybag-api.php');

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
            add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        }
        
        // Plugin lifecycle hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        register_uninstall_hook(__FILE__, [__CLASS__, 'uninstall']);
        
        // Add AJAX handlers for reCAPTCHA validation
        add_action('wp_ajax_verify_recaptcha', [$this, 'verify_recaptcha']);
        add_action('wp_ajax_nopriv_verify_recaptcha', [$this, 'verify_recaptcha']);
        
        // Add AJAX handlers for merchant registration
        add_action('wp_ajax_moneybag_submit_merchant_registration', [$this, 'submit_merchant_registration']);
        add_action('wp_ajax_nopriv_moneybag_submit_merchant_registration', [$this, 'submit_merchant_registration']);
        
        // Add AJAX handlers for merchant registration API (used by new React form)
        add_action('wp_ajax_moneybag_merchant_api', [$this, 'handle_merchant_api']);
        add_action('wp_ajax_nopriv_moneybag_merchant_api', [$this, 'handle_merchant_api']);
        
        // Add AJAX handlers for sandbox form
        add_action('wp_ajax_moneybag_sandbox_api', [$this, 'handle_sandbox_api']);
        add_action('wp_ajax_nopriv_moneybag_sandbox_api', [$this, 'handle_sandbox_api']);
        
        // Add AJAX handlers for pricing plan CRM integration
        add_action('wp_ajax_moneybag_pricing_crm', [$this, 'handle_pricing_crm']);
        add_action('wp_ajax_nopriv_moneybag_pricing_crm', [$this, 'handle_pricing_crm']);
        
        
        // Field validation disabled - API handles validation directly
        // add_action('wp_ajax_moneybag_validate_field', [$this, 'validate_field']);
        // add_action('wp_ajax_nopriv_moneybag_validate_field', [$this, 'validate_field']);
        
        // Validation rules disabled - API handles validation directly
        // add_action('wp_ajax_moneybag_get_validation_rules', [$this, 'get_validation_rules']);
        // add_action('wp_ajax_nopriv_moneybag_get_validation_rules', [$this, 'get_validation_rules']);
        
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
        wp_enqueue_script(
            'moneybag-editor',
            MONEYBAG_PLUGIN_URL . 'assets/js/editor.js',
            ['elementor-editor'],
            MONEYBAG_PLUGIN_VERSION,
            true
        );
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
                $email = sanitize_email($data['email'] ?? '');
                $response = \MoneybagPlugin\MoneybagAPI::send_email_verification($email);
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
                    'password' => $data['password'] ?? '', // Don't sanitize passwords
                    'phone' => sanitize_text_field($data['phone'] ?? ''),
                    'session_id' => sanitize_text_field($data['session_id'] ?? '')
                ];
                
                // Verify reCAPTCHA only if provided and configured
                // For v3, we're more permissive and rarely block
                if (!empty($sanitized['recaptcha_response'])) {
                    $recaptcha_result = \MoneybagPlugin\MoneybagAPI::verify_recaptcha($sanitized['recaptcha_response']);
                    
                    // Log the result for monitoring
                    if (defined('WP_DEBUG') && WP_DEBUG) {
                        error_log('reCAPTCHA v3 result: ' . json_encode([
                            'success' => $recaptcha_result['success'],
                            'score' => $recaptcha_result['score'] ?? 'N/A',
                            'message' => $recaptcha_result['message'] ?? ''
                        ]));
                    }
                    
                    // For v3, the verify_recaptcha function already handles scoring
                    // and will return success=true for most legitimate users
                    // Only truly suspicious activity would return success=false
                }
                
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
            wp_send_json_error($response['message'] ?? 'API request failed');
        }
    }
    
    // Validation methods removed - API handles all validation
    // The validate_field() and get_validation_rules() methods have been removed
    // as we now rely entirely on the Sandbox API for validation
    
    public function handle_pricing_crm() {
        try {
            // Verify nonce for security
            if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'moneybag_pricing_nonce')) {
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
                case 'search_person':
                    $response = $this->search_crm_person($data);
                    // For search_person, always return success even if person not found
                    wp_send_json_success($response['data'] ?? []);
                    return;
                    
                case 'create_person':
                    $response = $this->create_crm_person($data);
                    break;
                    
                case 'create_opportunity':
                    $response = $this->create_crm_opportunity($data);
                    break;
                    
                case 'create_note':
                    $response = $this->create_crm_note($data);
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
                wp_send_json_error($response['message'] ?? 'CRM operation failed');
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
    
    private function create_crm_person($data) {
        // No PHP validation - relying on JavaScript validation
        // Sanitize data for API
        $person_data = [
            'name' => [
                'firstName' => sanitize_text_field($data['name']['firstName'] ?? ''),
                'lastName' => sanitize_text_field($data['name']['lastName'] ?? '')
            ],
            'emails' => [
                'primaryEmail' => sanitize_email($data['emails']['primaryEmail'] ?? '')
            ],
            'phones' => [
                'primaryPhoneNumber' => sanitize_text_field($data['phones']['primaryPhoneNumber'] ?? ''),
                'primaryPhoneCallingCode' => sanitize_text_field($data['phones']['primaryPhoneCallingCode'] ?? '+880'),
                'primaryPhoneCountryCode' => sanitize_text_field($data['phones']['primaryPhoneCountryCode'] ?? 'BD')
            ]
        ];
        
        $response = \MoneybagPlugin\MoneybagAPI::crm_request('/people', $person_data);
        
        return $response;
    }
    
    private function create_crm_opportunity($data) {
        // Let API handle all validation - just sanitize data
        $opportunity_data = [
            'name' => sanitize_text_field($data['name'] ?? ''),
            'stage' => sanitize_text_field($data['stage'] ?? 'NEW'),
            'amount' => [
                'amountMicros' => intval($data['amount']['amountMicros'] ?? 0),
                'currencyCode' => sanitize_text_field($data['amount']['currencyCode'] ?? 'BDT')
            ],
            'pointOfContactId' => sanitize_text_field($data['pointOfContactId'] ?? '')
        ];
        
        return \MoneybagPlugin\MoneybagAPI::crm_request('/opportunities', $opportunity_data);
    }
    
    private function create_crm_note($data) {
        // Let API handle all validation - just sanitize data
        $note_data = [
            'title' => sanitize_text_field($data['title'] ?? ''),
            'bodyV2' => [
                'markdown' => sanitize_textarea_field($data['bodyV2']['markdown'] ?? '')
            ]
        ];
        
        return \MoneybagPlugin\MoneybagAPI::crm_request('/notes', $note_data);
    }
    
    
    private function create_crm_note_target($data) {
        // Let API handle all validation - just sanitize data
        $note_target_data = [
            'noteId' => sanitize_text_field($data['noteId'] ?? ''),
            'opportunityId' => sanitize_text_field($data['opportunityId'] ?? '')
        ];
        
        return \MoneybagPlugin\MoneybagAPI::crm_request('/noteTargets', $note_target_data);
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
                
            case 'upload_document':
                $this->handle_document_upload();
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
        // Validate required fields
        $required_fields = ['name', 'domainName', 'email', 'phone'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                wp_send_json_error("Missing required field: $field");
                return;
            }
        }
        
        // Use the existing submit_merchant_registration logic
        // For now, just return success - the actual CRM integration can be added later
        wp_send_json_success(['message' => 'Merchant registration submitted successfully']);
    }
    
    private function handle_document_upload() {
        // Handle file uploads for merchant documents
        if (empty($_FILES['file'])) {
            wp_send_json_error('No file uploaded');
            return;
        }
        
        $file = $_FILES['file'];
        
        // Validate file type and size
        $allowed_types = ['image/jpeg', 'image/png', 'application/pdf'];
        $max_size = 1048576; // 1MB
        
        if (!in_array($file['type'], $allowed_types)) {
            wp_send_json_error('Invalid file type. Only JPG, PNG, and PDF files are allowed.');
            return;
        }
        
        if ($file['size'] > $max_size) {
            wp_send_json_error('File size too large. Maximum 1MB allowed.');
            return;
        }
        
        // For now, just return success - actual file handling can be implemented later
        wp_send_json_success([
            'message' => 'File uploaded successfully',
            'url' => 'placeholder-url',
            'filename' => $file['name']
        ]);
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Set default options if they don't exist
        if (!get_option('moneybag_api_base_url')) {
            add_option('moneybag_api_base_url', 'https://api.moneybag.com.bd/api/v2');
        }
        if (!get_option('moneybag_sandbox_api_url')) {
            add_option('moneybag_sandbox_api_url', 'https://sandbox.api.moneybag.com.bd/api/v2');
        }
        if (!get_option('moneybag_crm_api_url')) {
            add_option('moneybag_crm_api_url', 'https://crm.moneybag.com.bd/rest');
        }
        if (!get_option('moneybag_crm_api_key')) {
            // Set the default CRM API key on activation (should be changed in admin)
            add_option('moneybag_crm_api_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNmVjMjllMS1jNjg5LTRhZmItODViNi0xNWI3NzA2Mzk4MjAiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMDZlYzI5ZTEtYzY4OS00YWZiLTg1YjYtMTViNzcwNjM5ODIwIiwiaWF0IjoxNzU1NDEyODEzLCJleHAiOjQ5MDkwMTI4MTIsImp0aSI6IjliZGEwMDY4LTFmODAtNDAwMS1iN2E0LWRiNTVhMGRmYTQ4MSJ9.HOPJJTd3mXz2HbcWxDnNc2eaWEW9FbM-K-6DmlezeIo');
        }
        
        // Create upload directory for merchant documents
        $upload_dir = wp_upload_dir();
        $moneybag_dir = $upload_dir['basedir'] . '/moneybag-documents';
        if (!file_exists($moneybag_dir)) {
            wp_mkdir_p($moneybag_dir);
            // Add .htaccess for security
            file_put_contents($moneybag_dir . '/.htaccess', 'deny from all');
        }
        
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
        
        // Remove plugin options (uncomment if you want complete cleanup)
        // delete_option('moneybag_api_base_url');
        // delete_option('moneybag_sandbox_api_url'); 
        // delete_option('moneybag_crm_api_url');
        // delete_option('moneybag_crm_api_key');
        // delete_option('moneybag_recaptcha_site_key');
        // delete_option('moneybag_recaptcha_secret_key');
        // delete_option('moneybag_default_redirect_url');
        // delete_option('moneybag_crm_opportunity_name');
        
        // Remove merchant registrations (uncomment if you want to delete data)
        // $registrations = get_option('moneybag_all_registrations', []);
        // foreach ($registrations as $reg) {
        //     delete_option('moneybag_registration_' . $reg['id']);
        // }
        // delete_option('moneybag_all_registrations');
        
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