<?php
if (!defined('ABSPATH')) {
    exit;
}

class MoneyBagMultirole {
    
    private static $instance = null;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->includes();
        $this->init_hooks();
    }
    
    private function includes() {
        // Core includes with error checking
        $required_files = [
            'includes/class-ajax-handler.php',
            'includes/class-api-manager.php', 
            'includes/class-validation.php',
            'includes/class-crm-integration.php',
            'includes/class-pricing-calculator.php',
            'includes/admin/class-admin-settings.php'
        ];
        
        foreach ($required_files as $file) {
            $file_path = MONEYBAG_MULTIROLE_PATH . $file;
            if (file_exists($file_path)) {
                require_once $file_path;
            } else {
                error_log("MoneyBag Multirole: Missing required file: {$file}");
            }
        }
        
        // Elementor integration
        if (did_action('elementor/loaded')) {
            $elementor_file = MONEYBAG_MULTIROLE_PATH . 'includes/elementor/class-elementor-loader.php';
            if (file_exists($elementor_file)) {
                require_once $elementor_file;
            }
        }
    }
    
    private function init_hooks() {
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('admin_enqueue_scripts', [$this, 'admin_enqueue_scripts']);
        
        // Load plugin textdomain
        add_action('init', [$this, 'load_textdomain']);
        
        // Initialize components
        add_action('init', [$this, 'init_components']);
        
        // Check Elementor compatibility
        add_action('admin_notices', [$this, 'check_elementor']);
    }
    
    public function enqueue_scripts() {
        // React from multiple CDN sources for reliability
        wp_enqueue_script(
            'react',
            'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
            [],
            '18.2.0',
            true
        );
        
        wp_enqueue_script(
            'react-dom',
            'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
            ['react'],
            '18.2.0',
            true
        );
        
        // Main plugin styles
        wp_enqueue_style(
            'moneybag-multirole-styles',
            MONEYBAG_MULTIROLE_URL . 'assets/css/moneybag-multirole.css',
            [],
            MONEYBAG_MULTIROLE_VERSION
        );
        
        // Main plugin script
        wp_enqueue_script(
            'moneybag-multirole-script',
            MONEYBAG_MULTIROLE_URL . 'assets/js/moneybag-multirole.js',
            ['react', 'react-dom'],
            MONEYBAG_MULTIROLE_VERSION,
            true
        );
        
        // Localize script
        wp_localize_script('moneybag-multirole-script', 'moneybagMultirole', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_multirole_nonce'),
            'apiUrl' => get_rest_url(null, 'moneybag-multirole/v1'),
            'pluginUrl' => MONEYBAG_MULTIROLE_URL,
            'settings' => $this->get_public_settings()
        ]);
    }
    
    public function admin_enqueue_scripts() {
        // Empty function to prevent errors
    }
    
    public function load_textdomain() {
        load_plugin_textdomain(
            'moneybag-multirole',
            false,
            dirname(MONEYBAG_MULTIROLE_BASENAME) . '/languages'
        );
    }
    
    public function init_components() {
        // Initialize components with error checking
        if (class_exists('MoneyBagAjaxHandler')) {
            MoneyBagAjaxHandler::init();
        }
        
        if (class_exists('MoneyBagApiManager')) {
            MoneyBagApiManager::init();
        }
        
        if (class_exists('MoneyBagCrmIntegration')) {
            MoneyBagCrmIntegration::init();
        }
        
        // Initialize admin components
        if (is_admin() && class_exists('MoneyBagAdminSettings')) {
            MoneyBagAdminSettings::init();
        }
        
        // Initialize Elementor widgets
        if (did_action('elementor/loaded') && class_exists('MoneyBagElementorLoader')) {
            MoneyBagElementorLoader::init();
        }
    }
    
    public function check_elementor() {
        if (!did_action('elementor/loaded')) {
            $message = sprintf(
                __('%1$sMoneyBag Multirole Plugin%2$s requires %1$sElementor%2$s plugin to be active.', 'moneybag-multirole'),
                '<strong>',
                '</strong>'
            );
            
            printf('<div class="notice notice-warning"><p>%s</p></div>', $message);
        }
    }
    
    private function get_public_settings() {
        return [
            'validationRules' => get_option('moneybag_validation_rules', []),
            'apiEndpoints' => [
                'staging' => 'https://staging.api.moneybag.com.bd/api/v2',
                'production' => 'https://api.moneybag.com.bd/api/v2'
            ],
            'environment' => get_option('moneybag_environment', 'staging')
        ];
    }
    
    public static function activate() {
        // Set minimal default options
        self::set_default_options();
        
        // Clear rewrite rules
        flush_rewrite_rules();
    }
    
    public static function deactivate() {
        // Clean up scheduled events
        wp_clear_scheduled_hook('moneybag_multirole_daily_cleanup');
        
        // Clear rewrite rules
        flush_rewrite_rules();
    }
    
    // Database tables removed - no submissions storage needed
    
    private static function set_default_options() {
        // Minimal settings - just environment
        add_option('moneybag_environment', 'staging');
        add_option('moneybag_test_mode', 'yes');
    }
}