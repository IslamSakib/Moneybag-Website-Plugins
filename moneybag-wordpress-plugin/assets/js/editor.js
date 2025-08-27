(function() {
    'use strict';
    
    // Elementor editor enhancements for Moneybag widgets
    jQuery(window).on('elementor:init', function() {
        elementor.hooks.addAction('panel/open_editor/widget/moneybag-sandbox-form', function(panel, model, view) {
            // Add any editor-specific functionality here
            // Moneybag Sandbox Form widget opened in editor
        });
    });
    
})();