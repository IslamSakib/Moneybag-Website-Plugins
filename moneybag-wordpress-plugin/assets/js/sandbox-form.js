(function() {
    'use strict';
    
    const { useState, useEffect, createElement } = wp.element;
    
    const SandboxSignupForm = ({ config }) => {
        const [currentStep, setCurrentStep] = useState(1);
        const [timeLeft, setTimeLeft] = useState(60);
        const [timerActive, setTimerActive] = useState(false);
        const [loading, setLoading] = useState(false);
        const [verifyingOTP, setVerifyingOTP] = useState(false);
        const [resendingOTP, setResendingOTP] = useState(false);
        const [errors, setErrors] = useState({});
        const [sessionId, setSessionId] = useState('');
        
        const [formData, setFormData] = useState({
            identifier: '', // Can be email or phone
            otp: '',
            firstName: '',
            lastName: '',
            email: '', // Email address (required when phone was used for verification)
            mobile: '',
            legalIdType: '',
            businessName: '',
            website: '',
            humanVerified: false
        });
        
        const [recaptchaResponse, setRecaptchaResponse] = useState('');
        const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
        
        // Password fields removed - no longer required by API

        useEffect(() => {
            let interval = null;
            if (timerActive && timeLeft > 0) {
                interval = setInterval(() => {
                    setTimeLeft(prevTime => prevTime - 1);
                }, 1000);
            } else if (timeLeft === 0) {
                setTimerActive(false);
            }
            return () => {
                if (interval) clearInterval(interval);
            };
        }, [timerActive, timeLeft]);
        
        useEffect(() => {
            loadRecaptcha();
        }, []);
        
        const loadRecaptcha = () => {
            if (window.grecaptcha || document.querySelector('script[src*="recaptcha"]')) {
                setRecaptchaLoaded(true);
                return;
            }
            
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${config.recaptcha_site_key}`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                setRecaptchaLoaded(true);
            };
            
            document.head.appendChild(script);
        };
        
        const executeRecaptcha = () => {
            return new Promise((resolve, reject) => {
                // If no reCAPTCHA key configured, don't try to execute
                if (!config.recaptcha_site_key) {
                    // reCAPTCHA not configured, skipping
                    resolve(null);
                    return;
                }
                
                // Check if grecaptcha is loaded
                if (!window.grecaptcha) {
                    // reCAPTCHA library not loaded, skipping
                    resolve(null);
                    return;
                }
                
                window.grecaptcha.ready(() => {
                    try {
                        window.grecaptcha.execute(config.recaptcha_site_key, { action: 'submit' })
                            .then(token => {
                                setRecaptchaResponse(token);
                                resolve(token);
                            })
                            .catch(error => {
                                // reCAPTCHA execute failed
                                // Don't set error message, just resolve with null
                                resolve(null);
                            });
                    } catch (error) {
                        // reCAPTCHA execute error
                        // Don't set error message, just resolve with null
                        resolve(null);
                    }
                });
            });
        };

        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `0${minutes}:${secs.toString().padStart(2, '0')}`;
        };
        
        const renderCountdown = (timeString) => {
            const digits = timeString.split('');
            return digits.map((digit, index) => {
                if (digit === ':') {
                    return createElement('span', { 
                        key: index, 
                        className: 'countdown-colon'
                    }, ':');
                }
                return createElement('div', { 
                    key: index, 
                    className: 'countdown-digit' 
                }, digit);
            });
        };

        // No client-side validation - API handles everything
        // Use centralized validation
        const validateField = (fieldName, value) => {
            if (!window.MoneybagValidation) {
                return '';
            }
            return window.MoneybagValidation.validateField(fieldName, value);
        };
        
        // Validate and set field error
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
        
        // This is just for UX to show field is required
        const isFieldEmpty = (name, value) => {
            const requiredFields = ['identifier', 'otp', 'firstName', 'lastName', 'mobile', 'businessName', 'legalIdType'];
            return requiredFields.includes(name) && !value;
        };
        
        // Helper function to detect if identifier is email or phone
        const isEmail = (identifier) => {
            return identifier.includes('@') && identifier.includes('.');
        };
        
        const isPhone = (identifier) => {
            const phoneRegex = /^01[3-9]\d{8}$/;
            return phoneRegex.test(identifier.replace(/\s/g, ''));
        };

        const handleInputChange = (e) => {
            const { name, value, type, checked } = e.target;
            let processedValue = type === 'checkbox' ? checked : value;
            
            // Use centralized input filtering
            if (window.MoneybagValidation && type !== 'checkbox') {
                const fieldMap = {
                    'identifier': 'text', // Can be email or phone, don't filter
                    'firstName': 'name',
                    'lastName': 'name',
                    'mobile': 'phone',
                    'email': 'text',
                    'businessName': 'businessName',
                    'website': 'text',
                    'otp': 'text'
                };
                
                const filterType = fieldMap[name];
                if (filterType) {
                    processedValue = window.MoneybagValidation.filterInput(value, filterType);
                }
            }
            
            setFormData(prev => ({
                ...prev,
                [name]: processedValue
            }));
            
            // Clear error when user starts typing
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        };

        // Secure API call through WordPress backend
        const apiCall = async (action, data) => {
            const formData = new FormData();
            formData.append('action', 'moneybag_sandbox_api');
            formData.append('nonce', moneybagAjax.nonce);
            formData.append('api_action', action);
            formData.append('data', JSON.stringify(data));
            
            try {
                const response = await fetch(moneybagAjax.ajaxurl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                const responseData = await response.json();
                
                // API call response received
                
                if (!responseData.success) {
                    // API call failed
                    throw new Error(responseData.data || 'API request failed');
                }
                
                return responseData.data;
            } catch (error) {
                // API call error
                throw error;
            }
        };
        
        // Remove server-side field validation - let API handle it directly
        // API will return validation errors in its response

        const sendIdentifierVerification = async () => {
            // Use centralized validation
            if (window.MoneybagValidation) {
                const validationError = window.MoneybagValidation.validateField('identifier', formData.identifier);
                if (validationError) {
                    setErrors(prev => ({ ...prev, identifier: validationError }));
                    return;
                }
            }
            
            setLoading(true);
            try {
                const response = await apiCall('email_verification', {
                    identifier: formData.identifier
                });
                
                // Identifier verification response received
                
                // The response should contain session_id in the data field
                if (response && response.data && response.data.session_id) {
                    setSessionId(response.data.session_id);
                    goToStep(2);
                } else if (response && response.session_id) {
                    // Fallback for direct session_id
                    setSessionId(response.session_id);
                    goToStep(2);
                } else {
                    // If no session_id, throw error
                    throw new Error('No session ID received from server');
                }
            } catch (error) {
                // Identifier verification error
                let errorMessage = error.message;
                
                // Check if it's an "already exists" error for sandbox
                if (errorMessage && (
                    errorMessage.toLowerCase().includes('already registered') ||
                    errorMessage.toLowerCase().includes('already exists') ||
                    errorMessage.toLowerCase().includes('already associated')
                )) {
                    // Add forgot password link for sandbox
                    errorMessage = errorMessage + ' <a href="https://sandbox.moneybag.com.bd/forgot-password" target="_blank" style="color: #ff4444; text-decoration: underline;">Forgot password?</a>';
                }
                
                setErrors(prev => ({ ...prev, identifier: errorMessage }));
            } finally {
                setLoading(false);
            }
        };

        const verifyOTP = async () => {
            // Validate OTP before sending
            if (!formData.otp || formData.otp.length !== 6) {
                setErrors(prev => ({ ...prev, otp: 'Please enter a valid 6-digit code' }));
                return;
            }
            
            setVerifyingOTP(true);
            try {
                const response = await apiCall('verify_otp', {
                    otp: formData.otp,
                    session_id: sessionId
                });
                
                // OTP verification response received
                
                // If we get a response without error, consider it successful
                if (response) {
                    // Check for explicit verification status if available
                    if (response.verified === false) {
                        throw new Error('Invalid OTP');
                    }
                    goToStep(3);
                }
            } catch (error) {
                // OTP verification error
                setErrors(prev => ({ ...prev, otp: error.message }));
            } finally {
                setVerifyingOTP(false);
            }
        };

        const submitBusinessDetails = async () => {
            // Basic validation for required fields
            const newErrors = {};
            
            if (!formData.firstName) {
                newErrors.firstName = 'First name is required';
            }
            if (!formData.lastName) {
                newErrors.lastName = 'Last name is required';
            }
            if (!formData.businessName) {
                newErrors.businessName = 'Business name is required';
            }
            if (!formData.legalIdType) {
                newErrors.legalIdType = 'Please select a legal identity type';
            }
            
            // Check mobile or email based on verification method
            if (isEmail(formData.identifier)) {
                if (!formData.mobile) {
                    newErrors.mobile = 'Mobile number is required';
                } else if (window.MoneybagValidation) {
                    const mobileError = window.MoneybagValidation.validateField('mobile', formData.mobile);
                    if (mobileError) {
                        newErrors.mobile = mobileError;
                    }
                }
            } else {
                if (!formData.email) {
                    newErrors.email = 'Email address is required';
                } else if (window.MoneybagValidation) {
                    const emailError = window.MoneybagValidation.validateField('email', formData.email);
                    if (emailError) {
                        newErrors.email = emailError;
                    }
                }
            }
            
            // If there are validation errors, show them and don't submit
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
            
            setErrors({});
            setLoading(true);
            try {
                const requestData = {
                    business_name: formData.businessName,
                    business_website: formData.website || '',
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    legal_identity: formData.legalIdType,
                    session_id: sessionId
                };
                
                // Dynamic email/phone based on verification method
                if (isEmail(formData.identifier)) {
                    // Email was used for verification, phone comes from form
                    requestData.email = formData.identifier;
                    requestData.phone = formData.mobile;
                } else {
                    // Phone was used for verification, email comes from form  
                    requestData.phone = formData.identifier;
                    requestData.email = formData.email;
                }
                
                const response = await apiCall('business_details', requestData);
                
                // Handle response - if we get here without error, it was successful
                if (response) {
                    goToStep(4);
                }
            } catch (error) {
                // Parse error message to see if it's a field-specific validation error
                const errorMsg = error.message.toLowerCase();
                
                if (errorMsg.includes('url') || errorMsg.includes('website')) {
                    setErrors(prev => ({ ...prev, website: 'Please enter a valid website URL (e.g., example.com)' }));
                } else if (errorMsg.includes('business') || errorMsg.includes('business_name')) {
                    setErrors(prev => ({ ...prev, businessName: error.message }));
                } else if (errorMsg.includes('first') || errorMsg.includes('first_name')) {
                    setErrors(prev => ({ ...prev, firstName: error.message }));
                } else if (errorMsg.includes('last') || errorMsg.includes('last_name')) {
                    setErrors(prev => ({ ...prev, lastName: error.message }));
                } else if (errorMsg.includes('email')) {
                    let emailErrorMessage = error.message;
                    
                    // Check if it's an "already exists" error for email
                    if (emailErrorMessage && (
                        emailErrorMessage.toLowerCase().includes('already registered') ||
                        emailErrorMessage.toLowerCase().includes('already exists') ||
                        emailErrorMessage.toLowerCase().includes('already associated')
                    )) {
                        // Add forgot password link for email
                        emailErrorMessage = emailErrorMessage + ' <a href="https://sandbox.moneybag.com.bd/forgot-password" target="_blank" style="color: #ff4444; text-decoration: underline;">Forgot password?</a>';
                    }
                    
                    setErrors(prev => ({ ...prev, email: emailErrorMessage }));
                } else if (errorMsg.includes('phone') || errorMsg.includes('mobile')) {
                    let mobileErrorMessage = error.message;
                    
                    // Check if it's an "already exists" error for mobile
                    if (mobileErrorMessage && (
                        mobileErrorMessage.toLowerCase().includes('already registered') ||
                        mobileErrorMessage.toLowerCase().includes('already exists') ||
                        mobileErrorMessage.toLowerCase().includes('already associated')
                    )) {
                        // Add forgot password link for mobile
                        mobileErrorMessage = mobileErrorMessage + ' <a href="https://sandbox.moneybag.com.bd/forgot-password" target="_blank" style="color: #ff4444; text-decoration: underline;">Forgot password?</a>';
                    }
                    
                    setErrors(prev => ({ ...prev, mobile: mobileErrorMessage }));
                } else if (errorMsg.includes('legal') || errorMsg.includes('identity')) {
                    setErrors(prev => ({ ...prev, legalIdType: error.message }));
                } else {
                    // Generic error - could show in a toast or alert instead of submit error
                    console.error('Submission error:', error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        const goToStep = (step) => {
            setCurrentStep(step);
            setErrors({});
            if (step === 2) {
                setTimeLeft(60);
                setTimerActive(true);
            } else {
                setTimerActive(false);
            }
            
            // reCAPTCHA v3 loads automatically, no manual rendering needed
        };

        const resendOTP = async () => {
            setResendingOTP(true);
            try {
                const response = await apiCall('email_verification', {
                    identifier: formData.identifier
                });
                
                // Update sessionId with new session from resend response
                if (response && response.data && response.data.session_id) {
                    setSessionId(response.data.session_id);
                } else if (response && response.session_id) {
                    // Fallback for direct session_id
                    setSessionId(response.session_id);
                }
                
                setTimeLeft(60);
                setTimerActive(true);
            } catch (error) {
                setErrors(prev => ({ ...prev, otp: error.message }));
            } finally {
                setResendingOTP(false);
            }
        };

        // Password toggle function removed - passwords no longer needed

        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && !loading) {
                e.preventDefault();
                if (currentStep === 1) sendIdentifierVerification();
                else if (currentStep === 2) verifyOTP();
                else if (currentStep === 3) submitBusinessDetails();
            }
        };

        const renderInput = (name, type = 'text', placeholder = '', options = {}) => {
            const label = name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
            let helperText = null;
            
            if (name === 'mobile') {
                helperText = 'Format: 01712345678';
            } else if (name === 'identifier') {
                helperText = 'Enter your email address or phone number';
            }
            
            // Map field names to validation field types
            const validationFieldMap = {
                'identifier': 'identifier',
                'firstName': 'name',
                'lastName': 'name',
                'mobile': 'mobile',
                'email': 'email',
                'businessName': 'businessName',
                'website': 'website'
            };
            
            const validationField = validationFieldMap[name] || name;
            
            // Determine if field is required
            const isRequired = options.required !== false && name !== 'website';
            
            return createElement('div', { className: 'field-group' },
                createElement('label', { className: 'field-label' }, 
                    name === 'identifier' ? 'Email or Phone' : label,
                    isRequired && createElement('span', { className: 'required-indicator' }, ' *')
                ),
                createElement('input', {
                    type,
                    className: `input-field ${errors[name] ? 'error' : ''} ${formData[name] ? 'valid' : ''}`,
                    name,
                    value: formData[name],
                    onChange: handleInputChange,
                    onBlur: (e) => validateAndSetFieldError(validationField, e.target.value, name),
                    placeholder: options.placeholder || placeholder || (name === 'mobile' ? '01712345678' : 
                        name === 'identifier' ? 'user@example.com or 01712345678' : ''),
                    maxLength: options.maxLength || (name === 'email' ? 30 : name === 'mobile' ? 14 : name === 'identifier' ? 50 : null),
                    onKeyPress: handleKeyPress,
                    required: options.required || false
                }),
                helperText && !errors[name] && createElement('span', { 
                    className: 'field-helper-text'
                }, helperText),
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

        // Password field render function removed - passwords no longer needed

        return createElement('div', { className: 'moneybag-form-container moneybag-form', onKeyPress: handleKeyPress },
            // Step 1: Email Input
            currentStep === 1 && createElement('div', { className: 'split-layout' },
                createElement('div', { className: 'left-section' },
                    createElement('div', { className: 'icon-container' },
                        createElement('div', { className: 'envelope-icon' },
                            createElement('img', {
                                src: config.plugin_url + 'assets/image/emojione_e-mail.webp',
                                alt: 'Email verification',
                                className: 'illustration-small'
                            })
                        )
                    ),
                    createElement('p', { className: 'info-text' },
                        'Secure verification ensures your sandbox credentials are delivered safely. We support both email and phone verification.'
                    )
                ),
                createElement('div', { className: 'section-divider' }),
                createElement('div', { className: 'right-section' },
                    createElement('div', { className: 'form-content' },
                        createElement('label', { className: 'input-label' }, 
                            'Email or Phone',
                            createElement('span', { className: 'required-indicator' }, ' *')
                        ),
                        createElement('input', {
                            type: 'text',
                            className: `input-field ${errors.identifier ? 'error' : ''} ${formData.identifier ? 'valid' : ''}`,
                            name: 'identifier',
                            value: formData.identifier,
                            onChange: handleInputChange,
                            onBlur: (e) => validateAndSetFieldError('identifier', e.target.value, 'identifier'),
                            onKeyPress: handleKeyPress,
                            placeholder: 'user@example.com or 01712345678',
                            disabled: loading
                        }),
                        errors.identifier && createElement('span', { 
                            className: 'error-message',
                            dangerouslySetInnerHTML: typeof errors.identifier === 'string' && errors.identifier.includes('<a') 
                                ? { __html: errors.identifier } 
                                : undefined
                        }, typeof errors.identifier === 'string' && errors.identifier.includes('<a') 
                            ? null 
                            : errors.identifier
                        ),
                        createElement('button', {
                            className: 'primary-btn',
                            onClick: sendIdentifierVerification,
                            disabled: loading || !!errors.identifier
                        }, 
                            loading ? createElement('span', { className: 'btn-content' },
                                createElement('span', { 
                                    className: 'spinner',
                                    dangerouslySetInnerHTML: {
                                        __html: '<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.3)" stroke-width="4" fill="none"/><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="80 50" stroke-linecap="round"/></svg>'
                                    }
                                }),
                                'Sending...'
                            ) : createElement('span', { className: 'btn-content' }, 'Send Verification Code')
                        )
                    )
                )
            ),

            // Step 2: OTP Input
            currentStep === 2 && createElement('div', { className: 'otp-step-wrapper' },
                createElement('div', { className: 'countdown-top-right' }, 
                    ...renderCountdown(formatTime(timeLeft))
                ),
                createElement('div', { className: 'split-layout' },
                    createElement('div', { className: 'left-section' },
                        createElement('div', { className: 'icon-container' },
                            createElement('div', { className: 'envelope-icon' },
                                createElement('img', {
                                    src: config.plugin_url + 'assets/image/streamline-freehand-color_password-approved.webp',
                                    alt: 'Password approved',
                                    className: 'illustration-password'
                                })
                            )
                        ),
                        createElement('p', { className: 'info-text' },
                            `Enter the 6-digit verification code sent to your ${isEmail(formData.identifier) ? 'email' : 'phone'}. Code expires in 1 minute for security.`
                        )
                    ),
                    createElement('div', { className: 'section-divider' }),
                    createElement('div', { className: 'right-section' },
                        createElement('div', { className: 'form-content' },
                            createElement('div', { className: 'otp-sent-message' }, 
                                `OTP sent to ${formData.identifier}`
                            ),
                            createElement('label', { className: 'input-label' }, 
                                'Verification Code',
                                createElement('span', { className: 'required-indicator' }, ' *')
                            ),
                            createElement('div', { className: 'otp-input-wrapper' },
                                createElement('input', {
                                    type: 'text',
                                    className: `input-field ${errors.otp ? 'error' : ''}`,
                                    name: 'otp',
                                    maxLength: 6,
                                    value: formData.otp,
                                    onChange: handleInputChange,
                                    onKeyPress: handleKeyPress,
                                    disabled: loading
                                }),
                                errors.otp && createElement('span', { className: 'error-message' }, errors.otp)
                            ),
                            createElement('div', { className: 'btn-row' },
                                createElement('button', {
                                    className: 'primary-btn',
                                    onClick: verifyOTP,
                                    disabled: verifyingOTP || resendingOTP
                                }, 
                                    verifyingOTP ? createElement('span', { className: 'btn-content' },
                                        createElement('span', { 
                                            className: 'spinner',
                                            dangerouslySetInnerHTML: {
                                                __html: '<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.3)" stroke-width="4" fill="none"/><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="80 50" stroke-linecap="round"/></svg>'
                                            }
                                        }),
                                        'Verifying...'
                                    ) : createElement('span', { className: 'btn-content' }, 'Verify')
                                ),
                                createElement('button', {
                                    className: 'secondary-btn',
                                    onClick: resendOTP,
                                    disabled: resendingOTP || verifyingOTP || timeLeft > 0
                                }, resendingOTP ? 'Resending...' : 'Resend')
                            )
                        )
                    )
                )
            ),

            // Step 3: Registration Form
            currentStep === 3 && createElement('div', { className: 'full-form' },
                createElement('div', { className: 'input-row' },
                    renderInput('firstName', 'text', ''),
                    renderInput('lastName', 'text', ''),
                    // Dynamic field based on verification method
                    isEmail(formData.identifier) 
                        ? renderInput('mobile', 'tel', '', {
                            placeholder: 'Enter your mobile number',
                            required: true
                        })
                        : renderInput('email', 'email', '', {
                            placeholder: 'Enter your email address',
                            required: true
                        })
                ),
                createElement('div', { className: 'input-row' },
                    createElement('div', { className: 'field-group' },
                        createElement('label', { className: 'field-label' }, 
                            'Legal Identity Type',
                            createElement('span', { className: 'required-indicator' }, ' *')
                        ),
                        createElement('div', { className: 'dropdown-wrapper' },
                            createElement('select', {
                                className: `input-field ${errors.legalIdType ? 'error' : ''} ${formData.legalIdType ? 'valid' : ''}`,
                                name: 'legalIdType',
                                value: formData.legalIdType,
                                onChange: handleInputChange,
                                onBlur: (e) => {
                                    if (!e.target.value) {
                                        setErrors(prev => ({ ...prev, legalIdType: 'Please select a legal identity type' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, legalIdType: '' }));
                                    }
                                }
                            },
                                createElement('option', { value: '' }, 'Select'),
                                createElement('option', { value: 'Educational Institution' }, 'Educational Institution'),
                                createElement('option', { value: 'Corporation' }, 'Corporation'),
                                createElement('option', { value: 'Sole Proprietorship' }, 'Sole Proprietorship'),
                                createElement('option', { value: 'Partnership' }, 'Partnership'),
                                createElement('option', { value: 'Limited Liability Company' }, 'Limited Liability Company'),
                                createElement('option', { value: 'Public Company' }, 'Public Company'),
                                createElement('option', { value: 'Non-Governmental Organization' }, 'Non-Governmental Organization'),
                                createElement('option', { value: 'Other' }, 'Other')
                            )
                        ),
                        errors.legalIdType && createElement('span', { className: 'error-message' }, errors.legalIdType)
                    ),
                    renderInput('businessName', 'text', ''),
                    renderInput('website', 'text', 'example.com')
                ),
                // reCAPTCHA v3 is invisible, only show error if any
                errors.recaptcha && createElement('div', { className: 'recaptcha-error' },
                    createElement('span', { className: 'error-message' }, errors.recaptcha)
                ),
                createElement('button', {
                    className: 'arrow-btn',
                    onClick: submitBusinessDetails,
                    disabled: loading
                },
                    loading ? createElement('span', { className: 'btn-content' },
                        createElement('span', { 
                            className: 'spinner',
                            dangerouslySetInnerHTML: {
                                __html: '<svg class="spinner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6-8.485"></path></svg>'
                            }
                        }),
                        'Creating Account...'
                    ) : createElement('span', { className: 'btn-content' },
                        'Get Sandbox Access',
                        createElement('span', { className: 'btn-arrow' }, '→')
                    )
                )
            ),

            // Step 4: Success
            currentStep === 4 && createElement('div', { className: 'success-page' },
                createElement('div', { className: 'icon-container' },
                    createElement('div', { className: 'envelope-icon' },
                        createElement('img', {
                            src: config.plugin_url + 'assets/image/emojione_e-mail.webp',
                            alt: 'Email sent',
                            className: 'illustration-small'
                        })
                    )
                ),
                createElement('h2', { className: 'success-heading' }, 
                    isEmail(formData.identifier) 
                        ? "You're almost there! We sent an email to"
                        : "You're almost there! We sent a message to"
                ),
                createElement('div', { className: 'email-display' }, formData.identifier || 'user@example.com'),
                createElement('p', { className: 'success-info' },
                    `Check your ${isEmail(formData.identifier) ? 'inbox' : 'messages'} for your sandbox API credentials and documentation links.`
                ),
                createElement('button', {
                    className: 'arrow-btn',
                    onClick: () => alert('Please check your admin settings for the configured redirect URL or contact your API provider.')
                },
                    'Login To Sandbox',
                    createElement('span', { className: 'btn-arrow' }, '→')
                )
            )
        );
    };

    // Initialize forms when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const formWrappers = document.querySelectorAll('.moneybag-sandbox-form-wrapper');
        
        formWrappers.forEach(wrapper => {
            const config = JSON.parse(wrapper.dataset.config || '{}');
            
            // Set default values if not provided
            const safeConfig = {
                widget_id: config.widget_id || 'default',
                redirect_url: config.redirect_url || '',
                form_title: config.form_title || 'Sandbox Account Registration',
                primary_color: config.primary_color || '#f85149',
                recaptcha_site_key: config.recaptcha_site_key || '',
                plugin_url: config.plugin_url || '',
                ...config
            };
            
            const targetId = `moneybag-sandbox-form-${safeConfig.widget_id}`;
            const targetElement = document.getElementById(targetId);
            
            if (targetElement && wp.element && wp.element.render) {
                wp.element.render(
                    createElement(SandboxSignupForm, { config: safeConfig }),
                    targetElement
                );
            }
        });
    });

})();