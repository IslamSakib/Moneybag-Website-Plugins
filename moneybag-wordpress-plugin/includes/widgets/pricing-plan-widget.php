<?php
namespace MoneybagPlugin\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if (!defined('ABSPATH')) {
    exit;
}

class PricingPlanWidget extends Widget_Base {
    
    public function get_name() {
        return 'moneybag-pricing-plan';
    }
    
    public function get_title() {
        return __('Moneybag Pricing Plan', 'moneybag-plugin');
    }
    
    public function get_icon() {
        return 'eicon-price-list';
    }
    
    public function get_categories() {
        return ['moneybag'];
    }
    
    public function get_keywords() {
        return ['moneybag', 'pricing', 'plan', 'consultation'];
    }
    
    public function get_script_depends() {
        return ['moneybag-pricing-plan'];
    }
    
    public function get_style_depends() {
        return ['moneybag-global'];
    }
    
    protected function register_controls() {
        // No controls needed - widget uses global styles
    }
    
    protected function render() {
        $widget_id = $this->get_id();
        $form_config = [
            'widget_id' => !empty($widget_id) ? $widget_id : 'default',
            'form_title' => __('Pricing & Requirements', 'moneybag-plugin'),
            'success_redirect_url' => get_option('moneybag_default_redirect_url', ''),
            'consultation_duration' => 15,
            'opportunity_name' => get_option('moneybag_crm_opportunity_name', 'Payment Gateway – merchant onboarding'),
            'primary_color' => '#ff6b6b',
            'recaptcha_site_key' => get_option('moneybag_recaptcha_site_key', '')
        ];
        ?>
        <div class="moneybag-pricing-plan-wrapper" data-config='<?php echo esc_attr(json_encode($form_config)); ?>'>
            <div id="moneybag-pricing-plan-<?php echo esc_attr($widget_id); ?>">
            </div>
        </div>
        <?php
    }
    
    protected function content_template() {
        ?>
        <div class="moneybag-pricing-plan-wrapper">
            <div class="pricing-plan-preview">
                <h3><?php echo __('Pricing & Requirements', 'moneybag-plugin'); ?></h3>
                <p><?php echo __('Moneybag Pricing Plan Form Preview - Multi-step consultation form will appear here', 'moneybag-plugin'); ?></p>
                <div class="moneybag-widget-placeholder moneybag-widget-placeholder-pricing">
                    <div class="moneybag-widget-placeholder-inner">
                        <p class="moneybag-widget-placeholder-text"><?php echo __('4-Step Pricing & Consultation Form', 'moneybag-plugin'); ?></p>
                        <p class="moneybag-widget-placeholder-subtext"><?php echo __('Dynamic pricing based on business requirements', 'moneybag-plugin'); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}