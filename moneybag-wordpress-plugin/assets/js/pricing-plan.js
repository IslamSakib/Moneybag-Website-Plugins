(function() {
    'use strict';
    
    const { useState, useEffect, createElement } = wp.element;
    
    const PricingPlanForm = ({ config }) => {
        const [currentStep, setCurrentStep] = useState(1);
        const [loading, setLoading] = useState(false);
        const [errors, setErrors] = useState({});
        const [pricingRules, setPricingRules] = useState(null);
        const [selectedPricing, setSelectedPricing] = useState(null);
        const [selectedDocuments, setSelectedDocuments] = useState([]);
        const [showAllPricing, setShowAllPricing] = useState(false);
        
        const [formData, setFormData] = useState({
            legalIdentity: '',
            businessCategory: '',
            monthlyVolume: '',
            domainName: '',
            name: '',
            email: '',
            mobile: ''
        });

        // Load pricing rules from JSON
        useEffect(() => {
            const loadPricingRules = async () => {
                try {
                    const response = await fetch(`${window.location.origin}/wp-content/plugins/moneybag-wordpress-plugin/data/pricing-rules.json`);
                    const rules = await response.json();
                    setPricingRules(rules);
                } catch (error) {
                    // Failed to load pricing rules
                }
            };
            
            loadPricingRules();
        }, []);

        // Set default values when pricing rules are loaded
        useEffect(() => {
            if (pricingRules && !formData.businessCategory) {
                // Get first business category
                const firstBusinessCategory = Object.keys(pricingRules.businessCategories || {})[0] || '';
                
                // Get first legal identity for that business category
                const firstLegalIdentity = Object.keys(pricingRules.businessCategories?.[firstBusinessCategory]?.identities || {})[0] || '';
                
                const defaultValues = {
                    businessCategory: firstBusinessCategory,
                    legalIdentity: firstLegalIdentity,
                    monthlyVolume: '0-100000' // Default monthly volume
                };
                
                setFormData(prev => ({
                    ...prev,
                    ...defaultValues
                }));
            }
        }, [pricingRules, formData.businessCategory]);

        // Calculate pricing and documents based on form data
        useEffect(() => {
            if (pricingRules && formData.legalIdentity && formData.businessCategory) {
                calculatePricingAndDocuments();
            }
        }, [pricingRules, formData.legalIdentity, formData.businessCategory]);

        // Reset legal identity when business category changes
        useEffect(() => {
            if (pricingRules && formData.businessCategory) {
                // Get available legal identities for selected business category
                const availableLegalIdentities = Object.keys(pricingRules.businessCategories?.[formData.businessCategory]?.identities || {});
                
                // If current legal identity is not available for selected business category, reset it
                if (availableLegalIdentities.length > 0 && !availableLegalIdentities.includes(formData.legalIdentity)) {
                    setFormData(prev => ({
                        ...prev,
                        legalIdentity: availableLegalIdentities[0]
                    }));
                }
            }
        }, [formData.businessCategory, pricingRules]);

        // Force update pricing and documents when business category or legal identity changes (for Step 2)
        useEffect(() => {
            if (pricingRules && formData.businessCategory && formData.legalIdentity) {
                // Small delay to ensure state updates are processed
                const timer = setTimeout(() => {
                    calculatePricingAndDocuments();
                }, 10);
                return () => clearTimeout(timer);
            }
        }, [formData.businessCategory, formData.legalIdentity, pricingRules]);

        const calculatePricingAndDocuments = () => {
            if (!pricingRules) return;

            // Get documents from businessCategories structure based on both category and identity
            const businessCategoryData = pricingRules.businessCategories?.[formData.businessCategory];
            const legalIdentityData = businessCategoryData?.identities?.[formData.legalIdentity];
            
            if (legalIdentityData && legalIdentityData.required_documents) {
                // Set documents from the selected combination
                setSelectedDocuments(legalIdentityData.required_documents);
            } else {
                // Clear documents if no data found
                setSelectedDocuments([]);
            }
            
            // Set default pricing (you can customize this based on business category if needed)
            const serviceTypes = [
                // Popular services first
                { key: 'visa', label: 'VISA', category: 'cards' },
                { key: 'mastercard', label: 'MasterCard', category: 'cards' },
                { key: 'bkash', label: 'bKash', category: 'wallets' },
                { key: 'nagad', label: 'Nagad', category: 'wallets' },
                // Other services
                { key: 'amex', label: 'AMEX', category: 'cards' },
                { key: 'nexus_card', label: 'Nexus', category: 'cards' },
                { key: 'unionpay', label: 'UnionPay', category: 'cards' },
                { key: 'diners_club', label: 'Diners Club', category: 'cards' },
                { key: 'upay', label: 'Upay', category: 'wallets' },
                { key: 'rocket', label: 'Rocket', category: 'wallets' }
            ];
            
            // Default pricing rates - can be customized based on business category
            const isEducational = formData.businessCategory === 'Educational Institution';
            const defaultRate = isEducational ? 0.023 : 0.025;
            
            const pricingByService = serviceTypes.map(service => {
                let rate = (defaultRate * 100).toFixed(1) + '%';
                
                // Special rate for AMEX
                if (service.key === 'amex' && !isEducational) {
                    rate = '3.5%';
                }
                
                return {
                    key: service.key,
                    label: service.label,
                    category: service.category,
                    rate: rate
                };
            });
            
            setSelectedPricing({
                name: 'Custom Plan',
                services: pricingByService,
                negotiable: true,
                negotiation_text: 'Book FREE Call for custom pricing'
            });
        };

        // Use global form validator
        const validateFieldInstantly = (name, value) => {
            if (!window.MoneybagValidation) {
                // MoneybagValidation not loaded
                return '';
            }
            
            return window.MoneybagValidation.validateField(name, value);
        };

        const handleInputChange = (name, value) => {
            // Use global form validator filter for mobile field
            if (window.MoneybagValidation && name === 'mobile') {
                value = window.MoneybagValidation.filterInput(value, 'phone');
            }
            
            setFormData(prev => ({ ...prev, [name]: value }));
            
            // Use global validation for instant feedback
            if (['name', 'email', 'mobile'].includes(name)) {
                const error = validateFieldInstantly(name, value);
                setErrors(prev => ({
                    ...prev,
                    [name]: error
                }));
            } else {
                // Clear errors for non-validated fields
                setErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        };

        const crmApiCall = async (action, data) => {
            const formData = new FormData();
            formData.append('action', 'moneybag_pricing_crm');
            formData.append('nonce', moneybagPricingAjax.nonce);
            formData.append('crm_action', action);
            formData.append('data', JSON.stringify(data));
            
            try {
                const response = await fetch(moneybagPricingAjax.ajaxurl, {
                    method: 'POST',
                    body: formData
                });
                
                // Handle 500 errors gracefully
                if (response.status === 500) {
                    // For search_person, a 500 might mean no results found - not a critical error
                    if (action === 'search_person') {
                        return [];
                    }
                    throw new Error('Server error occurred. Please try again.');
                }
                
                if (!response.ok) {
                    throw new Error(`Network error: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.data || 'CRM operation failed');
                }
                
                return result.data;
            } catch (error) {
                // For search_person, errors are expected for new users
                if (action === 'search_person') {
                    return [];
                }
                throw error;
            }
        };

        const findOrCreatePerson = async () => {
            const phoneNumber = formData.mobile.replace('+880', '').replace('880', '').replace('0', '');
            
            // First, try to find existing person by email (only if email exists)
            if (formData.email && formData.email.trim()) {
                const searchData = await crmApiCall('search_person', { email: formData.email });
                if (searchData && searchData.length > 0) {
                    return searchData[0].id;
                }
            }
            
            // If not found, try to create new person
            const personData = {
                name: {
                    firstName: formData.name.split(' ')[0] || formData.name,
                    lastName: formData.name.split(' ').slice(1).join(' ') || ''
                },
                emails: {
                    primaryEmail: formData.email
                },
                phones: {
                    primaryPhoneNumber: phoneNumber,
                    primaryPhoneCallingCode: '+880',
                    primaryPhoneCountryCode: 'BD'
                }
            };
            
            const personResponse = await crmApiCall('create_person', personData);
            return personResponse.data?.createPerson?.id || personResponse.id;
        };

        const createCRMEntries = async () => {
            try {
                // 1. Find or create person
                let personId;
                
                try {
                    personId = await findOrCreatePerson();
                } catch (personError) {
                    // If person creation fails and it's a duplicate error, we'll continue with a placeholder
                    if (personError.message && personError.message.includes('duplicate')) {
                        // Use a deterministic ID based on email
                        personId = `existing_${btoa(formData.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
                    } else {
                        throw personError;
                    }
                }

                // 2. Create Opportunity (with better error handling)
                let opportunityId;
                try {
                    const opportunityData = {
                        name: config.opportunity_name,
                        stage: 'NEW',
                        amount: {
                            amountMicros: 0,
                            currencyCode: 'BDT'
                        },
                        pointOfContactId: personId
                    };

                    const opportunityResponse = await crmApiCall('create_opportunity', opportunityData);
                    opportunityId = opportunityResponse.data?.createOpportunity?.id || opportunityResponse.id;
                } catch (oppError) {
                    // Continue with a fallback opportunity ID
                    opportunityId = `opp_${Date.now()}`;
                }

                // 3. Create Note (with error handling)
                let noteId;
                try {
                    const noteText = `- **Industry:** ${formData.businessCategory}
- **Legal identity:** ${formData.legalIdentity}
- **Business category:** ${formData.businessCategory}
- **Domain:** ${formData.domainName || 'Not provided'}
- **Contact:** ${formData.name} – ${formData.email} – ${formData.mobile}
- **Selected Pricing:** ${selectedPricing?.name || 'Standard Plan'}
- **Services:** ${selectedPricing?.services?.slice(0, 4).map(s => `${s.label}: ${s.rate}`).join(', ') || 'Standard rates'}`;

                    const noteData = {
                        title: 'Pricing form submission data',
                        bodyV2: {
                            markdown: noteText
                        }
                    };

                    const noteResponse = await crmApiCall('create_note', noteData);
                    noteId = noteResponse.data?.createNote?.id || noteResponse.id;

                    // 4. Attach Note to Opportunity (only if both IDs are valid)
                    if (noteId && opportunityId && !opportunityId.startsWith('opp_')) {
                        const noteTargetData = {
                            noteId: noteId,
                            opportunityId: opportunityId
                        };

                        await crmApiCall('create_note_target', noteTargetData);
                    }
                } catch (noteError) {
                    // Continue without note - form submission should still succeed
                }

                return { personId, opportunityId, noteId };
            } catch (error) {
                // Check if it's a duplicate person error - if so, still consider it successful
                if (error.message && error.message.includes('duplicate')) {
                    return { personId: 'existing', opportunityId: 'existing', noteId: 'existing' };
                }
                throw new Error(`Unable to process your request. Please try again or contact support.`);
            }
        };

        const nextStep = () => {
            if (currentStep < 4) {
                const newStep = currentStep + 1;
                setCurrentStep(newStep);
            }
        };

        const handleSubmit = async () => {
            // Clear all errors first
            setErrors({});
            
            // Use global form validator to validate all required fields
            if (window.MoneybagValidation) {
                const requiredFields = ['name', 'email', 'mobile'];
                const validationErrors = window.MoneybagValidation.validateFields(formData, requiredFields);
                
                // If validation fails, show errors and stop
                if (Object.keys(validationErrors).length > 0) {
                    setErrors(validationErrors);
                    return; // STOP - don't proceed with submission
                }
            }
            
            setLoading(true);
            try {
                const crmResult = await createCRMEntries();
                
                // If we get here, CRM integration was successful
                // Always go to thank you page after successful CRM submission
                nextStep();
            } catch (error) {
                
                // Check if it's an API validation error
                if (error.message && error.message.includes('validation')) {
                    setErrors(prev => ({ ...prev, submit: error.message }));
                    // Don't proceed to next step if validation fails
                    return;
                } else {
                    setErrors(prev => ({ ...prev, submit: 'An unexpected error occurred. Your information has been saved and our team will contact you soon.' }));
                    // Still go to thank you page after a delay for non-validation errors
                    setTimeout(() => nextStep(), 2000);
                }
            } finally {
                setLoading(false);
            }
        };

        const renderSelect = (name, options, placeholder = 'Select') => {
            if (!pricingRules) return null;
            
            let fieldOptions = [];
            
            if (name === 'businessCategory') {
                // Business category options - all available categories
                fieldOptions = Object.keys(pricingRules.businessCategories || {}).map(category => ({
                    value: category,
                    label: category
                }));
            } else if (name === 'legalIdentity') {
                // Legal identity options based on selected business category
                const selectedBusinessCategory = formData.businessCategory;
                const availableIdentities = Object.keys(pricingRules.businessCategories?.[selectedBusinessCategory]?.identities || {});
                fieldOptions = availableIdentities.map(identity => ({
                    value: identity,
                    label: identity
                }));
            } else if (name === 'monthlyVolume') {
                // Monthly volume options
                fieldOptions = [
                    { value: '0-100000', label: '0 - 100,000 BDT' },
                    { value: '100000-500000', label: '100,000 - 500,000 BDT' },
                    { value: '500000-600000', label: '500,000 - 600,000 BDT' },
                    { value: '600000-1000000', label: '600,000 - 1,000,000 BDT' },
                    { value: '1000000-5000000', label: '1,000,000 - 5,000,000 BDT' },
                    { value: '5000000-10000000', label: '5,000,000 - 10,000,000 BDT' },
                    { value: '10000000+', label: '10,000,000+ BDT' }
                ];
            }
            
            return createElement('div', { className: 'field-group' },
                createElement('label', { className: 'field-label' }, name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')),
                createElement('div', { className: 'dropdown-wrapper' },
                    createElement('select', {
                        className: `input-field ${errors[name] ? 'error' : ''}`,
                        value: formData[name],
                        onChange: (e) => handleInputChange(name, e.target.value),
                        disabled: loading
                    },
                        createElement('option', { 
                            key: 'placeholder', 
                            value: '' 
                        }, `Select ${name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')}`),
                        ...fieldOptions.map(option => 
                            createElement('option', { 
                                key: option.value, 
                                value: option.value 
                            }, option.label)
                        )
                    )
                ),
                errors[name] && createElement('span', { className: 'error-message' }, errors[name])
            );
        };

        const renderInput = (name, type = 'text', placeholder = '') => {
            // Use tel type for mobile field
            if (name === 'mobile') {
                type = 'tel';
            }
            
            return createElement('div', { className: 'field-group' },
                createElement('label', { className: 'field-label' }, name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')),
                createElement('input', {
                    type,
                    className: `input-field ${errors[name] ? 'error' : ''}`,
                    value: formData[name],
                    onChange: (e) => handleInputChange(name, e.target.value),
                    onKeyUp: (e) => handleInputChange(name, e.target.value), // Add keyup for instant validation
                    placeholder,
                    disabled: loading,
                    ...(name === 'mobile' && { 
                        pattern: '[0-9+\\-\\s]*',
                        inputMode: 'numeric'
                    })
                }),
                errors[name] && createElement('span', { className: 'error-message' }, errors[name])
            );
        };

        // Step 1: Requirements Form
        if (currentStep === 1) {
            return createElement('div', { className: 'pricing-plan-container moneybag-form' },
                createElement('div', { className: 'step-container' },
                    createElement('div', { className: 'form-section' },
                        createElement('h1', null, config.form_title),
                        renderSelect('businessCategory'),
                        renderSelect('legalIdentity'),
                        createElement('button', {
                            className: 'primary-btn',
                            onClick: () => {
                                nextStep();
                            },
                        }, createElement('span', { className: 'btn-content' },
                            'Get Pricing & Docs'
                        ))
                    ),
                    createElement('div', { className: 'content-section' },
                        createElement('div', { className: 'content-text' },
                            createElement('h2', null,
                                'Share your business details for a customized Moneybag pricing quote and the exact documents needed to start accepting payments seamlessly.'
                            )
                        )
                    )
                )
            );
        }

        // Step 2: Pricing & Documents Display
        if (currentStep === 2) {
            return createElement('div', { className: 'pricing-plan-container moneybag-form' },
                createElement('div', { className: 'step-container-three-col' },
                    createElement('div', { className: 'form-section' },
                        createElement('h1', null, config.form_title),
                        renderSelect('businessCategory'),
                        renderSelect('legalIdentity'),
                        createElement('button', {
                            className: 'primary-btn',
                            onClick: nextStep
                        }, createElement('span', { className: 'btn-content' },
                            'Book an Appointment',
                            createElement('span', { style: { fontSize: '15px', marginLeft: '8px' } }, '→')
                        ))
                    ),
                    
                    createElement('div', { className: 'cards-container' },
                        createElement('div', { className: 'card' },
                            createElement('h3', { className: 'card-header' }, 'Required Documents'),
                            createElement('div', { className: 'checklist' },
                                selectedDocuments.map((doc, index) =>
                                    createElement('div', { 
                                        key: index, 
                                        className: 'checklist-item' 
                                    }, doc)
                                )
                            )
                        ),
                        
                        selectedPricing && createElement('div', { className: 'card' },
                            createElement('h3', { className: 'card-header' }, 'Pricing'),
                            createElement('div', { className: 'pricing-grid' },
                                // Popular services (first 4)
                                ...(selectedPricing.services || []).slice(0, 4).map(service =>
                                    createElement('div', { 
                                        key: service.key, 
                                        className: 'pricing-row' 
                                    },
                                        createElement('span', null, service.label),
                                        createElement('span', null, service.rate)
                                    )
                                ),
                                // Show more services if expanded
                                showAllPricing && (selectedPricing.services || []).slice(4).map(service =>
                                    createElement('div', { 
                                        key: service.key, 
                                        className: 'pricing-row' 
                                    },
                                        createElement('span', null, service.label),
                                        createElement('span', null, service.rate)
                                    )
                                )
                            ),
                            // See more/less button
                            (selectedPricing.services && selectedPricing.services.length > 4) && 
                            createElement('button', {
                                className: 'see-more-button',
                                onClick: () => setShowAllPricing(!showAllPricing)
                            }, showAllPricing ? 'See Less' : 'See More'),
                            createElement('p', { className: 'contact-text' },
                                createElement('a', { 
                                    href: 'https://tidycal.com/moneybag-pso/15-minute-meeting',
                                    target: '_blank',
                                    rel: 'noopener noreferrer',
                                    className: 'book-call-link'
                                }, 'Book FREE Call'),
                                ' to discuss your needs and negotiate a better price.'
                            )
                        )
                    )
                )
            );
        }

        // Step 3: Consultation Booking
        if (currentStep === 3) {
            return createElement('div', { className: 'pricing-plan-container moneybag-form' },
                createElement('div', { className: 'consultation-container' },
                    createElement('div', { className: 'consultation-wrapper' },
                        createElement('h1', null, `${config.consultation_duration} minutes`, createElement('br'), 'Expert Consultation'),
                        createElement('div', { className: 'consultation-form' },
                                createElement('div', { className: 'input-row' },
                                    renderSelect('businessCategory'),
                                    renderSelect('legalIdentity'),
                                    renderInput('domainName', 'text', 'example.com'),
                                    renderSelect('monthlyVolume'),
                                    renderInput('name', 'text', 'Full Name'),
                                    renderInput('email', 'email', 'your@email.com'),
                                    renderInput('mobile', 'tel', '+8801XXXXXXXXX')
                                ),
                                errors.submit && createElement('div', { className: 'submit-error' }, errors.submit),
                                createElement('button', {
                                    className: 'primary-btn',
                                    onClick: handleSubmit,
                                    disabled: loading
                                }, 
                                    loading ? createElement('span', { className: 'btn-content' },
                                        createElement('span', { 
                                            className: 'spinner',
                                            dangerouslySetInnerHTML: {
                                                __html: '<svg class="spinner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6-8.485"></path></svg>'
                                            }
                                        }),
                                        'Submitting...'
                                    ) : createElement('span', { className: 'btn-content' }, 'Submit')
                                )
                            )
                    ),
                    
                    createElement('div', { className: 'consultation-image-container' },
                        createElement('img', {
                            src: `${window.location.origin}/wp-content/plugins/moneybag-wordpress-plugin/assets/image/Right.webp`,
                            alt: 'Consultation illustration',
                            loading: 'lazy'
                        })
                    )
                )
            );
        }

        // Step 4: Thank You
        if (currentStep === 4) {
            return createElement('div', { className: 'thank-you-container' },
                createElement('img', {
                    src: `${window.location.origin}/wp-content/plugins/moneybag-wordpress-plugin/assets/image/icon_moneybag.webp`,
                    alt: 'Moneybag icon',
                    className: 'moneybag-icon',
                    loading: 'lazy'
                }),
                createElement('h1', null, 'Thank You!'),
                createElement('p', null, 
                    `All set! Our team will reach out within 24 hours to schedule your ${config.consultation_duration}-minute consultation. Meanwhile, check your inbox for next steps.`
                ),
                // Quick Contact Section
                createElement('div', { className: 'quick-contact-section' },
                    createElement('div', { className: 'contact-items' },
                        // Phone contact
                        createElement('div', { className: 'contact-item' },
                            createElement('svg', {
                                className: 'contact-icon phone-icon',
                                width: '20',
                                height: '20',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                xmlns: 'http://www.w3.org/2000/svg'
                            },
                                createElement('path', {
                                    d: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
                                    stroke: '#2d3748',
                                    strokeWidth: '2',
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round'
                                })
                            ),
                            createElement('a', {
                                href: 'tel:+8801958109228',
                                className: 'contact-link'
                            }, '+880 1958 109 228')
                        ),
                        // Email contact
                        createElement('div', { className: 'contact-item' },
                            createElement('svg', {
                                className: 'contact-icon email-icon',
                                width: '20',
                                height: '20',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                xmlns: 'http://www.w3.org/2000/svg'
                            },
                                createElement('path', {
                                    d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
                                    stroke: '#2d3748',
                                    strokeWidth: '2',
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round'
                                }),
                                createElement('polyline', {
                                    points: '22,6 12,13 2,6',
                                    stroke: '#2d3748',
                                    strokeWidth: '2',
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round'
                                })
                            ),
                            createElement('a', {
                                href: 'mailto:info@moneybag.com.bd',
                                className: 'contact-link'
                            }, 'info@moneybag.com.bd')
                        )
                    ),
                    createElement('p', { className: 'contact-description' },
                        'For any inquiries, feel free to reach out via phone or email. Our support team is here to assist you with any questions or service-related requests.'
                    )
                )
            );
        }

        return null;
    };

    // Expose component globally for testing
    window.PricingPlanForm = PricingPlanForm;

    // Initialize forms when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const formWrappers = document.querySelectorAll('.moneybag-pricing-plan-wrapper');
        
        formWrappers.forEach(wrapper => {
            const config = JSON.parse(wrapper.dataset.config || '{}');
            
            // Set default values if not provided
            const safeConfig = {
                widget_id: config.widget_id || 'default',
                form_title: config.form_title || 'Pricing & Requirements',
                success_redirect_url: config.success_redirect_url || '',
                consultation_duration: config.consultation_duration || 15,
                opportunity_name: config.opportunity_name || 'Payment Gateway – merchant onboarding',
                primary_color: config.primary_color || '#ff6b6b',
                ...config
            };
            
            const targetId = `moneybag-pricing-plan-${safeConfig.widget_id}`;
            const targetElement = document.getElementById(targetId);
            
            if (targetElement && wp.element && wp.element.render) {
                wp.element.render(
                    createElement(PricingPlanForm, { config: safeConfig }),
                    targetElement
                );
            }
        });
    });

})();