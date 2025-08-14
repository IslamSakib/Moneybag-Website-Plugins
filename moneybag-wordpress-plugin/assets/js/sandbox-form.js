(function() {
    'use strict';
    
    const { useState, useEffect, createElement } = wp.element;
    
    const SandboxSignupForm = ({ config }) => {
        const [currentStep, setCurrentStep] = useState(1);
        const [timeLeft, setTimeLeft] = useState(300);
        const [timerActive, setTimerActive] = useState(false);
        const [loading, setLoading] = useState(false);
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
            script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
            script.async = true;
            script.defer = true;
            
            window.onRecaptchaLoad = () => {
                setRecaptchaLoaded(true);
            };
            
            document.head.appendChild(script);
        };
        
        const renderRecaptcha = () => {
            if (window.grecaptcha && config.recaptcha_site_key) {
                const recaptchaDiv = document.getElementById('recaptcha-container');
                if (recaptchaDiv && !recaptchaDiv.hasChildNodes()) {
                    window.grecaptcha.render('recaptcha-container', {
                        'sitekey': config.recaptcha_site_key,
                        'callback': (response) => setRecaptchaResponse(response),
                        'expired-callback': () => setRecaptchaResponse('')
                    });
                }
            }
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
                    return createElement('span', { key: index, style: { margin: '0 2px' } }, ':');
                }
                return createElement('div', { 
                    key: index, 
                    className: 'countdown-digit' 
                }, digit);
            });
        };

        const validateEmail = (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };

        const validatePassword = (password) => {
            return password.length >= 8;
        };

        const validatePhone = (phone) => {
            const phoneRegex = /^(\+880|880|0)?[1-9][0-9]{8,10}$/;
            return phoneRegex.test(phone);
        };

        const validateOTP = (otp) => {
            return otp.length === 6 && /^\d+$/.test(otp);
        };

        const validateField = (name, value) => {
            let error = '';
            
            switch (name) {
                case 'email':
                    if (!value) error = 'Email is required';
                    else if (!validateEmail(value)) error = 'Invalid email format';
                    break;
                case 'otp':
                    if (!value) error = 'OTP is required';
                    else if (!validateOTP(value)) error = 'OTP must be 6 digits';
                    break;
                case 'firstName':
                    if (!value) error = 'First name is required';
                    else if (value.length < 2) error = 'First name must be at least 2 characters';
                    break;
                case 'lastName':
                    if (!value) error = 'Last name is required';
                    else if (value.length < 2) error = 'Last name must be at least 2 characters';
                    break;
                case 'mobile':
                    if (!value) error = 'Mobile number is required';
                    else if (!validatePhone(value)) error = 'Invalid mobile number format';
                    break;
                case 'businessName':
                    if (!value) error = 'Business name is required';
                    break;
                case 'legalIdType':
                    if (!value) error = 'Legal identity type is required';
                    break;
                case 'password':
                    if (!value) error = 'Password is required';
                    else if (!validatePassword(value)) error = 'Password must be at least 8 characters';
                    break;
                case 'confirmPassword':
                    if (!value) error = 'Confirm password is required';
                    else if (value !== formData.password) error = 'Passwords do not match';
                    break;
                case 'website':
                    if (value && !value.match(/^https?:\/\//)) error = 'Website must include http:// or https://';
                    break;
            }
            
            return error;
        };

        const handleInputChange = (e) => {
            const { name, value, type, checked } = e.target;
            const newValue = type === 'checkbox' ? checked : value;
            
            setFormData(prev => ({
                ...prev,
                [name]: newValue
            }));
            
            // Instant validation
            const error = validateField(name, newValue);
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        };

        const apiCall = async (endpoint, data) => {
            const response = await fetch(`${config.api_base_url}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const responseData = await response.json();
            
            if (!response.ok || (responseData.success === false)) {
                // Handle different error response formats
                let errorMessage = 'API request failed';
                
                if (responseData.message) {
                    // Moneybag API format: {success: false, message: "...", code: 409}
                    errorMessage = responseData.message;
                } else if (responseData.detail && Array.isArray(responseData.detail)) {
                    // Validation error format: {detail: [{msg: "..."}]}
                    errorMessage = responseData.detail[0]?.msg || errorMessage;
                } else if (responseData.error) {
                    // Generic error format: {error: "..."}
                    errorMessage = responseData.error;
                }
                
                throw new Error(errorMessage);
            }
            
            return responseData;
        };

        const sendEmailVerification = async () => {
            if (!validateEmail(formData.email)) {
                setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
                return;
            }
            
            setLoading(true);
            try {
                const response = await apiCall('/sandbox/email-verification', {
                    email: formData.email
                });
                
                if (response.success) {
                    setSessionId(response.data.session_id);
                    goToStep(2);
                }
            } catch (error) {
                setErrors(prev => ({ ...prev, email: error.message }));
            } finally {
                setLoading(false);
            }
        };

        const verifyOTP = async () => {
            if (!validateOTP(formData.otp)) {
                setErrors(prev => ({ ...prev, otp: 'OTP must be 6 digits' }));
                return;
            }
            
            setLoading(true);
            try {
                const response = await apiCall('/sandbox/verify-otp', {
                    otp: formData.otp,
                    session_id: sessionId
                });
                
                if (response.success && response.data.verified) {
                    goToStep(3);
                }
            } catch (error) {
                setErrors(prev => ({ ...prev, otp: error.message }));
            } finally {
                setLoading(false);
            }
        };

        const submitBusinessDetails = async () => {
            const requiredFields = ['firstName', 'lastName', 'mobile', 'legalIdType', 'businessName', 'password'];
            let hasErrors = false;
            
            // Validate all required fields
            requiredFields.forEach(field => {
                const error = validateField(field, formData[field]);
                if (error) {
                    setErrors(prev => ({ ...prev, [field]: error }));
                    hasErrors = true;
                }
            });
            
            // Validate confirm password
            const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
            if (confirmPasswordError) {
                setErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
                hasErrors = true;
            }
            
            if (!recaptchaResponse && config.recaptcha_site_key) {
                setErrors(prev => ({ ...prev, recaptcha: 'Please complete the reCAPTCHA verification' }));
                hasErrors = true;
            }
            
            if (hasErrors) return;
            
            setLoading(true);
            try {
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
                
                if (config.recaptcha_site_key && recaptchaResponse) {
                    requestData.recaptcha_response = recaptchaResponse;
                }
                
                const response = await apiCall('/sandbox/merchants/business-details', requestData);
                
                if (response.success) {
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
                setTimeLeft(300);
                setTimerActive(true);
            } else {
                setTimerActive(false);
            }
            
            // Render reCAPTCHA when moving to step 3
            if (step === 3 && config.recaptcha_site_key) {
                setTimeout(renderRecaptcha, 100);
            }
        };

        const resendOTP = async () => {
            setLoading(true);
            try {
                await apiCall('/sandbox/email-verification', {
                    email: formData.email
                });
                setTimeLeft(300);
                setTimerActive(true);
            } catch (error) {
                setErrors(prev => ({ ...prev, otp: error.message }));
            } finally {
                setLoading(false);
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
            return createElement('div', { className: 'field-group' },
                createElement('label', { className: 'field-label' }, name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')),
                createElement('input', {
                    type,
                    className: `input-field ${errors[name] ? 'error' : ''}`,
                    name,
                    value: formData[name],
                    onChange: handleInputChange,
                    placeholder,
                    maxLength,
                    onKeyPress: handleKeyPress
                }),
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
                        onClick: () => togglePassword(name)
                    }, passwordVisible[name] ? '🙈' : '👁')
                ),
                errors[name] && createElement('span', { className: 'error-message' }, errors[name])
            );
        };

        return createElement('div', { className: 'moneybag-form-container', onKeyPress: handleKeyPress },
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
                            disabled: loading || !formData.email
                        }, loading ? 'Sending...' : 'Send Verification Code')
                    )
                )
            ),

            // Step 2: OTP Input
            currentStep === 2 && createElement('div', { className: 'split-layout' },
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
                        'Enter the 6-digit verification code sent to your email. Code expires in 5 minutes for security.'
                    )
                ),
                createElement('div', { className: 'section-divider' }),
                createElement('div', { className: 'right-section' },
                    createElement('div', { className: 'form-content' },
                        createElement('div', { className: 'countdown' }, ...renderCountdown(formatTime(timeLeft))),
                        createElement('div', { className: 'otp-text' }, 'OTP'),
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
                        errors.otp && createElement('span', { className: 'error-message' }, errors.otp),
                        createElement('div', { className: 'btn-row' },
                            createElement('button', {
                                className: 'primary-btn',
                                onClick: verifyOTP,
                                disabled: loading || !formData.otp
                            }, loading ? 'Verifying...' : 'Verify'),
                            createElement('button', {
                                className: 'secondary-btn',
                                onClick: resendOTP,
                                disabled: loading || timeLeft > 0
                            }, loading ? 'Resending...' : 'Resend')
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
                            ),
                            createElement('span', { className: 'dropdown-arrow' }, '▾')
                        ),
                        errors.legalIdType && createElement('span', { className: 'error-message' }, errors.legalIdType)
                    ),
                    renderInput('businessName', 'text', ''),
                    renderInput('website', 'url', 'https://')
                ),
                createElement('div', { className: 'input-row-2' },
                    renderPasswordField('password', 'Password'),
                    renderPasswordField('confirmPassword', 'Confirm Password')
                ),
                config.recaptcha_site_key && createElement('div', { className: 'recaptcha-section' },
                    createElement('div', { 
                        id: 'recaptcha-container',
                        style: { marginBottom: '15px' }
                    }),
                    errors.recaptcha && createElement('span', { className: 'error-message' }, errors.recaptcha)
                ),
                errors.submit && createElement('div', { className: 'error-message submit-error' }, errors.submit),
                createElement('button', {
                    className: 'arrow-btn',
                    onClick: submitBusinessDetails,
                    disabled: loading
                },
                    loading ? 'Creating Account...' : 'Get My Sandbox Access',
                    createElement('span', { style: { fontSize: '15px' } }, '→')
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
                    'My Sandbox',
                    createElement('span', { style: { fontSize: '15px' } }, '→')
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
                api_base_url: config.api_base_url || 'https://sandbox.api.moneybag.com.bd/api/v2',
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