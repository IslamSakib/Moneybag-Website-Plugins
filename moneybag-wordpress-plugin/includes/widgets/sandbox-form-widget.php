<?php
namespace MoneybagPlugin\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if (!defined('ABSPATH')) {
    exit;
}

class SandboxFormWidget extends Widget_Base {
    
    public function get_name() {
        return 'moneybag-sandbox-form';
    }
    
    public function get_title() {
        return __('Moneybag Sandbox Form', 'moneybag-plugin');
    }
    
    public function get_icon() {
        return 'eicon-form-horizontal';
    }
    
    public function get_categories() {
        return ['moneybag'];
    }
    
    public function get_keywords() {
        return ['moneybag', 'form', 'sandbox', 'payment'];
    }
    
    public function get_script_depends() {
        return ['moneybag-sandbox-form'];
    }
    
    public function get_style_depends() {
        return ['moneybag-sandbox-form'];
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
                'default' => __('Sandbox Account Registration', 'moneybag-plugin'),
                'placeholder' => __('Enter form title', 'moneybag-plugin'),
            ]
        );
        
        $this->add_control(
            'api_base_url',
            [
                'label' => __('API Base URL', 'moneybag-plugin'),
                'type' => Controls_Manager::TEXT,
                'default' => 'https://sandbox.api.moneybag.com.bd/api/v2',
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
                'default' => '#f85149',
                'selectors' => [
                    '{{WRAPPER}} .moneybag-form-container .primary-btn' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .moneybag-form-container .arrow-btn' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .moneybag-form-container .check-mark' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .moneybag-form-container .dot' => 'background-color: {{VALUE}};',
                ],
            ]
        );
        
        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'form_typography',
                'label' => __('Typography', 'moneybag-plugin'),
                'selector' => '{{WRAPPER}} .moneybag-form-container',
            ]
        );
        
        $this->end_controls_section();
    }
    
    protected function render() {
        $settings = $this->get_settings_for_display();
        
        $widget_id = $this->get_id();
        $form_config = [
            'widget_id' => $widget_id,
            'api_base_url' => !empty($settings['api_base_url']) ? $settings['api_base_url'] : 'https://sandbox.api.moneybag.com.bd/api/v2',
            'redirect_url' => !empty($settings['redirect_url']) ? $settings['redirect_url'] : '',
            'form_title' => !empty($settings['form_title']) ? $settings['form_title'] : __('Sandbox Account Registration', 'moneybag-plugin'),
            'primary_color' => !empty($settings['primary_color']) ? $settings['primary_color'] : '#f85149'
        ];
        ?>
        <div class="moneybag-sandbox-form-wrapper" data-config='<?php echo esc_attr(json_encode($form_config)); ?>'>
            <div id="moneybag-sandbox-form-<?php echo esc_attr($widget_id); ?>">
                <div class="moneybag-loading">
                    <p><?php echo __('Loading form...', 'moneybag-plugin'); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
    
    protected function content_template() {
        ?>
        <div class="moneybag-sandbox-form-wrapper">
            <div class="moneybag-form-preview">
                <h3>{{ settings.form_title }}</h3>
                <p><?php echo __('Moneybag Sandbox Form Preview - This will render the React component on frontend', 'moneybag-plugin'); ?></p>
                <div style="background: #f4f6f9; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.08);">
                        <p style="color: #5f6d7e; margin: 0;"><?php echo __('Multi-step sandbox registration form will appear here', 'moneybag-plugin'); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}

