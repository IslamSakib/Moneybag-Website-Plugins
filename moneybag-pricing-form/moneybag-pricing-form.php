<?php

/**
 * Plugin Name: MoneyBag Pricing Form
 * Plugin URI: https://your-website.com/moneybag-pricing-form
 * Description: A multi-step pricing form widget for Elementor with React-powered frontend
 * Version: 1.0.0
 * Author: Sakib Islam
 * Author URI: https://your-website.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: moneybag-pricing-form
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.3
 * Requires PHP: 7.4
 * Elementor tested up to: 3.15.0
 * Elementor Pro tested up to: 3.15.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MONEYBAG_PRICING_FORM_VERSION', '1.0.0');
define('MONEYBAG_PRICING_FORM_FILE', __FILE__);
define('MONEYBAG_PRICING_FORM_PATH', plugin_dir_path(__FILE__));
define('MONEYBAG_PRICING_FORM_URL', plugin_dir_url(__FILE__));
define('MONEYBAG_PRICING_FORM_ASSETS_URL', MONEYBAG_PRICING_FORM_URL . 'assets/');

/**
 * Main plugin class
 */
final class MoneyBag_Pricing_Form
{

    /**
     * Plugin instance
     */
    private static $_instance = null;

    /**
     * Singleton instance
     */
    public static function instance()
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }

    /**
     * Constructor
     */
    private function __construct()
    {
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks()
    {
        add_action('plugins_loaded', [$this, 'init']);
        add_action('elementor/widgets/widgets_registered', [$this, 'init_widgets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('elementor/frontend/after_register_scripts', [$this, 'register_widget_scripts']);
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
    }

    /**
     * Initialize plugin
     */
    public function init()
    {
        // Load textdomain
        load_plugin_textdomain('moneybag-pricing-form', false, dirname(plugin_basename(__FILE__)) . '/languages');

        // Check if Elementor is active
        if (!did_action('elementor/loaded')) {
            add_action('admin_notices', [$this, 'admin_notice_missing_elementor']);
            return;
        }

        // Check Elementor version
        if (!version_compare(ELEMENTOR_VERSION, '3.0.0', '>=')) {
            add_action('admin_notices', [$this, 'admin_notice_minimum_elementor_version']);
            return;
        }

        // Include base plugin files (NOT the widget class yet)
        $this->includes();
    }

    /**
     * Include required files
     */
    private function includes()
    {
        // Only include the plugin class here, NOT the widget class
        require_once MONEYBAG_PRICING_FORM_PATH . 'includes/class-plugin.php';
        // Widget class will be loaded in init_widgets() when Elementor is ready
    }

    /**
     * Initialize widgets - FIXED: Include widget class here when Elementor is ready
     */
    public function init_widgets()
    {
        // Now it's safe to include the widget class
        require_once MONEYBAG_PRICING_FORM_PATH . 'includes/class-elementor-widget.php';

        // Register the widget
        \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneyBag_Pricing_Form\Elementor_Widget());
    }

    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts()
    {
        // Enqueue React and ReactDOM from CDN for better performance
        wp_enqueue_script('react', 'https://unpkg.com/react@18/umd/react.production.min.js', [], '18.0.0', true);
        wp_enqueue_script('react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', ['react'], '18.0.0', true);
    }

    /**
     * Register widget scripts
     */
    public function register_widget_scripts()
    {
        wp_register_script(
            'moneybag-pricing-form-widget',
            MONEYBAG_PRICING_FORM_ASSETS_URL . 'js/dist/form-widget.js',
            ['react', 'react-dom'],
            MONEYBAG_PRICING_FORM_VERSION,
            true
        );

        wp_register_style(
            'moneybag-pricing-form-widget',
            MONEYBAG_PRICING_FORM_ASSETS_URL . 'js/dist/form-widget.css',
            [],
            MONEYBAG_PRICING_FORM_VERSION
        );

        wp_register_style(
            'moneybag-pricing-form-styles',
            MONEYBAG_PRICING_FORM_ASSETS_URL . 'css/widget-styles.css',
            [],
            MONEYBAG_PRICING_FORM_VERSION
        );

        // Localize script for AJAX
        wp_localize_script('moneybag-pricing-form-widget', 'moneyBagAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_pricing_form_nonce'),
        ]);
    }

    /**
     * Admin notice - Missing Elementor
     */
    public function admin_notice_missing_elementor()
    {
        if (isset($_GET['activate'])) unset($_GET['activate']);

        $message = sprintf(
            esc_html__('"%1$s" requires "%2$s" to be installed and activated.', 'moneybag-pricing-form'),
            '<strong>' . esc_html__('MoneyBag Pricing Form', 'moneybag-pricing-form') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'moneybag-pricing-form') . '</strong>'
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

    /**
     * Admin notice - Minimum Elementor version
     */
    public function admin_notice_minimum_elementor_version()
    {
        if (isset($_GET['activate'])) unset($_GET['activate']);

        $message = sprintf(
            esc_html__('"%1$s" requires "%2$s" version %3$s or greater.', 'moneybag-pricing-form'),
            '<strong>' . esc_html__('MoneyBag Pricing Form', 'moneybag-pricing-form') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'moneybag-pricing-form') . '</strong>',
            '3.0.0'
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

    /**
     * Plugin activation
     */
    public function activate()
    {
        // Create necessary database tables or options if needed
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate()
    {
        flush_rewrite_rules();
    }
}

// Initialize plugin
MoneyBag_Pricing_Form::instance();
