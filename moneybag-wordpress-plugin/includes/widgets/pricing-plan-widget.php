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
        return ['moneybag-pricing-plan'];
    }
    
    protected function register_controls() {
        
        
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Form Style', 'moneybag-plugin'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
        
        $this->add_control(
            'primary_color',
            [
                'label' => __('Primary Color', 'moneybag-plugin'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ff6b6b',
                'selectors' => [
                    '{{WRAPPER}} .pricing-plan-container .primary-button' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .pricing-plan-container .highlight' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .pricing-plan-container .card-header' => 'color: {{VALUE}};',
                ],
            ]
        );
        
        $this->add_control(
            'background_gradient',
            [
                'label' => __('Background Gradient', 'moneybag-plugin'),
                'type' => Controls_Manager::COLOR,
                'default' => '#f5f0f5',
                'selectors' => [
                    '{{WRAPPER}} .pricing-plan-container' => 'background: linear-gradient(135deg, {{VALUE}} 0%, #e8f4ff 100%);',
                ],
            ]
        );
        
        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'form_typography',
                'label' => __('Typography', 'moneybag-plugin'),
                'selector' => '{{WRAPPER}} .pricing-plan-container',
            ]
        );
        
        $this->end_controls_section();
    }
    
    protected function render() {
        $settings = $this->get_settings_for_display();
        
        $widget_id = $this->get_id();
        $form_config = [
            'widget_id' => !empty($widget_id) ? $widget_id : 'default',
            'form_title' => __('Pricing & Requirements', 'moneybag-plugin'),
            'crm_api_url' => get_option('moneybag_crm_api_url', 'https://crm.dummy-dev.tubeonai.com/rest'),
            'crm_api_key' => get_option('moneybag_crm_api_key', ''),
            'success_redirect_url' => get_option('moneybag_default_redirect_url', ''),
            'consultation_duration' => 15,
            'opportunity_name' => get_option('moneybag_crm_opportunity_name', 'TubeOnAI – merchant onboarding'),
            'primary_color' => '#ff6b6b',
            'recaptcha_site_key' => get_option('moneybag_recaptcha_site_key', '6LdDuakrAAAAAMMfFGjW9-DiuqV7oqK2ElIXkqcx'),
            'recaptcha_secret_key' => get_option('moneybag_recaptcha_secret_key', '6LdDuakrAAAAAByGOiQI6oPujSh-3v2g1G931sdL')
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
                <h3>{{ settings.form_title }}</h3>
                <p><?php echo __('Moneybag Pricing Plan Form Preview - Multi-step consultation form will appear here', 'moneybag-plugin'); ?></p>
                <div style="background: linear-gradient(135deg, #f5f0f5 0%, #e8f4ff 100%); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                        <p style="color: #4a5568; margin: 0; font-size: 16px;"><?php echo __('4-Step Pricing & Consultation Form', 'moneybag-plugin'); ?></p>
                        <p style="color: #718096; margin: 8px 0 0 0; font-size: 14px;"><?php echo __('Dynamic pricing based on business requirements', 'moneybag-plugin'); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}