(function() {
    'use strict';
    
    const { createElement: h, useState, useEffect, Fragment } = wp.element;
    
    // Admin Settings Info Cards Component
    function AdminInfoCards() {
        // Get Elementor status from PHP
        const elementorActive = moneybagAdminSettings.elementorActive || false;
        
        return h('div', { className: 'moneybag-info-cards' },
            h('div', { className: 'card' },
                h('h3', null, '📋 Plugin Status'),
                h('ul', null,
                    h('li', null, h('strong', null, 'Sandbox Form Widget:'), ' ✅ Active'),
                    h('li', null, h('strong', null, 'Pricing Plan Widget:'), ' ✅ Active'),
                    h('li', null, h('strong', null, 'Merchant Registration Widget:'), ' ✅ Active'),
                    h('li', null, 
                        h('strong', null, 'Elementor Integration:'), 
                        elementorActive ? ' ✅ Active' : ' ❌ Not Found'
                    )
                )
            ),
            h('div', { className: 'card' },
                h('h3', null, '🔗 Quick Links'),
                h('ul', null,
                    h('li', null, 
                        h('a', { 
                            href: moneybagAdminSettings.crmPageUrl 
                        }, 'CRM Integration')
                    ),
                    h('li', null, 
                        h('a', { 
                            href: '#', 
                            onClick: (e) => {
                                e.preventDefault();
                                alert('Please configure your Sandbox API URL in the settings above to access your sandbox environment.');
                            }
                        }, 'Your Sandbox Environment')
                    ),
                    h('li', null, 
                        h('span', { style: { color: '#666' } }, 'API Documentation - Contact your API provider for documentation')
                    )
                )
            )
        );
    }
    
    // Password Toggle Component
    function PasswordToggle({ fieldId }) {
        const [isVisible, setIsVisible] = useState(false);
        
        const togglePassword = () => {
            const field = document.getElementById(fieldId);
            if (field) {
                const newType = field.type === 'password' ? 'text' : 'password';
                field.type = newType;
                setIsVisible(newType === 'text');
            }
        };
        
        return h('button', {
            type: 'button',
            className: 'button button-secondary admin-toggle-btn',
            onClick: togglePassword
        }, isVisible ? 'Hide' : 'Show');
    }
    
    // CRM Test Component
    function CRMTestSection() {
        const [isLoading, setIsLoading] = useState(false);
        const [testResult, setTestResult] = useState(null);
        const [resultType, setResultType] = useState('');
        
        const testCRMConnection = async () => {
            setIsLoading(true);
            setTestResult(null);
            
            try {
                const response = await wp.apiFetch({
                    url: moneybagAdminSettings.ajaxUrl,
                    method: 'POST',
                    body: new URLSearchParams({
                        action: 'test_crm_connection',
                        nonce: moneybagAdminSettings.nonce
                    })
                });
                
                if (response.success) {
                    setResultType('success');
                    setTestResult({
                        message: response.data.message,
                        details: response.data.details,
                        testDataSent: response.data.test_data_sent,
                        responseData: response.data.response_data
                    });
                } else {
                    setResultType('error');
                    // Handle the error properly - check if it's an object or string
                    const errorMessage = typeof response.data === 'string'
                        ? response.data
                        : (response.data?.message || JSON.stringify(response.data));

                    setTestResult({
                        message: 'CRM Connection Failed',
                        error: errorMessage,
                        testDataSent: response.data?.test_data_sent,
                        apiUrlUsed: response.data?.api_url_used
                    });
                }
            } catch (error) {
                setResultType('error');
                setTestResult({
                    message: 'Request Failed',
                    error: error.message
                });
            } finally {
                setIsLoading(false);
                
                // Auto-hide after 30 seconds
                setTimeout(() => {
                    setTestResult(null);
                }, 30000);
            }
        };
        
        return h('div', { className: 'crm-test-section' },
            h('h2', null, '🧪 Test CRM Connection'),
            h('div', { className: 'notice notice-info inline' },
                h('p', null, '💡 ', h('strong', null, 'Important:'), ' Save your CRM settings first, then test the connection with sample data. The test will create a real person in your CRM system.')
            ),
            
            h('button', {
                type: 'button',
                className: 'button button-primary',
                onClick: testCRMConnection,
                disabled: isLoading
            }, isLoading ? 'Testing...' : 'Test CRM Connection'),
            
            testResult && h('div', {
                className: `${resultType}-result admin-result-message`
            },
                h('h4', null, resultType === 'success' ? '✅ ' : '❌ ', testResult.message),
                resultType === 'success' && testResult.details ?
                    h('div', { className: 'success-details' },
                        h('ul', null,
                            h('li', null, h('strong', null, 'Status Code:'), ' ', testResult.details.status_code),
                            testResult.details.company_id && h('li', null, h('strong', null, '🏢 Test Company ID:'), ' ',
                                h('code', null, testResult.details.company_id)
                            ),
                            testResult.details.test_company && h('li', null, h('strong', null, '🏢 Company Name:'), ' ',
                                h('code', null, testResult.details.test_company)
                            ),
                            h('li', null, h('strong', null, '👤 Test Person ID:'), ' ',
                                h('code', null, testResult.details.person_id)
                            ),
                            h('li', null, h('strong', null, '📧 Test Email:'), ' ',
                                h('code', null, testResult.details.test_email)
                            ),
                            h('li', null, h('strong', null, '📱 Phone:'), ' Added to person record')
                        ),
                        testResult.testDataSent && h('div', {
                            style: {
                                marginTop: '15px',
                                padding: '10px',
                                backgroundColor: '#f0f4f8',
                                borderRadius: '4px'
                            }
                        },
                            h('h5', null, '📤 Data Sent to CRM:'),
                            h('pre', {
                                style: {
                                    backgroundColor: 'white',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '12px'
                                }
                            }, JSON.stringify(testResult.testDataSent, null, 2))
                        ),
                        testResult.responseData && h('details', {
                            style: { marginTop: '10px' }
                        },
                            h('summary', { style: { cursor: 'pointer', fontWeight: 'bold' } }, 'CRM Response Data'),
                            h('pre', {
                                style: {
                                    backgroundColor: '#f5f5f5',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '12px'
                                }
                            }, JSON.stringify(testResult.responseData, null, 2))
                        )
                    ) :
                    h('div', { className: 'error-details' },
                        h('p', null, h('strong', null, 'Error:'), ' ', testResult.error),
                        testResult.apiUrlUsed && h('p', null,
                            h('strong', null, 'API Endpoint:'), ' ',
                            h('code', null, testResult.apiUrlUsed)
                        ),
                        testResult.testDataSent && h('div', {
                            style: {
                                marginTop: '15px',
                                padding: '10px',
                                backgroundColor: '#fff3cd',
                                borderRadius: '4px'
                            }
                        },
                            h('h5', null, '📤 Data Attempted to Send:'),
                            h('pre', {
                                style: {
                                    backgroundColor: 'white',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '12px'
                                }
                            }, JSON.stringify(testResult.testDataSent, null, 2))
                        ),
                        h('details', {
                            style: { marginTop: '15px' }
                        },
                            h('summary', {
                                style: {
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    color: '#d73502'
                                }
                            }, 'Show Full Error Details'),
                            h('pre', {
                                style: {
                                    backgroundColor: '#f5f5f5',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '11px',
                                    marginTop: '10px'
                                }
                            }, JSON.stringify(response, null, 2))
                        )
                    )
            )
        );
    }
    
    // CRM Info Component
    function CRMInfoSection() {
        return h('div', { className: 'crm-info-section' },
            h('h3', null, '📚 CRM Integration Information'),
            h('div', { className: 'crm-info-grid' },
                h('div', { className: 'info-card' },
                    h('h4', null, 'What gets created:'),
                    h('ol', null,
                        h('li', null, h('strong', null, 'Person'), ' - Contact details'),
                        h('li', null, h('strong', null, 'Opportunity'), ' - Linked to the person'),
                        h('li', null, h('strong', null, 'Note'), ' - Form submission details'),
                        h('li', null, h('strong', null, 'Note Target'), ' - Links note to opportunity')
                    )
                ),
                h('div', { className: 'info-card' },
                    h('h4', null, 'Required CRM API Permissions:'),
                    h('ul', null,
                        h('li', null, 'Create People'),
                        h('li', null, 'Create Opportunities'),
                        h('li', null, 'Create Notes'),
                        h('li', null, 'Create Note Targets')
                    )
                )
            )
        );
    }
    
    // Initialize React components when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize password toggles for existing password fields
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            const toggleContainer = document.createElement('span');
            field.parentNode.insertBefore(toggleContainer, field.nextSibling);
            
            wp.element.render(
                h(PasswordToggle, { fieldId: field.id }),
                toggleContainer
            );
        });
        
        // Initialize info cards on general settings page
        const infoCardsContainer = document.getElementById('moneybag-info-cards-container');
        if (infoCardsContainer) {
            wp.element.render(
                h(AdminInfoCards),
                infoCardsContainer
            );
        }
        
        // Initialize CRM components on CRM settings page
        const crmTestContainer = document.getElementById('crm-test-container');
        if (crmTestContainer) {
            wp.element.render(
                h(CRMTestSection),
                crmTestContainer
            );
        }
        
        const crmInfoContainer = document.getElementById('crm-info-container');
        if (crmInfoContainer) {
            wp.element.render(
                h(CRMInfoSection),
                crmInfoContainer
            );
        }
    });
    
})();