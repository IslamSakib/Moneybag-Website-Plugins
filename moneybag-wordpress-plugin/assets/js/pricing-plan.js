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
        
        const [formData, setFormData] = useState({
            legalIdentity: '',
            businessCategory: '',
            monthlyVolume: '',
            serviceType: '',
            domainName: '',
            maxAmount: '',
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

        // Calculate pricing and documents based on form data
        useEffect(() => {
            if (pricingRules && formData.legalIdentity && formData.monthlyVolume) {
                calculatePricingAndDocuments();
            }
        }, [pricingRules, formData.legalIdentity, formData.businessCategory, formData.monthlyVolume]);

        const calculatePricingAndDocuments = () => {
            if (!pricingRules) return;

            // Find matching rule
            const matchingRule = pricingRules.rules.find(rule => {
                const conditions = rule.conditions;
                
                // Check all conditions
                let matches = true;
                
                if (conditions.legalIdentity && conditions.legalIdentity !== formData.legalIdentity) {
                    matches = false;
                }
                
                if (conditions.businessCategory && conditions.businessCategory !== formData.businessCategory) {
                    matches = false;
                }
                
                if (conditions.monthlyVolume && conditions.monthlyVolume !== '*' && conditions.monthlyVolume !== formData.monthlyVolume) {
                    matches = false;
                }
                
                return matches;
            });

            // Get pricing and documents
            const pricingKey = matchingRule ? matchingRule.pricing : pricingRules.defaultPricing;
            const documentsKey = matchingRule ? matchingRule.documents : pricingRules.defaultDocuments;
            
            setSelectedPricing({
                ...pricingRules.sets.pricing[pricingKey],
                specialOffer: matchingRule?.specialOffer
            });
            setSelectedDocuments(pricingRules.sets.documents[documentsKey]);
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
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
            return domainRegex.test(domain);
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
                case 'monthlyVolume':
                    if (!value) error = 'Monthly volume is required';
                    break;
                case 'serviceType':
                    if (!value) error = 'Service type is required';
                    break;
                case 'domainName':
                    if (value && !validateDomain(value)) error = 'Invalid domain format (e.g., example.com)';
                    break;
                case 'maxAmount':
                    if (!value) error = 'Maximum amount is required';
                    else if (isNaN(value) || parseFloat(value) <= 0) error = 'Amount must be a positive number';
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
- **Monthly volume:** ${formData.monthlyVolume}
- **Max single txn:** ${formData.maxAmount}
- **Services needed:** ${formData.serviceType}
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
            const requiredFields = ['domainName', 'maxAmount', 'name', 'email', 'mobile'];
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
                
                // Redirect if configured
                if (config.success_redirect_url) {
                    setTimeout(() => {
                        window.location.href = config.success_redirect_url;
                    }, 3000);
                }
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
                    createElement('option', { value: '' }, placeholder),
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
                        renderSelect('monthlyVolume'),
                        renderSelect('serviceType'),
                        createElement('button', {
                            className: 'primary-button',
                            onClick: nextStep,
                            disabled: !formData.legalIdentity || !formData.businessCategory || !formData.monthlyVolume || !formData.serviceType
                        }, 'Get Pricing & Docs')
                    ),
                    createElement('div', { className: 'content-section' },
                        createElement('div', { className: 'content-text' },
                            createElement('h2', null,
                                'Share your business details for a ',
                                createElement('span', { className: 'highlight' }, 'customized'),
                                ' Moneybag pricing ',
                                createElement('span', { className: 'highlight' }, 'quote'),
                                ' and the exact documents needed to start accepting payments seamlessly.'
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
                        renderSelect('monthlyVolume', [], formData.monthlyVolume),
                        renderSelect('serviceType', [], formData.serviceType),
                        createElement('button', {
                            className: 'primary-button',
                            onClick: nextStep
                        }, 'Book an Appointment →')
                    ),
                    
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
                            createElement('div', { className: 'pricing-row' },
                                createElement('span', null, 'Plan'),
                                createElement('span', null, selectedPricing.name)
                            ),
                            createElement('div', { className: 'pricing-row' },
                                createElement('span', null, 'Card Rate'),
                                createElement('span', null, selectedPricing.cardRate)
                            ),
                            createElement('div', { className: 'pricing-row' },
                                createElement('span', null, 'Wallet Rate'),
                                createElement('span', null, selectedPricing.walletRate)
                            ),
                            createElement('div', { className: 'pricing-row' },
                                createElement('span', null, 'Setup Fee'),
                                createElement('span', null, selectedPricing.setupFee)
                            ),
                            createElement('div', { className: 'pricing-row' },
                                createElement('span', null, 'Monthly Fee'),
                                createElement('span', null, selectedPricing.monthlyFee === '0' ? 'FREE' : `${selectedPricing.monthlyFee} BDT`)
                            )
                        ),
                        selectedPricing.features && createElement('div', { style: { marginTop: '16px' } },
                            selectedPricing.features.map((feature, index) =>
                                createElement('div', { 
                                    key: index,
                                    className: 'checklist-item',
                                    style: { fontSize: '12px' }
                                }, feature)
                            )
                        ),
                        selectedPricing.specialOffer && createElement('div', { className: 'special-offer' },
                            selectedPricing.specialOffer
                        ),
                        createElement('p', { className: 'contact-text' },
                            'Contact us to discuss your needs and negotiate a better price.'
                        )
                    )
                )
            );
        }

        // Step 3: Consultation Booking
        if (currentStep === 3) {
            return createElement('div', { className: 'pricing-plan-container' },
                createElement('div', { className: 'consultation-container' },
                    createElement('h1', null, `${config.consultation_duration} minutes`, createElement('br'), 'Expert Consultation'),
                    createElement('div', { className: 'consultation-content' },
                        createElement('div', { className: 'consultation-form' },
                            createElement('div', { className: 'form-grid' },
                                renderSelect('legalIdentity', [], formData.legalIdentity),
                                renderSelect('businessCategory', [], formData.businessCategory),
                                renderInput('domainName', 'text', 'example.com'),
                                renderSelect('monthlyVolume', [], formData.monthlyVolume),
                                renderInput('maxAmount', 'number', '10000'),
                                renderSelect('serviceType', [], formData.serviceType),
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
                )
            );
        }

        // Step 4: Thank You
        if (currentStep === 4) {
            return createElement('div', { className: 'pricing-plan-container' },
                createElement('div', { className: 'thank-you-container' },
                    createElement('div', { className: 'wifi-logo large' },
                        createElement('span', { className: 'logo-m' }, 'M'),
                        createElement('div', { className: 'wifi-signals' },
                            createElement('div', { className: 'signal signal-1' }),
                            createElement('div', { className: 'signal signal-2' }),
                            createElement('div', { className: 'signal signal-3' })
                        )
                    ),
                    createElement('h1', null, 'Thank You!'),
                    createElement('p', null, 
                        `All set! Our team will reach out within 24 hours to schedule your ${config.consultation_duration}-minute consultation. Meanwhile, check your inbox for next steps.`
                    )
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
                consultation_duration: config.consultation_duration || 50,
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