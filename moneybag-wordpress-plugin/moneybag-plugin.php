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
}

new MoneybagPlugin();