<?php
if (!defined('ABSPATH')) {
    exit;
}

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

class MoneyBag_Multirole_Widget extends Widget_Base {
    
    public function get_name() {
        return 'moneybag-multirole';
    }
    
    public function get_title() {
        return __('MoneyBag Multirole Form', 'moneybag-multirole');
    }
    
    public function get_icon() {
        return 'eicon-form-horizontal';
    }
    
    public function get_categories() {
        return ['moneybag'];
    }
    
    public function get_keywords() {
        return ['form', 'merchant', 'registration', 'pricing', 'sandbox', 'moneybag', 'multirole'];
    }
    
    protected function register_controls() {
        // Form Selection Section
        $this->start_controls_section(
            'form_selection',
            [
                'label' => __('Form Type', 'moneybag-multirole'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'form_type',
            [
                'label' => __('Select Form Type', 'moneybag-multirole'),
                'type' => Controls_Manager::SELECT,
                'default' => 'merchant_registration',
                'options' => [
                    'merchant_registration' => __('Merchant Registration Form', 'moneybag-multirole'),
                    'pricing_calculator' => __('Pricing and Appointment Booking Form', 'moneybag-multirole'),
                    'sandbox_registration' => __('Sandbox Registration Form', 'moneybag-multirole'),
                ],
                'description' => __('Choose which form type to display', 'moneybag-multirole'),
            ]
        );
        
        $this->end_controls_section();
        
        // General Settings Section
        $this->start_controls_section(
            'general_settings',
            [
                'label' => __('General Settings', 'moneybag-multirole'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'form_title',
            [
                'label' => __('Form Title', 'moneybag-multirole'),
                'type' => Controls_Manager::TEXT,
                'default' => __('Get Started', 'moneybag-multirole'),
                'label_block' => true,
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );
        
        $this->add_control(
            'show_title',
            [
                'label' => __('Show Title', 'moneybag-multirole'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );
        
        $this->add_control(
            'enable_validation',
            [
                'label' => __('Enable Instant Validation', 'moneybag-multirole'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'description' => __('Validate fields instantly as user types', 'moneybag-multirole'),
            ]
        );
        
        $this->end_controls_section();
        
        // Data Source Section
        $this->start_controls_section(
            'data_source',
            [
                'label' => __('Data Source', 'moneybag-multirole'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'data_source',
            [
                'label' => __('Form Data Source', 'moneybag-multirole'),
                'type' => Controls_Manager::SELECT,
                'default' => 'json',
                'options' => [
                    'json' => __('JSON File', 'moneybag-multirole'),
                    'api' => __('API Endpoint', 'moneybag-multirole'),
                    'default' => __('Default Configuration', 'moneybag-multirole'),
                ],
            ]
        );
        
        $this->add_control(
            'api_endpoint',
            [
                'label' => __('API Endpoint', 'moneybag-multirole'),
                'type' => Controls_Manager::TEXT,
                'default' => '',
                'condition' => [
                    'data_source' => 'api',
                ],
                'label_block' => true,
                'description' => __('Enter the API endpoint URL to fetch form configuration', 'moneybag-multirole'),
            ]
        );
        
        $this->end_controls_section();
        
        // Merchant Registration Settings
        $this->start_controls_section(
            'merchant_settings',
            [
                'label' => __('Merchant Registration Settings', 'moneybag-multirole'),
                'tab' => Controls_Manager::TAB_CONTENT,
                'condition' => [
                    'form_type' => 'merchant_registration',
                ],
            ]
        );
        
        $this->add_control(
            'merchant_steps',
            [
                'label' => __('Number of Steps', 'moneybag-multirole'),
                'type' => Controls_Manager::NUMBER,
                'default' => 4,
                'min' => 2,
                'max' => 6,
            ]
        );
        
        $this->add_control(
            'show_progress',
            [
                'label' => __('Show Progress Bar', 'moneybag-multirole'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );
        
        $this->end_controls_section();
        
        // Pricing Calculator Settings
        $this->start_controls_section(
            'pricing_settings',
            [
                'label' => __('Pricing and Appointment Booking Settings', 'moneybag-multirole'),
                'tab' => Controls_Manager::TAB_CONTENT,
                'condition' => [
                    'form_type' => 'pricing_calculator',
                ],
            ]
        );
        
        $this->add_control(
            'show_consultation',
            [
                'label' => __('Show Consultation Form', 'moneybag-multirole'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );
        
        $this->add_control(
            'enable_crm_sync',
            [
                'label' => __('Enable CRM Sync', 'moneybag-multirole'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'description' => __('Sync consultation requests with CRM', 'moneybag-multirole'),
            ]
        );
        
        $this->add_control(
            'pricing_layout',
            [
                'label' => __('Layout', 'moneybag-multirole'),
                'type' => Controls_Manager::SELECT,
                'default' => 'two-column',
                'options' => [
                    'single-column' => __('Single Column', 'moneybag-multirole'),
                    'two-column' => __('Two Column', 'moneybag-multirole'),
                ],
            ]
        );
        
        $this->end_controls_section();
        
        // Sandbox Registration Settings
        $this->start_controls_section(
            'sandbox_settings',
            [
                'label' => __('Sandbox Registration Settings', 'moneybag-multirole'),
                'tab' => Controls_Manager::TAB_CONTENT,
                'condition' => [
                    'form_type' => 'sandbox_registration',
                ],
            ]
        );
        
        $this->add_control(
            'api_environment',
            [
                'label' => __('API Environment', 'moneybag-multirole'),
                'type' => Controls_Manager::SELECT,
                'default' => 'staging',
                'options' => [
                    'staging' => __('Staging', 'moneybag-multirole'),
                    'production' => __('Production', 'moneybag-multirole'),
                ],
            ]
        );
        
        $this->add_control(
            'enable_otp',
            [
                'label' => __('Enable OTP Verification', 'moneybag-multirole'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );
        
        $this->add_control(
            'save_to_database',
            [
                'label' => __('Save Submissions', 'moneybag-multirole'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'description' => __('This feature has been disabled for simplified operation', 'moneybag-multirole'),
            ]
        );
        
        $this->end_controls_section();
        
        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'moneybag-multirole'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
        
        $this->add_control(
            'primary_color',
            [
                'label' => __('Primary Color', 'moneybag-multirole'),
                'type' => Controls_Manager::COLOR,
                'default' => '#1f2937',
                'selectors' => [
                    '{{WRAPPER}} .moneybag-primary' => 'color: {{VALUE}}',
                    '{{WRAPPER}} .moneybag-primary-bg' => 'background-color: {{VALUE}}',
                    '{{WRAPPER}} .btn-primary' => 'background-color: {{VALUE}}',
                ],
            ]
        );
        
        $this->add_control(
            'secondary_color',
            [
                'label' => __('Secondary Color', 'moneybag-multirole'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ef4444',
                'selectors' => [
                    '{{WRAPPER}} .moneybag-secondary' => 'color: {{VALUE}}',
                    '{{WRAPPER}} .moneybag-secondary-bg' => 'background-color: {{VALUE}}',
                    '{{WRAPPER}} .step-item.active .step-number' => 'background-color: {{VALUE}}',
                ],
            ]
        );
        
        $this->add_control(
            'form_background',
            [
                'label' => __('Form Background', 'moneybag-multirole'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .form-main' => 'background-color: {{VALUE}}',
                    '{{WRAPPER}} .pricing-form-panel' => 'background-color: {{VALUE}}',
                    '{{WRAPPER}} .sandbox-container' => 'background-color: {{VALUE}}',
                ],
            ]
        );
        
        $this->add_control(
            'border_radius',
            [
                'label' => __('Border Radius', 'moneybag-multirole'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 30,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 8,
                ],
                'selectors' => [
                    '{{WRAPPER}} .form-main' => 'border-radius: {{SIZE}}{{UNIT}}',
                    '{{WRAPPER}} .form-input' => 'border-radius: {{SIZE}}{{UNIT}}',
                    '{{WRAPPER}} .btn' => 'border-radius: {{SIZE}}{{UNIT}}',
                ],
            ]
        );
        
        $this->end_controls_section();
        
        // Typography Section
        $this->start_controls_section(
            'typography_section',
            [
                'label' => __('Typography', 'moneybag-multirole'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
        
        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'form_typography',
                'label' => __('Form Typography', 'moneybag-multirole'),
                'selector' => '{{WRAPPER}} .moneybag-widget-container',
            ]
        );
        
        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'heading_typography',
                'label' => __('Heading Typography', 'moneybag-multirole'),
                'selector' => '{{WRAPPER}} h1, {{WRAPPER}} h2, {{WRAPPER}} h3',
            ]
        );
        
        $this->end_controls_section();
    }
    
    protected function render() {
        $settings = $this->get_settings_for_display();
        $widget_id = $this->get_id();
        
        // Add the form type to settings for JavaScript
        $settings['widget_id'] = $widget_id;
        ?>
        <div id="moneybag-multirole-<?php echo esc_attr($widget_id); ?>" 
             class="moneybag-widget-container"
             data-widget-type="multirole"
             data-form-type="<?php echo esc_attr($settings['form_type']); ?>"
             data-settings='<?php echo wp_json_encode($settings); ?>'>
            
            <?php if ($settings['show_title'] === 'yes' && !empty($settings['form_title'])) : ?>
                <h2 class="moneybag-form-title"><?php echo esc_html($settings['form_title']); ?></h2>
            <?php endif; ?>
            
            <div class="moneybag-form-container">
                <div class="moneybag-loading">
                    <div class="spinner"></div>
                    <p><?php _e('Loading form...', 'moneybag-multirole'); ?></p>
                </div>
                
                <?php if ($settings['form_type'] === 'sandbox_registration') : ?>
                <noscript>
                    <div class="alert alert-warning">
                        <h3><?php _e('JavaScript Required', 'moneybag-multirole'); ?></h3>
                        <p><?php _e('This form requires JavaScript to function properly. Please enable JavaScript in your browser.', 'moneybag-multirole'); ?></p>
                    </div>
                </noscript>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
    
    protected function content_template() {
        ?>
        <#
        var formTypes = {
            'merchant_registration': 'Merchant Registration Form',
            'pricing_calculator': 'Pricing and Appointment Booking Form',
            'sandbox_registration': 'Sandbox Registration Form'
        };
        #>
        <div class="moneybag-widget-container elementor-edit-mode">
            <# if (settings.show_title === 'yes' && settings.form_title) { #>
                <h2 class="moneybag-form-title">{{{ settings.form_title }}}</h2>
            <# } #>
            
            <div class="moneybag-form-preview">
                <div class="form-type-indicator">
                    <span class="form-type-label">Form Type:</span>
                    <strong>{{{ formTypes[settings.form_type] }}}</strong>
                </div>
                
                <div class="form-preview-content">
                    <# if (settings.form_type === 'merchant_registration') { #>
                        <p>📝 4-Step Merchant Registration Form</p>
                        <ul>
                            <li>Business Information</li>
                            <li>Online Presence</li>
                            <li>Contact Details</li>
                            <li>Document Upload</li>
                        </ul>
                    <# } else if (settings.form_type === 'pricing_calculator') { #>
                        <p>💰 Pricing and Appointment Booking</p>
                        <ul>
                            <li>Business Criteria Selection</li>
                            <li>Instant Pricing Display</li>
                            <li>Consultation Booking</li>
                        </ul>
                    <# } else if (settings.form_type === 'sandbox_registration') { #>
                        <p>🔐 Sandbox Account Registration</p>
                        <ul>
                            <li>Email Verification</li>
                            <li>OTP Authentication</li>
                            <li>Business Details</li>
                            <li>API Credentials Generation</li>
                        </ul>
                    <# } #>
                </div>
                
                <div class="form-settings-summary">
                    <p><strong>Settings:</strong></p>
                    <ul>
                        <li>Instant Validation: {{{ settings.enable_validation }}}</li>
                        <li>Data Source: {{{ settings.data_source }}}</li>
                        <# if (settings.form_type === 'pricing_calculator') { #>
                            <li>CRM Sync: {{{ settings.enable_crm_sync }}}</li>
                        <# } #>
                    </ul>
                </div>
            </div>
        </div>
        
        <style>
        .elementor-edit-mode .moneybag-form-preview {
            padding: 20px;
            background: #f5f5f5;
            border: 2px dashed #ddd;
            border-radius: 8px;
            min-height: 200px;
        }
        
        .elementor-edit-mode .form-type-indicator {
            background: white;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        
        .elementor-edit-mode .form-type-label {
            color: #666;
            margin-right: 10px;
        }
        
        .elementor-edit-mode .form-preview-content {
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        
        .elementor-edit-mode .form-settings-summary {
            background: white;
            padding: 15px;
            border-radius: 5px;
            font-size: 12px;
        }
        
        .elementor-edit-mode .form-settings-summary ul {
            margin: 5px 0;
            padding-left: 20px;
        }
        </style>
        <?php
    }
}