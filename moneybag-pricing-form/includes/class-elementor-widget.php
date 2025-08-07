<?php

namespace MoneyBag_Pricing_Form;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Elementor Pricing Form Widget
 */
class Elementor_Widget extends Widget_Base
{

    /**
     * Get widget name
     */
    public function get_name()
    {
        return 'moneybag-pricing-form';
    }

    /**
     * Get widget title
     */
    public function get_title()
    {
        return __('MoneyBag Pricing Form', 'moneybag-pricing-form');
    }

    /**
     * Get widget icon
     */
    public function get_icon()
    {
        return 'eicon-form-horizontal';
    }

    /**
     * Get widget categories
     */
    public function get_categories()
    {
        return ['general'];
    }

    /**
     * Get widget keywords
     */
    public function get_keywords()
    {
        return ['form', 'pricing', 'moneybag', 'contact'];
    }

    /**
     * Register widget controls
     */
    protected function register_controls()
    {
        // Content Tab
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'moneybag-pricing-form'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'form_title',
            [
                'label' => __('Form Title', 'moneybag-pricing-form'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Get Your Custom Quote', 'moneybag-pricing-form'),
                'placeholder' => __('Enter form title', 'moneybag-pricing-form'),
            ]
        );

        $this->add_control(
            'form_description',
            [
                'label' => __('Form Description', 'moneybag-pricing-form'),
                'type' => Controls_Manager::TEXTAREA,
                'default' => __('Tell us about your project and get a personalized quote.', 'moneybag-pricing-form'),
                'placeholder' => __('Enter form description', 'moneybag-pricing-form'),
            ]
        );

        $this->add_control(
            'success_message',
            [
                'label' => __('Success Message', 'moneybag-pricing-form'),
                'type' => Controls_Manager::TEXTAREA,
                'default' => __('Thank you! We\'ll get back to you within 24 hours.', 'moneybag-pricing-form'),
            ]
        );

        $this->end_controls_section();

        // Style Tab
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'moneybag-pricing-form'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'primary_color',
            [
                'label' => __('Primary Color', 'moneybag-pricing-form'),
                'type' => Controls_Manager::COLOR,
                'default' => '#007cba',
            ]
        );

        $this->add_control(
            'secondary_color',
            [
                'label' => __('Secondary Color', 'moneybag-pricing-form'),
                'type' => Controls_Manager::COLOR,
                'default' => '#f8f9fa',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render widget output
     */
    protected function render()
    {
        $settings = $this->get_settings_for_display();

        $widget_id = 'moneybag-form-' . $this->get_id();

?>
        <div id="<?php echo esc_attr($widget_id); ?>" class="moneybag-pricing-form-container">
            <div class="moneybag-pricing-form-loading">
                <div class="spinner"></div>
                <p><?php _e('Loading form...', 'moneybag-pricing-form'); ?></p>
            </div>
        </div>

        <script type="text/javascript">
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof MoneyBagPricingForm !== 'undefined') {
                    const settings = <?php echo json_encode($settings); ?>;
                    MoneyBagPricingForm.init('<?php echo esc_js($widget_id); ?>', settings);
                }
            });
        </script>
<?php
    }

    /**
     * Get script dependencies
     */
    public function get_script_depends()
    {
        return ['moneybag-pricing-form-widget'];
    }

    /**
     * Get style dependencies
     */
    public function get_style_depends()
    {
        return ['moneybag-pricing-form-widget', 'moneybag-pricing-form-styles'];
    }
}
