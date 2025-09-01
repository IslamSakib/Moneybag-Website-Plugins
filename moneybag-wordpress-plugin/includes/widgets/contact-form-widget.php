<?php
/**
 * Contact Form Widget for Elementor
 * 
 * Provides a secure contact form with CRM integration
 * Creates people, opportunities, and notes in the CRM system
 */

namespace MoneybagPlugin\Widgets;

if (!defined('ABSPATH')) {
    exit;
}

class Contact_Form_Widget extends \Elementor\Widget_Base {
    
    /**
     * Get widget name
     */
    public function get_name() {
        return 'moneybag-contact-form';
    }
    
    /**
     * Get widget title
     */
    public function get_title() {
        return __('Moneybag Contact Form', 'moneybag-plugin');
    }
    
    /**
     * Get widget icon
     */
    public function get_icon() {
        return 'eicon-form-horizontal';
    }
    
    /**
     * Get widget categories
     */
    public function get_categories() {
        return ['moneybag'];
    }
    
    /**
     * Register widget controls
     * Following the simplified pattern with no customization controls
     */
    protected function register_controls() {
        // No controls as per v2.0.0 architecture
        // All styling handled by global CSS
    }
    
    /**
     * Render widget output on the frontend
     */
    protected function render() {
        $widget_id = $this->get_id();
        ?>
        <div id="moneybag-contact-form-<?php echo esc_attr($widget_id); ?>" class="moneybag-form contact-form-container">
            <!-- React component will mount here -->
        </div>
        
        <script type="text/javascript">
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof wp !== 'undefined' && wp.element && window.MoneybagContactForm) {
                    const { render } = wp.element;
                    const container = document.getElementById('moneybag-contact-form-<?php echo esc_js($widget_id); ?>');
                    
                    if (container) {
                        render(
                            wp.element.createElement(window.MoneybagContactForm, {
                                ajaxUrl: '<?php echo esc_js(admin_url('admin-ajax.php')); ?>',
                                nonce: '<?php echo esc_js(wp_create_nonce('moneybag_contact_nonce')); ?>',
                                widgetId: '<?php echo esc_js($widget_id); ?>'
                            }),
                            container
                        );
                    }
                }
            });
        </script>
        <?php
    }
    
    /**
     * Render widget output in the editor
     */
    protected function content_template() {
        ?>
        <div class="moneybag-form contact-form-container">
            <div class="elementor-alert elementor-alert-info">
                Contact Form Widget - Form will be displayed on the frontend
            </div>
        </div>
        <?php
    }
}