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
            'default_volume' => 100000,
            'default_gateway' => 'sslcommerz',
            'api_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_nonce'),
            'pluginUrl' => MONEYBAG_PLUGIN_URL,
            'gateway_presets' => [
                'sslcommerz' => ['bkash' => 2.0, 'visa' => 2.45, 'nagad' => 1.85],
                'bkash' => ['bkash' => 1.85, 'visa' => 2.5, 'nagad' => 1.9],
                'shurjopay' => ['bkash' => 1.95, 'visa' => 2.4, 'nagad' => 1.8],
                'aamarpay' => ['bkash' => 2.1, 'visa' => 2.55, 'nagad' => 1.95]
            ],
            'moneybag_rates' => ['bkash' => 1.75, 'visa' => 2.1, 'nagad' => 1.6]
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