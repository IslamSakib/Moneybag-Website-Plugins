<?php

/**
 * Plugin Name: Moneybag Pricing Form
 * Description: Elementor widget for multi-step pricing and consultation form
 * Version: 1.1.0
 * Author: Sakib Islam
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

define('MONEYBAG_FORM_URL', plugin_dir_url(__FILE__));
define('MONEYBAG_FORM_PATH', plugin_dir_path(__FILE__));

class MoneybagPricingForm
{

    public function __construct()
    {
        add_action('plugins_loaded', [$this, 'init']);
        // Add debug logging
        add_action('wp_footer', [$this, 'debug_footer']);
    }

    public function debug_footer()
    {
        if (is_admin()) return;
?>
        <script>
            console.log('=== MONEYBAG PLUGIN DEBUG ===');
            console.log('Plugin URL: <?php echo MONEYBAG_FORM_URL; ?>');
            console.log('moneybagAjax available:', typeof window.moneybagAjax);
            if (typeof window.moneybagAjax !== 'undefined') {
                console.log('AJAX URL:', window.moneybagAjax.ajaxurl);
                console.log('Nonce:', window.moneybagAjax.nonce);
            }
            console.log('React available:', typeof window.React);
            console.log('ReactDOM available:', typeof window.ReactDOM);
            console.log('Babel available:', typeof window.Babel);
            console.log('MoneybagPricingForm available:', typeof window.MoneybagPricingForm);
            console.log('=== END PLUGIN DEBUG ===');
        </script>
        <?php
    }

    public function init()
    {
        // Check if Elementor is active
        if (!did_action('elementor/loaded')) {
            add_action('admin_notices', [$this, 'admin_notice_missing_elementor']);
            return;
        }

        // Register widget
        add_action('elementor/widgets/widgets_registered', [$this, 'register_widgets']);

        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);

        // Add AJAX handlers
        add_action('wp_ajax_get_pricing_data', [$this, 'get_pricing_data']);
        add_action('wp_ajax_nopriv_get_pricing_data', [$this, 'get_pricing_data']);

        add_action('wp_ajax_submit_consultation', [$this, 'submit_consultation']);
        add_action('wp_ajax_nopriv_submit_consultation', [$this, 'submit_consultation']);
    }

    public function admin_notice_missing_elementor()
    {
        if (isset($_GET['activate'])) unset($_GET['activate']);
        $message = sprintf(
            esc_html__('"%1$s" requires "%2$s" to be installed and activated.', 'moneybag-form'),
            '<strong>' . esc_html__('Moneybag Pricing Form', 'moneybag-form') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'moneybag-form') . '</strong>'
        );
        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

    public function register_widgets()
    {
        require_once MONEYBAG_FORM_PATH . 'includes/widgets/pricing-form-widget.php';
        \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MoneybagPricingFormWidget());
    }

    public function enqueue_scripts()
    {
        // Only load on frontend
        if (is_admin()) return;

        // Enqueue React from CDN
        wp_enqueue_script(
            'react',
            'https://unpkg.com/react@18/umd/react.development.js',
            [],
            '18.0.0',
            false // Load in head
        );

        wp_enqueue_script(
            'react-dom',
            'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
            ['react'],
            '18.0.0',
            false // Load in head
        );

        wp_enqueue_script(
            'babel-standalone',
            'https://unpkg.com/@babel/standalone/babel.min.js',
            [],
            '7.0.0',
            false // Load in head
        );

        // Our React component
        wp_enqueue_script(
            'moneybag-form',
            MONEYBAG_FORM_URL . 'includes/assets/js/moneybag-form.js',
            ['react', 'react-dom', 'babel-standalone'],
            '1.1.0',
            true // Load in footer
        );

        // AJAX data
        wp_localize_script('moneybag-form', 'moneybagAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_nonce'),
            'debug' => WP_DEBUG
        ]);

        // CSS
        wp_enqueue_style(
            'moneybag-form',
            MONEYBAG_FORM_URL . 'includes/assets/css/moneybag-form.css',
            [],
            '1.1.0'
        );

        // Add script loading debug
        add_action('wp_footer', function () {
        ?>
            <script>
                console.log('=== SCRIPT LOADING DEBUG ===');
                console.log('React script loaded:', document.querySelector('script[src*="react"]') !== null);
                console.log('ReactDOM script loaded:', document.querySelector('script[src*="react-dom"]') !== null);
                console.log('Babel script loaded:', document.querySelector('script[src*="babel"]') !== null);
                console.log('Moneybag script loaded:', document.querySelector('script[src*="moneybag-form"]') !== null);
            </script>
<?php
        }, 999);
    }

    public function get_pricing_data()
    {
        // Add debug logging
        error_log('Moneybag: get_pricing_data called');
        error_log('Moneybag: POST data: ' . print_r($_POST, true));

        check_ajax_referer('moneybag_nonce', 'nonce');

        $legal_identity = sanitize_text_field($_POST['legalIdentity']);
        $business_category = sanitize_text_field($_POST['businessCategory']);
        $transaction_volume = sanitize_text_field($_POST['monthlyTransactionVolume']);
        $service_type = sanitize_text_field($_POST['serviceType']);

        error_log("Moneybag: Filtering data for {$legal_identity}, {$business_category}, {$transaction_volume}, {$service_type}");

        // Load pricing data from JSON file
        $pricing_file = MONEYBAG_FORM_PATH . 'data/pricing-data.json';
        $pricing_data = [];

        if (file_exists($pricing_file)) {
            $pricing_data = json_decode(file_get_contents($pricing_file), true);
            error_log('Moneybag: JSON file loaded successfully');
        } else {
            error_log('Moneybag: JSON file not found at ' . $pricing_file);
        }

        // Filter pricing based on form data
        $filtered_data = $this->filter_pricing_data($pricing_data, [
            'legalIdentity' => $legal_identity,
            'businessCategory' => $business_category,
            'monthlyTransactionVolume' => $transaction_volume,
            'serviceType' => $service_type
        ]);

        error_log('Moneybag: Filtered data: ' . print_r($filtered_data, true));

        wp_send_json_success($filtered_data);
    }

    public function submit_consultation()
    {
        check_ajax_referer('moneybag_nonce', 'nonce');

        $form_data = [
            'legalIdentity' => sanitize_text_field($_POST['legalIdentity']),
            'businessCategory' => sanitize_text_field($_POST['businessCategory']),
            'monthlyTransactionVolume' => sanitize_text_field($_POST['monthlyTransactionVolume']),
            'serviceType' => sanitize_text_field($_POST['serviceType']),
            'maxAmount' => sanitize_text_field($_POST['maxAmount']),
            'domainName' => sanitize_text_field($_POST['domainName']),
            'name' => sanitize_text_field($_POST['name']),
            'email' => sanitize_email($_POST['email']),
            'mobile' => sanitize_text_field($_POST['mobile'])
        ];

        // Save to database
        $this->save_consultation_data($form_data);

        wp_send_json_success(['message' => 'Consultation request submitted successfully']);
    }

    private function filter_pricing_data($pricing_data, $filters)
    {
        $legal_identity = $filters['legalIdentity'];
        $business_category = $filters['businessCategory'];
        $transaction_volume = $filters['monthlyTransactionVolume'];
        $service_type = $filters['serviceType'];

        // Extract transaction volume numbers for range comparison
        $volume_parts = explode('-', $transaction_volume);
        $volume_number = 0;
        if (count($volume_parts) >= 2) {
            $volume_number = (int)$volume_parts[0]; // Use lower bound for comparison
        }

        // Check rules in order
        if (isset($pricing_data['rules']) && is_array($pricing_data['rules'])) {
            foreach ($pricing_data['rules'] as $rule) {
                if ($this->matches_rule($rule, $legal_identity, $business_category, $volume_number, $service_type)) {
                    return $this->format_rule_result($pricing_data, $rule);
                }
            }
        }

        // Default fallback
        return $this->get_default_pricing_data();
    }

    private function matches_rule($rule, $legal_identity, $business_category, $volume_number, $service_type)
    {
        if (!isset($rule['if'])) {
            return false;
        }

        $conditions = $rule['if'];

        // Check for catch-all rule
        if (isset($conditions['any']) && $conditions['any'] === true) {
            return true;
        }

        // Check legal identity
        if (isset($conditions['legal_identity']) && $conditions['legal_identity'] !== $legal_identity) {
            return false;
        }

        // Check business category
        if (isset($conditions['business_category']) && $conditions['business_category'] !== $business_category) {
            return false;
        }

        // Check service type
        if (isset($conditions['service_type'])) {
            if (is_array($conditions['service_type']) && isset($conditions['service_type']['any'])) {
                // Any service type is allowed
            } else if ($conditions['service_type'] !== $service_type) {
                return false;
            }
        }

        // Check transaction volume
        if (isset($conditions['monthly_txn_volume'])) {
            $volume_condition = $conditions['monthly_txn_volume'];

            if (is_array($volume_condition)) {
                if (isset($volume_condition['any']) && $volume_condition['any'] === true) {
                    // Any volume is allowed
                } else if (isset($volume_condition['between']) && is_array($volume_condition['between'])) {
                    $min = $volume_condition['between'][0];
                    $max = $volume_condition['between'][1];
                    if ($volume_number < $min || $volume_number > $max) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    private function format_rule_result($pricing_data, $rule)
    {
        if (!isset($rule['show'])) {
            return $this->get_default_pricing_data();
        }

        $show = $rule['show'];
        $result = [
            'pricing' => [],
            'documents' => [],
            'negotiable' => false,
            'negotiation_text' => ''
        ];

        // Get documents
        if (isset($show['documents_set']) && isset($pricing_data['sets']['documents'][$show['documents_set']])) {
            $documents_set = $pricing_data['sets']['documents'][$show['documents_set']];
            $result['documents'] = [];

            foreach ($documents_set as $doc) {
                $label = $doc['label'];
                if ($doc['optional']) {
                    $label .= ' (Optional)';
                }
                $result['documents'][] = $label;
            }
        }

        // Get pricing
        if (isset($show['pricing_set']) && isset($pricing_data['sets']['pricing'][$show['pricing_set']])) {
            $pricing_set = $pricing_data['sets']['pricing'][$show['pricing_set']];

            // Convert decimal rates to percentage strings
            $result['pricing']['monthlyFee'] = $this->format_rate($pricing_set['monthly_fee']);

            // Add card rates
            if (isset($pricing_set['cards'])) {
                foreach ($pricing_set['cards'] as $card => $rate) {
                    $formatted_key = $this->format_pricing_key($card);
                    $result['pricing'][$formatted_key] = $this->format_rate($rate);
                }
            }

            // Add wallet rates
            if (isset($pricing_set['wallets'])) {
                foreach ($pricing_set['wallets'] as $wallet => $rate) {
                    $formatted_key = $this->format_pricing_key($wallet);
                    $result['pricing'][$formatted_key] = $this->format_rate($rate);
                }
            }

            // Add negotiation info
            $result['negotiable'] = isset($pricing_set['negotiable']) ? $pricing_set['negotiable'] : false;
            $result['negotiation_text'] = isset($pricing_set['negotiation_text']) ? $pricing_set['negotiation_text'] : '';
        }

        return $result;
    }

    private function format_rate($decimal_rate)
    {
        return number_format($decimal_rate * 100, 1) . '%';
    }

    private function format_pricing_key($key)
    {
        // Convert snake_case to camelCase for consistency with frontend
        $formatted = str_replace('_', ' ', $key);
        $formatted = ucwords($formatted);
        $formatted = str_replace(' ', '', $formatted);
        $formatted = lcfirst($formatted);

        // Handle special cases
        $replacements = [
            'dinersClub' => 'dinersClub',
            'nexusCard' => 'nexusCard',
            'bkash' => 'bkash',
            'nagad' => 'nagad',
            'rocket' => 'rocket',
            'upay' => 'upay'
        ];

        return isset($replacements[$formatted]) ? $replacements[$formatted] : $formatted;
    }

    private function get_default_pricing_data()
    {
        return [
            'pricing' => [
                'monthlyFee' => '2.3%',
                'visa' => '2.3%',
                'mastercard' => '2.3%',
                'amex' => '2.3%',
                'unionpay' => '2.3%',
                'dinersClub' => '2.3%',
                'nexusCard' => '2.3%',
                'bkash' => '2.3%',
                'nagad' => '2.3%',
                'rocket' => '2.3%',
                'upay' => '2.3%'
            ],
            'documents' => [
                'Digital Business Identification Number (DBID)',
                'TIN Certificate',
                'MEF (Merchant Enrollment Form)',
                'Trade License',
                'VAT Document (Optional)',
                'Authorization letter for signatories'
            ],
            'negotiable' => true,
            'negotiation_text' => 'Contact us to discuss your needs and negotiate a better price.'
        ];
    }

    private function save_consultation_data($form_data)
    {
        global $wpdb;

        $table_name = $wpdb->prefix . 'moneybag_consultations';

        $wpdb->insert(
            $table_name,
            [
                'legal_identity' => $form_data['legalIdentity'],
                'business_category' => $form_data['businessCategory'],
                'monthly_transaction_volume' => $form_data['monthlyTransactionVolume'],
                'service_type' => $form_data['serviceType'],
                'max_amount' => $form_data['maxAmount'],
                'domain_name' => $form_data['domainName'],
                'name' => $form_data['name'],
                'email' => $form_data['email'],
                'mobile' => $form_data['mobile'],
                'created_at' => current_time('mysql')
            ]
        );
    }
}

// Activation hook
register_activation_hook(__FILE__, 'moneybag_create_table');

function moneybag_create_table()
{
    global $wpdb;

    $table_name = $wpdb->prefix . 'moneybag_consultations';

    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        legal_identity varchar(100) NOT NULL,
        business_category varchar(100) NOT NULL,
        monthly_transaction_volume varchar(50) NOT NULL,
        service_type varchar(100) NOT NULL,
        max_amount varchar(50),
        domain_name varchar(255),
        name varchar(100) NOT NULL,
        email varchar(100) NOT NULL,
        mobile varchar(20) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

new MoneybagPricingForm();
