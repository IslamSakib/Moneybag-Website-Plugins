<?php
if (!defined('ABSPATH')) {
    exit;
}

class MoneyBagElementorLoader {
    
    public static function init() {
        add_action('elementor/widgets/register', [__CLASS__, 'register_widgets']);
        add_action('elementor/elements/categories_registered', [__CLASS__, 'add_widget_category']);
        add_action('elementor/frontend/after_enqueue_styles', [__CLASS__, 'enqueue_widget_styles']);
    }
    
    public static function register_widgets($widgets_manager) {
        // Include the single unified widget file
        require_once MONEYBAG_MULTIROLE_PATH . 'includes/elementor/widgets/multirole-widget.php';
        
        // Register the single multirole widget
        $widgets_manager->register(new MoneyBag_Multirole_Widget());
    }
    
    public static function add_widget_category($elements_manager) {
        $elements_manager->add_category(
            'moneybag',
            [
                'title' => __('MoneyBag', 'moneybag-multirole'),
                'icon' => 'fa fa-plug',
            ]
        );
    }
    
    public static function enqueue_widget_styles() {
        wp_enqueue_style(
            'moneybag-widget-styles',
            MONEYBAG_MULTIROLE_URL . 'assets/css/moneybag-multirole.css',
            [],
            MONEYBAG_MULTIROLE_VERSION
        );
    }
}