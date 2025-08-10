<?php

/**
 * Merchant Registration Form Widget for Elementor
 * Author: Sakib Islam
 */

class MRF_Widget extends \Elementor\Widget_Base
{
    /**
     * Get widget name
     */
    public function get_name()
    {
        return 'merchant_registration_form';
    }

    /**
     * Get widget title
     */
    public function get_title()
    {
        return __('Merchant Registration Form', 'merchant-registration-form');
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
        return ['form', 'merchant', 'registration', 'payment', 'multi-step'];
    }

    /**
     * Register widget controls
     */
    protected function _register_controls()
    {
        // Content Section
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content Settings', 'merchant-registration-form'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'form_title',
            [
                'label' => __('Form Title', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('Please fill this information first', 'merchant-registration-form'),
                'placeholder' => __('Enter form title', 'merchant-registration-form'),
            ]
        );

        $this->add_control(
            'subtitle',
            [
                'label' => __('Subtitle', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('After completing all steps you will be eligible for 7 days trial.', 'merchant-registration-form'),
                'placeholder' => __('Enter subtitle', 'merchant-registration-form'),
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
            'show_header',
            [
                'label' => __('Show Header Links', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'merchant-registration-form'),
                'label_off' => __('Hide', 'merchant-registration-form'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();

        // Email Settings
        $this->start_controls_section(
            'email_section',
            [
                'label' => __('Email Settings', 'merchant-registration-form'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'admin_email',
            [
                'label' => __('Admin Email', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => get_option('admin_email'),
                'placeholder' => __('admin@example.com', 'merchant-registration-form'),
                'description' => __('Email address to receive form submissions', 'merchant-registration-form'),
            ]
        );

        $this->add_control(
            'email_subject',
            [
                'label' => __('Email Subject', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('[Merchant Registration] New Application', 'merchant-registration-form'),
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
                'default' => '#dc3545',
                'selectors' => [
                    '{{WRAPPER}} .mrf-btn-primary' => 'background-color: {{VALUE}}; border-color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-progress-bar-fill' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-step-active' => 'border-left-color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-step-active .mrf-step-number' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-step-active .mrf-step-title' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-checkbox:checked' => 'accent-color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-error' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-error-input' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'success_color',
            [
                'label' => __('Success Color', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#28a745',
                'selectors' => [
                    '{{WRAPPER}} .mrf-step-completed .mrf-step-number' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-input:valid:not(:placeholder-shown):not(.mrf-error-input)' => 'border-color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-application-id' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-icon-circle' => 'background-color: {{VALUE}}1a;',
                ],
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label' => __('Text Color', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#495057',
                'selectors' => [
                    '{{WRAPPER}} .mrf-label' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-input' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .mrf-select' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => __('Border Radius', 'merchant-registration-form'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 20,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 4,
                ],
                'selectors' => [
                    '{{WRAPPER}} .mrf-input' => 'border-radius: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .mrf-select' => 'border-radius: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .mrf-btn' => 'border-radius: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .mrf-file-label' => 'border-radius: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .mrf-error-banner' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Typography Section
        $this->start_controls_section(
            'typography_section',
            [
                'label' => __('Typography', 'merchant-registration-form'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'label' => __('Title Typography', 'merchant-registration-form'),
                'selector' => '{{WRAPPER}} .mrf-sidebar-title',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'label_typography',
                'label' => __('Label Typography', 'merchant-registration-form'),
                'selector' => '{{WRAPPER}} .mrf-label',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'input_typography',
                'label' => __('Input Typography', 'merchant-registration-form'),
                'selector' => '{{WRAPPER}} .mrf-input, {{WRAPPER}} .mrf-select',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'button_typography',
                'label' => __('Button Typography', 'merchant-registration-form'),
                'selector' => '{{WRAPPER}} .mrf-btn',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render widget output on the frontend
     */
    protected function render()
    {
        $settings = $this->get_settings_for_display();

        // Generate unique ID for this instance
        $widget_id = 'merchant-registration-form-' . $this->get_id();

        // Prepare settings for JavaScript
        $js_settings = [
            'title' => esc_attr($settings['form_title']),
            'subtitle' => esc_attr($settings['subtitle']),
            'showProgress' => esc_attr($settings['show_progress']),
            'showHeader' => esc_attr($settings['show_header']),
            'adminEmail' => esc_attr($settings['admin_email']),
            'emailSubject' => esc_attr($settings['email_subject']),
        ];
?>

        <div id="<?php echo esc_attr($widget_id); ?>"
            class="merchant-registration-form-container"
            data-settings='<?php echo json_encode($js_settings); ?>'>
            <!-- React component will be mounted here -->
            <div style="padding: 20px; text-align: center; color: #999;">
                <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
                <div>Loading form...</div>
            </div>
        </div>

        <script>
            (function() {
                // Wait for DOM and React to be ready
                function initMerchantForm() {
                    if (typeof React !== 'undefined' &&
                        typeof ReactDOM !== 'undefined' &&
                        typeof MerchantRegistrationForm !== 'undefined') {

                        const container = document.getElementById('<?php echo esc_js($widget_id); ?>');

                        if (container && !container.hasAttribute('data-initialized')) {
                            container.setAttribute('data-initialized', 'true');

                            // Parse settings from data attribute
                            const settings = JSON.parse(container.dataset.settings || '{}');

                            // Clear loading message
                            container.innerHTML = '';

                            // Create React element and render
                            const element = React.createElement(MerchantRegistrationForm, {
                                title: settings.title || 'Please fill this information first',
                                subtitle: settings.subtitle || 'After completing all steps you will be eligible for 7 days trial.',
                                showProgress: settings.showProgress || 'yes',
                                showHeader: settings.showHeader || 'yes',
                                adminEmail: settings.adminEmail,
                                emailSubject: settings.emailSubject
                            });

                            ReactDOM.render(element, container);
                        }
                    } else {
                        // If React is not ready yet, try again
                        setTimeout(initMerchantForm, 100);
                    }
                }

                // Initialize on DOMContentLoaded
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initMerchantForm);
                } else {
                    initMerchantForm();
                }

                // Also initialize on Elementor frontend init (for editor)
                if (window.elementorFrontend) {
                    elementorFrontend.hooks.addAction('frontend/element_ready/merchant_registration_form.default', initMerchantForm);
                }
            })();
        </script>
    <?php
    }

    /**
     * Render widget output in the editor
     */
    protected function _content_template()
    {
    ?>
        <div class="merchant-registration-form-container">
            <div style="padding: 40px; text-align: center; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;">
                <i class="eicon-form-horizontal" style="font-size: 48px; color: #6c757d; margin-bottom: 16px; display: block;"></i>
                <h3 style="margin: 0 0 8px 0; color: #495057; font-size: 24px;">Merchant Registration Form</h3>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                    Multi-step registration form with file upload support<br>
                    <small style="opacity: 0.8;">By: Sakib Islam</small>
                </p>
                <# if ( settings.form_title ) { #>
                    <p style="margin: 10px 0 0 0; color: #495057; font-size: 13px;">
                        <strong>Title:</strong> {{{ settings.form_title }}}
                    </p>
                    <# } #>
                        <# if ( settings.show_progress==='yes' ) { #>
                            <p style="margin: 5px 0 0 0; color: #28a745; font-size: 12px;">
                                ✓ Progress bar enabled
                            </p>
                            <# } #>
                                <# if ( settings.show_header==='yes' ) { #>
                                    <p style="margin: 5px 0 0 0; color: #28a745; font-size: 12px;">
                                        ✓ Header links enabled
                                    </p>
                                    <# } #>
            </div>
        </div>
<?php
    }
}
