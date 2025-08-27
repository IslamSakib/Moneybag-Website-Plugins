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
            email: '',
            otp: '',
            firstName: '',
            lastName: '',
            mobile: '',
            legalIdType: '',
            businessName: '',
            website: '',
            password: '',
            confirmPassword: '',
            humanVerified: false
        });
        
        const [recaptchaResponse, setRecaptchaResponse] = useState('');
        const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
        
        const [passwordVisible, setPasswordVisible] = useState({
            password: false,
            confirmPassword: false
        });

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
                        className: 'countdown-colon',
                        style: { 
                            margin: '0 2px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '32px',
                            fontWeight: '700',
                            lineHeight: '38px'
                        } 
                    }, ':');
                }
                return createElement('div', { 
                    key: index, 
                    className: 'countdown-digit' 
                }, digit);
            });
        };

        // No client-side validation - API handles everything
        // This is just for UX to show field is required
        const isFieldEmpty = (name, value) => {
            const requiredFields = ['email', 'otp', 'firstName', 'lastName', 'mobile', 'businessName', 'legalIdType', 'password', 'confirmPassword'];
            return requiredFields.includes(name) && !value;
        };

        const handleInputChange = (e) => {
            const { name, value, type, checked } = e.target;
            const newValue = type === 'checkbox' ? checked : value;
            
            setFormData(prev => ({
                ...prev,
                [name]: newValue
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

        const sendEmailVerification = async () => {
            // No client-side validation - let API handle everything
            setLoading(true);
            try {
                const response = await apiCall('email_verification', {
                    email: formData.email
                });
                
                // Email verification response received
                
                // The response should contain session_id
                if (response && response.session_id) {
                    setSessionId(response.session_id);
                    goToStep(2);
                } else {
                    // If no session_id, assume success and generate one locally
                    const localSessionId = 'sess_' + Math.random().toString(36).substring(2, 18);
                    setSessionId(localSessionId);
                    goToStep(2);
                }
            } catch (error) {
                // Email verification error
                setErrors(prev => ({ ...prev, email: error.message }));
            } finally {
                setLoading(false);
            }
        };

        const verifyOTP = async () => {
            // No client-side validation - let API handle everything
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
            // No client-side validation - let API handle everything
            setErrors({});
            setLoading(true);
            try {
                // Try to execute reCAPTCHA v3 but don't block if it fails
                let recaptchaToken = null;
                if (config.recaptcha_site_key) {
                    try {
                        recaptchaToken = await executeRecaptcha();
                    } catch (error) {
                        // reCAPTCHA failed, proceeding without it
                        // Don't block form submission if reCAPTCHA fails
                    }
                }
                
                const requestData = {
                    business_name: formData.businessName,
                    business_website: formData.website || '',
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    legal_identity: formData.legalIdType,
                    password: formData.password,
                    phone: formData.mobile,
                    session_id: sessionId
                };
                
                // Only add reCAPTCHA token if we got one
                if (recaptchaToken) {
                    requestData.recaptcha_response = recaptchaToken;
                }
                
                const response = await apiCall('business_details', requestData);
                
                // Handle response - if we get here without error, it was successful
                if (response) {
                    goToStep(4);
                }
            } catch (error) {
                setErrors(prev => ({ ...prev, submit: error.message }));
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
                await apiCall('email_verification', {
                    email: formData.email
                });
                setTimeLeft(60);
                setTimerActive(true);
            } catch (error) {
                setErrors(prev => ({ ...prev, otp: error.message }));
            } finally {
                setResendingOTP(false);
            }
        };

        const togglePassword = (field) => {
            setPasswordVisible(prev => ({
                ...prev,
                [field]: !prev[field]
            }));
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && !loading) {
                e.preventDefault();
                if (currentStep === 1) sendEmailVerification();
                else if (currentStep === 2) verifyOTP();
                else if (currentStep === 3) submitBusinessDetails();
            }
        };

        const renderInput = (name, type = 'text', placeholder = '', maxLength = null) => {
            const label = name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
            const helperText = name === 'mobile' ? 'Format: 01712345678 or +8801712345678' : null;
            
            return createElement('div', { className: 'field-group' },
                createElement('label', { className: 'field-label' }, label),
                createElement('input', {
                    type,
                    className: `input-field ${errors[name] ? 'error' : ''}`,
                    name,
                    value: formData[name],
                    onChange: handleInputChange,
                    placeholder: placeholder || (name === 'mobile' ? '01712345678' : ''),
                    maxLength: maxLength || (name === 'mobile' ? 14 : null),
                    onKeyPress: handleKeyPress
                }),
                helperText && !errors[name] && createElement('span', { 
                    className: 'field-helper-text',
                    style: { fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }
                }, helperText),
                errors[name] && createElement('span', { className: 'error-message' }, errors[name])
            );
        };

        const renderPasswordField = (name, label) => {
            return createElement('div', { className: 'field-group' },
                createElement('label', { className: 'field-label' }, label),
                createElement('div', { className: 'password-field' },
                    createElement('input', {
                        type: passwordVisible[name] ? 'text' : 'password',
                        className: `input-field ${errors[name] ? 'error' : ''}`,
                        name,
                        value: formData[name],
                        onChange: handleInputChange,
                        onKeyPress: handleKeyPress
                    }),
                    createElement('span', {
                        className: 'eye-icon',
                        onClick: () => togglePassword(name),
                        dangerouslySetInnerHTML: {
                            __html: passwordVisible[name] ? 
                                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>' :
                                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
                        }
                    })
                ),
                errors[name] && createElement('span', { className: 'error-message' }, errors[name])
            );
        };

        return createElement('div', { className: 'moneybag-form-container moneybag-form', onKeyPress: handleKeyPress },
            // Step 1: Email Input
            currentStep === 1 && createElement('div', { className: 'split-layout' },
                createElement('div', { className: 'left-section' },
                    createElement('div', { className: 'icon-container' },
                        createElement('div', { className: 'envelope-icon' },
                            createElement('img', {
                                src: config.plugin_url + 'assets/image/emojione_e-mail.webp',
                                alt: 'Email verification',
                                style: { width: '120px', height: '120px' }
                            })
                        )
                    ),
                    createElement('p', { className: 'info-text' },
                        'Secure email verification ensures your sandbox credentials are delivered safely to the right person.'
                    )
                ),
                createElement('div', { className: 'section-divider' }),
                createElement('div', { className: 'right-section' },
                    createElement('div', { className: 'form-content' },
                        createElement('label', { className: 'input-label' }, 'Email'),
                        createElement('input', {
                            type: 'email',
                            className: `input-field ${errors.email ? 'error' : ''}`,
                            name: 'email',
                            value: formData.email,
                            onChange: handleInputChange,
                            onKeyPress: handleKeyPress,
                            disabled: loading
                        }),
                        errors.email && createElement('span', { className: 'error-message' }, errors.email),
                        createElement('button', {
                            className: 'primary-btn',
                            onClick: sendEmailVerification,
                            disabled: loading
                        }, 
                            loading ? createElement('span', { className: 'btn-content' },
                                createElement('span', { 
                                    className: 'spinner',
                                    dangerouslySetInnerHTML: {
                                        __html: '<svg class="spinner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6-8.485"></path></svg>'
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
                                    style: { 
                                        width: '155.625px', 
                                        height: '120px', 
                                        aspectRatio: '83/64' 
                                    }
                                })
                            )
                        ),
                        createElement('p', { className: 'info-text' },
                            'Enter the 6-digit verification code sent to your email. Code expires in 1 minute for security.'
                        )
                    ),
                    createElement('div', { className: 'section-divider' }),
                    createElement('div', { className: 'right-section' },
                        createElement('div', { className: 'form-content' },
                            createElement('div', { className: 'otp-sent-message' }, 
                                `OTP sent to ${formData.email}`
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
                                                __html: '<svg class="spinner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6-8.485"></path></svg>'
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
                    renderInput('mobile', 'tel', '')
                ),
                createElement('div', { className: 'input-row' },
                    createElement('div', { className: 'field-group' },
                        createElement('label', { className: 'field-label' }, 'Legal Identity Type'),
                        createElement('div', { className: 'dropdown-wrapper' },
                            createElement('select', {
                                className: `input-field ${errors.legalIdType ? 'error' : ''}`,
                                name: 'legalIdType',
                                value: formData.legalIdType,
                                onChange: handleInputChange
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
                createElement('div', { className: 'input-row-2' },
                    renderPasswordField('password', 'Password'),
                    renderPasswordField('confirmPassword', 'Confirm Password')
                ),
                // reCAPTCHA v3 is invisible, only show error if any
                errors.recaptcha && createElement('div', { className: 'recaptcha-error' },
                    createElement('span', { className: 'error-message' }, errors.recaptcha)
                ),
                errors.submit && createElement('div', { className: 'error-message submit-error' }, errors.submit),
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
                        createElement('span', { style: { fontSize: '15px', marginLeft: '8px' } }, '→')
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
                            style: { width: '120px', height: '120px' }
                        })
                    )
                ),
                createElement('h2', { className: 'success-heading' }, "You're almost there! We sent an email to"),
                createElement('div', { className: 'email-display' }, formData.email || 'user@memberstack.com'),
                createElement('p', { className: 'success-info' },
                    'Check your inbox for your sandbox API credentials and documentation links.'
                ),
                createElement('button', {
                    className: 'arrow-btn',
                    onClick: () => window.location.href = 'https://sandbox.moneybag.com.bd/'
                },
                    'Login To Sandbox',
                    createElement('span', { style: { fontSize: '15px', marginLeft: '8px' } }, '→')
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