<?php
namespace MoneybagPlugin\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if (!defined('ABSPATH')) {
    exit;
}

class MerchantRegistrationWidget extends Widget_Base {
    
    public function get_name() {
        return 'moneybag-merchant-registration';
    }
    
    public function get_title() {
        return __('Moneybag Merchant Registration', 'moneybag-plugin');
    }
    
    public function get_icon() {
        return 'eicon-form-horizontal';
    }
    
    public function get_categories() {
        return ['moneybag'];
    }
    
    public function get_keywords() {
        return ['moneybag', 'merchant', 'registration', 'business', 'form'];
    }
    
    public function get_script_depends() {
        return ['jquery', 'moneybag-merchant-registration'];
    }
    
    public function get_style_depends() {
        return ['moneybag-global'];
    }
    
    protected function register_controls() {
        // No controls needed - widget uses global styles
    }
    
    protected function render() {
        $widget_id = $this->get_id();
        $form_config = [
            'widget_id' => $widget_id,
            'redirect_url' => '',
            'form_title' => __('Merchant Registration', 'moneybag-plugin'),
            'primary_color' => '#1f2937',
            'success_color' => '#10b981',
            'error_color' => '#ef4444',
            'warning_color' => '#f59e0b',
            'enable_captcha' => true,
            'recaptcha_site_key' => get_option('moneybag_recaptcha_site_key', ''),
            'plugin_url' => MONEYBAG_PLUGIN_URL,
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('moneybag_merchant_nonce')
        ];
        ?>
        <div class="moneybag-merchant-form-wrapper" data-config='<?php echo esc_attr(json_encode($form_config)); ?>'>
            <div id="moneybag-merchant-form-<?php echo esc_attr($widget_id); ?>">
                <div class="moneybag-loading">
                    <div class="loading-spinner"></div>
                    <p><?php echo __('Loading merchant registration form...', 'moneybag-plugin'); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
    
    protected function content_template() {
        ?>
        <div class="moneybag-merchant-form-wrapper">
            <div class="merchant-form-preview">
                <h3><?php echo __('Merchant Registration', 'moneybag-plugin'); ?></h3>
                <p><?php echo __('Moneybag Merchant Registration Form Preview - This will render the React component on frontend', 'moneybag-plugin'); ?></p>
                <div class="moneybag-widget-placeholder moneybag-widget-placeholder-merchant">
                    <div class="moneybag-widget-placeholder-inner">
                        <div class="moneybag-progress-steps">
                            <div class="moneybag-progress-step moneybag-progress-step-active">1</div>
                            <div class="moneybag-progress-step moneybag-progress-step-inactive">2</div>
                            <div class="moneybag-progress-step moneybag-progress-step-inactive">3</div>
                        </div>
                        <p class="moneybag-widget-placeholder-text"><?php echo __('Multi-step merchant registration form will appear here', 'moneybag-plugin'); ?></p>
                        <p class="moneybag-widget-placeholder-subtext"><?php echo __('Business Info → Online Presence → Point of Contact', 'moneybag-plugin'); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}