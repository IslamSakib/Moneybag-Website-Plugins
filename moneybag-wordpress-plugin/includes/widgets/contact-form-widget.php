<?php

/**
 * Contact Form Widget for Elementor
 */

namespace MoneybagPlugin\Widgets;

if (!defined('ABSPATH')) {
    exit;
}

class Contact_Form_Widget extends \Elementor\Widget_Base
{
    public function get_name()
    {
        return 'moneybag-contact-form';
    }

    public function get_title()
    {
        return __('Moneybag Contact Form', 'moneybag-plugin');
    }

    public function get_icon()
    {
        return 'eicon-form-horizontal';
    }

    public function get_categories()
    {
        return ['moneybag'];
    }

    /**
     * Tells Elementor to load moneybag-global.css only on pages with this widget.
     * The handle must be registered via wp_register_style() — done in class-moneybag-assets.php.
     */
    public function get_style_depends()
    {
        return ['moneybag-global'];
    }

    /**
     * Tells Elementor to load contact-form.js only on pages with this widget.
     * The handle must be registered via wp_register_script() — done in class-moneybag-assets.php.
     */
    public function get_script_depends()
    {
        return ['moneybag-contact-form'];
    }

    protected function register_controls()
    {
        // No controls needed
    }

    protected function render()
    {
        $widget_id = $this->get_id();

        $config = [
            'recaptcha_site_key' => get_option('moneybag_recaptcha_site_key', ''),
        ];
?>
        <div id="moneybag-contact-form-<?php echo esc_attr($widget_id); ?>" class="moneybag-form contact-form-container"></div>

        <script type="text/javascript">
            (function() {
                function initMoneybagContact() {
                    if (typeof wp !== 'undefined' && wp.element && window.MoneybagContactForm) {
                        var container = document.getElementById('moneybag-contact-form-<?php echo esc_js($widget_id); ?>');
                        if (container) {
                            wp.element.render(
                                wp.element.createElement(window.MoneybagContactForm, {
                                    ajaxUrl: '<?php echo esc_js(admin_url('admin-ajax.php')); ?>',
                                    widgetId: '<?php echo esc_js($widget_id); ?>',
                                    config: <?php echo wp_json_encode($config); ?>
                                }),
                                container
                            );
                        }
                    } else {
                        setTimeout(initMoneybagContact, 50);
                    }
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initMoneybagContact);
                } else {
                    initMoneybagContact();
                }
            })();
        </script>
    <?php
    }

    protected function content_template()
    {
    ?>
        <div class="moneybag-form contact-form-container">
            <div class="elementor-alert elementor-alert-info">
                Contact Form Widget — Form renders on the frontend.
            </div>
        </div>
<?php
    }
}
