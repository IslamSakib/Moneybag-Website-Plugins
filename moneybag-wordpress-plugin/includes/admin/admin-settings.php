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
        // General Settings with URL sanitization
        register_setting('moneybag_settings', 'moneybag_sandbox_api_url', [
            'sanitize_callback' => [$this, 'sanitize_url_setting']
        ]);
        // Production API removed - not being used
        // register_setting('moneybag_settings', 'moneybag_api_base_url', [
        //     'sanitize_callback' => [$this, 'sanitize_url_setting']
        // ]);
        register_setting('moneybag_settings', 'moneybag_default_redirect_url', [
            'sanitize_callback' => [$this, 'sanitize_url_setting']
        ]);
        
        // Security Settings
        register_setting('moneybag_settings', 'moneybag_recaptcha_site_key', [
            'sanitize_callback' => 'sanitize_text_field'
        ]);
        register_setting('moneybag_settings', 'moneybag_recaptcha_secret_key', [
            'sanitize_callback' => 'sanitize_text_field'
        ]);
        register_setting('moneybag_settings', 'moneybag_recaptcha_score_threshold', [
            'sanitize_callback' => [$this, 'sanitize_score_threshold']
        ]);
        
        // CRM Settings
        register_setting('moneybag_crm_settings', 'moneybag_crm_api_key');
        register_setting('moneybag_crm_settings', 'moneybag_crm_api_url', [
            'sanitize_callback' => [$this, 'sanitize_url_setting']
        ]);
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
                'default' => '',
                'placeholder' => 'https://staging.api.moneybag.com.bd/api',
                'description' => 'Base URL for Sandbox API without version (e.g., https://staging.api.moneybag.com.bd/api)'
            ]
        );
        
        // Production API field removed - not being used
        // add_settings_field(
        //     'moneybag_api_base_url',
        //     __('Production API URL', 'moneybag-plugin'),
        //     [$this, 'text_field_callback'],
        //     'moneybag_settings',
        //     'moneybag_general_section',
        //     [
        //         'option_name' => 'moneybag_api_base_url',
        //         'default' => '',
        //         'placeholder' => 'https://your-production-api.com/api/v2',
        //         'description' => 'Base URL for Production API (required for live transactions)'
        //     ]
        // );
        
        add_settings_field(
            'moneybag_default_redirect_url',
            __('Default Redirect URL', 'moneybag-plugin'),
            [$this, 'text_field_callback'],
            'moneybag_settings',
            'moneybag_general_section',
            [
                'option_name' => 'moneybag_default_redirect_url',
                'default' => '',
                'placeholder' => 'https://your-website.com/success',
                'description' => 'Default URL to redirect users after successful form submission (optional)'
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
                'default' => '',
                'placeholder' => 'Your reCAPTCHA Site Key',
                'description' => 'Your Google reCAPTCHA v3 Site Key (public key) - optional but recommended'
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
                'default' => '',
                'placeholder' => 'Your reCAPTCHA Secret Key',
                'description' => 'Your Google reCAPTCHA v3 Secret Key (private key) - optional but recommended'
            ]
        );
        
        add_settings_field(
            'moneybag_recaptcha_score_threshold',
            __('reCAPTCHA Score Threshold', 'moneybag-plugin'),
            [$this, 'number_field_callback'],
            'moneybag_settings',
            'moneybag_general_section',
            [
                'option_name' => 'moneybag_recaptcha_score_threshold',
                'default' => '0.3',
                'description' => 'Minimum score required (0.0-1.0). Lower = more strict',
                'min' => '0.0',
                'max' => '1.0',
                'step' => '0.1'
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
                'default' => '',
                'placeholder' => 'https://your-crm-api.com/rest',
                'description' => 'Base URL for your CRM API (optional - needed only for contact form CRM integration)'
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
                'default' => 'Payment Gateway – merchant onboarding',
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
    
    /**
     * Sanitize URL settings to prevent security vulnerabilities
     */
    public function sanitize_url_setting($url) {
        if (empty($url)) {
            return '';
        }
        
        // Sanitize the URL
        $url = esc_url_raw($url);
        
        // Additional validation - only allow HTTP/HTTPS URLs
        $parsed = wp_parse_url($url);
        
        if (!$parsed || !isset($parsed['scheme']) || !in_array($parsed['scheme'], ['http', 'https'])) {
            add_settings_error(
                'moneybag_settings',
                'invalid_url',
                __('Invalid URL format. Only HTTP and HTTPS URLs are allowed.', 'moneybag-plugin')
            );
            return '';
        }
        
        // Prevent localhost/internal network access for security
        if (isset($parsed['host'])) {
            $host = strtolower($parsed['host']);
            $blocked_hosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
            
            foreach ($blocked_hosts as $blocked) {
                if ($host === $blocked || strpos($host, $blocked) !== false) {
                    add_settings_error(
                        'moneybag_settings',
                        'blocked_host',
                        __('Localhost and internal network URLs are not allowed for security reasons.', 'moneybag-plugin')
                    );
                    return '';
                }
            }
            
            // Block private IP ranges
            if (filter_var($host, FILTER_VALIDATE_IP)) {
                if (!filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    add_settings_error(
                        'moneybag_settings',
                        'private_ip',
                        __('Private IP addresses are not allowed for security reasons.', 'moneybag-plugin')
                    );
                    return '';
                }
            }
        }
        
        return $url;
    }
    
    /**
     * Sanitize score threshold to ensure it's between 0.0 and 1.0
     */
    public function sanitize_score_threshold($value) {
        $score = floatval($value);
        if ($score < 0.0) return '0.0';
        if ($score > 1.0) return '1.0';
        return number_format($score, 1);
    }
    
    public function text_field_callback($args) {
        $option_name = $args['option_name'];
        $default = $args['default'] ?? '';
        $placeholder = $args['placeholder'] ?? $default;
        $description = $args['description'] ?? '';
        $value = get_option($option_name, $default);
        
        // Determine input type based on field name
        $input_type = 'text';
        if (strpos($option_name, '_url') !== false) {
            $input_type = 'url';
        }
        
        echo '<input type="' . esc_attr($input_type) . '" id="' . esc_attr($option_name) . '" name="' . esc_attr($option_name) . '" value="' . esc_attr($value) . '" class="regular-text" placeholder="' . esc_attr($placeholder) . '" />';
        if ($description) {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
    }
    
    public function password_field_callback($args) {
        $option_name = $args['option_name'];
        $default = $args['default'] ?? '';
        $placeholder = $args['placeholder'] ?? $default;
        $description = $args['description'] ?? '';
        $value = get_option($option_name, $default);
        
        echo '<div class="password-field-wrapper">';
        echo '<input type="password" id="' . esc_attr($option_name) . '" name="' . esc_attr($option_name) . '" value="' . esc_attr($value) . '" class="regular-text" placeholder="' . esc_attr($placeholder) . '" />';
        echo '<span id="toggle-' . esc_attr($option_name) . '"></span>';
        echo '</div>';
        if ($description) {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
    }
    
    public function number_field_callback($args) {
        $option_name = $args['option_name'];
        $default = $args['default'] ?? '';
        $description = $args['description'] ?? '';
        $min = $args['min'] ?? null;
        $max = $args['max'] ?? null;
        $step = $args['step'] ?? null;
        $value = get_option($option_name, $default);
        
        $attrs = [];
        if ($min !== null) $attrs[] = 'min="' . esc_attr($min) . '"';
        if ($max !== null) $attrs[] = 'max="' . esc_attr($max) . '"';
        if ($step !== null) $attrs[] = 'step="' . esc_attr($step) . '"';
        
        echo '<input type="number" id="' . esc_attr($option_name) . '" name="' . esc_attr($option_name) . '" value="' . esc_attr($value) . '" class="small-text" ' . implode(' ', $attrs) . ' />';
        if ($description) {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
    }
    
    public function settings_page() {
        ?>
        <div class="wrap moneybag-admin-settings">
            <h1><?php echo __('Moneybag Settings', 'moneybag-plugin'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('moneybag_settings');
                do_settings_sections('moneybag_settings');
                submit_button();
                ?>
            </form>
            
            <div id="moneybag-info-cards-container"></div>
        </div>
        <?php
    }
    
    public function crm_settings_page() {
        ?>
        <div class="wrap moneybag-admin-settings">
            <h1><?php echo __('CRM Integration', 'moneybag-plugin'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('moneybag_crm_settings');
                do_settings_sections('moneybag_crm_settings');
                submit_button();
                ?>
            </form>
            
            <div id="crm-test-container"></div>
            <div id="crm-info-container"></div>
        </div>
        <?php
    }
    
    public function test_crm_connection() {
        // Verify nonce for security
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'moneybag_admin_nonce')) {
            wp_send_json_error('Security check failed');
            return;
        }
        
        $api_key = get_option('moneybag_crm_api_key');
        $api_url = get_option('moneybag_crm_api_url');
        
        if (empty($api_key)) {
            wp_send_json_error('CRM API key is not configured');
        }
        
        // Validate API URL for security
        if (empty($api_url)) {
            wp_send_json_error('CRM API URL is not configured');
        }
        
        // Additional security validation for the URL
        $api_url = esc_url_raw($api_url);
        $parsed = wp_parse_url($api_url);
        
        if (!$parsed || !isset($parsed['scheme']) || !in_array($parsed['scheme'], ['http', 'https'])) {
            wp_send_json_error('Invalid CRM API URL format');
        }
        
        // Prevent SSRF attacks by blocking internal/local URLs
        if (isset($parsed['host'])) {
            $host = strtolower($parsed['host']);
            $blocked_hosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0', '10.', '192.168.', '172.'];
            
            foreach ($blocked_hosts as $blocked) {
                if ($host === $blocked || strpos($host, $blocked) === 0) {
                    wp_send_json_error('Invalid CRM API URL - internal addresses not allowed');
                }
            }
            
            // Block private IP ranges
            if (filter_var($host, FILTER_VALIDATE_IP)) {
                if (!filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    wp_send_json_error('Invalid CRM API URL - private IP addresses not allowed');
                }
            }
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
        // Enqueue on both main settings and CRM pages
        if (in_array($hook_suffix, ['toplevel_page_moneybag-settings', 'moneybag_page_moneybag-crm'])) {
            // Enqueue WordPress React dependencies
            wp_enqueue_script('wp-element');
            wp_enqueue_script('wp-api-fetch');
            
            // Enqueue global CSS
            wp_enqueue_style(
                'moneybag-global-css',
                MONEYBAG_PLUGIN_URL . 'assets/css/moneybag-global.css',
                [],
                MONEYBAG_PLUGIN_VERSION
            );
            
            // Enqueue new React-based admin settings
            wp_enqueue_script(
                'moneybag-admin-settings',
                MONEYBAG_PLUGIN_URL . 'assets/js/admin-settings.js',
                ['wp-element', 'wp-api-fetch'],
                MONEYBAG_PLUGIN_VERSION,
                true
            );
            
            wp_localize_script('moneybag-admin-settings', 'moneybagAdminSettings', [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('moneybag_admin_nonce'),
                'crmPageUrl' => admin_url('admin.php?page=moneybag-crm'),
                'pluginVersion' => MONEYBAG_PLUGIN_VERSION,
                'settings' => [
                    'sandboxApiUrl' => get_option('moneybag_sandbox_api_url'),
                    // 'apiBaseUrl' => get_option('moneybag_api_base_url'), // Removed - not being used
                    'crmApiUrl' => get_option('moneybag_crm_api_url')
                ]
            ]);
        }
    }
}