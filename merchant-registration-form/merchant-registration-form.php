<?php

/**
 * Plugin Name: Merchant Registration Form
 * Description: Elementor widget for merchant registration form with React JS
 * Version: 1.0.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

define('MRF_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MRF_PLUGIN_PATH', plugin_dir_path(__FILE__));

class MerchantRegistrationForm
{

    public function __construct()
    {
        add_action('plugins_loaded', [$this, 'init']);
    }

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
        add_action('wp_ajax_mrf_validate_step', [$this, 'ajax_validate_step']);
        add_action('wp_ajax_nopriv_mrf_validate_step', [$this, 'ajax_validate_step']);
        add_action('wp_ajax_mrf_submit_form', [$this, 'ajax_submit_form']);
        add_action('wp_ajax_nopriv_mrf_submit_form', [$this, 'ajax_submit_form']);
        add_action('wp_ajax_mrf_upload_file', [$this, 'ajax_upload_file']);
        add_action('wp_ajax_nopriv_mrf_upload_file', [$this, 'ajax_upload_file']);
    }

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

    public function init_widgets()
    {
        require_once(MRF_PLUGIN_PATH . 'widgets/merchant-registration-widget.php');
        \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \MRF_Widget());
    }

    public function enqueue_scripts()
    {
        wp_enqueue_script('react', 'https://unpkg.com/react@17/umd/react.production.min.js', [], '17.0.0', true);
        wp_enqueue_script('react-dom', 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js', ['react'], '17.0.0', true);

        wp_enqueue_script(
            'mrf-script',
            MRF_PLUGIN_URL . 'assets/js/merchant-form.js',
            ['react', 'react-dom'],
            '1.0.0',
            true
        );

        wp_enqueue_style(
            'mrf-style',
            MRF_PLUGIN_URL . 'assets/css/merchant-form.css',
            [],
            '1.0.0'
        );

        wp_localize_script('mrf-script', 'mrfAjax', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mrf_nonce')
        ]);
    }

    public function ajax_validate_step()
    {
        if (!wp_verify_nonce($_POST['nonce'], 'mrf_nonce')) {
            wp_die('Security check failed');
        }

        $step = intval($_POST['step']);
        $data = json_decode(stripslashes($_POST['data']), true);
        $errors = [];
        $valid = true;

        // Basic validation logic
        switch ($step) {
            case 1:
                if (empty($data['legalIdentity'])) {
                    $errors['legalIdentity'] = 'Legal Identity is required';
                    $valid = false;
                }
                if (empty($data['businessCategory'])) {
                    $errors['businessCategory'] = 'Business Category is required';
                    $valid = false;
                }
                if (empty($data['currencyType'])) {
                    $errors['currencyType'] = 'Currency Type is required';
                    $valid = false;
                }
                break;

            case 2:
                if (empty($data['merchantRegisteredName'])) {
                    $errors['merchantRegisteredName'] = 'Merchant Registered Name is required';
                    $valid = false;
                }
                if (empty($data['tradingName'])) {
                    $errors['tradingName'] = 'Trading Name is required';
                    $valid = false;
                }
                break;

            case 3:
                if (empty($data['name'])) {
                    $errors['name'] = 'Name is required';
                    $valid = false;
                }
                if (empty($data['email']) || !is_email($data['email'])) {
                    $errors['email'] = 'Valid email is required';
                    $valid = false;
                }
                if (empty($data['mobileNumber'])) {
                    $errors['mobileNumber'] = 'Mobile Number is required';
                    $valid = false;
                }
                break;

            case 4:
                // File validation would go here
                break;
        }

        wp_send_json_success([
            'valid' => $valid,
            'errors' => $errors
        ]);
    }

    public function ajax_submit_form()
    {
        if (!wp_verify_nonce($_POST['nonce'], 'mrf_nonce')) {
            wp_die('Security check failed');
        }

        $formData = json_decode(stripslashes($_POST['formData']), true);

        // Here you would save the data to database or send to external API
        // For demo purposes, we'll just return success

        $application_id = 'MRF-' . time();
        $registration_id = 'REG-' . uniqid();

        wp_send_json_success([
            'message' => 'Your merchant registration has been submitted successfully!',
            'application_id' => $application_id,
            'registration_id' => $registration_id
        ]);
    }

    public function ajax_upload_file()
    {
        if (!wp_verify_nonce($_POST['nonce'], 'mrf_nonce')) {
            wp_die('Security check failed');
        }

        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        $upload_overrides = array('test_form' => false);
        $uploaded_files = array();

        foreach ($_FILES as $field_name => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                $movefile = wp_handle_upload($file, $upload_overrides);

                if ($movefile && !isset($movefile['error'])) {
                    $uploaded_files[$field_name] = [
                        'filename' => basename($movefile['file']),
                        'url' => $movefile['url']
                    ];
                } else {    
                    wp_send_json_error(['message' => $movefile['error']]);
                }
            }
        }

        wp_send_json_success(['files' => $uploaded_files]);
    }
}

new MerchantRegistrationForm();
