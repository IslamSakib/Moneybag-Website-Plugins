(function() {
    'use strict';
    
    const { createElement: h, useState, useEffect, Fragment } = wp.element;
    
    // Admin Settings Info Cards Component
    function AdminInfoCards() {
        const [elementorActive, setElementorActive] = useState(false);
        
        useEffect(() => {
            // Check if Elementor is active
            setElementorActive(typeof window.elementor !== 'undefined' || document.body.classList.contains('elementor-active'));
        }, []);
        
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
                            href: 'https://sandbox.moneybag.com.bd/', 
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        }, 'Moneybag Sandbox')
                    ),
                    h('li', null, 
                        h('a', { 
                            href: 'https://docs.moneybag.com.bd/', 
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        }, 'Documentation')
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
                        details: response.data.details
                    });
                } else {
                    setResultType('error');
                    setTestResult({
                        message: 'CRM Connection Failed',
                        error: response.data
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
            h('p', null, 'Test your CRM API connection with sample data. Make sure to save your settings first.'),
            
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
                    h('ul', null,
                        h('li', null, h('strong', null, 'Status Code:'), ' ', testResult.details.status_code),
                        h('li', null, h('strong', null, 'Test Person ID:'), ' ', testResult.details.person_id),
                        h('li', null, h('strong', null, 'Test Email:'), ' ', testResult.details.test_email)
                    ) :
                    h('p', null, h('strong', null, 'Error:'), ' ', testResult.error)
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