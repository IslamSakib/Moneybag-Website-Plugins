const { useState, useEffect, useCallback, useMemo } = React;

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
    
    // Steps configuration
    const steps = [
        { id: 1, title: 'Business Info' },
        { id: 2, title: 'Online Presence' },
        { id: 3, title: 'Point Of Contact' },
        { id: 4, title: 'Documents' }
    ];
    
    const progressPercentage = {
        1: 28,
        2: 52,
        3: 74,
        4: 96
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
        return formData.contactName.trim() && 
               formData.designation.trim() && 
               formData.email.trim() && 
               emailRegex.test(formData.email) &&
               formData.mobile.trim();
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
    
    // Handle form input changes
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
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
        const allServices = ['Visa', 'Mastercard', 'Amex', 'DBBL-Nexus', 'bKash', 
                           'Nagad', 'UnionPay', 'Rocket', 'Diners Club', 'Upay'];
        setFormData(prev => ({
            ...prev,
            serviceTypes: isChecked ? [...allServices] : []
        }));
    }, []);
    
    // Navigation handlers
    const handleNext = useCallback(() => {
        const canProceed = isStepComplete(currentStep);
        
        if (!canProceed) {
            let missingFields = [];
            if (currentStep === 1) {
                if (!formData.businessCategory) missingFields.push('Business Category');
                if (!formData.legalIdentity) missingFields.push('Legal Identity');
                if (!formData.monthlyVolume) missingFields.push('Monthly Volume');
                if (formData.serviceTypes.length === 0) missingFields.push('Service Types');
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
            
            const submitData = {
                business_name: formData.merchantName,
                business_website: formData.domainName,
                trading_name: formData.tradingName,
                first_name: formData.contactName.split(' ')[0] || formData.contactName,
                last_name: formData.contactName.split(' ').slice(1).join(' ') || '',
                email: formData.email,
                phone: formData.mobile.replace(/\s/g, ''),
                designation: formData.designation,
                business_category: formData.businessCategory,
                legal_identity: formData.legalIdentity,
                monthly_volume: formData.monthlyVolume,
                max_amount: formData.maxAmount || '',
                currency_type: formData.currencyType,
                service_types: formData.serviceTypes.join(','),
                office_phone: formData.phone || '',
                session_id: sessionId
            };
            
            const response = await fetch(`${config.api_base_url}/sandbox/merchants/business-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(submitData)
            });
            
            const result = await response.json();
            
            setLoading(false);
            
            if (response.ok && result.success) {
                setIsSubmitted(true);
                if (config.redirect_url) {
                    setTimeout(() => {
                        window.location.href = config.redirect_url;
                    }, 3000);
                }
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            setLoading(false);
            setInlineError({ 
                message: 'Registration failed: ' + error.message, 
                type: 'error' 
            });
        }
    };
    
    // Component renders
    const ProgressHeader = () => (
        <div className="form-progress-header">
            <div className="merchant-form-header-nav">
                <button>Need Assistance?</button>
                <button>FAQ</button>
            </div>
            <div className="progress-section">
                <div className="progress-text">{progressPercentage[currentStep]}% Progress</div>
                <div className="progress-bar">
                    <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progressPercentage[currentStep]}%` }}
                    />
                </div>
            </div>
        </div>
    );
    
    const Sidebar = () => (
        <div className="steps-sidebar">
            <h3 className="steps-title">Please fill this information first</h3>
            <p className="steps-subtitle">After completing all steps you will be eligible for 7 days trial.</p>
            
            <div className="steps-list">
                <div className="vertical-line-container">
                    <div className="vertical-line" />
                    <div 
                        className="vertical-line-fill" 
                        style={{ height: `${getProgressHeight()}%` }}
                    />
                </div>
                
                {steps.map(step => {
                    const status = getStepStatus(step.id);
                    const isClickable = canNavigateToStep(step.id);
                    
                    return (
                        <div 
                            key={step.id}
                            className={`step-item step-${status} ${isClickable ? 'clickable' : 'disabled'}`}
                            onClick={() => isClickable && handleStepClick(step.id)}
                        >
                            <div className={`step-marker ${status}`} />
                            <div className="step-content">
                                <div className="step-title">Step {step.id}: {step.title}</div>
                                {status === 'completed' && <div className="step-status completed">✓ Completed</div>}
                                {status === 'incomplete' && <div className="step-status incomplete">⚠ Incomplete</div>}
                                {status === 'current' && <div className="step-status current">In Progress</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="steps-illustration">
                <img 
                    src={`${config.plugin_url}assets/images/img_join now.webp`} 
                    alt="Join Now" 
                    className="illustration-image"
                />
            </div>
        </div>
    );
    
    const Instructions = () => {
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
                '• Company Logo - Square format (500x500px), PNG preferred',
                '• Trade License: Current and valid trade license',
                '• Owner ID - NID/Passport/Birth Certificate/Driving License',
                '• TIN Certificate: Tax Identification Number certificate',
                '• All documents must be clear, readable, and unedited',
                '• Accepted formats: JPG, JPEG, PNG, PDF (max 2MB per file)'
            ]
        };
        
        return (
            <div className="instructions-panel">
                <h3 className="instructions-title">Instructions</h3>
                <ul className="instructions-list">
                    {instructionsMap[currentStep].map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                    ))}
                </ul>
            </div>
        );
    };
    
    const Step1Content = () => (
        <div className="step-content-1">
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">
                        Business Category <span className="required-indicator">*</span>
                    </label>
                    <select 
                        className={`form-select ${formData.businessCategory ? 'valid' : ''}`}
                        value={formData.businessCategory}
                        onChange={(e) => handleInputChange('businessCategory', e.target.value)}
                    >
                        <option value="">Select Business Category</option>
                        {registrationOptions?.businessCategories && 
                            Object.entries(registrationOptions.businessCategories).map(([name, data]) => (
                                <option key={data.value} value={data.value}>{name}</option>
                            ))
                        }
                    </select>
                </div>
                
                <div className="form-group">
                    <label className="form-label">
                        Legal Identity <span className="required-indicator">*</span>
                    </label>
                    <select 
                        className={`form-select ${formData.legalIdentity ? 'valid' : ''}`}
                        value={formData.legalIdentity}
                        onChange={(e) => handleInputChange('legalIdentity', e.target.value)}
                        disabled={!formData.businessCategory}
                    >
                        {!formData.businessCategory ? (
                            <option value="">Please select Business Category first</option>
                        ) : (
                            <>
                                <option value="">Select Legal Identity</option>
                                {availableLegalIdentities.map(([name, data]) => (
                                    <option key={data.value} value={data.value}>{name}</option>
                                ))}
                            </>
                        )}
                    </select>
                </div>
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">
                        Monthly Transaction Volume <span className="required-indicator">*</span>
                    </label>
                    <select 
                        className={`form-select ${formData.monthlyVolume ? 'valid' : ''}`}
                        value={formData.monthlyVolume}
                        onChange={(e) => handleInputChange('monthlyVolume', e.target.value)}
                    >
                        <option value="">Select Monthly Volume</option>
                        {registrationOptions?.monthlyVolumes?.map(volume => (
                            <option key={volume.value} value={volume.value}>{volume.label}</option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label className="form-label">Maximum Amount in a Single Transaction</label>
                    <input 
                        type="number" 
                        className="form-input"
                        value={formData.maxAmount}
                        onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                        placeholder="Enter amount" 
                        min="0" 
                        step="any"
                    />
                </div>
            </div>
            
            <div className="form-row full-width">
                <div className="form-group">
                    <label className="form-label">
                        Type of Service Needed <span className="required-indicator">*</span>
                    </label>
                    <div className="service-grid">
                        <div className="service-item">
                            <input 
                                type="checkbox" 
                                className="select-all-checkbox" 
                                id="select-all-services"
                                checked={formData.serviceTypes.length === 10}
                                onChange={(e) => handleSelectAllServices(e.target.checked)}
                            />
                            <label className="service-label" htmlFor="select-all-services">
                                Select All
                            </label>
                        </div>
                        
                        {['Visa', 'Mastercard', 'Amex', 'DBBL-Nexus', 'bKash', 
                          'Nagad', 'UnionPay', 'Rocket', 'Diners Club', 'Upay'].map(service => (
                            <div key={service} className="service-item">
                                <input 
                                    type="checkbox" 
                                    className="service-checkbox" 
                                    id={`service-${service.toLowerCase().replace(' ', '-')}`}
                                    checked={formData.serviceTypes.includes(service)}
                                    onChange={() => handleServiceToggle(service)}
                                />
                                <label 
                                    className="service-label" 
                                    htmlFor={`service-${service.toLowerCase().replace(' ', '-')}`}
                                >
                                    {service}
                                </label>
                            </div>
                        ))}
                    </div>
                    {formData.serviceTypes.length === 0 && currentStep === 1 && 
                        <div className="error-message">Please select at least one service type</div>
                    }
                </div>
            </div>
        </div>
    );
    
    const Step2Content = () => (
        <div className="step-content-2">
            <div className="form-row full-width">
                <div className="form-group">
                    <label className="form-label">
                        Merchant Registered Name <span className="required-indicator">*</span>
                    </label>
                    <input 
                        type="text" 
                        className={`form-input ${formData.merchantName.trim() ? 'valid' : ''}`}
                        value={formData.merchantName}
                        onChange={(e) => handleInputChange('merchantName', e.target.value)}
                        placeholder="Enter registered business name"
                    />
                </div>
            </div>
            
            <div className="form-row full-width">
                <div className="form-group">
                    <label className="form-label">
                        Trading Name (Name on the Shop) <span className="required-indicator">*</span>
                    </label>
                    <input 
                        type="text" 
                        className={`form-input ${formData.tradingName.trim() ? 'valid' : ''}`}
                        value={formData.tradingName}
                        onChange={(e) => handleInputChange('tradingName', e.target.value)}
                        placeholder="Enter trading/shop name"
                    />
                </div>
            </div>
            
            <div className="form-row full-width">
                <div className="form-group">
                    <label className="form-label">
                        Domain Name <span className="required-indicator">*</span>
                    </label>
                    <input 
                        type="text" 
                        className={`form-input ${formData.domainName.trim() ? 'valid' : ''}`}
                        value={formData.domainName}
                        onChange={(e) => handleInputChange('domainName', e.target.value)}
                        placeholder="https://www.example.com"
                    />
                    <small className="form-hint">Enter your website URL starting with http:// or https://</small>
                </div>
            </div>
        </div>
    );
    
    const Step3Content = () => (
        <div className="step-content-3">
            <div className="form-row full-width">
                <div className="form-group">
                    <label className="form-label">
                        Contact Name <span className="required-indicator">*</span>
                    </label>
                    <input 
                        type="text" 
                        className={`form-input ${formData.contactName.trim() ? 'valid' : ''}`}
                        value={formData.contactName}
                        onChange={(e) => handleInputChange('contactName', e.target.value)}
                        placeholder="Full name"
                    />
                </div>
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">
                        Designation <span className="required-indicator">*</span>
                    </label>
                    <input 
                        type="text" 
                        className={`form-input ${formData.designation.trim() ? 'valid' : ''}`}
                        value={formData.designation}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        placeholder="Job title/position"
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">
                        Email <span className="required-indicator">*</span>
                    </label>
                    <input 
                        type="email" 
                        className={`form-input ${formData.email.trim() ? 'valid' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@example.com"
                    />
                </div>
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">
                        Mobile Number <span className="required-indicator">*</span>
                    </label>
                    <input 
                        type="text" 
                        className={`form-input ${formData.mobile.trim() ? 'valid' : ''}`}
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        placeholder="+880 1XXXXXXXXX"
                    />
                    <small className="form-hint">Bangladesh mobile number with or without country code</small>
                </div>
                
                <div className="form-group">
                    <label className="form-label">Phone Number (Optional)</label>
                    <input 
                        type="text" 
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Office/landline number"
                    />
                </div>
            </div>
        </div>
    );
    
    const Step4Content = () => {
        const FileUpload = ({ field, label, required = false }) => (
            <div className="form-row full-width">
                <div className="form-group">
                    <label className="form-label">
                        {label} {required ? 
                            <span className="required-indicator">*</span> : 
                            <span className="optional-indicator">(Optional)</span>
                        }
                    </label>
                    <div className={`file-upload ${formData[field] ? 'has-file' : ''}`}>
                        <div className="file-upload-content">
                            <span className="file-upload-text">
                                {formData[field] || `Click to upload ${label.toLowerCase()}`}
                            </span>
                            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <input 
                            type="file" 
                            className="file-input" 
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    handleInputChange(field, e.target.files[0].name);
                                }
                            }}
                            accept=".jpg,.jpeg,.png,.pdf" 
                            style={{ display: 'none' }}
                        />
                    </div>
                    <small className="form-hint">Accepted formats: JPG, JPEG, PNG, PDF (Max 2MB)</small>
                </div>
            </div>
        );
        
        return (
            <div className="step-content-4">
                <FileUpload field="logo" label="Business / Organization Logo" />
                <FileUpload field="tradeLicense" label="Trade License" />
                <FileUpload field="idDocument" label="NID / Passport / Birth Certificate / Driving License" />
                <FileUpload field="tinCertificate" label="TIN Certificate" />
            </div>
        );
    };
    
    const getCurrentStepContent = () => {
        switch(currentStep) {
            case 1: return <Step1Content />;
            case 2: return <Step2Content />;
            case 3: return <Step3Content />;
            case 4: return <Step4Content />;
            default: return null;
        }
    };
    
    const SuccessScreen = () => (
        <div className="success-screen">
            <div className="success-card">
                <div className="success-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="success-title">Thank You!</h2>
                <p className="success-description">
                    Your merchant registration has been submitted successfully. 
                    You will receive a confirmation email shortly.
                </p>
                <p className="success-note">Processing time: 1-3 business days</p>
                <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.reload()}
                >
                    Submit Another Application
                </button>
            </div>
        </div>
    );
    
    // Loading screen
    if (loading) {
        return (
            <div className="moneybag-loading">
                <div className="loading-spinner" />
                <p>Submitting registration...</p>
            </div>
        );
    }
    
    // Success screen
    if (isSubmitted) {
        return <SuccessScreen />;
    }
    
    // Main form render
    return (
        <div className="merchant-form-container">
            <div className="merchant-form-header">
                <div className="merchant-form-header-content">
                    <div />
                    <div className="merchant-form-header-nav">
                        <button>Need Assistance?</button>
                        <button>FAQ</button>
                    </div>
                </div>
            </div>
            
            <div className="merchant-form-content">
                <ProgressHeader />
                
                <div className="merchant-form-layout">
                    <Sidebar />
                    
                    <div className="form-card">
                        {inlineError && (
                            <div className={`inline-error inline-error-${inlineError.type}`}>
                                <div className="inline-error-content">
                                    <span className="inline-error-icon">
                                        {inlineError.type === 'error' ? '⚠' : 
                                         inlineError.type === 'success' ? '✓' : 'ℹ'}
                                    </span>
                                    <span className="inline-error-message">{inlineError.message}</span>
                                </div>
                            </div>
                        )}
                        
                        {getCurrentStepContent()}
                        
                        <div className="form-navigation">
                            <div>
                                {currentStep > 1 ? (
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={handlePrevious}
                                    >
                                        Previous
                                    </button>
                                ) : <div />}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button 
                                    className="btn btn-primary btn-next" 
                                    onClick={handleNext}
                                >
                                    {currentStep === 4 ? 'Submit' : 'Save & Next'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <Instructions />
                </div>
            </div>
        </div>
    );
};

// Make component globally available
window.MerchantRegistrationForm = MerchantRegistrationForm;