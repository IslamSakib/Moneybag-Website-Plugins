<?php
namespace MoneybagPlugin\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if (!defined('ABSPATH')) {
    exit;
}

class SandboxFormWidget extends Widget_Base {
    
    public function get_name() {
        return 'moneybag-sandbox-form';
    }
    
    public function get_title() {
        return __('Moneybag Sandbox Form', 'moneybag-plugin');
    }
    
    public function get_icon() {
        return 'eicon-form-horizontal';
    }
    
    public function get_categories() {
        return ['moneybag'];
    }
    
    public function get_keywords() {
        return ['moneybag', 'form', 'sandbox', 'payment'];
    }
    
    public function get_script_depends() {
        return ['moneybag-sandbox-form'];
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
            // API URL removed - now handled securely on server-side
            'redirect_url' => '',
            'form_title' => __('Sandbox Account Registration', 'moneybag-plugin'),
            'primary_color' => '#ff6b6b',
            'recaptcha_site_key' => get_option('moneybag_recaptcha_site_key', ''),
            'plugin_url' => MONEYBAG_PLUGIN_URL
        ];
        ?>
        <div class="moneybag-sandbox-form-wrapper moneybag-form" data-config='<?php echo esc_attr(json_encode($form_config)); ?>'>
            <div id="moneybag-sandbox-form-<?php echo esc_attr($widget_id); ?>">
                <div class="moneybag-loading">
                    <p><?php echo __('Loading form...', 'moneybag-plugin'); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
    
    protected function content_template() {
        ?>
        <div class="moneybag-sandbox-form-wrapper">
            <div class="moneybag-form-preview">
                <h3><?php echo __('Sandbox Account Registration', 'moneybag-plugin'); ?></h3>
                <p><?php echo __('Moneybag Sandbox Form Preview - This will render the React component on frontend', 'moneybag-plugin'); ?></p>
                <div style="background: #f4f6f9; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.08);">
                        <p style="color: #5f6d7e; margin: 0;"><?php echo __('Multi-step sandbox registration form will appear here', 'moneybag-plugin'); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}

