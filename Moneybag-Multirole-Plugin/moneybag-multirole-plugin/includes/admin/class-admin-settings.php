<?php
if (!defined('ABSPATH')) {
    exit;
}

class MoneyBagAdminSettings {
    
    public static function init() {
        add_action('admin_menu', [__CLASS__, 'add_admin_menu']);
        add_action('admin_init', [__CLASS__, 'register_settings']);
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_admin_scripts']);
    }
    
    public static function add_admin_menu() {
        add_menu_page(
            __('MoneyBag CRM', 'moneybag-multirole'),
            __('MoneyBag CRM', 'moneybag-multirole'),
            'manage_options',
            'moneybag-multirole',
            [__CLASS__, 'admin_page'],
            'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91 2.57.6 4.18 1.51 4.18 3.88 0 1.82-1.33 2.96-3.12 3.16z"/></svg>'),
            30
        );
        
        add_submenu_page(
            'moneybag-multirole',
            __('CRM Settings', 'moneybag-multirole'),
            __('CRM Settings', 'moneybag-multirole'),
            'manage_options',
            'moneybag-multirole-settings',
            [__CLASS__, 'settings_page']
        );
    }
    
    public static function register_settings() {
        register_setting('moneybag_multirole_settings', 'moneybag_environment');
        register_setting('moneybag_multirole_settings', 'moneybag_test_mode');
        register_setting('moneybag_multirole_settings', 'moneybag_crm_enabled');
        register_setting('moneybag_multirole_settings', 'moneybag_crm_api_key');
        register_setting('moneybag_multirole_settings', 'moneybag_crm_base_url');
    }
    
    public static function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'moneybag-multirole') === false) {
            return;
        }
        
        wp_enqueue_style(
            'moneybag-admin-styles',
            MONEYBAG_MULTIROLE_URL . 'assets/css/admin.css',
            [],
            MONEYBAG_MULTIROLE_VERSION
        );
        
        wp_enqueue_script(
            'moneybag-admin-script',
            MONEYBAG_MULTIROLE_URL . 'assets/js/admin.js',
            ['jquery'],
            MONEYBAG_MULTIROLE_VERSION,
            true
        );
        
        wp_localize_script('moneybag-admin-script', 'moneybagAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('test_crm_connection'),
            'strings' => [
                'testing' => __('Testing connection...', 'moneybag-multirole'),
                'success' => __('Connection successful!', 'moneybag-multirole'),
                'error' => __('Connection failed', 'moneybag-multirole')
            ]
        ]);
    }
    
    public static function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('MoneyBag CRM Dashboard', 'moneybag-multirole'); ?></h1>
            
            <div class="moneybag-admin-dashboard">
                <div class="dashboard-cards">
                    <div class="dashboard-card">
                        <h3><?php _e('API Status', 'moneybag-multirole'); ?></h3>
                        <div class="status-indicator">
                            <span class="status-dot status-<?php echo get_option('moneybag_test_mode', 'yes') === 'yes' ? 'test' : 'live'; ?>"></span>
                            <?php echo get_option('moneybag_test_mode', 'yes') === 'yes' ? __('Test Mode', 'moneybag-multirole') : __('Live Mode', 'moneybag-multirole'); ?>
                        </div>
                        <p><?php _e('Environment:', 'moneybag-multirole'); ?> <strong><?php echo ucfirst(get_option('moneybag_environment', 'staging')); ?></strong></p>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3><?php _e('CRM Integration', 'moneybag-multirole'); ?></h3>
                        <div class="status-indicator">
                            <span class="status-dot status-<?php echo get_option('moneybag_crm_enabled') === 'yes' ? 'enabled' : 'disabled'; ?>"></span>
                            <?php echo get_option('moneybag_crm_enabled') === 'yes' ? __('Enabled', 'moneybag-multirole') : __('Disabled', 'moneybag-multirole'); ?>
                        </div>
                        <p><?php _e('Sync leads and opportunities automatically', 'moneybag-multirole'); ?></p>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3><?php _e('Forms Status', 'moneybag-multirole'); ?></h3>
                        <ul class="form-status-list">
                            <li><span class="status-active"></span> <?php _e('Merchant Registration', 'moneybag-multirole'); ?></li>
                            <li><span class="status-active"></span> <?php _e('Pricing Calculator', 'moneybag-multirole'); ?></li>
                            <li><span class="status-active"></span> <?php _e('Sandbox Registration', 'moneybag-multirole'); ?></li>
                        </ul>
                    </div>
                </div>
                
                <div class="dashboard-actions">
                    <h2><?php _e('Quick Actions', 'moneybag-multirole'); ?></h2>
                    <div class="action-buttons">
                        <a href="<?php echo admin_url('admin.php?page=moneybag-multirole-settings'); ?>" class="button button-primary">
                            <?php _e('CRM Settings', 'moneybag-multirole'); ?>
                        </a>
                        <button id="test-crm-connection" class="button button-secondary">
                            <?php _e('Test CRM Connection', 'moneybag-multirole'); ?>
                        </button>
                        <a href="<?php echo admin_url('admin.php?page=elementor'); ?>" class="button">
                            <?php _e('Manage Elementor Widgets', 'moneybag-multirole'); ?>
                        </a>
                    </div>
                </div>
                
                <div id="connection-test-results" class="connection-results" style="display: none;">
                    <h3><?php _e('Connection Test Results', 'moneybag-multirole'); ?></h3>
                    <div class="results-content"></div>
                </div>
            </div>
        </div>
        <?php
    }
    
    public static function settings_page() {
        if (isset($_POST['submit'])) {
            check_admin_referer('moneybag_settings_nonce');
            
            update_option('moneybag_environment', sanitize_text_field($_POST['moneybag_environment']));
            update_option('moneybag_test_mode', isset($_POST['moneybag_test_mode']) ? 'yes' : 'no');
            update_option('moneybag_crm_enabled', isset($_POST['moneybag_crm_enabled']) ? 'yes' : 'no');
            update_option('moneybag_crm_api_key', sanitize_text_field($_POST['moneybag_crm_api_key']));
            update_option('moneybag_crm_base_url', esc_url_raw($_POST['moneybag_crm_base_url']));
            
            echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!', 'moneybag-multirole') . '</p></div>';
        }
        ?>
        <div class="wrap">
            <h1><?php _e('MoneyBag CRM Settings', 'moneybag-multirole'); ?></h1>
            
            <form method="post" action="">
                <?php wp_nonce_field('moneybag_settings_nonce'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Environment', 'moneybag-multirole'); ?></th>
                        <td>
                            <select name="moneybag_environment">
                                <option value="staging" <?php selected(get_option('moneybag_environment', 'staging'), 'staging'); ?>><?php _e('Staging', 'moneybag-multirole'); ?></option>
                                <option value="production" <?php selected(get_option('moneybag_environment'), 'production'); ?>><?php _e('Production', 'moneybag-multirole'); ?></option>
                            </select>
                            <p class="description"><?php _e('Select the API environment to use.', 'moneybag-multirole'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Test Mode', 'moneybag-multirole'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="moneybag_test_mode" value="yes" <?php checked(get_option('moneybag_test_mode', 'yes'), 'yes'); ?> />
                                <?php _e('Enable test mode (uses fallback responses if API fails)', 'moneybag-multirole'); ?>
                            </label>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('CRM Integration', 'moneybag-multirole'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="moneybag_crm_enabled" value="yes" <?php checked(get_option('moneybag_crm_enabled'), 'yes'); ?> />
                                <?php _e('Enable CRM synchronization', 'moneybag-multirole'); ?>
                            </label>
                            <p class="description"><?php _e('Automatically sync form submissions with your CRM system.', 'moneybag-multirole'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('CRM API Key', 'moneybag-multirole'); ?></th>
                        <td>
                            <input type="password" name="moneybag_crm_api_key" value="<?php echo esc_attr(get_option('moneybag_crm_api_key')); ?>" class="regular-text" />
                            <p class="description"><?php _e('Enter your CRM API key or JWT token.', 'moneybag-multirole'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('CRM Base URL', 'moneybag-multirole'); ?></th>
                        <td>
                            <input type="url" name="moneybag_crm_base_url" value="<?php echo esc_attr(get_option('moneybag_crm_base_url')); ?>" class="regular-text" />
                            <p class="description"><?php _e('Example: https://api.tubeonai.com or https://api.moneybag.com.bd', 'moneybag-multirole'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <div class="crm-test-section">
                    <h2><?php _e('Connection Test', 'moneybag-multirole'); ?></h2>
                    <p><?php _e('Test your CRM connection to ensure proper integration.', 'moneybag-multirole'); ?></p>
                    <button type="button" id="test-crm-connection" class="button button-secondary">
                        <?php _e('Test Connection', 'moneybag-multirole'); ?>
                    </button>
                    <div id="connection-test-results" class="connection-results" style="display: none; margin-top: 20px;">
                        <div class="results-content"></div>
                    </div>
                </div>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}