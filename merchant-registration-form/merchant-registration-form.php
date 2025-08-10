<?php

/**
 * Plugin Name: Merchant Registration Form
 * Description: Elementor widget for merchant registration form with React JS
 * Version: 1.0.0
 * Author: Sakib Islam
 * Text Domain: merchant-registration-form
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MRF_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MRF_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('MRF_PLUGIN_VERSION', '1.0.0');

/**
 * Main Plugin Class
 */
class MerchantRegistrationForm
{
    /**
     * Constructor
     */
    public function __construct()
    {
        add_action('plugins_loaded', [$this, 'init']);
        register_activation_hook(__FILE__, [$this, 'activate']);
    }

    /**
     * Initialize plugin
     */
    public function init()
    {
        // Check if Elementor is installed and activated
        if (!did_action('elementor/loaded')) {
            add_action('admin_notices', [$this, 'admin_notice_missing_main_plugin']);
            return;
        }

        // Add Plugin actions
        add_action('elementor/widgets/widgets_registered', [$this, 'init_widgets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);

        // AJAX handlers
        add_action('wp_ajax_mrf_validate_step', [$this, 'ajax_validate_step']);
        add_action('wp_ajax_nopriv_mrf_validate_step', [$this, 'ajax_validate_step']);
        add_action('wp_ajax_mrf_submit_form', [$this, 'ajax_submit_form']);
        add_action('wp_ajax_nopriv_mrf_submit_form', [$this, 'ajax_submit_form']);
        add_action('wp_ajax_mrf_upload_file', [$this, 'ajax_upload_file']);
        add_action('wp_ajax_nopriv_mrf_upload_file', [$this, 'ajax_upload_file']);
    }

    /**
     * Plugin activation
     */
    public function activate()
    {
        $this->create_database_tables();
        $this->create_upload_directory();
    }

    /**
     * Create upload directory for merchant documents
     */
    private function create_upload_directory()
    {
        $upload_dir = wp_upload_dir();
        $merchant_dir = $upload_dir['basedir'] . '/merchant-registrations';

        if (!file_exists($merchant_dir)) {
            wp_mkdir_p($merchant_dir);

            // Add .htaccess for security
            $htaccess_content = "Options -Indexes\n";
            $htaccess_content .= "<FilesMatch '\.(jpg|jpeg|png|gif|pdf|doc|docx)$'>\n";
            $htaccess_content .= "Order Allow,Deny\n";
            $htaccess_content .= "Allow from all\n";
            $htaccess_content .= "</FilesMatch>\n";
            file_put_contents($merchant_dir . '/.htaccess', $htaccess_content);
        }
    }

    /**
     * Create database tables
     */
    private function create_database_tables()
    {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $table_name = $wpdb->prefix . 'merchant_registrations';

        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id int(11) NOT NULL AUTO_INCREMENT,
            application_id varchar(50) NOT NULL,
            registration_id varchar(50) NOT NULL,
            legal_identity varchar(50),
            business_category varchar(50),
            monthly_volume varchar(50),
            max_amount decimal(10,2),
            currency_type varchar(10),
            payment_methods text,
            merchant_registered_name varchar(255),
            trading_name varchar(255),
            domain_name varchar(255),
            contact_name varchar(255),
            designation varchar(100),
            email varchar(255),
            mobile_number varchar(50),
            phone_number varchar(50),
            business_logo varchar(500),
            trade_license varchar(500),
            id_document varchar(500),
            tin_certificate varchar(500),
            submission_ip varchar(50),
            user_agent text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY application_id (application_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Admin notice for missing Elementor
     */
    public function admin_notice_missing_main_plugin()
    {
        if (isset($_GET['activate'])) unset($_GET['activate']);

        $message = sprintf(
            esc_html__('"%1$s" requires "%2$s" to be installed and activated.', 'merchant-registration-form'),
            '<strong>' . esc_html__('Merchant Registration Form', 'merchant-registration-form') . '</strong>',
            '<strong>' . esc_html__('Elementor', 'merchant-registration-form') . '</strong>'
        );

        printf('<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message);
    }

    /**
     * Initialize widgets
     */
    public function init_widgets()
    {
        require_once(MRF_PLUGIN_PATH . 'widgets/merchant-registration-widget.php');
        \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MRF_Widget());
    }

    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts()
    {
        // React from CDN
        wp_enqueue_script('react', 'https://unpkg.com/react@17/umd/react.production.min.js', [], '17.0.0', true);
        wp_enqueue_script('react-dom', 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js', ['react'], '17.0.0', true);

        // Plugin scripts
        wp_enqueue_script(
            'mrf-script',
            MRF_PLUGIN_URL . 'assets/js/merchant-form.js',
            ['react', 'react-dom'],
            MRF_PLUGIN_VERSION,
            true
        );

        // Plugin styles
        wp_enqueue_style(
            'mrf-style',
            MRF_PLUGIN_URL . 'assets/css/merchant-form.css',
            [],
            MRF_PLUGIN_VERSION
        );

        // Localize script
        wp_localize_script('mrf-script', 'mrfAjax', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mrf_nonce'),
            'pluginUrl' => MRF_PLUGIN_URL,
            'maxFileSize' => '5242880', // 5MB in bytes
            'allowedFileTypes' => [
                'image' => ['jpg', 'jpeg', 'png', 'gif'],
                'document' => ['pdf', 'doc', 'docx']
            ]
        ]);
    }

    /**
     * AJAX handler for step validation
     */
    public function ajax_validate_step()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'mrf_nonce')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }

        $step = intval($_POST['step']);
        $data = json_decode(stripslashes($_POST['data']), true);

        // Return success for client-side validation
        // The actual validation is handled on the client side for instant feedback
        wp_send_json_success([
            'valid' => true,
            'errors' => []
        ]);
    }

    /**
     * AJAX handler for form submission
     */
    public function ajax_submit_form()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'mrf_nonce')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }

        $formData = json_decode(stripslashes($_POST['formData']), true);

        // Generate unique IDs
        $application_id = 'MRF-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        $registration_id = 'REG-' . strtoupper(uniqid());

        // Prepare data for database
        $db_data = [
            'application_id' => $application_id,
            'registration_id' => $registration_id,
            'legal_identity' => sanitize_text_field($formData['legalIdentity']),
            'business_category' => sanitize_text_field($formData['businessCategory']),
            'monthly_volume' => sanitize_text_field($formData['monthlyVolume']),
            'max_amount' => floatval($formData['maxAmount']),
            'currency_type' => sanitize_text_field($formData['currencyType']),
            'payment_methods' => json_encode($formData['paymentMethods']),
            'merchant_registered_name' => sanitize_text_field($formData['merchantRegisteredName']),
            'trading_name' => sanitize_text_field($formData['tradingName']),
            'domain_name' => esc_url_raw($formData['domainName']),
            'contact_name' => sanitize_text_field($formData['name']),
            'designation' => sanitize_text_field($formData['designation']),
            'email' => sanitize_email($formData['email']),
            'mobile_number' => sanitize_text_field($formData['mobileNumber']),
            'phone_number' => sanitize_text_field($formData['phoneNumber']),
            'business_logo' => sanitize_text_field($formData['businessLogo']),
            'trade_license' => sanitize_text_field($formData['tradeLicense']),
            'id_document' => sanitize_text_field($formData['idDocument']),
            'tin_certificate' => sanitize_text_field($formData['tinCertificate']),
            'submission_ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT']
        ];

        // Save to database
        global $wpdb;
        $table_name = $wpdb->prefix . 'merchant_registrations';

        $result = $wpdb->insert($table_name, $db_data);

        if ($result === false) {
            wp_send_json_error([
                'message' => 'Failed to save application. Please try again.',
                'error' => $wpdb->last_error
            ]);
            return;
        }

        // Send email notifications
        $this->send_admin_notification($db_data);
        $this->send_confirmation_email($db_data);

        wp_send_json_success([
            'message' => 'Your merchant registration has been submitted successfully! We will review your application and contact you within 1-3 business days.',
            'application_id' => $application_id,
            'registration_id' => $registration_id
        ]);
    }

    /**
     * AJAX handler for file upload with enhanced support
     */
    public function ajax_upload_file()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'mrf_nonce')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }

        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        // Define allowed file types for each field
        $allowed_mimes = [
            // Images
            'jpg|jpeg|jpe' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            // Documents
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        $uploaded_files = array();

        foreach ($_FILES as $field_name => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                // Validate file size (5MB max)
                if ($file['size'] > 5242880) {
                    wp_send_json_error([
                        'message' => 'File size must be less than 5MB'
                    ]);
                    return;
                }

                // Get file extension
                $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

                // Validate file type
                $valid_extensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'];
                if (!in_array($file_extension, $valid_extensions)) {
                    wp_send_json_error([
                        'message' => 'Invalid file type. Allowed types: JPG, PNG, GIF, PDF, DOC, DOCX'
                    ]);
                    return;
                }

                // Special validation for business logo (images only)
                if ($field_name === 'businessLogo' && !in_array($file_extension, ['jpg', 'jpeg', 'png', 'gif'])) {
                    wp_send_json_error([
                        'message' => 'Business logo must be an image file (JPG, PNG, or GIF)'
                    ]);
                    return;
                }

                // Sanitize filename
                $file['name'] = sanitize_file_name($file['name']);
                // Add timestamp to filename to avoid conflicts
                $file['name'] = time() . '_' . $field_name . '_' . $file['name'];

                // Set upload directory
                add_filter('upload_dir', [$this, 'custom_upload_directory']);

                $upload_overrides = array(
                    'test_form' => false,
                    'mimes' => $allowed_mimes
                );

                $movefile = wp_handle_upload($file, $upload_overrides);

                // Remove the filter
                remove_filter('upload_dir', [$this, 'custom_upload_directory']);

                if ($movefile && !isset($movefile['error'])) {
                    $uploaded_files[$field_name] = [
                        'filename' => basename($movefile['file']),
                        'url' => $movefile['url'],
                        'type' => $movefile['type'],
                        'size' => $file['size']
                    ];
                } else {
                    wp_send_json_error(['message' => $movefile['error']]);
                    return;
                }
            }
        }

        wp_send_json_success(['files' => $uploaded_files]);
    }

    /**
     * Custom upload directory for merchant files
     */
    public function custom_upload_directory($upload)
    {
        $upload['subdir'] = '/merchant-registrations/' . date('Y/m');
        $upload['path'] = $upload['basedir'] . $upload['subdir'];
        $upload['url'] = $upload['baseurl'] . $upload['subdir'];

        // Create directory if it doesn't exist
        if (!file_exists($upload['path'])) {
            wp_mkdir_p($upload['path']);
        }

        return $upload;
    }

    /**
     * Send admin notification email
     */
    private function send_admin_notification($data)
    {
        $admin_email = get_option('admin_email');
        $subject = '[Merchant Registration] New Application - ' . $data['application_id'];

        $message = "A new merchant registration has been submitted.\n\n";
        $message .= "=== APPLICATION DETAILS ===\n\n";
        $message .= "Application ID: {$data['application_id']}\n";
        $message .= "Registration ID: {$data['registration_id']}\n";
        $message .= "Date: " . date('Y-m-d H:i:s') . "\n\n";

        $message .= "=== BUSINESS INFORMATION ===\n\n";
        $message .= "Legal Identity: {$data['legal_identity']}\n";
        $message .= "Business Category: {$data['business_category']}\n";
        $message .= "Business Name: {$data['merchant_registered_name']}\n";
        $message .= "Trading Name: {$data['trading_name']}\n";
        $message .= "Domain: {$data['domain_name']}\n";
        $message .= "Monthly Volume: {$data['monthly_volume']}\n";
        $message .= "Max Transaction: {$data['max_amount']} {$data['currency_type']}\n\n";

        $message .= "=== CONTACT INFORMATION ===\n\n";
        $message .= "Contact Person: {$data['contact_name']}\n";
        $message .= "Designation: {$data['designation']}\n";
        $message .= "Email: {$data['email']}\n";
        $message .= "Mobile: {$data['mobile_number']}\n";
        $message .= "Phone: {$data['phone_number']}\n\n";

        $message .= "=== PAYMENT METHODS ===\n\n";
        $payment_methods = json_decode($data['payment_methods'], true);
        $selected_methods = array_keys(array_filter($payment_methods));
        $message .= implode(', ', $selected_methods) . "\n\n";

        $message .= "=== SUBMITTED DOCUMENTS ===\n\n";
        $message .= "Business Logo: " . ($data['business_logo'] ? 'Uploaded' : 'Not uploaded') . "\n";
        $message .= "Trade License: " . ($data['trade_license'] ? 'Uploaded' : 'Not uploaded') . "\n";
        $message .= "ID Document: " . ($data['id_document'] ? 'Uploaded' : 'Not uploaded') . "\n";
        $message .= "TIN Certificate: " . ($data['tin_certificate'] ? 'Uploaded' : 'Not uploaded') . "\n\n";

        $message .= "=== SUBMISSION INFO ===\n\n";
        $message .= "IP Address: {$data['submission_ip']}\n";
        $message .= "User Agent: {$data['user_agent']}\n";

        wp_mail($admin_email, $subject, $message);
    }

    /**
     * Send confirmation email to applicant
     */
    private function send_confirmation_email($data)
    {
        $subject = 'Application Received - ' . get_bloginfo('name');

        $message = "Dear {$data['contact_name']},\n\n";
        $message .= "Thank you for submitting your merchant registration application.\n\n";
        $message .= "We have successfully received your application with the following details:\n\n";
        $message .= "Application ID: {$data['application_id']}\n";
        $message .= "Registration ID: {$data['registration_id']}\n";
        $message .= "Business Name: {$data['merchant_registered_name']}\n";
        $message .= "Submission Date: " . date('Y-m-d H:i:s') . "\n\n";
        $message .= "WHAT HAPPENS NEXT?\n";
        $message .= "1. Our team will review your application within 1-3 business days\n";
        $message .= "2. We may contact you if we need additional information\n";
        $message .= "3. You will receive an email once your application is approved\n";
        $message .= "4. After approval, you will receive your merchant credentials\n\n";
        $message .= "If you have any questions, please don't hesitate to contact us.\n\n";
        $message .= "Best regards,\n";
        $message .= get_bloginfo('name') . " Team\n\n";
        $message .= "---\n";
        $message .= "This is an automated email. Please do not reply to this message.";

        wp_mail($data['email'], $subject, $message);
    }
}

// Initialize the plugin
new MerchantRegistrationForm();
