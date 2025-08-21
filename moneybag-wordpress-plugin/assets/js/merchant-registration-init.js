(function($) {
    'use strict';
    
    // Function to initialize the merchant registration form
    function initMerchantRegistrationForm() {
        $('.moneybag-merchant-form-wrapper').each(function() {
            const wrapper = $(this);
            const config = wrapper.data('config');
            
            if (!config || !config.widget_id) {
                console.error('Moneybag: Missing configuration for merchant registration form');
                return;
            }
            
            const container = document.getElementById('moneybag-merchant-form-' + config.widget_id);
            
            if (!container) {
                console.error('Moneybag: Container not found for widget ID:', config.widget_id);
                return;
            }
            
            // Check if React and ReactDOM are available
            if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
                console.error('Moneybag: React or ReactDOM not loaded');
                return;
            }
            
            // Clear loading message
            container.innerHTML = '';
            
            // Check React version and use appropriate API
            try {
                if (ReactDOM.createRoot) {
                    // React 18+
                    const root = ReactDOM.createRoot(container);
                    root.render(React.createElement(MerchantRegistrationForm, { config: config }));
                } else {
                    // React 17 and below
                    ReactDOM.render(
                        React.createElement(MerchantRegistrationForm, { config: config }), 
                        container
                    );
                }
                
                console.log('Moneybag: Merchant registration form initialized successfully');
            } catch (error) {
                console.error('Moneybag: Error initializing merchant registration form:', error);
                container.innerHTML = '<div class="error-message">Error loading form. Please refresh the page.</div>';
            }
        });
    }
    
    // Wait for document ready
    $(document).ready(function() {
        // Give React time to load
        setTimeout(initMerchantRegistrationForm, 500);
    });
    
    // Also try on window load as backup
    $(window).on('load', function() {
        if ($('.moneybag-merchant-form-wrapper').length > 0 && 
            $('#moneybag-merchant-form-' + $('.moneybag-merchant-form-wrapper').data('config')?.widget_id).children().length === 0) {
            initMerchantRegistrationForm();
        }
    });
    
})(jQuery);