<?php

/**
 * Plugin Name: Moneybag Payment Gateway for WooCommerce
 * Plugin URI:  https://docs.moneybag.com.bd
 * Description: Official Moneybag Payment Gateway for WooCommerce.
 * Version:     2.0.1
 * Author:      Sakib ISlam
 * Author URI:  https://github.com/IslamSakib
 * License:     MIT
 * Text Domain: moneybag-woocommerce
 * Domain Path: /languages
 * WC requires at least: 5.0
 * WC tested up to: 9.0
 */

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// Declare HPOS compatibility on the 'before_woocommerce_init' hook.
// This is explicitly recommended by WooCommerce for plugins.
add_action('before_woocommerce_init', function () {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

/**
 * Hook into 'woocommerce_loaded' to ensure WooCommerce is fully loaded before our plugin.
 * This is the correct place to include classes that depend on WooCommerce.
 */
add_action('woocommerce_loaded', 'moneybag_woocommerce_gateway_init');

function moneybag_woocommerce_gateway_init()
{
    // Check if WC_Payment_Gateway exists. If not, WooCommerce is not active or fully loaded.
    // In this case, don't try to register the gateway, but allow the file to be included.
    // The conditional return should only prevent the gateway from being registered, not included.
    if (! class_exists('WooCommerce')) { // Even better: check for WooCommerce itself
        return;
    }

    // Include the main gateway class here. It should always be included once WooCommerce is active.
    require_once plugin_dir_path(__FILE__) . 'includes/class-wc-gateway-moneybag.php';

    // Include SDK classes (adjust paths as needed within your includes/moneybag-sdk directory)
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/MoneybagSdk.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/HttpClient.php';

    // Include SDK Exception classes
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Exceptions/MoneybagException.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Exceptions/AuthenticationException.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Exceptions/ValidationException.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Exceptions/ApiException.php';

    // Include SDK Request/Response Model classes
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Models/Request/CheckoutRequest.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Models/Request/Customer.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Models/Request/Shipping.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Models/Request/OrderItem.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Models/Request/PaymentInfo.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Models/Response/CheckoutResponse.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Models/Response/VerifyResponse.php';
    require_once plugin_dir_path(__FILE__) . 'includes/moneybag-sdk/Models/Response/RefundResponse.php'; // Make sure this is also included


    /**
     * Add Moneybag Gateway to WooCommerce.
     *
     * @param array $methods Existing payment methods.
     * @return array
     */
    function moneybag_add_woocommerce_gateway($methods)
    {
        // Only add the gateway if WC_Payment_Gateway class exists (meaning WooCommerce is ready)
        if (class_exists('WC_Payment_Gateway') && class_exists('WC_Gateway_Moneybag')) {
            $methods[] = 'WC_Gateway_Moneybag';
        }
        return $methods;
    }
    add_filter('woocommerce_payment_gateways', 'moneybag_add_woocommerce_gateway');

    /**
     * Register a custom query var for handling Moneybag callbacks.
     * This is crucial for your success_url, fail_url, cancel_url to be processed by your plugin.
     */
    function moneybag_add_query_vars($vars)
    {
        $vars[] = 'moneybag-callback';
        $vars[] = 'moneybag_order_id'; // To pass the order ID
        $vars[] = 'moneybag_transaction_id'; // To pass the transaction ID from Moneybag
        return $vars;
    }
    add_filter('query_vars', 'moneybag_add_query_vars');

    /**
     * Rewrite rules for handling Moneybag callbacks.
     * This ensures WordPress routes the custom URLs to your plugin.
     */
    function moneybag_rewrite_rules()
    {
        add_rewrite_rule(
            '^moneybag-payment-callback/?$',
            'index.php?moneybag-callback=1',
            'top'
        );
    }
    add_action('init', 'moneybag_rewrite_rules');

    /**
     * Flush rewrite rules on plugin activation to ensure the new rules are registered.
     */
    function moneybag_activation()
    {
        moneybag_rewrite_rules();
        flush_rewrite_rules();
    }
    register_activation_hook(__FILE__, 'moneybag_activation');

    /**
     * Flush rewrite rules on plugin deactivation.
     */
    function moneybag_deactivation()
    {
        flush_rewrite_rules();
    }
    register_deactivation_hook(__FILE__, 'moneybag_deactivation');

    /**
     * Handle the Moneybag payment callback.
     * This function will be triggered when Moneybag redirects back to your site.
     */
    function moneybag_handle_callback()
    {
        global $wp_query;

        // Ensure WC_Gateway_Moneybag is available before trying to instantiate it
        if (isset($wp_query->query_vars['moneybag-callback']) && class_exists('WC_Gateway_Moneybag')) {
            $gateway = new WC_Gateway_Moneybag(); // Instantiate your gateway to access its methods.
            $gateway->handle_moneybag_response();
            exit; // Prevent further WordPress loading.
        }
    }
    add_action('template_redirect', 'moneybag_handle_callback'); // Use template_redirect for earlier execution.
}

/**
 * Registers WooCommerce Blocks integration.
 */
add_action( 'woocommerce_blocks_loaded', 'moneybag_woocommerce_blocks_support' );

function moneybag_woocommerce_blocks_support() {
    if ( class_exists( 'Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
        require_once plugin_dir_path( __FILE__ ) . 'includes/blocks/class-wc-moneybag-blocks-support.php';
        add_action(
            'woocommerce_blocks_payment_method_type_registration',
            function( Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry $payment_method_registry ) {
                $payment_method_registry->register( new WC_Moneybag_Blocks_Support() );
            }
        );
    }
}

/**
 * Force classic checkout for better compatibility
 */
add_filter( 'woocommerce_checkout_is_block_default', '__return_false' );

/**
 * Plugin activation hook
 */
register_activation_hook(__FILE__, 'moneybag_activate');
function moneybag_activate() {
    // Set flag to flush rewrite rules
    update_option('moneybag_flush_rewrite_rules', true);
    
    // Add the rewrite rule
    add_rewrite_rule('^moneybag-payment-callback/?$', 'index.php?moneybag_callback=1', 'top');
    
    // Also add query var
    add_filter('query_vars', function($vars) {
        $vars[] = 'moneybag_callback';
        return $vars;
    });
    
    flush_rewrite_rules();
}

/**
 * Plugin deactivation hook
 */
register_deactivation_hook(__FILE__, 'moneybag_deactivate');
function moneybag_deactivate() {
    // Flush rewrite rules to remove our custom rule
    flush_rewrite_rules();
}
