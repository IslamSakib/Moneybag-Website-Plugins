<?php

namespace MoneybagPlugin\Widgets;

use Elementor\Widget_Base;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Price Comparison Calculator Widget
 *
 * JS init pattern (from price-comparison-calculator.js):
 *  - Queries all elements matching [id^="price-comparison-calculator-"]
 *  - Reads config from window.MoneybagPriceCalculatorConfig[widgetId]
 *  - Renders <PriceComparisonCalculator config={parsedConfig} /> into the container
 */
class PriceComparisonCalculatorWidget extends Widget_Base
{
    public function get_name()
    {
        return 'moneybag-price-comparison-calculator';
    }

    public function get_title()
    {
        return __('Moneybag Price Comparison Calculator', 'moneybag-plugin');
    }

    public function get_icon()
    {
        return 'eicon-counter';
    }

    public function get_categories()
    {
        return ['moneybag'];
    }

    public function get_keywords()
    {
        return ['moneybag', 'price', 'calculator', 'comparison', 'payment'];
    }

    /**
     * Tells Elementor to load price-comparison-calculator.js only on pages with this widget.
     * Handle registered in class-moneybag-assets.php.
     */
    public function get_script_depends()
    {
        return ['moneybag-price-calculator'];
    }

    /**
     * Tells Elementor to load moneybag-global.css only on pages with this widget.
     * Handle registered in class-moneybag-assets.php.
     */
    public function get_style_depends()
    {
        return ['moneybag-global'];
    }

    protected function register_controls()
    {
        // No controls needed
    }

    protected function render()
    {
        $widget_id = $this->get_id();

        $config = [
            'widget_id'          => $widget_id,
            'ajax_url'           => admin_url('admin-ajax.php'),
            'plugin_url'         => MONEYBAG_PLUGIN_URL,
            'recaptcha_site_key' => get_option('moneybag_recaptcha_site_key', ''),
            'nonce_type'         => 'calculator',
        ];
?>
        <div class="moneybag-calculator-wrapper">
            <div id="price-comparison-calculator-<?php echo esc_attr($widget_id); ?>"></div>
        </div>

        <script type="text/javascript">
            // price-comparison-calculator.js reads config from
            // window.MoneybagPriceCalculatorConfig[widgetId]
            window.MoneybagPriceCalculatorConfig = window.MoneybagPriceCalculatorConfig || {};
            window.MoneybagPriceCalculatorConfig[<?php echo wp_json_encode($widget_id); ?>] = <?php echo wp_json_encode($config); ?>;
        </script>
    <?php
    }

    protected function content_template()
    {
    ?>
        <div class="moneybag-calculator-wrapper">
            <div class="moneybag-widget-placeholder">
                <div class="moneybag-widget-placeholder-inner">
                    <p class="moneybag-widget-placeholder-text"><?php echo __('Price Comparison Calculator will appear here', 'moneybag-plugin'); ?></p>
                </div>
            </div>
        </div>
<?php
    }
}
