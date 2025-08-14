<?php
namespace MoneybagPlugin\Admin;

if (!defined('ABSPATH')) {
    exit;
}

class AdminSettings {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('wp_ajax_test_crm_connection', [$this, 'test_crm_connection']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
    }
    
    public function add_admin_menu() {
        add_menu_page(
            __('Moneybag Settings', 'moneybag-plugin'),
            __('Moneybag', 'moneybag-plugin'),
            'manage_options',
            'moneybag-settings',
            [$this, 'settings_page'],
            'dashicons-money-alt',
            30
        );
        
        add_submenu_page(
            'moneybag-settings',
            __('CRM Integration', 'moneybag-plugin'),
            __('CRM Integration', 'moneybag-plugin'),
            'manage_options',
            'moneybag-crm',
            [$this, 'crm_settings_page']
        );
    }
    
    public function register_settings() {
        // General Settings
        register_setting('moneybag_settings', 'moneybag_sandbox_api_url');
        register_setting('moneybag_settings', 'moneybag_default_redirect_url');
        
        // reCAPTCHA Settings
        register_setting('moneybag_settings', 'moneybag_recaptcha_site_key');
        register_setting('moneybag_settings', 'moneybag_recaptcha_secret_key');
        
        // CRM Settings
        register_setting('moneybag_crm_settings', 'moneybag_crm_api_key');
        register_setting('moneybag_crm_settings', 'moneybag_crm_api_url');
        register_setting('moneybag_crm_settings', 'moneybag_crm_opportunity_name');
        register_setting('moneybag_crm_settings', 'moneybag_crm_default_stage');
        
        // General Settings Section
        add_settings_section(
            'moneybag_general_section',
            __('General Settings', 'moneybag-plugin'),
            [$this, 'general_section_callback'],
            'moneybag_settings'
        );
        
        add_settings_field(
            'moneybag_sandbox_api_url',
            __('Sandbox API URL', 'moneybag-plugin'),
            [$this, 'text_field_callback'],
            'moneybag_settings',
            'moneybag_general_section',
            [
                'option_name' => 'moneybag_sandbox_api_url',
                'default' => 'https://sandbox.api.moneybag.com.bd/api/v2',
                'description' => 'Base URL for Moneybag Sandbox API'
            ]
        );
        
        add_settings_field(
            'moneybag_default_redirect_url',
            __('Default Redirect URL', 'moneybag-plugin'),
            [$this, 'text_field_callback'],
            'moneybag_settings',
            'moneybag_general_section',
            [
                'option_name' => 'moneybag_default_redirect_url',
                'default' => 'https://sandbox.moneybag.com.bd/',
                'description' => 'Default URL to redirect users after successful form submission'
            ]
        );
        
        add_settings_field(
            'moneybag_recaptcha_site_key',
            __('reCAPTCHA Site Key', 'moneybag-plugin'),
            [$this, 'text_field_callback'],
            'moneybag_settings',
            'moneybag_general_section',
            [
                'option_name' => 'moneybag_recaptcha_site_key',
                'default' => '6LeH1jEqAAAAALzgHRj-E4TGKbpGEs2K_P3_XcM8',
                'description' => 'Your Google reCAPTCHA v2 Site Key (public key)'
            ]
        );
        
        add_settings_field(
            'moneybag_recaptcha_secret_key',
            __('reCAPTCHA Secret Key', 'moneybag-plugin'),
            [$this, 'password_field_callback'],
            'moneybag_settings',
            'moneybag_general_section',
            [
                'option_name' => 'moneybag_recaptcha_secret_key',
                'default' => '6LeH1jEqAAAAALzgHRj-E4TGKbpGEs2K_P3_XcM8',
                'description' => 'Your Google reCAPTCHA v2 Secret Key (private key)'
            ]
        );
        
        // CRM Settings Section
        add_settings_section(
            'moneybag_crm_section',
            __('CRM Integration Settings', 'moneybag-plugin'),
            [$this, 'crm_section_callback'],
            'moneybag_crm_settings'
        );
        
        add_settings_field(
            'moneybag_crm_api_key',
            __('CRM API Key', 'moneybag-plugin'),
            [$this, 'password_field_callback'],
            'moneybag_crm_settings',
            'moneybag_crm_section',
            [
                'option_name' => 'moneybag_crm_api_key',
                'description' => 'API key for CRM integration (TwentyOne CRM)'
            ]
        );
        
        add_settings_field(
            'moneybag_crm_api_url',
            __('CRM API URL', 'moneybag-plugin'),
            [$this, 'text_field_callback'],
            'moneybag_crm_settings',
            'moneybag_crm_section',
            [
                'option_name' => 'moneybag_crm_api_url',
                'default' => 'https://crm.dummy-dev.tubeonai.com/rest',
                'description' => 'Base URL for your CRM API'
            ]
        );
        
        add_settings_field(
            'moneybag_crm_opportunity_name',
            __('Opportunity Name Template', 'moneybag-plugin'),
            [$this, 'text_field_callback'],
            'moneybag_crm_settings',
            'moneybag_crm_section',
            [
                'option_name' => 'moneybag_crm_opportunity_name',
                'default' => 'TubeOnAI – merchant onboarding',
                'description' => 'Template for opportunity names in CRM'
            ]
        );
        
        add_settings_field(
            'moneybag_crm_default_stage',
            __('Default Opportunity Stage', 'moneybag-plugin'),
            [$this, 'text_field_callback'],
            'moneybag_crm_settings',
            'moneybag_crm_section',
            [
                'option_name' => 'moneybag_crm_default_stage',
                'default' => 'NEW',
                'description' => 'Default stage for new opportunities'
            ]
        );
    }
    
