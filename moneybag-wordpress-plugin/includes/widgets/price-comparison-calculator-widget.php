<?php
namespace MoneybagPlugin\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if (!defined('ABSPATH')) {
    exit;
}

class PriceComparisonCalculatorWidget extends Widget_Base {
    
    public function get_name() {
        return 'moneybag-price-comparison-calculator';
    }
    
    public function get_title() {
        return __('Price Comparison Calculator', 'moneybag-plugin');
    }
    
    public function get_icon() {
        return 'eicon-calculator';
    }
    
    public function get_categories() {
        return ['moneybag'];
    }
    
    public function get_keywords() {
        return ['moneybag', 'calculator', 'price', 'comparison', 'savings'];
    }
    
    public function get_script_depends() {
        return ['moneybag-price-comparison-calculator'];
    }
    
    public function get_style_depends() {
        return ['moneybag-global'];
    }
    
    protected function register_controls() {
        // No controls needed - widget uses global styles
        // Following the pattern of other Moneybag widgets
    }
    
    protected function render() {
        $widget_id = $this->get_id();
        $calculator_config = [
            'widget_id' => !empty($widget_id) ? $widget_id : 'default',
            'default_volume' => 1000000,
            'default_gateway' => 'sslcommerz',
            'api_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_nonce'),
            'pluginUrl' => MONEYBAG_PLUGIN_URL,
            'gateway_presets' => [
                'sslcommerz' => [
                    'bkash' => 1.85, 
                    'nagad' => 1.85, 
                    'rocket' => 1.85, 
                    'upay' => 1.85,
                    'visa' => 2.5, 
                    'mastercard' => 2.5, 
                    'american_express' => 3.5, 
                    'diners_club' => 2.75, 
                    'unionpay' => 2.75, 
                    'dbbl_nexus' => 2.3,
                    'card' => 2.5
                ],
                'shurjopay' => [
                    'bkash' => 1.8, 
                    'nagad' => 1.8, 
                    'rocket' => 1.8, 
                    'upay' => 1.8,
                    'visa' => 2.45, 
                    'mastercard' => 2.45, 
                    'american_express' => 3.45, 
                    'diners_club' => 2.7, 
                    'unionpay' => 2.7, 
                    'dbbl_nexus' => 2.25,
                    'card' => 2.45
                ],
                'aamarpay' => [
                    'bkash' => 1.9, 
                    'nagad' => 1.9, 
                    'rocket' => 1.9, 
                    'upay' => 1.9,
                    'visa' => 2.55, 
                    'mastercard' => 2.55, 
                    'american_express' => 3.55, 
                    'diners_club' => 2.8, 
                    'unionpay' => 2.8, 
                    'dbbl_nexus' => 2.35,
                    'card' => 2.55
                ],
                'portwallet' => [
                    'bkash' => 1.85, 
                    'nagad' => 1.85, 
                    'rocket' => 1.85, 
                    'upay' => 1.85,
                    'visa' => 2.5, 
                    'mastercard' => 2.5, 
                    'american_express' => 3.5, 
                    'diners_club' => 2.75, 
                    'unionpay' => 2.75, 
                    'dbbl_nexus' => 2.3,
                    'card' => 2.5
                ],
                'paywell' => [
                    'bkash' => 1.95, 
                    'nagad' => 1.95, 
                    'rocket' => 1.95, 
                    'upay' => 1.95,
                    'visa' => 2.6, 
                    'mastercard' => 2.6, 
                    'american_express' => 3.6, 
                    'diners_club' => 2.85, 
                    'unionpay' => 2.85, 
                    'dbbl_nexus' => 2.4,
                    'card' => 2.6
                ],
                'ekpay' => [
                    'bkash' => 1.85, 
                    'nagad' => 1.85, 
                    'rocket' => 1.85, 
                    'upay' => 1.85,
                    'visa' => 2.45, 
                    'mastercard' => 2.45, 
                    'american_express' => 3.45, 
                    'diners_club' => 2.7, 
                    'unionpay' => 2.7, 
                    'dbbl_nexus' => 2.25,
                    'card' => 2.45
                ],
                'okwallet' => [
                    'bkash' => 1.9, 
                    'nagad' => 1.9, 
                    'rocket' => 1.9, 
                    'upay' => 1.9,
                    'visa' => 2.55, 
                    'mastercard' => 2.55, 
                    'american_express' => 3.55, 
                    'diners_club' => 2.8, 
                    'unionpay' => 2.8, 
                    'dbbl_nexus' => 2.35,
                    'card' => 2.55
                ],
                'tap' => [
                    'bkash' => 1.8, 
                    'nagad' => 1.8, 
                    'rocket' => 1.8, 
                    'upay' => 1.8,
                    'visa' => 2.4, 
                    'mastercard' => 2.4, 
                    'american_express' => 3.4, 
                    'diners_club' => 2.65, 
                    'unionpay' => 2.65, 
                    'dbbl_nexus' => 2.2,
                    'card' => 2.4
                ],
                'dmoney' => [
                    'bkash' => 1.85, 
                    'nagad' => 1.85, 
                    'rocket' => 1.85, 
                    'upay' => 1.85,
                    'visa' => 2.5, 
                    'mastercard' => 2.5, 
                    'american_express' => 3.5, 
                    'diners_club' => 2.75, 
                    'unionpay' => 2.75, 
                    'dbbl_nexus' => 2.3,
                    'card' => 2.5
                ]
            ],
            'moneybag_rates' => [
                'bkash' => 1.75, 
                'visa' => 2.1, 
                'nagad' => 1.6, 
                'card' => 2.1,
                'rocket' => 1.8,
                'upay' => 1.5,
                'mastercard' => 2.1,
                'american_express' => 3.3,
                'dbbl_nexus' => 2.0,
                'diners_club' => 2.3,
                'unionpay' => 2.3
            ]
        ];
        ?>
        <div id="price-comparison-calculator-<?php echo esc_attr($widget_id); ?>" 
             class="moneybag-price-calculator-container"
             data-config='<?php echo esc_attr(json_encode($calculator_config)); ?>'>
            <!-- React component will be mounted here -->
        </div>
        
        <script type="text/javascript">
            if (typeof window.MoneybagPriceCalculatorConfig === 'undefined') {
                window.MoneybagPriceCalculatorConfig = {};
            }
            window.MoneybagPriceCalculatorConfig['<?php echo esc_js($widget_id); ?>'] = <?php echo json_encode($calculator_config); ?>;
        </script>
        <?php
    }
    
    protected function content_template() {
        // Template for Elementor editor preview
        ?>
        <div class="moneybag-price-calculator-container">
            <div class="calculator-preview">
                <h3><?php echo __('Price Comparison Calculator', 'moneybag-plugin'); ?></h3>
                <p><?php echo __('Calculator will be displayed here', 'moneybag-plugin'); ?></p>
            </div>
        </div>
        <?php
    }
}