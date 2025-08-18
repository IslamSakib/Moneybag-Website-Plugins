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
                    console.error('Failed to load pricing rules:', error);
                }
            };
            
            loadPricingRules();
        }, []);

        // Set default values when pricing rules are loaded
        useEffect(() => {
            if (pricingRules && !formData.legalIdentity) {
                const defaultValues = {
                    legalIdentity: pricingRules.formOptions?.legalIdentity?.[0]?.value || '',
                    businessCategory: pricingRules.formOptions?.businessCategory?.[0]?.value || '',
                    monthlyVolume: pricingRules.formOptions?.monthlyVolume?.[0]?.value || ''
                };
                
                setFormData(prev => ({
                    ...prev,
                    ...defaultValues
                }));
            }
        }, [pricingRules, formData.legalIdentity]);

        // Calculate pricing and documents based on form data
        useEffect(() => {
            if (pricingRules && formData.legalIdentity && formData.businessCategory) {
                calculatePricingAndDocuments();
            }
        }, [pricingRules, formData.legalIdentity, formData.businessCategory]);

        const calculatePricingAndDocuments = () => {
            if (!pricingRules) return;

            // Helper function to check if value matches condition
            const checkCondition = (condition, value) => {
                if (!condition || condition.any === true) return true;
                
                // Check for between condition (for monthly volume)
                if (condition.between) {
                    const [min, max] = condition.between;
                    // Parse the value to get the numeric range
                    const valueParts = value.split('-');
                    let numValue;
                    if (valueParts.length === 2) {
                        numValue = parseInt(valueParts[0]);
                    } else if (value.includes('+')) {
                        numValue = parseInt(value.replace('+', ''));
                    } else {
                        numValue = parseInt(value);
                    }
                    return numValue >= min && numValue <= max;
                }
                
                // Direct string comparison
                return condition === value;
            };

            // Find matching rule based on legal identity
            const matchingRule = pricingRules.rules.find(rule => {
                if (rule.if.any === true) return true;
                
                const conditions = rule.if;
                
                // Direct value comparison for legal identity
                if (conditions.legal_identity) {
                    return conditions.legal_identity === formData.legalIdentity;
                }
                
                return false;
            });

            if (matchingRule) {
                // Get pricing and documents from the matched rule
                const pricingKey = matchingRule.show.pricing_set;
                const documentsKey = matchingRule.show.documents_set;
                
                const pricingData = pricingRules.sets.pricing[pricingKey];
                const documentsData = pricingRules.sets.documents[documentsKey];
                
                if (pricingData) {
                    // Format pricing for all service types
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
                    
                    const pricingByService = serviceTypes.map(service => {
                        let rate = '2.3%'; // Default rate
                        
                        if (pricingData[service.category] && pricingData[service.category][service.key]) {
                            rate = (pricingData[service.category][service.key] * 100).toFixed(1) + '%';
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
                        setupFee: 'Contact for pricing',
                        monthlyFee: (pricingData.monthly_fee * 100).toFixed(1) + '%',
                        negotiable: pricingData.negotiable,
                        negotiation_text: pricingData.negotiation_text
                    });
                }
                
                if (documentsData) {
                    // Format documents for display
                    setSelectedDocuments(documentsData.map(doc => 
                        doc.label + (doc.optional ? ' (Optional)' : '')
                    ));
                }
            }
        };

        const validateEmail = (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };

        const validatePhone = (phone) => {
            const phoneRegex = /^(\+880|880|0)?[1-9][0-9]{8,10}$/;
            return phoneRegex.test(phone);
        };

        const validateDomain = (domain) => {
            if (!domain) return true; // Optional field
            const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
            return urlRegex.test(domain);
        };

        const validateField = (name, value) => {
            let error = '';
            
            switch (name) {
                case 'legalIdentity':
                    if (!value) error = 'Legal identity is required';
                    break;
                case 'businessCategory':
                    if (!value) error = 'Business category is required';
                    break;
                case 'domainName':
                    if (value && !validateDomain(value)) error = 'Invalid URL format (e.g., https://example.com)';
                    break;
                case 'name':
                    if (!value) error = 'Name is required';
                    else if (value.length < 2) error = 'Name must be at least 2 characters';
                    break;
                case 'email':
                    if (!value) error = 'Email is required';
                    else if (!validateEmail(value)) error = 'Invalid email format';
                    break;
                case 'mobile':
                    if (!value) error = 'Mobile number is required';
                    else if (!validatePhone(value)) error = 'Invalid mobile number format';
                    break;
            }
            
            return error;
        };

        const handleInputChange = (name, value) => {
            setFormData(prev => ({ ...prev, [name]: value }));
            
            // Instant validation
            const error = validateField(name, value);
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        };

        const crmApiCall = async (endpoint, data) => {
            if (!config.crm_api_key) {
                throw new Error('CRM API key not configured');
            }

            const response = await fetch(`${config.crm_api_url}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.crm_api_key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                let errorMessage = 'CRM API request failed';
                
                if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                }
                
                throw new Error(errorMessage);
            }
            
            return responseData;
        };

        const createCRMEntries = async () => {
            try {
                // 1. Create Person
                const phoneNumber = formData.mobile.replace('+880', '').replace('880', '');
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

                const personResponse = await crmApiCall('/people', personData);
                const personId = personResponse.data?.createPerson?.id || personResponse.id;

                // 2. Create Opportunity
                const opportunityData = {
                    name: config.opportunity_name,
                    stage: 'NEW',
                    amount: {
                        amountMicros: 0,
                        currencyCode: 'BDT'
                    },
                    pointOfContactId: personId
                };

                const opportunityResponse = await crmApiCall('/opportunities', opportunityData);
                const opportunityId = opportunityResponse.data?.createOpportunity?.id || opportunityResponse.id;

                // 3. Create Note
                const noteText = `- **Industry:** ${formData.businessCategory}
- **Legal identity:** ${formData.legalIdentity}
- **Business category:** ${formData.businessCategory}
- **Domain:** ${formData.domainName || 'Not provided'}
- **Contact:** ${formData.name} – ${formData.email} – ${formData.mobile}
- **Selected Pricing:** ${selectedPricing?.name || 'Standard Plan'}
- **Card Rate:** ${selectedPricing?.cardRate || '2.5%'}
- **Wallet Rate:** ${selectedPricing?.walletRate || '1.8%'}`;

                const noteData = {
                    title: 'Pricing form submission data',
                    bodyV2: {
                        markdown: noteText
                    }
                };

                const noteResponse = await crmApiCall('/notes', noteData);
                const noteId = noteResponse.data?.createNote?.id || noteResponse.id;

                // 4. Attach Note to Opportunity
                const noteTargetData = {
                    noteId: noteId,
                    opportunityId: opportunityId
                };

                await crmApiCall('/noteTargets', noteTargetData);

                return { personId, opportunityId, noteId };
            } catch (error) {
                throw new Error(`CRM Integration failed: ${error.message}`);
            }
        };

        const nextStep = () => {
            if (currentStep < 4) {
                setCurrentStep(currentStep + 1);
            }
        };

        const handleSubmit = async () => {
            // Validate required fields
            const requiredFields = ['domainName', 'name', 'email', 'mobile'];
            let hasErrors = false;
            
            requiredFields.forEach(field => {
                const error = validateField(field, formData[field]);
                if (error) {
                    setErrors(prev => ({ ...prev, [field]: error }));
                    hasErrors = true;
                }
            });
            
            if (hasErrors) return;
            
            setLoading(true);
            try {
                await createCRMEntries();
                nextStep(); // Go to thank you page
            } catch (error) {
                setErrors(prev => ({ ...prev, submit: error.message }));
            } finally {
                setLoading(false);
            }
        };

        const renderSelect = (name, options, placeholder = 'Select') => {
            if (!pricingRules) return null;
            
            const fieldOptions = pricingRules.formOptions[name] || options || [];
            
            return createElement('div', { className: 'form-group' },
                createElement('label', null, name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')),
                createElement('select', {
                    className: `form-select ${errors[name] ? 'error' : ''}`,
                    value: formData[name],
                    onChange: (e) => handleInputChange(name, e.target.value),
                    disabled: loading
                },
                    ...fieldOptions.map(option => 
                        createElement('option', { 
                            key: option.value, 
                            value: option.value 
                        }, option.label)
                    )
                ),
                errors[name] && createElement('span', { className: 'error-message' }, errors[name])
            );
        };

        const renderInput = (name, type = 'text', placeholder = '') => {
            return createElement('div', { className: 'form-group' },
                createElement('label', null, name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')),
                createElement('input', {
                    type,
                    className: `form-input ${errors[name] ? 'error' : ''}`,
                    value: formData[name],
                    onChange: (e) => handleInputChange(name, e.target.value),
                    placeholder,
                    disabled: loading
                }),
                errors[name] && createElement('span', { className: 'error-message' }, errors[name])
            );
        };

        // Step 1: Requirements Form
        if (currentStep === 1) {
            return createElement('div', { className: 'pricing-plan-container' },
                createElement('div', { className: 'step-container' },
                    createElement('div', { className: 'form-section' },
                        createElement('h1', null, config.form_title),
                        renderSelect('legalIdentity'),
                        renderSelect('businessCategory'),
                        createElement('button', {
                            className: 'primary-button',
                            onClick: () => {
                                // Validate required fields before proceeding
                                if (!formData.legalIdentity || !formData.businessCategory) {
                                    alert('Please fill in all required fields');
                                    return;
                                }
                                nextStep();
                            },
                            disabled: !formData.legalIdentity || !formData.businessCategory
                        }, 'Get Pricing & Docs')
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
            return createElement('div', { className: 'pricing-plan-container' },
                createElement('div', { className: 'step-container-three-col' },
                    createElement('div', { className: 'form-section' },
                        createElement('h1', null, config.form_title),
                        renderSelect('legalIdentity', [], formData.legalIdentity),
                        renderSelect('businessCategory', [], formData.businessCategory),
                        createElement('button', {
                            className: 'primary-button',
                            onClick: nextStep
                        }, 'Book an Appointment →')
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
                                ),
                                // Setup Fee
                                createElement('div', { className: 'pricing-row' },
                                    createElement('span', null, 'Setup Fee'),
                                    createElement('span', null, selectedPricing.setupFee || 'Contact for pricing')
                                ),
                                // Monthly Fee
                                createElement('div', { className: 'pricing-row' },
                                    createElement('span', null, 'Monthly Fee'),
                                    createElement('span', null, selectedPricing.monthlyFee || '2.3%')
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
                                    href: 'https://moneybag.com.bd/support/', 
                                    target: '_blank',
                                    rel: 'noopener noreferrer',
                                    style: { color: 'inherit', textDecoration: 'underline' }
                                }, 'Contact us'),
                                ' to discuss your needs and negotiate a better price.'
                            )
                        )
                    )
                )
            );
        }

        // Step 3: Consultation Booking
        if (currentStep === 3) {
            return createElement('div', { className: 'pricing-plan-container' },
                createElement('div', { className: 'consultation-container' },
                    createElement('div', { className: 'consultation-wrapper' },
                        createElement('h1', null, `${config.consultation_duration} minutes`, createElement('br'), 'Expert Consultation'),
                        createElement('div', { className: 'consultation-content' },
                            createElement('div', { className: 'consultation-form' },
                                createElement('div', { className: 'form-grid' },
                                    renderSelect('legalIdentity', [], formData.legalIdentity),
                                    renderSelect('businessCategory', [], formData.businessCategory),
                                    renderInput('domainName', 'url', 'https://example.com'),
                                    renderSelect('monthlyVolume', [], formData.monthlyVolume),
                                    renderInput('name', 'text', 'Full Name'),
                                    renderInput('email', 'email', 'your@email.com'),
                                    renderInput('mobile', 'tel', '+8801XXXXXXXXX')
                                ),
                                errors.submit && createElement('div', { className: 'submit-error' }, errors.submit),
                                createElement('button', {
                                    className: 'primary-button',
                                    onClick: handleSubmit,
                                    disabled: loading
                                }, loading ? 'Submitting...' : 'Submit')
                            ),
                            
                            createElement('div', { className: 'illustration' },
                                createElement('div', { className: 'meeting-illustration' },
                                    createElement('div', { className: 'wifi-logo' },
                                        createElement('span', { className: 'logo-m' }, 'M'),
                                        createElement('div', { className: 'wifi-signals' },
                                            createElement('div', { className: 'signal signal-1' }),
                                            createElement('div', { className: 'signal signal-2' }),
                                            createElement('div', { className: 'signal signal-3' })
                                        )
                                    )
                                )
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
                )
            );
        }

        return null;
    };

    // Initialize forms when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const formWrappers = document.querySelectorAll('.moneybag-pricing-plan-wrapper');
        
        formWrappers.forEach(wrapper => {
            const config = JSON.parse(wrapper.dataset.config || '{}');
            
            // Set default values if not provided
            const safeConfig = {
                widget_id: config.widget_id || 'default',
                form_title: config.form_title || 'Pricing & Requirements',
                crm_api_url: config.crm_api_url || 'https://crm.dummy-dev.tubeonai.com/rest',
                crm_api_key: config.crm_api_key || '',
                success_redirect_url: config.success_redirect_url || '',
                consultation_duration: config.consultation_duration || 15,
                opportunity_name: config.opportunity_name || 'TubeOnAI – merchant onboarding',
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