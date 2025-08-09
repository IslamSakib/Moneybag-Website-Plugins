<?php

class MRF_Widget extends \Elementor\Widget_Base
{

    public function get_name()
    {
        return 'merchant_registration_form';
    }

    public function get_title()
    {
        return __('Merchant Registration Form', 'merchant-registration-form');
    }

    public function get_icon()
    {
        return 'eicon-form-horizontal';
    }

    public function get_categories()
    {
        return ['general'];
    }

    protected function _register_controls()
    {

        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'merchant-registration-form'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'form_title',
            [
                'label' => __('Form Title', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('Please fill this information first', 'merchant-registration-form'),
                'placeholder' => __('Type your title here', 'merchant-registration-form'),
            ]
        );

        $this->add_control(
            'show_progress',
            [
                'label' => __('Show Progress Bar', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'merchant-registration-form'),
                'label_off' => __('Hide', 'merchant-registration-form'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'theme',
            [
                'label' => __('Theme', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => __('Default', 'merchant-registration-form'),
                    'dark' => __('Dark', 'merchant-registration-form'),
                ],
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'merchant-registration-form'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'primary_color',
            [
                'label' => __('Primary Color', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ef4444',
                'selectors' => [
                    '{{WRAPPER}} .mrf-primary-color' => 'background-color: {{VALUE}}',
                    '{{WRAPPER}} .mrf-primary-text' => 'color: {{VALUE}}',
                    '{{WRAPPER}} .mrf-primary-border' => 'border-color: {{VALUE}}',
                ],
            ]
        );

        $this->add_control(
            'secondary_color',
            [
                'label' => __('Secondary Color', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1f2937',
                'selectors' => [
                    '{{WRAPPER}} .mrf-secondary-color' => 'background-color: {{VALUE}}',
                    '{{WRAPPER}} .mrf-secondary-text' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->end_controls_section();
    }

    protected function render()
    {
        $settings = $this->get_settings_for_display();

        echo '<div 
            id="merchant-registration-form-' . $this->get_id() . '" 
            class="merchant-registration-form-container"
            data-title="' . esc_attr($settings['form_title']) . '"
            data-show-progress="' . esc_attr($settings['show_progress']) . '"
            data-theme="' . esc_attr($settings['theme']) . '"
        ></div>';

        // Add inline script to initialize React component
?>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined' && typeof MerchantRegistrationForm !== 'undefined') {
                    const container = document.getElementById('merchant-registration-form-<?php echo $this->get_id(); ?>');
                    if (container && !container.hasAttribute('data-initialized')) {
                        container.setAttribute('data-initialized', 'true');
                        const props = {
                            title: container.dataset.title || 'Please fill this information first',
                            showProgress: container.dataset.showProgress || 'yes',
                            theme: container.dataset.theme || 'default'
                        };
                        ReactDOM.render(React.createElement(MerchantRegistrationForm, props), container);
                    }
                }
            });
        </script>
    <?php
    }

    protected function _content_template()
    {
    ?>
        <div id="merchant-registration-form-preview" class="merchant-registration-form-container">
            <div style="padding: 40px; text-align: center; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;">
                <i class="eicon-form-horizontal" style="font-size: 48px; color: #6c757d; margin-bottom: 16px;"></i>
                <h3 style="margin: 0 0 8px 0; color: #495057;">Merchant Registration Form</h3>
                <p style="margin: 0; color: #6c757d;">This is a preview. The form will appear on the frontend.</p>
            </div>
        </div>
<?php
    }
}
