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
    }
    
    public function init_admin() {
        require_once(MONEYBAG_PLUGIN_PATH . 'includes/admin/admin-settings.php');
        new \MoneybagPlugin\Admin\AdminSettings();
    }
    
    public function register_widgets() {
        if (class_exists('Elementor\Widget_Base')) {
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\SandboxFormWidget());
            \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPlugin\Widgets\PricingPlanWidget());
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
}

new MoneybagPlugin();