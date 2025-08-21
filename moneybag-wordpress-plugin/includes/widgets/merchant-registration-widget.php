<?php
namespace MoneybagPlugin\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if (!defined('ABSPATH')) {
    exit;
}

class MerchantRegistrationWidget extends Widget_Base {
    
    public function get_name() {
        return 'moneybag-merchant-registration';
    }
    
    public function get_title() {
        return __('Moneybag Merchant Registration', 'moneybag-plugin');
    }
    
    public function get_icon() {
        return 'eicon-form-horizontal';
    }
    
    public function get_categories() {
        return ['moneybag'];
    }
    
    public function get_keywords() {
        return ['moneybag', 'merchant', 'registration', 'business', 'form'];
    }
    
    public function get_script_depends() {
        return ['jquery', 'moneybag-merchant-registration'];
    }
    
    public function get_style_depends() {
        return ['moneybag-merchant-registration'];
    }
    
    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Form Settings', 'moneybag-plugin'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'form_title',
            [
                'label' => __('Form Title', 'moneybag-plugin'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Merchant Registration', 'moneybag-plugin'),
                'placeholder' => __('Enter form title', 'moneybag-plugin'),
            ]
        );
        
        $this->add_control(
            'api_base_url',
            [
                'label' => __('API Base URL', 'moneybag-plugin'),
                'type' => Controls_Manager::TEXT,
                'default' => 'https://api.moneybag.com.bd/api/v2',
                'placeholder' => __('API base URL', 'moneybag-plugin'),
            ]
        );
        
        $this->add_control(
            'redirect_url',
            [
                'label' => __('Success Redirect URL', 'moneybag-plugin'),
                'type' => Controls_Manager::TEXT,
                'default' => '',
                'placeholder' => __('Enter redirect URL after successful registration', 'moneybag-plugin'),
            ]
        );
        
        $this->add_control(
            'enable_captcha',
            [
                'label' => __('Enable reCAPTCHA', 'moneybag-plugin'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'moneybag-plugin'),
                'label_off' => __('No', 'moneybag-plugin'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );
        
        $this->end_controls_section();
        
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
                'default' => '#1f2937',
                'selectors' => [
                    '{{WRAPPER}} .merchant-form-container .btn-primary' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .merchant-form-container .progress-bar-fill' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .merchant-form-container .step-current .step-number' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .merchant-form-container .step-current .step-title' => 'color: {{VALUE}};',
                ],
            ]
        );
        
        $this->add_control(
            'success_color',
            [
                'label' => __('Success Color', 'moneybag-plugin'),
                'type' => Controls_Manager::COLOR,
                'default' => '#10b981',
                'selectors' => [
                    '{{WRAPPER}} .merchant-form-container .step-completed .step-number' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .merchant-form-container .step-completed .step-title' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .merchant-form-container .success-message' => 'background-color: {{VALUE}};',
                ],
            ]
        );
        
        $this->add_control(
            'error_color',
            [
                'label' => __('Error/Required Color', 'moneybag-plugin'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ef4444',
                'selectors' => [
                    '{{WRAPPER}} .merchant-form-container .step-current.incomplete .step-number' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .merchant-form-container .error-message' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .merchant-form-container .required-indicator' => 'color: {{VALUE}};',
                ],
            ]
        );
        
        $this->add_control(
            'warning_color',
            [
                'label' => __('Warning Color', 'moneybag-plugin'),
                'type' => Controls_Manager::COLOR,
                'default' => '#f59e0b',
                'selectors' => [
                    '{{WRAPPER}} .merchant-form-container .step-incomplete .step-number' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .merchant-form-container .warning-message' => 'color: {{VALUE}};',
                ],
            ]
        );
        
        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'form_typography',
                'label' => __('Typography', 'moneybag-plugin'),
                'selector' => '{{WRAPPER}} .merchant-form-container',
            ]
        );
        
        $this->add_control(
            'form_background',
            [
                'label' => __('Form Background', 'moneybag-plugin'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .merchant-form-container .form-card' => 'background-color: {{VALUE}};',
                ],
            ]
        );
        
        $this->add_control(
            'border_radius',
            [
                'label' => __('Border Radius', 'moneybag-plugin'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'default' => [
                    'top' => 8,
                    'right' => 8,
                    'bottom' => 8,
                    'left' => 8,
                    'unit' => 'px'
                ],
                'selectors' => [
                    '{{WRAPPER}} .merchant-form-container .form-card' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        
        $this->end_controls_section();
    }
    
    protected function render() {
        $settings = $this->get_settings_for_display();
        
        $widget_id = $this->get_id();
        $form_config = [
            'widget_id' => $widget_id,
            'redirect_url' => !empty($settings['redirect_url']) ? $settings['redirect_url'] : '',
            'form_title' => !empty($settings['form_title']) ? $settings['form_title'] : __('Merchant Registration', 'moneybag-plugin'),
            'primary_color' => !empty($settings['primary_color']) ? $settings['primary_color'] : '#1f2937',
            'success_color' => !empty($settings['success_color']) ? $settings['success_color'] : '#10b981',
            'error_color' => !empty($settings['error_color']) ? $settings['error_color'] : '#ef4444',
            'warning_color' => !empty($settings['warning_color']) ? $settings['warning_color'] : '#f59e0b',
            'enable_captcha' => $settings['enable_captcha'] === 'yes',
            'recaptcha_site_key' => get_option('moneybag_recaptcha_site_key', ''),
            'plugin_url' => MONEYBAG_PLUGIN_URL
        ];
        ?>
        <div class="moneybag-merchant-form-wrapper" data-config='<?php echo esc_attr(json_encode($form_config)); ?>'>
            <div id="moneybag-merchant-form-<?php echo esc_attr($widget_id); ?>">
                <div class="moneybag-loading">
                    <div class="loading-spinner"></div>
                    <p><?php echo __('Loading merchant registration form...', 'moneybag-plugin'); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
    
    protected function content_template() {
        ?>
        <div class="moneybag-merchant-form-wrapper">
            <div class="merchant-form-preview">
                <h3>{{ settings.form_title }}</h3>
                <p><?php echo __('Moneybag Merchant Registration Form Preview - This will render the React component on frontend', 'moneybag-plugin'); ?></p>
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.08);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <div style="background: #1f2937; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">1</div>
                            <div style="background: #e5e7eb; color: #6b7280; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">2</div>
                            <div style="background: #e5e7eb; color: #6b7280; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">3</div>
                            <div style="background: #e5e7eb; color: #6b7280; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">4</div>
                        </div>
                        <p style="color: #6b7280; margin: 0; font-size: 14px;"><?php echo __('Multi-step merchant registration form will appear here', 'moneybag-plugin'); ?></p>
                        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;"><?php echo __('Business Info → Online Presence → Point of Contact → Documents', 'moneybag-plugin'); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}