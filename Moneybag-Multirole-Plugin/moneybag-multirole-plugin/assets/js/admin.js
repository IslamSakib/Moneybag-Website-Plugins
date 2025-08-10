/**
 * MoneyBag Multirole Plugin - Admin JavaScript
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Test CRM Connection
    $('#test-crm-connection').on('click', function(e) {
        e.preventDefault();
        
        const $button = $(this);
        const $results = $('#connection-test-results');
        const $content = $('.results-content');
        
        // Show loading state
        $button.addClass('loading').text(moneybagAdmin.strings.testing);
        $results.show();
        $content.removeClass('success error').text('Testing connection...');
        
        // Make AJAX request
        $.ajax({
            url: moneybagAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'test_crm_connection',
                nonce: moneybagAdmin.nonce
            },
            timeout: 30000, // 30 second timeout
            success: function(response) {
                if (response.success) {
                    $content.addClass('success').html(formatSuccessResponse(response.data));
                } else {
                    $content.addClass('error').html(formatErrorResponse(response.data));
                }
            },
            error: function(xhr, status, error) {
                let errorMessage = 'Connection failed: ';
                if (status === 'timeout') {
                    errorMessage += 'Request timed out. Please check your network connection.';
                } else if (xhr.responseJSON && xhr.responseJSON.data) {
                    errorMessage += xhr.responseJSON.data.message || error;
                } else {
                    errorMessage += error || 'Unknown error occurred';
                }
                
                $content.addClass('error').text(errorMessage);
            },
            complete: function() {
                // Reset button state
                $button.removeClass('loading').text('Test Connection');
            }
        });
    });
    
    function formatSuccessResponse(data) {
        let output = '✅ ' + data.message + '\n\n';
        
        if (data.status_code) {
            output += 'HTTP Status: ' + data.status_code + '\n';
        }
        
        if (data.endpoint) {
            output += 'Working Endpoint: ' + data.endpoint + '\n';
        }
        
        if (data.crm_system_detected) {
            output += 'CRM System: ' + data.crm_system_detected + '\n';
        }
        
        if (data.response_preview) {
            output += '\nResponse Preview:\n' + data.response_preview;
        }
        
        if (data.debug_info && Array.isArray(data.debug_info)) {
            output += '\n\nDebug Information:\n';
            data.debug_info.forEach(function(info, index) {
                output += (index + 1) + '. ' + info.endpoint;
                if (info.status_code) {
                    output += ' → ' + info.status_code;
                }
                if (info.error) {
                    output += ' → ' + info.error;
                }
                output += '\n';
            });
        }
        
        return output;
    }
    
    function formatErrorResponse(data) {
        let output = '❌ ' + data.message + '\n\n';
        
        if (data.status_code) {
            output += 'HTTP Status: ' + data.status_code + '\n';
        }
        
        if (data.server_status) {
            output += 'Server Status: ' + data.server_status + '\n';
        }
        
        if (data.suggestion) {
            output += '\nSuggestion: ' + data.suggestion + '\n';
        }
        
        if (data.help) {
            output += '\nHelp: ' + data.help + '\n';
        }
        
        if (data.crm_system_detected) {
            output += '\nDetected CRM: ' + data.crm_system_detected + '\n';
        }
        
        if (data.expected_endpoints) {
            output += '\nExpected Endpoints:\n';
            Object.keys(data.expected_endpoints).forEach(function(endpoint) {
                output += '• ' + endpoint + ' - ' + data.expected_endpoints[endpoint] + '\n';
            });
        }
        
        if (data.tested_endpoints && Array.isArray(data.tested_endpoints)) {
            output += '\nTested Endpoints:\n';
            data.tested_endpoints.forEach(function(endpoint, index) {
                output += (index + 1) + '. ' + endpoint + '\n';
            });
        }
        
        if (data.debug_info && Array.isArray(data.debug_info)) {
            output += '\nDebug Information:\n';
            data.debug_info.forEach(function(info, index) {
                output += (index + 1) + '. ' + info.endpoint;
                if (info.status_code) {
                    output += ' → ' + info.status_code;
                }
                if (info.error) {
                    output += ' → ' + info.error;
                }
                output += '\n';
            });
        }
        
        return output;
    }
    
    // Auto-save settings on change
    $('input[name="moneybag_test_mode"], input[name="moneybag_crm_enabled"]').on('change', function() {
        const $checkbox = $(this);
        const settingName = $checkbox.attr('name');
        const isChecked = $checkbox.is(':checked');
        
        // Visual feedback
        $checkbox.parent().append('<span class="auto-save-indicator"> ⏳</span>');
        
        $.ajax({
            url: moneybagAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'save_moneybag_setting',
                setting: settingName,
                value: isChecked ? 'yes' : 'no',
                nonce: moneybagAdmin.nonce
            },
            success: function(response) {
                $('.auto-save-indicator').html(' ✅').delay(2000).fadeOut();
            },
            error: function() {
                $('.auto-save-indicator').html(' ❌').delay(2000).fadeOut();
            }
        });
    });
    
    // Copy API endpoints to clipboard
    $(document).on('click', '.copy-endpoint', function(e) {
        e.preventDefault();
        const endpoint = $(this).data('endpoint');
        
        // Create temporary input to copy text
        const $temp = $('<input>');
        $('body').append($temp);
        $temp.val(endpoint).select();
        document.execCommand('copy');
        $temp.remove();
        
        // Visual feedback
        $(this).text('Copied!').delay(1000).queue(function() {
            $(this).text('Copy').dequeue();
        });
    });
});