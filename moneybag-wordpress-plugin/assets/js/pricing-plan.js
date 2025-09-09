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
                    // Use the plugin URL from localized script if available
                    const pluginUrl = window.moneybagPricingAjax?.pluginUrl || `${window.location.origin}/wp-content/plugins/moneybag-wordpress-plugin`;
                    const response = await fetch(`${pluginUrl}/data/pricing-rules.json`);
                    if (!response.ok) {
                        throw new Error(`Failed to load pricing rules: ${response.status}`);
                    }
                    const rules = await response.json();
                    setPricingRules(rules);
                } catch (error) {
                    // Failed to load pricing rules - form will handle missing data
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
            
            // Get pricing data from JSON
            const pricing = pricingRules.pricing;
            if (!pricing) {
                // Fallback to default pricing if no pricing data in JSON
                setSelectedPricing({
                    name: 'Custom Plan',
                    services: [],
                    negotiable: true,
                    negotiation_text: 'Book FREE Call for custom pricing'
                });
                return;
            }
            
            // Define service types with their display labels
            const serviceTypes = [
                // Popular services first
                { key: 'visa', label: 'VISA', category: 'cards' },
                { key: 'mastercard', label: 'MasterCard', category: 'cards' },
                { key: 'bkash', label: 'bKash', category: 'mfs' },
                { key: 'nagad', label: 'Nagad', category: 'mfs' },
                // Other services
                { key: 'amex', label: 'AMEX', category: 'cards' },
                { key: 'nexus_card', label: 'DBBL Nexus', category: 'cards' },
                { key: 'unionpay', label: 'UnionPay', category: 'cards' },
                { key: 'diners_club', label: 'Diners Club', category: 'cards' },
                { key: 'upay', label: 'Upay', category: 'mfs' },
                { key: 'rocket', label: 'Rocket', category: 'mfs' }
            ];
            
            // Get pricing based on business category
            const pricingByService = serviceTypes.map(service => {
                let rate = 'Contact us';
                
                // Get the pricing category (cards or mfs)
                const pricingCategory = pricing[service.category];
                if (pricingCategory) {
                    // Try to get rate for specific business category, fallback to default
                    const categoryPricing = pricingCategory[formData.businessCategory] || pricingCategory['default'];
                    if (categoryPricing && categoryPricing[service.key]) {
                        rate = categoryPricing[service.key];
                    }
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
            // Use global form validator filter based on field type
            if (window.MoneybagValidation) {
                const filterMap = {
                    'mobile': 'phone',
                    'name': 'name',
                    'domainName': 'text',
                    'email': 'text'
                };
                
                if (filterMap[name]) {
                    value = window.MoneybagValidation.filterInput(value, filterMap[name]);
                }
            }
            
            setFormData(prev => ({ ...prev, [name]: value }));
            
            // Clear error when user starts typing
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        };
        
        // Validate and set field error on blur
        const validateAndSetFieldError = (fieldName, value, formFieldName = null) => {
            if (!window.MoneybagValidation) {
                return '';
            }
            
            const error = window.MoneybagValidation.validateField(fieldName, value);
            const errorKey = formFieldName || fieldName;
            
            setErrors(prev => ({
                ...prev,
                [errorKey]: error || ''
            }));
            
            return error;
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
                    throw new Error('Server error occurred. Please try again.');
                }
                
                if (!response.ok) {
                    throw new Error(`Network error: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    const errorMessage = result.data?.message || result.data || 'CRM operation failed';
                    
                    // Check for specific CRM configuration issues
                    if (errorMessage.includes('CRM API request failed')) {
                        // This means the CRM API itself is failing - likely configuration issue
                        throw new Error('CRM service is temporarily unavailable. Please try again later or contact support.');
                    } else if (errorMessage.includes('API key not configured')) {
                        throw new Error('CRM not configured. Please contact administrator.');
                    }
                    
                    throw new Error(errorMessage);
                }
                
                return result.data;
            } catch (error) {
                throw error;
            }
        };

        const createCRMEntries = async () => {
            try {
                // Use unified CRM submission
                const submissionData = {
                    name: formData.name,
                    email: formData.email,
                    mobile: formData.mobile,
                    domainName: formData.domainName,
                    businessCategory: formData.businessCategory,
                    legalIdentity: formData.legalIdentity,
                    monthlyVolume: formData.monthlyVolume,
                    selectedPricing: selectedPricing?.name || 'Standard Plan',
                    services: selectedPricing?.services?.slice(0, 4).map(s => `${s.label}: ${s.rate}`).join(', ') || 'Standard rates'
                };
                
                const response = await crmApiCall('submit_all', submissionData);
                
                return {
                    personId: response.person_id,
                    opportunityId: response.opportunity_id,
                    noteId: response.note_id
                };
            } catch (error) {
                // Re-throw the error with its original message for proper handling
                throw error;
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
                const validationErrors = {};
                
                // Validate each field
                const nameError = window.MoneybagValidation.validateField('name', formData.name);
                if (nameError) validationErrors.name = nameError;
                
                const emailError = window.MoneybagValidation.validateField('email', formData.email);
                if (emailError) validationErrors.email = emailError;
                
                const mobileError = window.MoneybagValidation.validateField('mobile', formData.mobile);
                if (mobileError) validationErrors.mobile = mobileError;
                
                // Validate domain if provided
                if (formData.domainName) {
                    const domainError = window.MoneybagValidation.validateField('domain', formData.domainName);
                    if (domainError) validationErrors.domainName = domainError;
                }
                
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
                // Parse error message to determine the field
                const errorMessage = error.message || 'Unable to process your request. Please try again.';
                
                // Check for specific field errors and map them
                if (errorMessage.toLowerCase().includes('email')) {
                    setErrors(prev => ({ ...prev, email: errorMessage }));
                } else if (errorMessage.toLowerCase().includes('phone') || errorMessage.toLowerCase().includes('mobile')) {
                    setErrors(prev => ({ ...prev, mobile: 'Invalid phone number format' }));
                } else if (errorMessage.toLowerCase().includes('name')) {
                    setErrors(prev => ({ ...prev, name: 'Invalid name format' }));
                } else if (errorMessage.toLowerCase().includes('duplicate')) {
                    // Handle duplicate person - this might not be an error
                    setErrors(prev => ({ ...prev, submit: 'This information already exists in our system. Our team will contact you soon.' }));
                } else {
                    // Generic error - show at form level
                    setErrors(prev => ({ ...prev, submit: errorMessage }));
                }
                
                // DO NOT proceed to next step on error
                // Form should stay on current step so user can fix the issue
                return;
            } finally {
                setLoading(false);
            }
        };

        const renderSelect = (name, options, placeholder = 'Select') => {
            
            let fieldOptions = [];
            
            if (name === 'businessCategory') {
                // Business category options from JSON
                if (pricingRules && pricingRules.businessCategories) {
                    fieldOptions = Object.keys(pricingRules.businessCategories).map(category => ({
                        value: category,
                        label: category
                    }));
                }
            } else if (name === 'legalIdentity') {
                // Legal identity options based on selected business category from JSON
                const selectedBusinessCategory = formData.businessCategory;
                if (pricingRules && pricingRules.businessCategories && selectedBusinessCategory && pricingRules.businessCategories[selectedBusinessCategory]) {
                    const availableIdentities = Object.keys(pricingRules.businessCategories[selectedBusinessCategory].identities || {});
                    fieldOptions = availableIdentities.map(identity => ({
                        value: identity,
                        label: identity
                    }));
                }
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
                        className: `input-field ${errors[name] ? 'error' : ''} ${formData[name] ? 'valid' : ''}`,
                        value: formData[name],
                        onChange: (e) => handleInputChange(name, e.target.value),
                        onBlur: (e) => {
                            if (!e.target.value && name !== 'domainName') {
                                setErrors(prev => ({ ...prev, [name]: `Please select ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}` }));
                            }
                        },
                        disabled: loading
                    },
                        createElement('option', { 
                            key: 'placeholder', 
                            value: '' 
                        }, `Select ${name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')}`),
                        ...(fieldOptions || []).map(option => 
                            createElement('option', { 
                                key: option.value, 
                                value: option.value 
                            }, option.label)
                        )
                    )
                ),
                errors[name] && createElement('span', { 
                    className: 'error-message',
                    dangerouslySetInnerHTML: typeof errors[name] === 'string' && errors[name].includes('<a') 
                        ? { __html: errors[name] } 
                        : undefined
                }, typeof errors[name] === 'string' && errors[name].includes('<a') 
                    ? null 
                    : errors[name]
                )
            );
        };

        const renderInput = (name, type = 'text', placeholder = '') => {
            // Use tel type for mobile field
            if (name === 'mobile') {
                type = 'tel';
            }
            
            // Map field names to validation types
            const validationFieldMap = {
                'name': 'name',
                'email': 'email',
                'mobile': 'mobile',
                'domainName': 'domain'
            };
            
            const validationField = validationFieldMap[name] || name;
            
            return createElement('div', { className: 'field-group' },
                createElement('label', { className: 'field-label' }, name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')),
                createElement('input', {
                    type,
                    className: `input-field ${errors[name] ? 'error' : ''} ${formData[name] ? 'valid' : ''}`,
                    value: formData[name],
                    onChange: (e) => handleInputChange(name, e.target.value),
                    onBlur: (e) => validateAndSetFieldError(validationField, e.target.value, name),
                    placeholder,
                    disabled: loading,
                    maxLength: name === 'email' ? 30 : null,
                    ...(name === 'mobile' && { 
                        pattern: '[0-9+\\-\\s]*',
                        inputMode: 'numeric'
                    })
                }),
                errors[name] && createElement('span', { 
                    className: 'error-message',
                    dangerouslySetInnerHTML: typeof errors[name] === 'string' && errors[name].includes('<a') 
                        ? { __html: errors[name] } 
                        : undefined
                }, typeof errors[name] === 'string' && errors[name].includes('<a') 
                    ? null 
                    : errors[name]
                )
            );
        };

        // Step 1: Requirements Form
        if (currentStep === 1) {
            // Only render the form when pricing rules are loaded
            if (!pricingRules) {
                return createElement('div', { className: 'pricing-plan-container moneybag-form' },
                    createElement('div', { className: 'step-container' },
                        createElement('div', { className: 'form-section' },
                            createElement('h1', null, config.form_title),
                            createElement('div', { style: { padding: '20px 0' } }, 'Loading...')
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
                            createElement('span', { className: 'btn-arrow' }, '→')
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
                                                __html: '<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.3)" stroke-width="4" fill="none"/><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="80 50" stroke-linecap="round"/></svg>'
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
            return createElement('div', { 
                className: 'thank-you-container',
                style: {
                    width: '100%',
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: window.innerWidth <= 480 ? '20px 0' : '50px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.30)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            },
                createElement('img', {
                    src: `${window.location.origin}/wp-content/plugins/moneybag-wordpress-plugin/assets/image/icon_moneybag.webp`,
                    alt: 'Moneybag icon',
                    className: 'moneybag-icon',
                    loading: 'lazy'
                }),
                createElement('h1', {
                    style: {
                        fontSize: window.innerWidth <= 480 ? '28px' : window.innerWidth <= 768 ? '36px' : '48px',
                        fontWeight: '700',
                        color: '#2d3748',
                        margin: window.innerWidth <= 480 ? '20px 0' : '30px 0',
                        lineHeight: '1.2'
                    }
                }, 'Thank You!'),
                createElement('p', {
                    style: {
                        fontSize: window.innerWidth <= 480 ? '15px' : window.innerWidth <= 768 ? '16px' : '17px',
                        color: '#4a5568',
                        lineHeight: '1.6',
                        margin: '0 auto 20px',
                        padding: '0'
                    }
                }, 
                    'We will call you within 24 hours. If you want to connect with us immediately, please call the below number.'
                ),
                // Contact items directly below the text
                createElement('div', { 
                    className: 'contact-items',
                    style: {
                        display: 'flex',
                        flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: window.innerWidth <= 480 ? '10px' : '30px',
                        margin: window.innerWidth <= 480 ? '20px 0 0 0' : '20px 0',
                        flexWrap: 'wrap',
                        width: '100%'
                    }
                },
                        // Phone contact
                        createElement('div', { 
                            className: 'contact-item',
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                justifyContent: 'center'
                            }
                        },
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
                                className: 'contact-link',
                                style: {
                                    color: '#2d3748',
                                    fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                                    fontWeight: '500',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease'
                                },
                                onMouseEnter: (e) => {
                                    e.target.style.color = '#ff6b6b';
                                },
                                onMouseLeave: (e) => {
                                    e.target.style.color = '#2d3748';
                                }
                            }, '+880 1958 109 228')
                        ),
                        // Email contact
                        createElement('div', { 
                            className: 'contact-item',
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                justifyContent: 'center'
                            }
                        },
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
                                className: 'contact-info',
                                href: 'mailto:info@moneybag.com.bd',
                                style: { 
                                    color: 'inherit', 
                                    textDecoration: 'none',
                                    transition: 'color 0.3s ease'
                                },
                                onMouseEnter: (e) => e.target.style.color = '#ff4444',
                                onMouseLeave: (e) => e.target.style.color = 'inherit'
                            }, 'info@moneybag.com.bd')
                        )
                    ),
                // Demo sandbox text
                createElement('p', { 
                    style: { 
                        marginTop: window.innerWidth <= 480 ? '15px' : '20px',
                        textAlign: 'center',
                        fontSize: window.innerWidth <= 480 ? '15px' : window.innerWidth <= 768 ? '16px' : '17px',
                        color: '#4a5568',
                        lineHeight: '1.5',
                        padding: '0',
                        margin: `${window.innerWidth <= 480 ? '15px' : '20px'} auto 0`
                    }
                }, 'In the meantime, check out the demo sandbox.'),
                // Button to merchant page
                createElement('div', { 
                    style: { 
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: window.innerWidth <= 480 ? '15px' : '20px',
                        marginBottom: window.innerWidth <= 480 ? '10px' : '20px',
                        width: '100%',
                        padding: window.innerWidth <= 768 ? '0' : '0 10px'
                    }
                },
                    createElement('a', {
                        href: 'https://demo.sandbox.moneybag.com.bd/',
                        target: '_blank',
                        className: 'primary-btn',
                        style: {
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: window.innerWidth <= 480 ? '10px 24px' : '12px 32px',
                            background: 'linear-gradient(270deg, #F46F6F 0%, #EE212E 100%)',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: window.innerWidth <= 480 ? '14px' : '15px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            textAlign: 'center',
                            boxShadow: '0 2px 4px rgba(238, 33, 46, 0.15)'
                        },
                        onMouseEnter: (e) => {
                            e.target.style.background = 'linear-gradient(270deg, #E45050 0%, #CC1A25 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(238, 33, 46, 0.4)';
                        },
                        onMouseLeave: (e) => {
                            e.target.style.background = 'linear-gradient(270deg, #F46F6F 0%, #EE212E 100%)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(238, 33, 46, 0.15)';
                        }
                    }, 
                        'Explore Demo Sandbox',
                        // Right arrow icon
                        createElement('svg', {
                            width: '16',
                            height: '16',
                            viewBox: '0 0 24 24',
                            fill: 'none',
                            xmlns: 'http://www.w3.org/2000/svg',
                            style: {
                                marginLeft: '8px',
                                display: 'inline-block',
                                verticalAlign: 'middle'
                            }
                        },
                            createElement('path', {
                                d: 'M5 12H19M19 12L12 5M19 12L12 19',
                                stroke: 'currentColor',
                                strokeWidth: '2',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round'
                            })
                        )
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