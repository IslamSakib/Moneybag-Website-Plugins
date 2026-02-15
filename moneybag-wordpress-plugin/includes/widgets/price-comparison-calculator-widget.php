<?php

namespace MoneybagPlugin\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if (!defined('ABSPATH')) {
    exit;
}

class PriceComparisonCalculatorWidget extends Widget_Base
{

    public function get_name()
    {
        return 'moneybag-price-comparison-calculator';
    }

    public function get_title()
    {
        return __('Price Comparison Calculator', 'moneybag-plugin');
    }

    public function get_icon()
    {
        return 'eicon-calculator';
    }

    public function get_categories()
    {
        return ['moneybag'];
    }

    public function get_keywords()
    {
        return ['moneybag', 'calculator', 'price', 'comparison', 'savings'];
    }

    public function get_script_depends()
    {
        return ['moneybag-price-comparison-calculator'];
    }

    public function get_style_depends()
    {
        return ['moneybag-global'];
    }

    protected function register_controls()
    {
        // No controls needed - widget uses global styles
        // Following the pattern of other Moneybag widgets
    }

    protected function render()
    {
        $widget_id = $this->get_id();
        // Version should match pricing-rules.json version
        $pricing_version = '1.4';

        $calculator_config = [
            'widget_id' => !empty($widget_id) ? $widget_id : 'default',
            'default_volume' => 1000000,
            'default_gateway' => 'sslcommerz',
            'api_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_nonce'),
            'pluginUrl' => MONEYBAG_PLUGIN_URL,
            'pricingVersion' => $pricing_version,
            'gateway_presets' => [
                'sslcommerz' => [ // Updated competitor rates: Moneybag + 0.30
                    'bkash' => 2.25,
                    'nagad' => 2.1,
                    'rocket' => 2.3,
                    'upay' => 2.0,
                    'visa' => 2.6,
                    'mastercard' => 2.6,
                    'american_express' => 3.8,
                    'diners_club' => 2.8,
                    'unionpay' => 2.8,
                    'dbbl_nexus' => 2.5,
                    'card' => 2.6
                ]
            ],
            'moneybag_rates' => [ // Moneybag rates (from previous step)
                'bkash' => 1.95,
                'visa' => 2.3,
                'nagad' => 1.8,
                'card' => 2.3,
                'rocket' => 2.0,
                'upay' => 1.7,
                'mastercard' => 2.3,
                'american_express' => 3.5,
                'dbbl_nexus' => 2.2,
                'diners_club' => 2.5,
                'unionpay' => 2.5
            ]
        ];
?>
        <div id="price-comparison-calculator-<?php echo esc_attr($widget_id); ?>"
            class="moneybag-price-calculator-container"
            data-config='<?php echo esc_attr(json_encode($calculator_config)); ?>'>
        </div>

        <script type="text/javascript">
            if (typeof window.MoneybagPriceCalculatorConfig === 'undefined') {
                window.MoneybagPriceCalculatorConfig = {};
            }
            window.MoneybagPriceCalculatorConfig['<?php echo esc_js($widget_id); ?>'] = <?php echo json_encode($calculator_config); ?>;
        </script>
    <?php
    }

    protected function content_template()
    {
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
