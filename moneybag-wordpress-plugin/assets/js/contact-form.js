(function() {
    'use strict';
    
    const { useState, useEffect, createElement: h } = wp.element;
    
    // Contact Form Component
    window.MoneybagContactForm = function({ ajaxUrl, nonce, widgetId }) {
        const [formData, setFormData] = useState({
            name: '',
            email: '',
            phone: '',
            company: '',
            inquiryType: 'General Inquiry',
            otherSubject: '',
            message: ''
        });
        
        const [errors, setErrors] = useState({});
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
        const [validator, setValidator] = useState(null);
        
        // Inquiry type options
        const inquiryOptions = [
            'General Inquiry',
            'Account Setup & Onboarding',
            'Technical Integration Support',
            'Transaction & Payment Issues',
            'API Documentation & SDKs',
            'Pricing & Billing Questions',
            'Settlement & Reconciliation',
            'Other'
        ];
        
        // Initialize validator
        useEffect(() => {
            // Wait for the validator to be loaded
            const checkValidator = () => {
                if (typeof window.MoneybagValidator !== 'undefined') {
                    setValidator(new window.MoneybagValidator());
                } else if (typeof window.MoneybagValidation !== 'undefined') {
                    // Use MoneybagValidation directly if MoneybagValidator is not available
                    setValidator(window.MoneybagValidation);
                }
            };
            
            // Check immediately
            checkValidator();
            
            // If not loaded yet, check again after a short delay
            if (!validator) {
                const timer = setTimeout(checkValidator, 100);
                return () => clearTimeout(timer);
            }
        }, []);
        
        // Validate and set field error (instant validation like other widgets)
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

        // Handle input changes
        const handleInputChange = (e) => {
            const { name, value } = e.target;
            let processedValue = value;
            
            // For phone field, only allow numbers
            if (name === 'phone') {
                // Remove all non-numeric characters except + for country code
                processedValue = value.replace(/[^0-9+]/g, '');
                // Only allow + at the beginning
                if (processedValue.indexOf('+') > 0) {
                    processedValue = processedValue.replace(/\+/g, '');
                }
            }
            
            setFormData(prev => ({
                ...prev,
                [name]: processedValue
            }));
        };
        
        
        // Validate form using global validator
        const validateForm = () => {
            const newErrors = {};
            
<<<<<<< Updated upstream
            if (validator) {
                // Use the initialized validator
                const nameError = validator.validateField ? 
                    validator.validateField('name', formData.name) : 
                    !validator.validateRequired(formData.name) ? 'Name is required' : '';
                if (nameError) newErrors.name = nameError;
                
                const emailError = validator.validateField ? 
                    validator.validateField('email', formData.email) : 
                    !validator.validateEmail(formData.email) ? 'Please enter a valid email address' : '';
                if (emailError) newErrors.email = emailError;
                
                // Validate phone using mobile pattern (Bangladesh format)
                const phoneError = validator.validateField ? 
                    validator.validateField('mobile', formData.phone) : 
                    !validator.validatePhone(formData.phone) ? 'Please enter a valid phone number' : '';
                if (phoneError) newErrors.phone = phoneError;
                
                const companyError = validator.validateField ? 
                    validator.validateField('businessName', formData.company) : 
                    !validator.validateRequired(formData.company) ? 'Company name is required' : '';
                if (companyError) newErrors.company = companyError;
                
                // Message is optional - only validate if provided
                if (formData.message.trim() && formData.message.trim().length < 10) {
                    newErrors.message = 'Message must be at least 10 characters if provided';
                }
                
                // If inquiry type is "Other", require the subject field
                if (formData.inquiryType === 'Other') {
                    const subjectError = validator.validateField ? 
                        validator.validateField('name', formData.otherSubject) : 
                        !validator.validateRequired(formData.otherSubject) ? 'Please specify the subject' : '';
                    if (subjectError) newErrors.otherSubject = subjectError;
                }
            } else {
                // Fallback validation when validator is not available
                if (!formData.name.trim()) {
                    newErrors.name = 'Name is required';
                } else if (formData.name.trim().length < 2) {
                    newErrors.name = 'Name must be at least 2 characters';
                } else if (!/^[a-zA-Z\\s\\.'\-]+$/.test(formData.name)) {
                    newErrors.name = 'Name can only contain letters and spaces';
                }
                
                const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                if (!formData.email.trim()) {
                    newErrors.email = 'Email is required';
                } else if (!emailRegex.test(formData.email)) {
                    newErrors.email = 'Please enter a valid email address';
                }
                
                // Bangladesh phone number pattern
                const phoneRegex = /^(\\+880|880|0)?1[0-9]{9,10}$/;
                if (!formData.phone.trim()) {
                    newErrors.phone = 'Phone number is required';
                } else if (!phoneRegex.test(formData.phone.replace(/[\\s\\-\\(\\)]/g, ''))) {
                    newErrors.phone = 'Please enter a valid Bangladesh mobile number';
                }
                
                if (!formData.company.trim()) {
                    newErrors.company = 'Company name is required';
                } else if (formData.company.trim().length < 2) {
                    newErrors.company = 'Company name must be at least 2 characters';
                }
                
                // Message is optional
                if (formData.message.trim() && formData.message.trim().length < 10) {
                    newErrors.message = 'Message must be at least 10 characters if provided';
                }
                
                if (formData.inquiryType === 'Other') {
                    if (!formData.otherSubject.trim()) {
                        newErrors.otherSubject = 'Please specify the subject';
                    } else if (formData.otherSubject.trim().length < 2) {
                        newErrors.otherSubject = 'Subject must be at least 2 characters';
                    }
                }
=======
            // Always use centralized validation from form-validator.js
            if (!window.MoneybagValidation) {
                console.warn('MoneybagValidation not loaded');
                return false;
            }
            
            // Validate each field using centralized validator
            const nameError = window.MoneybagValidation.validateField('name', formData.name);
            if (nameError) newErrors.name = nameError;
            
            const emailError = window.MoneybagValidation.validateField('email', formData.email);
            if (emailError) newErrors.email = emailError;
            
            // Use mobile validation for phone field
            const phoneError = window.MoneybagValidation.validateField('mobile', formData.phone);
            if (phoneError) newErrors.phone = phoneError;
            
            const companyError = window.MoneybagValidation.validateField('company', formData.company);
            if (companyError) newErrors.company = companyError;
            
            // Message is optional - only validate if provided
            if (formData.message && formData.message.trim()) {
                const messageError = window.MoneybagValidation.validateField('message', formData.message);
                if (messageError) newErrors.message = messageError;
            }
            
            // If inquiry type is "Other", validate the subject field
            if (formData.inquiryType === 'Other') {
                // Make it required when inquiry type is Other
                if (!formData.otherSubject || !formData.otherSubject.trim()) {
                    newErrors.otherSubject = 'Please specify the subject';
                } else {
                    const subjectError = window.MoneybagValidation.validateField('otherSubject', formData.otherSubject);
                    if (subjectError) newErrors.otherSubject = subjectError;
                }
>>>>>>> Stashed changes
            }
            
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };
        
        // Handle form submission
        const handleSubmit = async (e) => {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }
            
            setIsSubmitting(true);
            setSubmitStatus({ type: '', message: '' });
            
            // Prepare form data
            const submitData = new FormData();
            submitData.append('action', 'moneybag_contact_form');
            submitData.append('nonce', nonce);
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('company', formData.company);
            submitData.append('inquiry_type', formData.inquiryType);
            submitData.append('other_subject', formData.otherSubject);
            submitData.append('message', formData.message);
            
            try {
                
                const response = await fetch(ajaxUrl, {
                    method: 'POST',
                    body: submitData,
                    credentials: 'same-origin'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    setSubmitStatus({
                        type: 'success',
                        message: 'Thank you for contacting us! We will get back to you soon.'
                    });
                    
                    // Reset form
                    setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        company: '',
                        inquiryType: 'General Inquiry',
                        otherSubject: '',
                        message: ''
                    });
                } else {
                    setSubmitStatus({
                        type: 'error',
                        message: data.data?.message || 'An error occurred. Please try again.'
                    });
                }
            } catch (error) {
                setSubmitStatus({
                    type: 'error',
                    message: 'Network error. Please check your connection and try again.'
                });
            } finally {
                setIsSubmitting(false);
            }
        };
        
        return h('div', { className: 'contact-form-wrapper moneybag-form' },
            h('form', { 
                className: 'contact-form',
                onSubmit: handleSubmit,
                noValidate: true
            },
                // Status message
                submitStatus.message && h('div', {
                    className: `form-status ${submitStatus.type === 'success' ? 'success' : 'error'}`
                }, submitStatus.message),
                
                // Name field
                h('div', { className: 'form-group' },
                    h('input', {
                        type: 'text',
                        name: 'name',
                        placeholder: 'Name',
                        value: formData.name,
                        onChange: handleInputChange,
                        onBlur: (e) => validateAndSetFieldError('name', e.target.value, 'name'),
                        className: `input-field ${errors.name ? 'error' : ''} ${formData.name ? 'valid' : ''}`,
                        disabled: isSubmitting
                    }),
                    errors.name && h('span', { className: 'error-message' }, errors.name)
                ),
                
                // Email and Phone row with icons
                h('div', { className: 'form-row two-columns' },
                    h('div', { className: 'form-group with-icon' },
                        h('div', { className: 'input-wrapper' },
                            h('svg', {
                                className: 'input-icon',
                                width: '20',
                                height: '20',
                                viewBox: '0 0 20 20',
                                fill: 'none'
                            },
                                h('path', {
                                    d: 'M2.5 7.5L10 12.5L17.5 7.5M3.5 16.5H16.5C17.0523 16.5 17.5 16.0523 17.5 15.5V4.5C17.5 3.94772 17.0523 3.5 16.5 3.5H3.5C2.94772 3.5 2.5 3.94772 2.5 4.5V15.5C2.5 16.0523 2.94772 16.5 3.5 16.5Z',
                                    stroke: '#6B7280',
                                    strokeWidth: '1.5',
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round'
                                })
                            ),
                            h('input', {
                                type: 'email',
                                name: 'email',
                                placeholder: 'Email',
                                value: formData.email,
                                onChange: handleInputChange,
                                onBlur: (e) => validateAndSetFieldError('email', e.target.value, 'email'),
                                className: `input-field with-icon-padding ${errors.email ? 'error' : ''} ${formData.email ? 'valid' : ''}`,
                                disabled: isSubmitting
                            })
                        ),
                        errors.email && h('span', { className: 'error-message' }, errors.email)
                    ),
                    h('div', { className: 'form-group with-icon' },
                        h('div', { className: 'input-wrapper' },
                            h('svg', {
                                className: 'input-icon',
                                width: '20',
                                height: '20',
                                viewBox: '0 0 20 20',
                                fill: 'none'
                            },
                                h('path', {
                                    d: 'M2 4.5C2 3.67157 2.67157 3 3.5 3H6.5C7.05228 3 7.5 3.44772 7.5 4V7C7.5 7.55228 7.05228 8 6.5 8H5C5 11.866 8.13401 15 12 15V13.5C12 12.9477 12.4477 12.5 13 12.5H16C16.5523 12.5 17 12.9477 17 13.5V16.5C17 17.3284 16.3284 18 15.5 18H14C7.37258 18 2 12.6274 2 6V4.5Z',
                                    stroke: '#6B7280',
                                    strokeWidth: '1.5',
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round'
                                })
                            ),
                            h('input', {
                                type: 'tel',
                                name: 'phone',
                                placeholder: '+8801XXXXXXXXX',
                                value: formData.phone,
                                onChange: handleInputChange,
                                onBlur: (e) => validateAndSetFieldError('mobile', e.target.value, 'phone'),
                                onKeyPress: (e) => {
                                    // Allow only numbers, +, and control keys
                                    const char = String.fromCharCode(e.which || e.keyCode);
                                    if (!/[0-9+]/.test(char) && !e.ctrlKey && !e.metaKey) {
                                        e.preventDefault();
                                    }
                                },
                                pattern: '[0-9+]*',
                                inputMode: 'numeric',
                                className: `input-field with-icon-padding ${errors.phone ? 'error' : ''} ${formData.phone ? 'valid' : ''}`,
                                disabled: isSubmitting
                            })
                        ),
                        errors.phone && h('span', { className: 'error-message' }, errors.phone)
                    )
                ),
                
                // Company field
                h('div', { className: 'form-group' },
                    h('input', {
                        type: 'text',
                        name: 'company',
                        placeholder: 'Company Name',
                        value: formData.company,
                        onChange: handleInputChange,
<<<<<<< Updated upstream
                        onBlur: (e) => validateAndSetFieldError('businessName', e.target.value, 'company'),
=======
                        onBlur: (e) => validateAndSetFieldError('company', e.target.value, 'company'),
>>>>>>> Stashed changes
                        className: `input-field ${errors.company ? 'error' : ''} ${formData.company ? 'valid' : ''}`,
                        disabled: isSubmitting
                    }),
                    errors.company && h('span', { className: 'error-message' }, errors.company)
                ),
                
                // Inquiry type dropdown and Other subject row
                h('div', { className: 'form-row two-columns' },
                    h('div', { className: 'form-group' },
                        h('select', {
                            className: `input-field ${errors.inquiryType ? 'error' : ''} ${formData.inquiryType ? 'valid' : ''}`,
                            value: formData.inquiryType,
                            onChange: (e) => {
                                const newValue = e.target.value;
                                
                                // Update inquiry type
                                setFormData(prev => ({
                                    ...prev,
                                    inquiryType: newValue,
                                    // Clear other subject when changing away from "Other"
                                    otherSubject: newValue === 'Other' ? prev.otherSubject : ''
                                }));
                                
                                // Clear other subject error when changing away from "Other"
                                if (newValue !== 'Other') {
                                    setErrors(prev => ({
                                        ...prev,
                                        otherSubject: ''
                                    }));
                                }
                            },
                            disabled: isSubmitting
                        },
                            inquiryOptions.map(option =>
                                h('option', {
                                    key: option,
                                    value: option
                                }, option)
                            )
                        )
                    ),
                    h('div', { className: 'form-group' },
                        h('input', {
                            type: 'text',
                            name: 'otherSubject',
                            placeholder: formData.inquiryType === 'Other' ? 'Please specify subject *' : 'Other Topic Subject',
                            value: formData.otherSubject,
                            onChange: handleInputChange,
<<<<<<< Updated upstream
                            onBlur: (e) => formData.inquiryType === 'Other' ? validateAndSetFieldError('name', e.target.value, 'otherSubject') : null,
=======
                            onBlur: (e) => formData.inquiryType === 'Other' ? validateAndSetFieldError('otherSubject', e.target.value, 'otherSubject') : null,
>>>>>>> Stashed changes
                            className: `input-field ${errors.otherSubject ? 'error' : ''} ${formData.otherSubject && formData.inquiryType === 'Other' ? 'valid' : ''}`,
                            disabled: isSubmitting || (formData.inquiryType !== 'Other'),
                            required: formData.inquiryType === 'Other'
                        }),
                        errors.otherSubject && h('span', { className: 'error-message' }, errors.otherSubject)
                    )
                ),
                
                // Message field
                h('div', { className: 'form-group' },
                    h('textarea', {
                        name: 'message',
                        placeholder: 'Message',
                        value: formData.message,
                        onChange: handleInputChange,
                        onBlur: (e) => {
                            // Only validate if message is provided (it's optional)
                            if (e.target.value.trim()) {
                                const error = e.target.value.trim().length < 10 ? 'Message must be at least 10 characters if provided' : '';
                                setErrors(prev => ({...prev, message: error}));
                            } else {
                                setErrors(prev => ({...prev, message: ''}));
                            }
                        },
                        rows: 4,
                        className: `textarea-field ${errors.message ? 'error' : ''} ${formData.message ? 'valid' : ''}`,
                        disabled: isSubmitting
                    }),
                    errors.message && h('span', { className: 'error-message' }, errors.message)
                ),
                
                // Submit button
                h('div', { className: 'form-actions' },
                    h('button', {
                        type: 'submit',
                        className: 'primary-btn submit-button',
                        disabled: isSubmitting
                    }, isSubmitting ? 'Submitting...' : 'Submit')
                )
            )
        );
    };
})();