(function() {
    'use strict';
    
    const { useState, useEffect, useCallback, createElement: h } = wp.element;
    
    const MerchantRegistrationForm = ({ config }) => {
        // State management
        const [currentStep, setCurrentStep] = useState(1);
        const [isSubmitted, setIsSubmitted] = useState(false);
        const [registrationOptions, setRegistrationOptions] = useState(null);
        const [availableLegalIdentities, setAvailableLegalIdentities] = useState([]);
        const [sessionId] = useState('sess_' + Math.random().toString(36).substring(2, 18));
        const [loading, setLoading] = useState(false);
        const [inlineError, setInlineError] = useState(null);
        
        // Form data state
        const [formData, setFormData] = useState({
            // Step 1 - Business Info
            legalIdentity: '',
            businessCategory: '',
            monthlyVolume: '',
            maxAmount: '',
            currencyType: 'BDT',
            serviceTypes: [],
            
            // Step 2 - Online Presence  
            merchantName: '',
            tradingName: '',
            domainName: '',
            
            // Step 3 - Point of Contact
            contactName: '',
            designation: '',
            email: '',
            mobile: '',
            phone: '',
            
            // Step 4 - Documents (all optional)
            logo: '',
            tradeLicense: '',
            idDocument: '',
            tinCertificate: ''
        });
        
        const [validationErrors, setValidationErrors] = useState({});
        const [uploadingFiles, setUploadingFiles] = useState({});
        const [uploadedFiles, setUploadedFiles] = useState({});
        
        // Steps configuration
        const steps = [
            { id: 1, title: 'Business Info' },
            { id: 2, title: 'Online Presence' },
            { id: 3, title: 'Point Of Contact' },
            { id: 4, title: 'Documents' }
        ];
        
        const progressPercentage = {
            1: 25,
            2: 50,
            3: 75,
            4: 100
        };
        
        // Load registration options on mount
        useEffect(() => {
            const loadRegistrationOptions = async () => {
                try {
                    const response = await fetch(config.plugin_url + 'data/merchant-registration-options.json');
                    if (response.ok) {
                        const data = await response.json();
                        setRegistrationOptions(data);
                    }
                } catch (error) {
                    console.error('Error loading registration options:', error);
                }
            };
            loadRegistrationOptions();
        }, [config.plugin_url]);
        
        // Update available legal identities when business category changes
        useEffect(() => {
            if (registrationOptions && formData.businessCategory) {
                const categories = registrationOptions.businessCategories;
                for (const [catName, catData] of Object.entries(categories)) {
                    if (catData.value === formData.businessCategory) {
                        setAvailableLegalIdentities(Object.entries(catData.identities || {}));
                        break;
                    }
                }
            } else {
                setAvailableLegalIdentities([]);
            }
        }, [formData.businessCategory, registrationOptions]);
        
        // Validation functions
        const isStep1Complete = useCallback(() => {
            return formData.legalIdentity && 
                   formData.businessCategory && 
                   formData.serviceTypes.length > 0 &&
                   formData.monthlyVolume;
        }, [formData]);
        
        const isStep2Complete = useCallback(() => {
            return formData.merchantName.trim() && 
                   formData.tradingName.trim() && 
                   formData.domainName.trim();
        }, [formData]);
        
        const isStep3Complete = useCallback(() => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const cleanMobile = formData.mobile.replace(/[\s\-\+\(\)]/g, '');
            const phoneRegex = /^01[3-9][0-9]{8}$/;
            return formData.contactName.trim() && 
                   formData.designation.trim() && 
                   formData.email.trim() && 
                   emailRegex.test(formData.email) &&
                   formData.mobile.trim() &&
                   phoneRegex.test(cleanMobile);
        }, [formData]);
        
        const isStep4Complete = useCallback(() => {
            return true; // All file uploads are optional
        }, []);
        
        const isStepComplete = useCallback((stepNumber) => {
            switch(stepNumber) {
                case 1: return isStep1Complete();
                case 2: return isStep2Complete();
                case 3: return isStep3Complete();
                case 4: return isStep4Complete();
                default: return false;
            }
        }, [isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete]);
        
        const getStepStatus = useCallback((stepNumber) => {
            if (stepNumber < currentStep) {
                return isStepComplete(stepNumber) ? 'completed' : 'incomplete';
            } else if (stepNumber === currentStep) {
                return 'current';
            } else {
                return 'future';
            }
        }, [currentStep, isStepComplete]);
        
        const canNavigateToStep = useCallback((stepId) => {
            if (stepId === currentStep) return true;
            if (stepId < currentStep) return true;
            if (stepId === currentStep + 1 && isStepComplete(currentStep)) return true;
            return false;
        }, [currentStep, isStepComplete]);
        
        const getProgressHeight = useCallback(() => {
            let completedSteps = 0;
            for (let i = 1; i <= currentStep && i <= 4; i++) {
                if (i < currentStep || (i === currentStep && isStepComplete(i))) {
                    completedSteps++;
                }
            }
            return (completedSteps / 4) * 100;
        }, [currentStep, isStepComplete]);
        
        // Phone number validation - must start with 01
        const validatePhoneNumber = (phone) => {
            // Remove all spaces and special characters
            const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
            // Must start with 01 and be exactly 11 digits
            const phoneRegex = /^01[3-9][0-9]{8}$/;
            return phoneRegex.test(cleanPhone);
        };

        // File upload handler using the new file upload API
        const handleFileUpload = useCallback(async (field, file) => {
            if (!file) return;
            
            // Map field names to document types
            const documentTypeMap = {
                'logo': 'logo',
                'tradeLicense': 'trade_license',
                'idDocument': 'owner_id',
                'tinCertificate': 'tin_certificate'
            };
            
            const documentType = documentTypeMap[field];
            if (!documentType) {
                console.error('Invalid field for file upload:', field);
                return;
            }
            
            // Validate file
            const maxSize = 1048576; // 1MB
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            
            if (file.size > maxSize) {
                setInlineError({
                    message: 'File size must be less than 1MB',
                    type: 'error'
                });
                return;
            }
            
            if (!allowedTypes.includes(file.type)) {
                setInlineError({
                    message: 'Only JPG, PNG, and PDF files are allowed',
                    type: 'error'
                });
                return;
            }
            
            setUploadingFiles(prev => ({ ...prev, [field]: true }));
            setInlineError(null);
            
            try {
                // Create form data for file upload
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', documentType);
                formData.append('description', `${documentType} for merchant registration`);
                
                // Upload to file API
                const response = await fetch('https://crm.moneybag.com.bd/files/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNmVjMjllMS1jNjg5LTRhZmItODViNi0xNWI3NzA2Mzk4MjAiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMDZlYzI5ZTEtYzY4OS00YWZiLTg1YjYtMTViNzcwNjM5ODIwIiwiaWF0IjoxNzU1NDEyODEzLCJleHAiOjQ5MDkwMTI4MTIsImp0aSI6IjliZGEwMDY4LTFmODAtNDAwMS1iN2E0LWRiNTVhMGRmYTQ4MSJ9.HOPJJTd3mXz2HbcWxDnNc2eaWEW9FbM-K-6DmlezeIo'
                    },
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Store uploaded file info
                    setUploadedFiles(prev => ({
                        ...prev,
                        [field]: {
                            file_id: result.data.file_id,
                            url: result.data.url,
                            original_name: result.data.original_name,
                            document_type: result.data.document_type
                        }
                    }));
                    
                    // Update form data with file name
                    setFormData(prev => ({
                        ...prev,
                        [field]: result.data.original_name
                    }));
                    
                    setInlineError({
                        message: `${file.name} uploaded successfully!`,
                        type: 'success'
                    });
                } else {
                    throw new Error(result.error?.message || 'Upload failed');
                }
            } catch (error) {
                console.error('File upload error:', error);
                setInlineError({
                    message: `Failed to upload ${file.name}: ${error.message}`,
                    type: 'error'
                });
            } finally {
                setUploadingFiles(prev => ({ ...prev, [field]: false }));
            }
        }, []);
        
        // Handle form input changes
        const handleInputChange = useCallback((field, value) => {
            // For mobile and phone fields, validate and format
            if (field === 'mobile' || field === 'phone') {
                // Only allow digits, spaces, hyphens, plus signs, and parentheses
                const cleanValue = value.replace(/[^\d\s\-\+\(\)]/g, '');
                setFormData(prev => ({ ...prev, [field]: cleanValue }));
            } else {
                setFormData(prev => ({ ...prev, [field]: value }));
            }
            
            // Clear validation error for this field
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
            
            // If business category changes, reset legal identity if not available
            if (field === 'businessCategory') {
                const isAvailable = availableLegalIdentities.some(([name, data]) => 
                    data.value === formData.legalIdentity
                );
                if (!isAvailable) {
                    setFormData(prev => ({ ...prev, legalIdentity: '' }));
                }
            }
        }, [availableLegalIdentities, formData.legalIdentity]);
        
        // Handle service type selection
        const handleServiceToggle = useCallback((service) => {
            setFormData(prev => ({
                ...prev,
                serviceTypes: prev.serviceTypes.includes(service)
                    ? prev.serviceTypes.filter(s => s !== service)
                    : [...prev.serviceTypes, service]
            }));
        }, []);
        
        const handleSelectAllServices = useCallback((isChecked) => {
            // Use proper API values instead of labels
            const allServiceValues = ['visa', 'mastercard', 'amex', 'dbbl_nexus', 'bkash', 
                                    'nagad', 'unionpay', 'rocket', 'diners', 'upay'];
            setFormData(prev => ({
                ...prev,
                serviceTypes: isChecked ? [...allServiceValues] : []
            }));
        }, []);
        
        // Navigation handlers
        const handleNext = useCallback(() => {
            const canProceed = isStepComplete(currentStep);
            
            if (!canProceed) {
                let missingFields = [];
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const cleanMobile = formData.mobile.replace(/[\s\-\+\(\)]/g, '');
                const phoneRegex = /^01[3-9][0-9]{8}$/;
                
                if (currentStep === 1) {
                    if (!formData.businessCategory) missingFields.push('Business Category');
                    if (!formData.legalIdentity) missingFields.push('Legal Identity');
                    if (!formData.monthlyVolume) missingFields.push('Monthly Volume');
                    if (formData.serviceTypes.length === 0) missingFields.push('Service Types');
                } else if (currentStep === 2) {
                    if (!formData.merchantName.trim()) missingFields.push('Business Name');
                    if (!formData.tradingName.trim()) missingFields.push('Trading Name');
                    if (!formData.domainName.trim()) missingFields.push('Website/Domain');
                } else if (currentStep === 3) {
                    if (!formData.contactName.trim()) missingFields.push('Contact Name');
                    if (!formData.designation.trim()) missingFields.push('Designation');
                    if (!formData.email.trim()) missingFields.push('Email');
                    else if (!emailRegex.test(formData.email)) missingFields.push('Valid Email');
                    if (!formData.mobile.trim()) missingFields.push('Mobile Number (must start with 01)');
                    else if (!phoneRegex.test(cleanMobile)) missingFields.push('Valid Mobile Number (01XXXXXXXXX format)');
                }
                
                const errorMsg = missingFields.length > 0 
                    ? `Please fill: ${missingFields.join(', ')}` 
                    : 'Please fill all required fields before proceeding to the next step.';
                    
                setInlineError({ message: errorMsg, type: 'error' });
                return;
            }
            
            setInlineError(null);
            
            if (currentStep < 4) {
                setCurrentStep(prev => prev + 1);
            } else {
                // Submit on step 4 after file uploads
                handleSubmit();
            }
        }, [currentStep, formData, isStepComplete]);
        
        const handlePrevious = useCallback(() => {
            if (currentStep > 1) {
                setCurrentStep(prev => prev - 1);
                setInlineError(null);
            }
        }, [currentStep]);
        
        const handleStepClick = useCallback((stepId) => {
            if (canNavigateToStep(stepId)) {
                setCurrentStep(stepId);
                setInlineError(null);
            } else {
                setInlineError({ 
                    message: 'Please complete the current step before proceeding.', 
                    type: 'warning' 
                });
            }
        }, [canNavigateToStep]);
        
        // Submit handler
        const handleSubmit = async () => {
            try {
                setLoading(true);
                
                // Format data according to CRM API requirements
                const submitData = {
                    // Basic company information only (minimal required fields)
                    name: formData.merchantName,
                    domainName: formData.domainName,
                    
                    // Contact information (flatten the structure)
                    email: formData.email,
                    phone: formData.mobile.replace(/[\s\-\+\(\)]/g, ''),
                    
                    // Extended properties in a custom field
                    customFields: {
                        tradingName: formData.tradingName,
                        businessCategory: formData.businessCategory,
                        legalIdentity: formData.legalIdentity,
                        monthlyVolume: formData.monthlyVolume,
                        maxTransactionAmount: formData.maxAmount || '0',
                        currency: formData.currencyType,
                        serviceTypes: formData.serviceTypes,
                        contactName: formData.contactName,
                        designation: formData.designation,
                        officePhone: formData.phone || '',
                        documents: uploadedFiles,
                        sessionId: sessionId,
                        source: 'wordpress_plugin',
                        timestamp: new Date().toISOString()
                    }
                };
                
                // Debug: Log submission data
                console.log('Submitting merchant data:', submitData);
                
                // Use WordPress AJAX to avoid CORS issues
                const ajaxData = new FormData();
                ajaxData.append('action', 'moneybag_submit_merchant_registration');
                ajaxData.append('nonce', window.moneybagMerchantAjax.nonce);
                ajaxData.append('merchant_data', JSON.stringify(submitData));

                const response = await fetch(window.moneybagMerchantAjax.ajaxurl, {
                    method: 'POST',
                    body: ajaxData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                // Debug: Log API response
                console.log('API Response:', result);
                
                setLoading(false);
                
                if (result.success) {
                    setIsSubmitted(true);
                    if (config.redirect_url) {
                        setTimeout(() => {
                            window.location.href = config.redirect_url;
                        }, 3000);
                    }
                } else {
                    // Better error handling for different response formats
                    let errorMessage = 'Registration failed';
                    if (typeof result.data === 'string') {
                        errorMessage = result.data;
                    } else if (typeof result.data === 'object' && result.data.message) {
                        errorMessage = result.data.message;
                    } else if (typeof result.data === 'object' && result.data.error) {
                        errorMessage = result.data.error;
                    } else if (result.data) {
                        errorMessage = JSON.stringify(result.data);
                    }
                    throw new Error(errorMessage);
                }
            } catch (error) {
                setLoading(false);
                let displayMessage = 'Registration failed';
                
                // Handle specific network errors
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    displayMessage = 'Network connection error. Please check your internet connection and try again.';
                } else if (error.message && error.message.includes('ERR_CONNECTION_TIMED_OUT')) {
                    displayMessage = 'Connection timed out. Please try again in a moment.';
                } else if (error.message && error.message.includes('HTTP 5')) {
                    displayMessage = 'Server error. Please try again later.';
                } else if (error.message && error.message !== '[object Object]') {
                    displayMessage = error.message;
                } else if (error.toString && error.toString() !== '[object Object]') {
                    displayMessage = error.toString();
                } else {
                    displayMessage = 'Registration failed. Please try again.';
                }
                
                console.error('Submission error:', error);
                
                setInlineError({ 
                    message: displayMessage, 
                    type: 'error' 
                });
            }
        };
        
        // No full-screen loading - spinner is now in the submit button
        
        // Success screen
        if (isSubmitted) {
            return h('div', { className: 'merchant-form-container' },
                h('div', { className: 'merchant-form-content' },
                    h('div', { className: 'success-layout' },
                        h('div', { className: 'success-sidebar' },
                            h('h3', { className: 'success-sidebar-title' }, 'Registration Complete'),
                            h('p', { className: 'success-sidebar-subtitle' }, 'Your application has been submitted successfully and is now under review.'),
                            h('div', { className: 'success-illustration' },
                                h('div', { className: 'success-checkmark' },
                                    h('svg', { 
                                        width: '80', 
                                        height: '80', 
                                        viewBox: '0 0 80 80',
                                        fill: 'none'
                                    },
                                        h('circle', {
                                            cx: '40',
                                            cy: '40', 
                                            r: '40',
                                            fill: 'url(#successGradient)'
                                        }),
                                        h('path', {
                                            d: 'M25 40L35 50L55 30',
                                            stroke: 'white',
                                            strokeWidth: '4',
                                            strokeLinecap: 'round',
                                            strokeLinejoin: 'round'
                                        }),
                                        h('defs', null,
                                            h('linearGradient', {
                                                id: 'successGradient',
                                                x1: '0%',
                                                y1: '0%',
                                                x2: '100%',
                                                y2: '100%'
                                            },
                                                h('stop', { offset: '0%', stopColor: '#10b981' }),
                                                h('stop', { offset: '100%', stopColor: '#059669' })
                                            )
                                        )
                                    )
                                )
                            )
                        ),
                        h('div', { className: 'success-main-content' },
                            h('div', { className: 'success-card' },
                                h('h1', { className: 'success-title' }, 'Thank You for Your Application!'),
                                h('p', { className: 'success-description' }, 
                                    'Your merchant registration has been submitted successfully. Our team will review your application and contact you within 1-3 business days.'
                                ),
                                h('div', { className: 'success-details' },
                                    h('div', { className: 'success-detail-item' },
                                        h('h4', null, 'What\'s Next?'),
                                        h('ul', null,
                                            h('li', null, '• We will review your application thoroughly'),
                                            h('li', null, '• You will receive a confirmation email shortly'),
                                            h('li', null, '• Our team may contact you for additional information'),
                                            h('li', null, '• Account activation typically takes 1-3 business days')
                                        )
                                    ),
                                    h('div', { className: 'success-detail-item' },
                                        h('h4', null, 'Need Help?'),
                                        h('p', null, 'If you have any questions, feel free to contact our support team.'),
                                        h('div', { className: 'success-actions' },
                                            h('button', { 
                                                className: 'btn btn-secondary',
                                                onClick: () => window.open('https://moneybag.com.bd/support/#faq', '_blank', 'noopener,noreferrer')
                                            }, 'FAQ'),
                                            h('button', { 
                                                className: 'btn btn-primary',
                                                onClick: () => window.location.reload()
                                            }, 'Submit New Application')
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );
        }
        
        // Step 1 Content
        const renderStep1 = () => {
            // Map service values to labels for display
            const serviceMap = {
                'visa': 'Visa',
                'mastercard': 'Mastercard', 
                'amex': 'American Express',
                'dbbl_nexus': 'DBBL-Nexus',
                'bkash': 'bKash',
                'nagad': 'Nagad',
                'unionpay': 'UnionPay',
                'rocket': 'Rocket',
                'diners': 'Diners Club',
                'upay': 'Upay'
            };
            const allServiceValues = Object.keys(serviceMap);
            
            return h('div', { className: 'step-content-1' },
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Business Category ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('select', {
                            className: `form-select ${formData.businessCategory ? 'valid' : ''}`,
                            value: formData.businessCategory,
                            onChange: (e) => handleInputChange('businessCategory', e.target.value)
                        },
                            h('option', { value: '', disabled: true, hidden: true }, 'Select Business Category'),
                            registrationOptions?.businessCategories && 
                                Object.entries(registrationOptions.businessCategories).map(([name, data]) =>
                                    h('option', { key: data.value, value: data.value }, name)
                                )
                        )
                    ),
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Legal Identity ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('select', {
                            className: `form-select ${formData.legalIdentity ? 'valid' : ''}`,
                            value: formData.legalIdentity,
                            onChange: (e) => handleInputChange('legalIdentity', e.target.value)
                        },
                            !formData.businessCategory 
                                ? h('option', { value: '', disabled: true }, 'Please select Business Category first')
                                : [
                                    h('option', { value: '', disabled: true, hidden: true }, 'Select Legal Identity'),
                                    ...availableLegalIdentities.map(([name, data]) =>
                                        h('option', { key: data.value, value: data.value }, name)
                                    )
                                ]
                        )
                    )
                ),
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Monthly Transaction Volume ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('select', {
                            className: `form-select ${formData.monthlyVolume ? 'valid' : ''}`,
                            value: formData.monthlyVolume,
                            onChange: (e) => handleInputChange('monthlyVolume', e.target.value)
                        },
                            h('option', { value: '', disabled: true, hidden: true }, 'Select Monthly Volume'),
                            registrationOptions?.monthlyVolumes?.map(volume =>
                                h('option', { key: volume.value, value: volume.value }, volume.label)
                            )
                        )
                    ),
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' }, 'Maximum Amount in a Single Transaction'),
                        h('input', {
                            type: 'number',
                            className: 'form-input',
                            value: formData.maxAmount,
                            onChange: (e) => handleInputChange('maxAmount', e.target.value),
                            placeholder: 'Enter amount',
                            min: '0',
                            step: 'any'
                        })
                    )
                ),
                h('div', { className: 'form-row full-width' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Type of Service Needed ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('div', { className: 'service-grid' },
                            h('div', { className: 'service-item' },
                                h('input', {
                                    type: 'checkbox',
                                    className: 'select-all-checkbox',
                                    id: 'select-all-services',
                                    checked: formData.serviceTypes.length === allServiceValues.length,
                                    onChange: (e) => handleSelectAllServices(e.target.checked)
                                }),
                                h('label', { 
                                    className: 'service-label',
                                    htmlFor: 'select-all-services'
                                }, 'Select All')
                            ),
                            ...allServiceValues.map(serviceValue =>
                                h('div', { key: serviceValue, className: 'service-item' },
                                    h('input', {
                                        type: 'checkbox',
                                        className: 'service-checkbox',
                                        id: `service-${serviceValue}`,
                                        checked: formData.serviceTypes.includes(serviceValue),
                                        onChange: () => handleServiceToggle(serviceValue)
                                    }),
                                    h('label', {
                                        className: 'service-label',
                                        htmlFor: `service-${serviceValue}`
                                    }, serviceMap[serviceValue])
                                )
                            )
                        )
                    )
                )
            );
        };
        
        // Step 2 Content
        const renderStep2 = () => {
            return h('div', { className: 'step-content-2' },
                h('div', { className: 'form-row full-width' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Merchant Registered Name ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `form-input ${formData.merchantName.trim() ? 'valid' : ''}`,
                            value: formData.merchantName,
                            onChange: (e) => handleInputChange('merchantName', e.target.value),
                            placeholder: 'Enter registered business name'
                        })
                    )
                ),
                h('div', { className: 'form-row full-width' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Trading Name (Name on the Shop) ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `form-input ${formData.tradingName.trim() ? 'valid' : ''}`,
                            value: formData.tradingName,
                            onChange: (e) => handleInputChange('tradingName', e.target.value),
                            placeholder: 'Enter trading/shop name'
                        })
                    )
                ),
                h('div', { className: 'form-row full-width' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Domain Name ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `form-input ${formData.domainName.trim() ? 'valid' : ''}`,
                            value: formData.domainName,
                            onChange: (e) => handleInputChange('domainName', e.target.value),
                            placeholder: 'https://www.example.com'
                        }),
                        h('small', { className: 'form-hint' }, 'Enter your website URL starting with http:// or https://')
                    )
                )
            );
        };
        
        // Step 3 Content
        const renderStep3 = () => {
            return h('div', { className: 'step-content-3' },
                h('div', { className: 'form-row full-width' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Contact Name ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `form-input ${formData.contactName.trim() ? 'valid' : ''}`,
                            value: formData.contactName,
                            onChange: (e) => handleInputChange('contactName', e.target.value),
                            placeholder: 'Full name'
                        })
                    )
                ),
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Designation ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `form-input ${formData.designation.trim() ? 'valid' : ''}`,
                            value: formData.designation,
                            onChange: (e) => handleInputChange('designation', e.target.value),
                            placeholder: 'Job title/position'
                        })
                    ),
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Email ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'email',
                            className: `form-input ${formData.email.trim() ? 'valid' : ''}`,
                            value: formData.email,
                            onChange: (e) => handleInputChange('email', e.target.value),
                            placeholder: 'email@example.com'
                        })
                    )
                ),
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            'Mobile Number ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `form-input ${formData.mobile.trim() ? 'valid' : ''}`,
                            value: formData.mobile,
                            onChange: (e) => handleInputChange('mobile', e.target.value),
                            placeholder: '01XXXXXXXXX'
                        }),
                        h('small', { className: 'form-hint' }, 'Bangladesh mobile number starting with 01 (11 digits total)')
                    ),
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' }, 'Phone Number (Optional)'),
                        h('input', {
                            type: 'text',
                            className: 'form-input',
                            value: formData.phone,
                            onChange: (e) => handleInputChange('phone', e.target.value),
                            placeholder: 'Office/landline number'
                        })
                    )
                )
            );
        };
        
        // Step 4 Content - File Uploads
        const renderStep4 = () => {
            const renderFileUpload = (field, label, required = false) => {
                return h('div', { className: 'form-row full-width' },
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' },
                            label,
                            ' ',
                            required 
                                ? h('span', { className: 'required-indicator' }, '*')
                                : h('span', { className: 'optional-indicator' }, '(Optional)')
                        ),
                        h('div', { 
                            className: `file-upload ${formData[field] ? 'has-file' : ''} ${uploadingFiles[field] ? 'uploading' : ''}`,
                            onClick: () => {
                                if (uploadingFiles[field]) return; // Prevent clicks during upload
                                
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.jpg,.jpeg,.png,.pdf';
                                input.onchange = (e) => {
                                    if (e.target.files[0]) {
                                        handleFileUpload(field, e.target.files[0]);
                                    }
                                };
                                input.click();
                            }
                        },
                            h('div', { className: 'file-upload-content' },
                                h('span', { className: 'file-upload-text' },
                                    uploadingFiles[field] 
                                        ? 'Uploading...' 
                                        : formData[field] 
                                            ? formData[field] 
                                            : `Click to upload ${label.toLowerCase()}`
                                ),
                                h('svg', { 
                                    className: 'upload-icon',
                                    fill: 'none',
                                    stroke: 'currentColor',
                                    viewBox: '0 0 24 24'
                                },
                                    h('path', {
                                        strokeLinecap: 'round',
                                        strokeLinejoin: 'round',
                                        strokeWidth: '2',
                                        d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                                    })
                                )
                            )
                        ),
                        h('small', { className: 'form-hint' }, 'Accepted formats: JPG, JPEG, PNG, PDF (Max 1MB)')
                    )
                );
            };
            
            return h('div', { className: 'step-content-4' },
                renderFileUpload('logo', 'Business / Organization Logo'),
                renderFileUpload('tradeLicense', 'Trade License'),
                renderFileUpload('idDocument', 'NID / Passport / Birth Certificate / Driving License'),
                renderFileUpload('tinCertificate', 'TIN Certificate')
            );
        };
        
        // Get current step content
        const getCurrentStepContent = () => {
            switch(currentStep) {
                case 1: return renderStep1();
                case 2: return renderStep2();
                case 3: return renderStep3();
                case 4: return renderStep4();
                default: return null;
            }
        };
        
        // Render sidebar
        const renderSidebar = () => {
            return h('div', { className: 'steps-sidebar' },
                h('h3', { className: 'steps-title' }, 'Please fill this information first'),
                h('p', { className: 'steps-subtitle' }, 'After completing all steps you will be eligible for 7 days trial.'),
                h('div', { className: 'steps-list' },
                    h('div', { className: 'vertical-line-container' },
                        h('div', { className: 'vertical-line' }),
                        h('div', { 
                            className: 'vertical-line-fill',
                            style: { height: `${getProgressHeight()}%` }
                        })
                    ),
                    ...steps.map(step => {
                        const status = getStepStatus(step.id);
                        const isClickable = canNavigateToStep(step.id);
                        
                        return h('div', {
                            key: step.id,
                            className: `step-item step-${status} ${isClickable ? 'clickable' : 'disabled'}`,
                            onClick: isClickable ? () => handleStepClick(step.id) : null
                        },
                            h('div', { className: 'step-content' },
                                h('div', { className: 'step-title' }, `Step ${step.id}: ${step.title}`),
                                status === 'completed' && h('div', { className: 'step-status completed' }, '✓ Completed'),
                                status === 'incomplete' && h('div', { className: 'step-status incomplete' }, '⚠ Incomplete'),
                                status === 'current' && h('div', { className: 'step-status current' }, 'In Progress')
                            )
                        );
                    })
                ),
                h('div', { className: 'steps-illustration' },
                    h('img', {
                        src: `${config.plugin_url}assets/image/img_join now.webp`,
                        alt: 'Join Now',
                        className: 'illustration-image'
                    })
                )
            );
        };
        
        // Render instructions
        const renderInstructions = () => {
            const instructionsMap = {
                1: [
                    '• Select your business type from the legal identity dropdown',
                    '• Enter your expected monthly transaction amount in BDT',
                    '• Specify the highest single transaction amount you expect to process',
                    '• Select all payment methods you want to accept (you can add more later)',
                    '• All fields are required to proceed to the next step',
                    '• Ensure your transaction volumes are realistic to avoid delays in approval'
                ],
                2: [
                    '• Enter your official business name as registered with government authorities',
                    '• Trading name is what customers see (your shop/brand name)',
                    '• Domain Name should be your complete website URL',
                    '• If you don\'t have a website yet, enter your social media page',
                    '• Double-check spelling - this information will appear on your merchant account',
                    '• These details will be used for payment gateway integration'
                ],
                3: [
                    '• Provide details of the primary contact person for this merchant account',
                    '• This person will receive all account-related communications',
                    '• Email must be valid and actively monitored',
                    '• Mobile number must be a Bangladesh number',
                    '• Phone number is optional but recommended for urgent support',
                    '• This contact will have admin access to the merchant dashboard'
                ],
                4: [
                    '• Company Logo - Square format (500x500px recommended), PNG preferred',
                    '• Trade License: Current and valid trade license document',
                    '• Owner ID - NID/Passport/Birth Certificate/Driving License',
                    '• TIN Certificate: Tax Identification Number certificate',
                    '• All documents must be clear, readable, and unedited',
                    '• Accepted formats: JPG, JPEG, PNG, PDF (max 1MB per file)',
                    '• All file uploads are optional but recommended for faster approval'
                ]
            };
            
            return h('div', { className: 'instructions-panel' },
                h('h3', { className: 'instructions-title' }, 'Instructions'),
                h('ul', { className: 'instructions-list' },
                    ...instructionsMap[currentStep].map((instruction, index) =>
                        h('li', { key: index }, instruction)
                    )
                )
            );
        };
        
        // Main render
        return h('div', { className: 'merchant-form-container' },
            h('div', { className: 'merchant-form-content' },
                // Main content wrapper for sidebar, form, and instructions
                h('div', { className: 'merchant-form-layout' },
                    renderSidebar(),
                    // Form content wrapper
                    h('div', { className: 'form-main-wrapper' },
                        // Progress header inside form-main-wrapper
                        h('div', { className: 'form-progress-header' },
                            h('div', { className: 'merchant-form-header-nav' },
                                h('button', null, 'Need Assistance?'),
                                h('button', { 
                                    onClick: () => window.open('https://moneybag.com.bd/support/#faq', '_blank', 'noopener,noreferrer')
                                }, 'FAQ')
                            ),
                            h('div', { className: 'progress-section' },
                                h('div', { className: 'progress-text' }, `${progressPercentage[currentStep]}% Progress`),
                                h('div', { className: 'progress-bar' },
                                    h('div', {
                                        className: 'progress-bar-fill',
                                        style: { width: `${progressPercentage[currentStep]}%` }
                                    })
                                )
                            )
                        ),
                        // Content wrapper for form and instructions
                        h('div', { className: 'form-main-content' },
                            h('div', { className: 'form-card' },
                                inlineError && h('div', { className: `inline-error inline-error-${inlineError.type}` },
                                    h('div', { className: 'inline-error-content' },
                                        h('span', { className: 'inline-error-icon' },
                                            inlineError.type === 'error' ? '⚠' :
                                            inlineError.type === 'success' ? '✓' : 'ℹ'
                                        ),
                                        h('span', { className: 'inline-error-message' }, inlineError.message)
                                    )
                                ),
                                getCurrentStepContent(),
                                h('div', { className: 'form-navigation' },
                                    h('div', null,
                                        currentStep > 1 
                                            ? h('button', {
                                                className: 'btn btn-secondary',
                                                onClick: handlePrevious
                                            }, 'Previous')
                                            : h('div')
                                    ),
                                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
                                        h('button', {
                                            className: `btn btn-primary btn-next ${loading ? 'loading' : ''}`,
                                            onClick: handleNext,
                                            disabled: loading
                                        }, 
                                            loading && currentStep === 4 
                                                ? h('span', { className: 'button-spinner-wrapper' },
                                                    h('span', { className: 'button-spinner' }),
                                                    h('span', null, 'Submitting...')
                                                  )
                                                : (currentStep === 4 ? 'Submit' : 'Save & Next')
                                        )
                                    )
                                )
                            ),
                            renderInstructions()
                        )
                    )
                )
            )
        );
    };
    
    // Initialize when DOM is ready
    jQuery(document).ready(function($) {
        $('.moneybag-merchant-form-wrapper').each(function() {
            const config = $(this).data('config');
            const widgetId = config?.widget_id;
            
            if (config && widgetId) {
                const container = document.getElementById(`moneybag-merchant-form-${widgetId}`);
                if (container) {
                    wp.element.render(
                        wp.element.createElement(MerchantRegistrationForm, { config }),
                        container
                    );
                }
            }
        });
    });
})();