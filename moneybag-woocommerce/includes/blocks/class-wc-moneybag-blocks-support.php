<?php
/**
 * Moneybag payment method integration for WooCommerce Blocks
 */

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

final class WC_Moneybag_Blocks_Support extends AbstractPaymentMethodType {
    /**
     * Payment method name/id/slug.
     *
     * @var string
     */
    protected $name = 'moneybag';

    /**
     * Initializes the payment method type.
     */
    public function initialize() {
        $this->settings = get_option( 'woocommerce_moneybag_settings', [] );
    }

    /**
     * Returns if this payment method should be active. If false, the scripts will not be enqueued.
     *
     * @return boolean
     */
    public function is_active() {
        return ! empty( $this->settings['enabled'] ) && 'yes' === $this->settings['enabled'];
    }

    /**
     * Returns an array of scripts/handles to be registered for this payment method.
     *
     * @return array
     */
    public function get_payment_method_script_handles() {
        $script_asset_path = plugin_dir_path( dirname( __DIR__ ) ) . 'assets/js/blocks/moneybag-blocks.asset.php';
        $script_asset      = file_exists( $script_asset_path )
            ? require( $script_asset_path )
            : array(
                'dependencies' => array(),
                'version'      => '1.0.0'
            );
        $script_url        = plugin_dir_url( dirname( __DIR__ ) ) . 'assets/js/blocks/moneybag-blocks.js';

        wp_register_script(
            'wc-moneybag-blocks',
            $script_url,
            $script_asset['dependencies'],
            $script_asset['version'],
            true
        );

        if ( function_exists( 'wp_set_script_translations' ) ) {
            wp_set_script_translations( 'wc-moneybag-blocks', 'moneybag-woocommerce' );
        }

        return [ 'wc-moneybag-blocks' ];
    }

    /**
     * Returns an array of key=>value pairs of data made available to the payment methods script.
     *
     * @return array
     */
    public function get_payment_method_data() {
        return [
            'title'       => isset( $this->settings['title'] ) ? $this->settings['title'] : __( 'Moneybag Payment', 'moneybag-woocommerce' ),
            'description' => isset( $this->settings['description'] ) ? $this->settings['description'] : __( 'Pay with Moneybag', 'moneybag-woocommerce' ),
            'supports'    => [ 'products', 'refunds' ],
            'icon'        => plugin_dir_url( dirname( __DIR__ ) ) . 'assets/images/moneybag-icon.png',
        ];
    }
}