<?php

if (!defined('ABSPATH')) {
    exit;
}

class MSFM_Multi_Step_Form_Widget extends \Elementor\Widget_Base
{

    public function get_name()
    {
        return 'multi-step-form';
    }

    public function get_title()
    {
        return __('Multi Step Form', 'multi-step-form-widget');
    }

    public function get_icon()
    {
        return 'eicon-form-horizontal';
    }

    public function get_categories()
    {
        return ['general'];
    }

    public function get_script_depends()
    {
        return ['msfm-app'];
    }

    public function get_style_depends()
    {
        return ['msfm-styles'];
    }

    protected function register_controls()
    {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'multi-step-form-widget'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'form_title',
            [
                'label' => __('Form Title', 'multi-step-form-widget'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('Get Your Sandbox Access', 'multi-step-form-widget'),
            ]
        );

        $this->add_control(
            'success_message',
            [
                'label' => __('Success Message', 'multi-step-form-widget'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => __('Your sandbox account has been created successfully!', 'multi-step-form-widget'),
            ]
        );

        $this->end_controls_section();

        // Style section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'multi-step-form-widget'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'primary_color',
            [
                'label' => __('Primary Color', 'multi-step-form-widget'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#4A5568',
                'selectors' => [
                    '{{WRAPPER}} .msfm-primary-btn' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .msfm-progress-fill' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'form_background',
            [
                'label' => __('Form Background', 'multi-step-form-widget'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#FFFFFF',
                'selectors' => [
                    '{{WRAPPER}} .msfm-container' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    protected function render()
    {
        $settings = $this->get_settings_for_display();
?>
        <div id="msfm-root"
            data-form-title="<?php echo esc_attr($settings['form_title']); ?>"
            data-success-message="<?php echo esc_attr($settings['success_message']); ?>">
        </div>
<?php
    }
}
