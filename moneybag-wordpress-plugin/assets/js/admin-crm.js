(function($) {
    'use strict';
    
    $(document).ready(function() {
        $('#test-crm-btn').on('click', function() {
            const button = $(this);
            const resultsDiv = $('#crm-test-results');
            
            // Disable button and show loading
            button.prop('disabled', true).text('Testing...');
            resultsDiv.hide().removeClass('success-result error-result');
            
            // Make AJAX request
            $.post(moneybagAdmin.ajaxurl, {
                action: 'test_crm_connection',
                nonce: moneybagAdmin.nonce
            })
            .done(function(response) {
                if (response.success) {
                    resultsDiv
                        .addClass('success-result')
                        .html(`
                            <h4>✅ ${response.data.message}</h4>
                            <ul>
                                <li><strong>Status Code:</strong> ${response.data.details.status_code}</li>
                                <li><strong>Test Person ID:</strong> ${response.data.details.person_id}</li>
                                <li><strong>Test Email:</strong> ${response.data.details.test_email}</li>
                            </ul>
                            <p><em>A test person was successfully created in your CRM.</em></p>
                        `)
                        .show();
                } else {
                    resultsDiv
                        .addClass('error-result')
                        .html(`
                            <h4>❌ CRM Connection Failed</h4>
                            <p><strong>Error:</strong> ${response.data}</p>
                            <details>
                                <summary>Show technical details</summary>
                                <pre>${JSON.stringify(response, null, 2)}</pre>
                            </details>
                        `)
                        .show();
                }
            })
            .fail(function(xhr, status, error) {
                resultsDiv
                    .addClass('error-result')
                    .html(`
                        <h4>❌ Request Failed</h4>
                        <p><strong>Error:</strong> ${error}</p>
                        <p><strong>Status:</strong> ${status}</p>
                        <p>Please check your internet connection and CRM settings.</p>
                    `)
                    .show();
            })
            .always(function() {
                // Re-enable button
                button.prop('disabled', false).text('Test CRM Connection');
            });
        });
        
        // Auto-hide success/error messages after 30 seconds
        setTimeout(function() {
            $('#crm-test-results').fadeOut();
        }, 30000);
    });
    
})(jQuery);