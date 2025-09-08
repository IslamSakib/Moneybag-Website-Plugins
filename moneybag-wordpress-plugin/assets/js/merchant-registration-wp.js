(function() {
    'use strict';
    
    const { useState, useEffect, useCallback, createElement: h } = wp.element;
    
    const MerchantRegistrationForm = ({ config }) => {
        // State management
        const [currentStep, setCurrentStep] = useState(1);
        const [isSubmitted, setIsSubmitted] = useState(false);
        const [apiResponse, setApiResponse] = useState(null);
        const [registrationOptions, setRegistrationOptions] = useState(null);
        const [availableLegalIdentities, setAvailableLegalIdentities] = useState([]);
        const [sessionId] = useState('sess_' + Math.random().toString(36).substring(2, 18));
        const [loading, setLoading] = useState(false);
        
        // Form data state
        const [formData, setFormData] = useState({
            // Step 1 - Business Info (simplified for no-auth API)
            businessCategory: '',
            legalIdentity: '',
            serviceTypes: [],
            
            // Step 2 - Business Details  
            businessName: '', // Replaces "Trading Name" - business_name for API
            domainName: '', // Optional business website
            
            // Step 3 - Contact Information (required for API)
            firstName: '', // Representative first name - splits "Merchant Registered Name" 
            lastName: '', // Representative last name - splits "Merchant Registered Name"
            email: '', // Required - email for API
            mobile: '', // Required - phone for API
            
            // Keep for backward compatibility but simplified
            monthlyVolume: '',
            maxAmount: '',
            currencyType: 'BDT'
        });
        
        const [validationErrors, setValidationErrors] = useState({});
        const [fieldErrors, setFieldErrors] = useState({});
        const [uploadingFiles, setUploadingFiles] = useState({});
        const [uploadedFiles, setUploadedFiles] = useState({});
        
        // Simplified steps configuration for no-auth API
        const steps = [
            { id: 1, title: 'Business Information' },
            { id: 2, title: 'Business Details' },
            { id: 3, title: 'Contact Information' }
        ];
        
        const progressPercentage = {
            1: 33,
            2: 66,
            3: 100
            // 4: 100 // Temporarily disabled
        };
        
        // Global API call system - similar to sandbox form
        const apiCall = async (action, data) => {
            const formData = new FormData();
            formData.append('action', 'moneybag_merchant_api');
            formData.append('nonce', window.moneybagMerchantAjax.nonce);
            formData.append('api_action', action);
            formData.append('data', JSON.stringify(data));
            
            try {
                const response = await fetch(window.moneybagMerchantAjax.ajaxurl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.data || 'API call failed');
                }
                
                return result.data;
            } catch (error) {
                // API call failed
                throw error;
            }
        };

        // Load registration options directly from JSON (like pricing form)
        useEffect(() => {
            const loadRegistrationOptions = async () => {
                try {
                    // Load directly from JSON file for faster rendering
                    const response = await fetch(config.plugin_url + 'data/merchant-registration-options.json');
                    if (response.ok) {
                        const data = await response.json();
                        setRegistrationOptions(data);
                        
                        // Don't set default values - let placeholders show instead
                        // Users should explicitly select their options
                    }
                } catch (error) {
                    // Error loading registration options
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
        
        // Use global validation for step completion
        const isStepComplete = useCallback((stepNumber) => {
            if (!window.MoneybagValidation) {
                // MoneybagValidation not loaded
                return false;
            }
            return window.MoneybagValidation.validateMerchantStep(stepNumber, formData);
        }, [formData]);
        
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
            for (let i = 1; i <= currentStep && i <= 3; i++) { // Changed from 4 to 3
                if (i < currentStep || (i === currentStep && isStepComplete(i))) {
                    completedSteps++;
                }
            }
            return (completedSteps / 3) * 100; // Changed from 4 to 3
        }, [currentStep, isStepComplete]);
        
        // Use global validation system
        const validateField = (fieldName, value) => {
            if (!window.MoneybagValidation) {
                // MoneybagValidation not loaded
                return '';
            }
            return window.MoneybagValidation.validateField(fieldName, value);
        };
        
        // Validate individual field and update error state
        const validateAndSetFieldError = (fieldName, value, formFieldName = null) => {
            if (!window.MoneybagValidation) {
                // MoneybagValidation not loaded
                return '';
            }
            
            const error = window.MoneybagValidation.validateField(fieldName, value);
            const errorKey = formFieldName || fieldName;
            
            setFieldErrors(prev => ({
                ...prev,
                [errorKey]: error || ''
            }));
            
            return error;
        };

        // File upload handler using global API system
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
                // Invalid field for file upload
                return;
            }
            
            // Validate file
            const maxSize = 1048576; // 1MB
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            
            if (file.size > maxSize) {
                alert('File size must be less than 1MB');
                return;
            }
            
            if (!allowedTypes.includes(file.type)) {
                alert('Only JPG, PNG, and PDF files are allowed');
                return;
            }
            
            setUploadingFiles(prev => ({ ...prev, [field]: true }));
            
            try {
                // Create form data for file upload
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', documentType);
                formData.append('description', `${documentType} for merchant registration`);
                
                // Use global API system for secure file upload
                const result = await apiCall('upload_file', {
                    file: file,
                    document_type: documentType,
                    merchant_id: sessionId
                });
                
                // Upload response received
                
                if (result) {
                    // Store uploaded file info
                    const fileInfo = {
                        url: result.file_url || result.url,
                        filename: file.name,
                        size: file.size,
                        uploadId: result.id || result.file_id
                    };
                    
                    setUploadedFiles(prev => ({
                        ...prev,
                        [field]: fileInfo
                    }));
                    
                    // Update form data with file URL
                    setFormData(prev => ({
                        ...prev,
                        [field]: fileInfo.url
                    }));
                    
                    // File uploaded successfully
                } else {
                    throw new Error(result.error?.message || 'Upload failed');
                }
            } catch (error) {
                // File upload error
                alert(`Failed to upload ${file.name}: ${error.message}`);
            } finally {
                setUploadingFiles(prev => ({ ...prev, [field]: false }));
            }
        }, []);
        
        // Handle form input changes with global validation
        const handleInputChange = useCallback((field, value) => {
            // Use global validation system for input filtering
            let processedValue = value;
            
            if (window.MoneybagValidation) {
                // Map merchant form fields to validation field names and filter types
                const fieldMap = {
                    'businessCategory': { validation: 'businessCategory', filter: 'text' },
                    'legalIdentity': { validation: 'legalIdentity', filter: 'text' },
                    'monthlyVolume': { validation: 'monthlyVolume', filter: 'text' },
                    'serviceTypes': { validation: 'serviceTypes', filter: 'array' },
                    'businessName': { validation: 'businessName', filter: 'businessName' },
                    'firstName': { validation: 'name', filter: 'name' },
                    'lastName': { validation: 'name', filter: 'name' },
                    'domainName': { validation: 'domain', filter: 'text' },
                    'mobile': { validation: 'mobile', filter: 'phone' },
                    'phone': { validation: 'phone', filter: 'phone' },
                    'email': { validation: 'email', filter: 'text' },
                    'maxAmount': { validation: 'maxAmount', filter: 'amount' }
                };
                
                const mappedField = fieldMap[field];
                if (mappedField) {
                    processedValue = window.MoneybagValidation.filterInput(value, mappedField.filter);
                }
            } else {
                // Fallback basic filtering
                if (field === 'mobile' || field === 'phone') {
                    processedValue = value.replace(/[^\d\s\-\+\(\)]/g, '');
                } else if (field === 'domainName') {
                    processedValue = value.trim();
                }
            }
            
            setFormData(prev => ({ ...prev, [field]: processedValue }));
            
            // Clear any existing validation errors for this field
            setFieldErrors(prev => ({
                ...prev,
                [field]: ''
            }));
            
            // Clear old validation errors as well
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
            
            // If business category changes, reset legal identity if not available
            if (field === 'businessCategory') {
                // Clear legal identity error when category changes
                setFieldErrors(prev => ({
                    ...prev,
                    legalIdentity: ''
                }));
                
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
            const newServiceTypes = formData.serviceTypes.includes(service)
                ? formData.serviceTypes.filter(s => s !== service)
                : [...formData.serviceTypes, service];
                
            // Update form data
            setFormData(prev => ({
                ...prev,
                serviceTypes: newServiceTypes
            }));
            
            // Immediate validation and error clearing
            if (window.MoneybagValidation) {
                const error = window.MoneybagValidation.validateField('serviceTypes', newServiceTypes);
                setFieldErrors(prev => ({
                    ...prev,
                    serviceTypes: error || ''
                }));
            }
        }, [formData.serviceTypes]);
        
        const handleSelectAllServices = useCallback((isChecked) => {
            // Use proper API values instead of labels
            const allServiceValues = ['visa', 'mastercard', 'amex', 'dbbl_nexus', 'bkash', 
                                    'nagad', 'unionpay', 'rocket', 'diners', 'upay'];
            const newServiceTypes = isChecked ? [...allServiceValues] : [];
            
            // Update form data
            setFormData(prev => ({
                ...prev,
                serviceTypes: newServiceTypes
            }));
            
            // Immediate validation and error clearing
            if (window.MoneybagValidation) {
                const error = window.MoneybagValidation.validateField('serviceTypes', newServiceTypes);
                setFieldErrors(prev => ({
                    ...prev,
                    serviceTypes: error || ''
                }));
            }
        }, []);
        
        // Navigation handlers
        const handleNext = useCallback(async () => {
            // Use global validation to get all field errors for current step
            if (window.MoneybagValidation) {
                const stepErrors = window.MoneybagValidation.validateMerchantStepFields(currentStep, formData);
                
                // Set all field errors at once
                setFieldErrors(prev => ({
                    ...prev,
                    ...stepErrors
                }));
                
                // Don't proceed if there are validation errors
                if (Object.keys(stepErrors).length > 0) {
                    return;
                }
            }
            
            const canProceed = isStepComplete(currentStep);
            
            if (!canProceed) {
                return; // Don't proceed if validation fails
            }
            
            if (currentStep < 3) {
                // Show loading briefly for step navigation
                setLoading(true);
                setTimeout(() => {
                    setCurrentStep(prev => prev + 1);
                    setLoading(false);
                }, 300);
            } else {
                // Submit on step 3
                handleSubmit();
            }
        }, [currentStep, formData, isStepComplete]);
        
        const handlePrevious = useCallback(() => {
            if (currentStep > 1) {
                setCurrentStep(prev => prev - 1);
            }
        }, [currentStep]);
        
        const handleStepClick = useCallback((stepId) => {
            if (canNavigateToStep(stepId)) {
                setCurrentStep(stepId);
            }
        }, [canNavigateToStep]);
        
        // Helper function to generate BlockNote content format
        const generateBlocknoteContent = (data) => {
            return JSON.stringify([
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "Merchant Registration Form Submission", styles: { bold: true } }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "Business Information" }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: `• Business Name: ${data.businessName || 'N/A'}` }
                    ]
                },
                {
                    type: "paragraph", 
                    content: [
                        { type: "text", text: `• Legal Identity: ${data.legalIdentity || 'N/A'}` }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "Contact Information" }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: `• Name: ${data.firstName || 'N/A'} ${data.lastName || 'N/A'}` }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: `• Email: ${data.email || 'N/A'}` }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: `• Phone: ${data.mobile || data.phone || 'N/A'}` }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: `• Website: ${data.businessWebsite || 'N/A'}` }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: `Source: WordPress Plugin (No-Auth) - ${new Date().toLocaleDateString()}` }
                    ]
                }
            ]);
        };

        // CRM Integration - Using Global System
        const sendToCRM = async (data) => {
            try {
                // CRM API call helper using unified endpoint
                const crmApiCall = async (action, crmData) => {
                    const formData = new FormData();
                    formData.append('action', 'moneybag_pricing_crm');
                    formData.append('crm_action', action);
                    formData.append('nonce', config.nonce || window.moneybagMerchantAjax?.nonce);
                    formData.append('data', JSON.stringify(crmData));
                    
                    const response = await fetch(config.ajax_url || window.moneybagMerchantAjax?.ajaxurl, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.data?.message || result.data || 'CRM operation failed');
                    }
                    return result.data;
                };
                
                // Use the global submit_all action for unified CRM submission
                const crmSubmissionData = {
                    // Person data
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    mobile: data.mobile,
                    
                    // Business data
                    businessName: data.businessName,
                    domainName: data.domainName,
                    legalIdentity: data.legalIdentity,
                    
                    // Extended fields
                    businessCategory: data.customFields?.businessCategory,
                    serviceTypes: data.customFields?.serviceTypes?.join(', '),
                    monthlyVolume: data.customFields?.monthlyVolume,
                    maxAmount: data.customFields?.maxAmount,
                    currency: data.customFields?.currency || 'BDT'
                };
                
                const crmResponse = await crmApiCall('submit_all', crmSubmissionData);
                
                // CRM submission successful - all operations handled by the global system
                const { person_id: personId, opportunity_id: opportunityId, note_id: noteId } = crmResponse;
                
                // Merchant CRM submission successful
                
                return true;
            } catch (error) {
                // Don't throw - let the main submission succeed even if CRM fails
                return false;
            }
        };
        
        // Submit handler
        const handleSubmit = async () => {
            try {
                // Validate all fields before submission using global validation
                if (window.MoneybagValidation) {
                    const allErrors = {};
                    
                    // Validate all steps
                    for (let step = 1; step <= 3; step++) {
                        const stepErrors = window.MoneybagValidation.validateMerchantStepFields(step, formData);
                        Object.assign(allErrors, stepErrors);
                    }
                    
                    // If there are validation errors, show them and don't submit
                    if (Object.keys(allErrors).length > 0) {
                        setFieldErrors(allErrors);
                        // Find the first step with errors and go there
                        for (let step = 1; step <= 3; step++) {
                            const stepErrors = window.MoneybagValidation.validateMerchantStepFields(step, formData);
                            if (Object.keys(stepErrors).length > 0) {
                                setCurrentStep(step);
                                break;
                            }
                        }
                        return;
                    }
                }
                
                setLoading(true);
                
                // Format data according to no-auth API requirements
                const submitData = {
                    // Required fields for no-auth API (mapped to new field names)
                    businessName: formData.businessName, // Maps to business_name
                    legalIdentity: formData.legalIdentity, // Maps to legal_identity  
                    firstName: formData.firstName, // Maps to first_name
                    lastName: formData.lastName, // Maps to last_name
                    email: formData.email, // Maps to email
                    mobile: formData.mobile, // Maps to phone (cleaned)
                    
                    // Optional field
                    domainName: formData.domainName, // Maps to business_website
                    
                    // Extended properties for logging/analytics (not sent to API)
                    customFields: {
                        businessCategory: formData.businessCategory,
                        serviceTypes: formData.serviceTypes,
                        monthlyVolume: formData.monthlyVolume,
                        maxAmount: formData.maxAmount || '0',
                        currency: formData.currencyType,
                        sessionId: sessionId,
                        source: 'wordpress_plugin_no_auth',
                        timestamp: new Date().toISOString()
                    }
                };
                
                // Submitting merchant data
                
                // Use global API system for merchant registration
                const result = await apiCall('submit_merchant_registration', submitData);
                
                // API response received
                
                setLoading(false);
                
                // Global API system returns data directly on success
                if (result) {
                    // Store the API response data (contains merchant_id, api_key, etc.)
                    setApiResponse(result.data || result);
                    
                    // CRM integration disabled - uncomment below if needed
                    // sendToCRM(submitData).catch(error => {
                    //     // Don't fail the whole submission if CRM fails
                    // });
                    
                    setIsSubmitted(true);
                    if (config.redirect_url) {
                        setTimeout(() => {
                            window.location.href = config.redirect_url;
                        }, 3000);
                    }
                } else {
                    throw new Error('Registration failed - no response data');
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
                
                // Check if it's a validation error from the API
                if (displayMessage.toLowerCase().includes('email') && 
                    displayMessage.toLowerCase().includes('already')) {
                    // Handle existing email error with forgot password link
                    const errorWithLink = displayMessage + ' <a href="https://sandbox.moneybag.com.bd/forgot-password" target="_blank" style="color: #ff4444; text-decoration: underline;">Forgot password?</a>';
                    setFieldErrors(prev => ({
                        ...prev,
                        email: errorWithLink
                    }));
                    // Go back to step 3 where email field is
                    setCurrentStep(3);
                } else if ((displayMessage.toLowerCase().includes('phone') || 
                           displayMessage.toLowerCase().includes('mobile')) && 
                           displayMessage.toLowerCase().includes('already')) {
                    // Handle existing phone number error with forgot password link
                    const errorWithLink = displayMessage + ' <a href="https://sandbox.moneybag.com.bd/forgot-password" target="_blank" style="color: #ff4444; text-decoration: underline;">Forgot password?</a>';
                    setFieldErrors(prev => ({
                        ...prev,
                        mobile: errorWithLink
                    }));
                    // Go back to step 3 where mobile field is
                    setCurrentStep(3);
                } else if (displayMessage.toLowerCase().includes('business name') || 
                    displayMessage.toLowerCase().includes('repeating') ||
                    displayMessage.toLowerCase().includes('validation') ||
                    displayMessage.toLowerCase().includes('invalid') ||
                    displayMessage.toLowerCase().includes('too long') ||
                    displayMessage.toLowerCase().includes('varchar')) {
                    
                    // Set inline error for the appropriate field
                    if (displayMessage.toLowerCase().includes('business name')) {
                        setFieldErrors(prev => ({
                            ...prev,
                            businessName: displayMessage
                        }));
                        // Go back to step 2 where business name is
                        setCurrentStep(2);
                    } else if (displayMessage.toLowerCase().includes('first name')) {
                        setFieldErrors(prev => ({
                            ...prev,
                            firstName: displayMessage
                        }));
                        // Go back to step 3 where first name is
                        setCurrentStep(3);
                    } else if (displayMessage.toLowerCase().includes('last name')) {
                        setFieldErrors(prev => ({
                            ...prev,
                            lastName: displayMessage
                        }));
                        // Go back to step 3 where last name is
                        setCurrentStep(3);
                    } else if (displayMessage.toLowerCase().includes('phone') || 
                              displayMessage.toLowerCase().includes('mobile')) {
                        setFieldErrors(prev => ({
                            ...prev,
                            mobile: displayMessage
                        }));
                        // Go back to step 3 where phone is
                        setCurrentStep(3);
                    } else if (displayMessage.toLowerCase().includes('email') || 
                              (displayMessage.toLowerCase().includes('varchar(30)') && displayMessage.includes('@'))) {
                        // Handle email-related errors including database length constraints
                        let errorMsg = displayMessage;
                        if (displayMessage.includes('varchar(30)')) {
                            errorMsg = 'Email must be 30 characters or less';
                        }
                        setFieldErrors(prev => ({
                            ...prev,
                            email: errorMsg
                        }));
                        // Go back to step 3 where email is
                        setCurrentStep(3);
                    }
                    // Removed generic inline error - all validation should be field-specific
                }
                // Removed non-validation error inline display - let field errors handle everything
            }
        };
        
        // No full-screen loading - spinner is now in the submit button
        
        // Success screen
        if (isSubmitted) {
            return h('div', { className: 'merchant-form-container' },
                h('div', { className: 'merchant-form-content' },
                    h('div', { className: 'success-layout' },
                        h('div', { className: 'success-sidebar' },
                            h('div', { className: 'success-sidebar-content' },
                                h('h3', { className: 'success-sidebar-title' }, 'Registration Complete'),
                                h('p', { className: 'success-sidebar-subtitle' }, 'Your application has been submitted successfully and is now under review.'),
                                h('div', { className: 'contact-info-section' },
                                    h('h4', { className: 'contact-section-title' }, 'Quick Contact'),
                                    h('div', { className: 'contact-item' },
                                        h('svg', { 
                                            className: 'contact-icon',
                                            width: '20', 
                                            height: '20', 
                                            viewBox: '0 0 24 24',
                                            fill: 'none',
                                            stroke: 'currentColor',
                                            strokeWidth: '2'
                                        },
                                            h('path', {
                                                d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'
                                            })
                                        ),
                                        h('a', { 
                                            href: 'tel:+8801958109228',
                                            className: 'contact-link',
                                            style: { 
                                                color: 'inherit', 
                                                textDecoration: 'none',
                                                transition: 'color 0.3s ease'
                                            },
                                            onMouseEnter: (e) => e.target.style.color = '#ff4444',
                                            onMouseLeave: (e) => e.target.style.color = 'inherit'
                                        }, '+880 1958 109 228')
                                    ),
                                    h('div', { className: 'contact-item' },
                                        h('svg', { 
                                            className: 'contact-icon',
                                            width: '20', 
                                            height: '20', 
                                            viewBox: '0 0 24 24',
                                            fill: 'none',
                                            stroke: 'currentColor',
                                            strokeWidth: '2'
                                        },
                                            h('path', {
                                                d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'
                                            }),
                                            h('polyline', {
                                                points: '22,6 12,13 2,6'
                                            })
                                        ),
                                        h('a', { 
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
                                    ),
                                    h('p', { className: 'contact-description' }, 
                                        'For any inquiries, feel free to reach out via phone or email. Our support team is here to assist you with any questions or service-related requests.'
                                    )
                                )
                            ),
                            h('div', { className: 'steps-illustration' },
                                h('img', {
                                    src: `${config.plugin_url}assets/image/img_join now.webp`,
                                    alt: 'Success',
                                    className: 'illustration-image'
                                })
                            )
                        ),
                        h('div', { className: 'success-main-content' },
                            h('div', { className: 'success-card' },
                                h('h1', { className: 'success-title' }, 'Thank You for Your Application!'),
                                h('p', { className: 'success-description' }, 
                                    'Your merchant registration has been submitted successfully. While we review your application, you can start testing with our sandbox environment right away!'
                                ),
                                h('div', { className: 'success-details' },
                                    (apiResponse && (apiResponse.redirect_url || apiResponse.dashboard_url)) ? (
                                        h('div', { className: 'success-detail-item sandbox-access' },
                                            h('h4', { className: 'sandbox-title' }, 
                                                h('span', { className: 'sandbox-icon' }, '🚀'),
                                                ' Your Sandbox is Ready!'
                                            ),
                                            h('div', { className: 'sandbox-login-container' },
                                                h('p', { className: 'sandbox-intro' }, 
                                                    'Your sandbox account has been created successfully! Click below to access your sandbox dashboard with automatic login.'
                                                ),
                                                h('div', { className: 'sandbox-login-action' },
                                                    h('a', { 
                                                        href: apiResponse.redirect_url || apiResponse.dashboard_url || apiResponse.magic_link_url,
                                                        target: '_blank',
                                                        rel: 'noopener noreferrer',
                                                        className: 'sandbox-login-card'
                                                    }, 
                                                        h('div', { className: 'login-card-content' },
                                                            h('div', { className: 'login-card-icon' },
                                                                h('svg', { 
                                                                    width: '32', 
                                                                    height: '32', 
                                                                    viewBox: '0 0 24 24',
                                                                    fill: 'none',
                                                                    stroke: 'currentColor',
                                                                    strokeWidth: '1.5'
                                                                },
                                                                    h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
                                                                    h('path', { d: 'M9 3v18' }),
                                                                    h('path', { d: 'M16 10l-3 3-3-3' })
                                                                )
                                                            ),
                                                            h('div', { className: 'login-card-text' },
                                                                h('span', { className: 'login-card-title' }, 'LOGIN TO SANDBOX'),
                                                                h('span', { className: 'login-card-subtitle' }, 'Click here for instant access')
                                                            ),
                                                            h('div', { className: 'login-card-arrow' },
                                                                h('svg', { 
                                                                    width: '24', 
                                                                    height: '24', 
                                                                    viewBox: '0 0 24 24',
                                                                    fill: 'none',
                                                                    stroke: 'currentColor',
                                                                    strokeWidth: '2.5'
                                                                },
                                                                    h('path', { d: 'M5 12h14', strokeLinecap: 'round' }),
                                                                    h('path', { d: 'M12 5l7 7-7 7', strokeLinecap: 'round', strokeLinejoin: 'round' })
                                                                )
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    ) : (
                                        h('div', { className: 'success-detail-item' },
                                            h('h4', null, 'What\'s Next?'),
                                            h('ul', null,
                                                h('li', null, '• We will review your application thoroughly'),
                                                h('li', null, '• You will receive a confirmation email shortly'),
                                                h('li', null, '• Our team may contact you for additional information'),
                                                h('li', null, '• Account activation typically takes 1-3 business days')
                                            )
                                        )
                                    ),
                                    h('div', { className: 'success-detail-item' },
                                        h('h4', null, 'Need Help?'),
                                        h('p', null, 'If you have any questions, feel free to contact our support team.'),
                                        h('div', { className: 'success-actions' },
                                            h('button', { 
                                                className: 'secondary-btn',
                                                onClick: () => window.open('https://moneybag.com.bd/support/#faq', '_blank')
                                            }, 'FAQ'),
                                            h('button', { 
                                                className: 'primary-btn',
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
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'Business Category ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('select', {
                            className: `input-field ${fieldErrors.businessCategory ? 'error' : ''} ${formData.businessCategory ? 'valid' : ''}`,
                            value: formData.businessCategory,
                            onChange: (e) => handleInputChange('businessCategory', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('businessCategory', e.target.value, 'businessCategory')
                        },
                            !registrationOptions?.businessCategories 
                                ? h('option', { value: '', disabled: true }, 'Loading business categories...')
                                : [
                                    h('option', { value: '', disabled: true, selected: !formData.businessCategory, hidden: true }, 'Select Business Category'),
                                    ...Object.entries(registrationOptions.businessCategories).map(([name, data]) =>
                                        h('option', { 
                                            key: data.value, 
                                            value: data.value
                                        }, name)
                                    )
                                ]
                        ),
                        fieldErrors.businessCategory && h('span', { className: 'error-message' }, fieldErrors.businessCategory)
                    ),
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'Legal Identity ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('select', {
                            className: `input-field ${fieldErrors.legalIdentity ? 'error' : ''} ${formData.legalIdentity ? 'valid' : ''}`,
                            value: formData.legalIdentity,
                            onChange: (e) => handleInputChange('legalIdentity', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('legalIdentity', e.target.value, 'legalIdentity')
                        },
                            !formData.businessCategory 
                                ? h('option', { value: '', disabled: true }, 'Please select Business Category first')
                                : [
                                    h('option', { value: '', disabled: true, selected: !formData.legalIdentity, hidden: true }, 'Select Legal Identity'),
                                    ...availableLegalIdentities.map(([name, data]) =>
                                        h('option', { 
                                            key: data.value, 
                                            value: data.value
                                        }, name)
                                    )
                                ]
                        ),
                        fieldErrors.legalIdentity && h('span', { className: 'error-message' }, fieldErrors.legalIdentity)
                    )
                ),
                h('div', { className: 'form-row' },
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'Monthly Transaction Volume ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('select', {
                            className: `input-field ${fieldErrors.monthlyVolume ? 'error' : ''} ${formData.monthlyVolume ? 'valid' : ''}`,
                            value: formData.monthlyVolume,
                            onChange: (e) => handleInputChange('monthlyVolume', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('monthlyVolume', e.target.value, 'monthlyVolume')
                        },
                            !registrationOptions?.monthlyVolumes 
                                ? h('option', { value: '', disabled: true }, 'Loading volume options...')
                                : [
                                    h('option', { value: '', disabled: true, selected: !formData.monthlyVolume, hidden: true }, 'Select Monthly Volume'),
                                    ...registrationOptions.monthlyVolumes.map((volume) =>
                                        h('option', { 
                                            key: volume.value, 
                                            value: volume.value
                                        }, volume.label)
                                    )
                                ]
                        ),
                        fieldErrors.monthlyVolume && h('span', { className: 'error-message' }, fieldErrors.monthlyVolume)
                    ),
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' }, 'Maximum Amount in a Single Transaction'),
                        h('input', {
                            type: 'number',
                            className: `input-field ${fieldErrors.maxAmount ? 'error' : ''}`,
                            value: formData.maxAmount,
                            onChange: (e) => handleInputChange('maxAmount', e.target.value),
                            placeholder: 'Enter amount',
                            min: '0',
                            step: 'any'
                        }),
                        fieldErrors.maxAmount && h('span', { className: 'error-message' }, fieldErrors.maxAmount)
                    )
                ),
                h('div', { className: 'form-row full-width' },
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
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
                                    'data-checked': formData.serviceTypes.length === allServiceValues.length ? 'true' : 'false',
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
                                        'data-checked': formData.serviceTypes.includes(serviceValue) ? 'true' : 'false',
                                        onChange: () => handleServiceToggle(serviceValue)
                                    }),
                                    h('label', {
                                        className: 'service-label',
                                        htmlFor: `service-${serviceValue}`
                                    }, serviceMap[serviceValue])
                                )
                            )
                        ),
                        fieldErrors.serviceTypes && h('span', { className: 'error-message' }, fieldErrors.serviceTypes)
                    )
                )
            );
        };
        
        // Step 2 Content - Business Details (Simplified for no-auth API)
        const renderStep2 = () => {
            return h('div', { className: 'step-content-2' },
                h('div', { className: 'form-row full-width' },
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'Business Name ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `input-field ${fieldErrors.businessName ? 'error' : ''} ${formData.businessName ? 'valid' : ''}`,
                            value: formData.businessName,
                            onChange: (e) => handleInputChange('businessName', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('businessName', e.target.value, 'businessName'),
                            placeholder: 'Enter your business name'
                        }),
                        fieldErrors.businessName && h('span', { className: 'error-message' }, fieldErrors.businessName)
                    )
                ),
                h('div', { className: 'form-row full-width' },
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'Business Website ',
                            h('span', { className: 'optional-text' }, '(Optional)')
                        ),
                        h('input', {
                            type: 'url',
                            className: `input-field ${fieldErrors.domainName ? 'error' : ''} ${formData.domainName ? 'valid' : ''}`,
                            value: formData.domainName,
                            onChange: (e) => handleInputChange('domainName', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('domain', e.target.value, 'domainName'),
                            placeholder: 'www.example.com'
                        }),
                        fieldErrors.domainName && h('span', { className: 'error-message' }, fieldErrors.domainName),
                        h('small', { className: 'form-hint' }, 'Enter your business website URL (optional)')
                    )
                )
            );
        };
        
        // Step 3 Content - Point of Contact (Updated for no-auth API)
        const renderStep3 = () => {
            return h('div', { className: 'step-content-3' },
                h('div', { className: 'form-row' },
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'First Name ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `input-field ${fieldErrors.firstName ? 'error' : ''} ${formData.firstName ? 'valid' : ''}`,
                            value: formData.firstName,
                            onChange: (e) => handleInputChange('firstName', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('name', e.target.value, 'firstName'),
                            placeholder: 'First name'
                        }),
                        fieldErrors.firstName && h('span', { className: 'error-message' }, fieldErrors.firstName)
                    ),
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'Last Name ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `input-field ${fieldErrors.lastName ? 'error' : ''} ${formData.lastName ? 'valid' : ''}`,
                            value: formData.lastName,
                            onChange: (e) => handleInputChange('lastName', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('name', e.target.value, 'lastName'),
                            placeholder: 'Last name'
                        }),
                        fieldErrors.lastName && h('span', { className: 'error-message' }, fieldErrors.lastName)
                    )
                ),
                h('div', { className: 'form-row' },
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'Email ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'email',
                            className: `input-field ${fieldErrors.email ? 'error' : ''} ${formData.email ? 'valid' : ''}`,
                            value: formData.email,
                            onChange: (e) => handleInputChange('email', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('email', e.target.value, 'email'),
                            placeholder: 'email@example.com',
                            maxLength: 30  // Enforce database constraint
                        }),
                        fieldErrors.email && h('span', { 
                            className: 'error-message',
                            dangerouslySetInnerHTML: typeof fieldErrors.email === 'string' && fieldErrors.email.includes('<a') 
                                ? { __html: fieldErrors.email } 
                                : undefined
                        }, typeof fieldErrors.email === 'string' && fieldErrors.email.includes('<a') 
                            ? null 
                            : fieldErrors.email
                        )
                    ),
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
                            'Mobile Number ',
                            h('span', { className: 'required-indicator' }, '*')
                        ),
                        h('input', {
                            type: 'text',
                            className: `input-field ${fieldErrors.mobile ? 'error' : ''} ${formData.mobile ? 'valid' : ''}`,
                            value: formData.mobile,
                            onChange: (e) => handleInputChange('mobile', e.target.value),
                            onBlur: (e) => validateAndSetFieldError('mobile', e.target.value, 'mobile'),
                            placeholder: '01XXXXXXXXX'
                        }),
                        fieldErrors.mobile && h('span', { 
                            className: 'error-message',
                            dangerouslySetInnerHTML: typeof fieldErrors.mobile === 'string' && fieldErrors.mobile.includes('<a') 
                                ? { __html: fieldErrors.mobile } 
                                : undefined
                        }, typeof fieldErrors.mobile === 'string' && fieldErrors.mobile.includes('<a') 
                            ? null 
                            : fieldErrors.mobile
                        ),
                        h('small', { className: 'form-hint' }, 'Bangladesh mobile number format: 01XXXXXXXXX')
                    )
                )
            );
        };
        
        // Step 4 Content - File Uploads
        const renderStep4 = () => {
            const renderFileUpload = (field, label, required = false) => {
                return h('div', { className: 'form-row full-width' },
                    h('div', { className: 'field-group' },
                        h('label', { className: 'field-label' },
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
                // case 4: return renderStep4(); // Temporarily disabled
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
                    '• Enter your domain name without http:// or https://',
                    '• If you don\'t have a website yet, enter your social media domain',
                    '• Double-check spelling - this information will appear on your merchant account',
                    '• These details will be used for payment gateway integration'
                ],
                3: [
                    '• Provide details of the primary contact person for this merchant account',
                    '• This person will receive all account-related communications',
                    '• Email must be valid and actively monitored',
                    '• Mobile number must be a Bangladesh number starting with 01',
                    '• Phone number is optional but recommended for urgent support',
                    '• This contact will have admin access to the merchant dashboard'
                ]
                /* Step 4 temporarily disabled
                4: [
                    '• Company Logo - Square format (500x500px recommended), PNG preferred',
                    '• Trade License: Current and valid trade license document',
                    '• Owner ID - NID/Passport/Birth Certificate/Driving License',
                    '• TIN Certificate: Tax Identification Number certificate',
                    '• All documents must be clear, readable, and unedited',
                    '• Accepted formats: JPG, JPEG, PNG, PDF (max 1MB per file)',
                    '• All file uploads are optional but recommended for faster approval'
                ]
                */
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
        return h('div', { className: 'merchant-form-container moneybag-form' },
            h('div', { className: 'merchant-form-content' },
                // Main content wrapper for sidebar, form, and instructions
                h('div', { className: 'merchant-form-layout' },
                    renderSidebar(),
                    // Form content wrapper
                    h('div', { className: 'form-main-wrapper' },
                        // Progress header inside form-main-wrapper
                        h('div', { className: 'form-progress-header' },
                            h('div', { className: 'merchant-form-header-nav' },
                                h('button', { 
                                    onClick: () => window.open('https://moneybag.com.bd/support/', '_blank')
                                }, 'Need Assistance?'),
                                h('button', { 
                                    onClick: () => window.open('https://moneybag.com.bd/support/#faq', '_blank')
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
                                getCurrentStepContent(),
                                h('div', { className: 'form-navigation' },
                                    h('div', null,
                                        currentStep > 1 
                                            ? h('button', {
                                                className: 'secondary-btn',
                                                onClick: handlePrevious
                                            }, 'Previous')
                                            : h('div')
                                    ),
                                    h('div', { className: 'button-group-flex' },
                                        h('button', {
                                            className: `primary-btn ${loading ? 'loading' : ''}`,
                                            onClick: handleNext,
                                            disabled: loading
                                        }, 
                                            loading 
                                                ? h('span', { className: 'btn-content' },
                                                    h('span', { 
                                                        className: 'spinner',
                                                        dangerouslySetInnerHTML: {
                                                            __html: '<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.3)" stroke-width="4" fill="none"/><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="80 50" stroke-linecap="round"/></svg>'
                                                        }
                                                    }),
                                                    currentStep === 3 ? 'Submitting...' : 'Processing...'
                                                )
                                                : h('span', { className: 'btn-content' }, currentStep === 3 ? 'Submit' : 'Save & Next')
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