    public function general_section_callback() {
        echo '<p>' . __('Configure general settings for Moneybag WordPress Plugin.', 'moneybag-plugin') . '</p>';
    }
    
    public function crm_section_callback() {
        echo '<p>' . __('Configure CRM integration settings. Test your connection below after saving.', 'moneybag-plugin') . '</p>';
    }
    
    public function text_field_callback($args) {
        $option_name = $args['option_name'];
        $default = $args['default'] ?? '';
        $description = $args['description'] ?? '';
        $value = get_option($option_name, $default);
        
        echo '<input type="text" id="' . esc_attr($option_name) . '" name="' . esc_attr($option_name) . '" value="' . esc_attr($value) . '" class="regular-text" />';
        if ($description) {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
    }
    
    public function password_field_callback($args) {
        $option_name = $args['option_name'];
        $description = $args['description'] ?? '';
        $value = get_option($option_name, '');
        
        echo '<input type="password" id="' . esc_attr($option_name) . '" name="' . esc_attr($option_name) . '" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<button type="button" class="button button-secondary" onclick="togglePassword(\'' . esc_attr($option_name) . '\')">Show/Hide</button>';
        if ($description) {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
    }
    
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo __('Moneybag Settings', 'moneybag-plugin'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('moneybag_settings');
                do_settings_sections('moneybag_settings');
                submit_button();
                ?>
            </form>
            
            <div class="moneybag-info-cards">
                <div class="card">
                    <h3>📋 Plugin Status</h3>
                    <ul>
                        <li><strong>Sandbox Form Widget:</strong> ✅ Active</li>
                        <li><strong>Pricing Plan Widget:</strong> ✅ Active</li>
                        <li><strong>Elementor Integration:</strong> <?php echo class_exists('\Elementor\Plugin') ? '✅ Active' : '❌ Not Found'; ?></li>
                    </ul>
                </div>
                
                <div class="card">
                    <h3>🔗 Quick Links</h3>
                    <ul>
                        <li><a href="<?php echo admin_url('admin.php?page=moneybag-crm'); ?>">CRM Integration</a></li>
                        <li><a href="https://sandbox.moneybag.com.bd/" target="_blank">Moneybag Sandbox</a></li>
                        <li><a href="https://docs.moneybag.com.bd/" target="_blank">Documentation</a></li>
                    </ul>
                </div>
            </div>
        </div>
        
        <style>
        .moneybag-info-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .moneybag-info-cards .card {
            background: white;
            border: 1px solid #ccd0d4;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .moneybag-info-cards .card h3 {
            margin-top: 0;
            color: #23282d;
        }
        .moneybag-info-cards .card ul {
            margin: 0;
            padding-left: 20px;
        }
        .moneybag-info-cards .card li {
            margin-bottom: 8px;
        }
        </style>
        <?php
    }
    
    public function crm_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo __('CRM Integration', 'moneybag-plugin'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('moneybag_crm_settings');
                do_settings_sections('moneybag_crm_settings');
                submit_button();
                ?>
            </form>
            
            <div class="crm-test-section">
                <h2>🧪 Test CRM Connection</h2>
                <p>Test your CRM API connection with sample data. Make sure to save your settings first.</p>
                
                <button type="button" id="test-crm-btn" class="button button-primary">
                    Test CRM Connection
                </button>
                
                <div id="crm-test-results" style="margin-top: 20px;"></div>
            </div>
            
            <div class="crm-info-section">
                <h3>📚 CRM Integration Information</h3>
                <div class="crm-info-grid">
                    <div class="info-card">
                        <h4>What gets created:</h4>
                        <ol>
                            <li><strong>Person</strong> - Contact details</li>
                            <li><strong>Opportunity</strong> - Linked to the person</li>
                            <li><strong>Note</strong> - Form submission details</li>
                            <li><strong>Note Target</strong> - Links note to opportunity</li>
                        </ol>
                    </div>
                    
                    <div class="info-card">
                        <h4>Required CRM API Permissions:</h4>
                        <ul>
                            <li>Create People</li>
                            <li>Create Opportunities</li>
                            <li>Create Notes</li>
                            <li>Create Note Targets</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
        .crm-test-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .crm-info-section {
            margin-top: 30px;
        }
        
        .crm-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        
        .info-card {
            background: white;
            border: 1px solid #ccd0d4;
            border-radius: 8px;
            padding: 20px;
        }
        
        .info-card h4 {
            margin-top: 0;
            color: #0073aa;
        }
        
        #crm-test-results {
            padding: 15px;
            border-radius: 4px;
            display: none;
        }
        
        .success-result {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .error-result {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        </style>
        
        <script>
        function togglePassword(fieldId) {
            const field = document.getElementById(fieldId);
            field.type = field.type === 'password' ? 'text' : 'password';
        }
        </script>
        <?php
    }
    
    public function test_crm_connection() {
        // Verify nonce for security
        if (!wp_verify_nonce($_POST['nonce'], 'test_crm_nonce')) {
            wp_die('Security check failed');
        }
        
        $api_key = get_option('moneybag_crm_api_key');
        $api_url = get_option('moneybag_crm_api_url', 'https://crm.dummy-dev.tubeonai.com/rest');
        
        if (empty($api_key)) {
            wp_send_json_error('CRM API key is not configured');
        }
        
        // Test data
        $test_time = time();
        $test_data = [
            'name' => [
                'firstName' => 'Test',
                'lastName' => 'User'
            ],
            'emails' => [
                'primaryEmail' => "test_user_{$test_time}@example.com"
            ],
            'phones' => [
                'primaryPhoneNumber' => '1712345678',
                'primaryPhoneCallingCode' => '+880',
                'primaryPhoneCountryCode' => 'BD'
            ]
        ];
        
        // Test CRM API call
        $response = wp_remote_post($api_url . '/people', [
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json'
            ],
            'body' => json_encode($test_data),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            wp_send_json_error('Connection failed: ' . $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($status_code === 200 || $status_code === 201) {
            $person_id = $data['data']['createPerson']['id'] ?? $data['id'] ?? 'Unknown';
            wp_send_json_success([
                'message' => 'CRM connection successful!',
                'details' => [
                    'status_code' => $status_code,
                    'person_id' => $person_id,
                    'test_email' => $test_data['emails']['primaryEmail']
                ]
            ]);
        } else {
            wp_send_json_error([
                'message' => 'CRM API returned error',
                'details' => [
                    'status_code' => $status_code,
                    'response_body' => $body
                ]
            ]);
        }
    }
    
    public function enqueue_admin_scripts($hook_suffix) {
        if ($hook_suffix === 'moneybag_page_moneybag-crm') {
            wp_enqueue_script(
                'moneybag-admin-crm',
                MONEYBAG_PLUGIN_URL . 'assets/js/admin-crm.js',
                ['jquery'],
                MONEYBAG_PLUGIN_VERSION,
                true
            );
            
            wp_localize_script('moneybag-admin-crm', 'moneybagAdmin', [
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('test_crm_nonce')
            ]);
        }
    }
}