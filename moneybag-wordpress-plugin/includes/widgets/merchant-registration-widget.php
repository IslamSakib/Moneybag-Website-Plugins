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
        return ['moneybag-global', 'moneybag-merchant-registration'];
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
            'plugin_url' => MONEYBAG_PLUGIN_URL
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
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.08);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <div style="background: #1f2937; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">1</div>
                            <div style="background: #e5e7eb; color: #6b7280; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">2</div>
                            <div style="background: #e5e7eb; color: #6b7280; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">3</div>
                            <div style="background: #e5e7eb; color: #6b7280; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">4</div>
                        </div>
                        <p style="color: #6b7280; margin: 0; font-size: 14px;"><?php echo __('Multi-step merchant registration form will appear here', 'moneybag-plugin'); ?></p>
                        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;"><?php echo __('Business Info → Online Presence → Point of Contact → Documents', 'moneybag-plugin'); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}