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
                    // Format the test data for display
                    let testDataHtml = '<pre>' + JSON.stringify(response.data.test_data_sent, null, 2) + '</pre>';

                    // Format response data if available
                    let responseDataHtml = '';
                    if (response.data.response_data) {
                        responseDataHtml = `
                            <details style="margin-top: 10px;">
                                <summary><strong>CRM Response Data</strong></summary>
                                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(response.data.response_data, null, 2)}</pre>
                            </details>
                        `;
                    }

                    resultsDiv
                        .addClass('success-result')
                        .html(`
                            <h4>✅ ${response.data.message}</h4>
                            <div style="background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 10px 0;">
                                <h5>Connection Details:</h5>
                                <ul>
                                    <li><strong>Status Code:</strong> ${response.data.details.status_code}</li>
                                    <li><strong>Test Person ID:</strong> ${response.data.details.person_id}</li>
                                    <li><strong>Test Email:</strong> ${response.data.details.test_email}</li>
                                </ul>
                            </div>
                            <div style="background: #f0f4f8; padding: 15px; border-radius: 4px; margin: 10px 0;">
                                <h5>📤 Data Sent to CRM:</h5>
                                ${testDataHtml}
                            </div>
                            ${responseDataHtml}
                            <p style="margin-top: 15px;"><em>✓ A test person was successfully created in your CRM with the above data.</em></p>
                        `)
                        .show();
                } else {
                    // Format error details
                    let errorMessage = typeof response.data === 'string' ? response.data : response.data.message || 'Unknown error';

                    // Show test data that was attempted
                    let testDataHtml = '';
                    if (response.data && response.data.test_data_sent) {
                        testDataHtml = `
                            <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 10px 0;">
                                <h5>📤 Data Attempted to Send:</h5>
                                <pre style="background: white; padding: 10px; border-radius: 4px;">${JSON.stringify(response.data.test_data_sent, null, 2)}</pre>
                            </div>
                        `;
                    }

                    // Show API URL if available
                    let apiUrlHtml = '';
                    if (response.data && response.data.api_url_used) {
                        apiUrlHtml = `<p><strong>API Endpoint Used:</strong> <code>${response.data.api_url_used}</code></p>`;
                    }

                    resultsDiv
                        .addClass('error-result')
                        .html(`
                            <h4>❌ CRM Connection Failed</h4>
                            <p><strong>Error:</strong> ${errorMessage}</p>
                            ${apiUrlHtml}
                            ${testDataHtml}
                            <details style="margin-top: 10px;">
                                <summary>Show full technical details</summary>
                                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(response, null, 2)}</pre>
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