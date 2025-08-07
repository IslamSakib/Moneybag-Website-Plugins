<?php

namespace MoneyBag_Pricing_Form;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Main Plugin Class
 */
class Plugin
{

    public function __construct()
    {
        add_action('wp_ajax_submit_pricing_form', [$this, 'handle_form_submission']);
        add_action('wp_ajax_nopriv_submit_pricing_form', [$this, 'handle_form_submission']);
    }

    /**
     * Handle form submission via AJAX
     */
    public function handle_form_submission()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'moneybag_pricing_form_nonce')) {
            wp_die('Security check failed');
        }

        $form_data = sanitize_text_field($_POST['form_data']);
        $parsed_data = json_decode(stripslashes($form_data), true);

        // Process form data
        $response = [
            'success' => true,
            'message' => __('Thank you for your submission!', 'moneybag-pricing-form'),
            'data' => $parsed_data
        ];

        // Save to database or send email here
        // $this->save_form_data($parsed_data);
        // $this->send_notification_email($parsed_data);

        wp_send_json($response);
    }

    /**
     * Save form data to database
     */
    private function save_form_data($data)
    {
        global $wpdb;

        $table_name = $wpdb->prefix . 'moneybag_pricing_forms';

        $wpdb->insert(
            $table_name,
            [
                'form_data' => json_encode($data),
                'submitted_at' => current_time('mysql'),
                'ip_address' => $this->get_client_ip()
            ]
        );
    }

    /**
     * Send notification email
     */
    private function send_notification_email($data)
    {
        $to = get_option('admin_email');
        $subject = 'New Pricing Form Submission';

        $message = "New pricing form submission:\n\n";
        $message .= "Project Type: " . $data['step1']['projectType'] . "\n";
        $message .= "Budget: " . $data['step1']['budget'] . "\n";
        $message .= "Timeline: " . $data['step2']['timeline'] . "\n";
        $message .= "Name: " . $data['step3']['name'] . "\n";
        $message .= "Email: " . $data['step3']['email'] . "\n";
        $message .= "Company: " . $data['step3']['company'] . "\n";
        $message .= "Requirements: " . $data['step4']['requirements'] . "\n";

        wp_mail($to, $subject, $message);
    }

    /**
     * Get client IP address
     */
    private function get_client_ip()
    {
        $ipkeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        foreach ($ipkeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
    }
}

new Plugin();
