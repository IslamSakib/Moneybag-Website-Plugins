<?php
/**
 * Plugin Name: MoneyBag Multirole Plugin
 * Plugin URI: https://moneybag.com.bd
 * Description: Comprehensive plugin with Merchant Registration, Pricing Forms, and Multi-Step Forms for Elementor
 * Version: 1.0.0
 * Author: Sakib Islam
 * Author URI: https://moneybag.com.bd
 * Text Domain: moneybag-multirole
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.2
 * Elementor tested up to: 3.16.0
 * Elementor Pro tested up to: 3.16.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MONEYBAG_MULTIROLE_VERSION', '1.0.0');
define('MONEYBAG_MULTIROLE_FILE', __FILE__);
define('MONEYBAG_MULTIROLE_PATH', plugin_dir_path(__FILE__));
define('MONEYBAG_MULTIROLE_URL', plugin_dir_url(__FILE__));
define('MONEYBAG_MULTIROLE_BASENAME', plugin_basename(__FILE__));

// Include the main plugin class
require_once MONEYBAG_MULTIROLE_PATH . 'includes/class-moneybag-multirole.php';

// Initialize the plugin
function moneybag_multirole_init() {
    return MoneyBagMultirole::instance();
}

// Start the plugin
add_action('plugins_loaded', 'moneybag_multirole_init');

// Activation hook
register_activation_hook(__FILE__, ['MoneyBagMultirole', 'activate']);

// Deactivation hook
register_deactivation_hook(__FILE__, ['MoneyBagMultirole', 'deactivate']);