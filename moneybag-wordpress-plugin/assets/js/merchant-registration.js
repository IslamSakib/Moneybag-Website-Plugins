(function($) {
    'use strict';

    class MerchantRegistrationForm {
        constructor(config) {
            this.config = config;
            this.currentStep = 1;
            this.isSubmitted = false;
            this.registrationOptions = null;
            this.availableLegalIdentities = [];
            this.formData = {
                // Step 1 - Business Info
                legalIdentity: '',
                businessCategory: '',
                monthlyVolume: '',
                maxAmount: '',
                currencyType: 'BDT',  // Default to BDT
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
            };
            
            this.validationErrors = {};
            this.sessionId = null;
            
            // Load registration options from JSON
            this.loadRegistrationOptions();
            
            this.steps = [
                { id: 1, title: 'Business Info' },
                { id: 2, title: 'Online Presence' },
                { id: 3, title: 'Point Of Contact' },
                { id: 4, title: 'Documents' }
            ];

            this.progressPercentage = {
                1: 28,
                2: 52,
                3: 74,
                4: 96
            };

            this.serviceOptions = [];
            this.init();
        }

        async loadRegistrationOptions() {
            try {
                const response = await fetch(this.config.plugin_url + 'data/merchant-registration-options.json');
                if (response.ok) {
                    this.registrationOptions = await response.json();
                    this.updateServiceOptions();
                    this.updateUI();
                } else {
                    console.error('Failed to load registration options');
                }
            } catch (error) {
                console.error('Error loading registration options:', error);
            }
        }
        
        updateServiceOptions() {
            if (this.registrationOptions && this.registrationOptions.serviceTypes) {
                this.serviceOptions = [];
                this.registrationOptions.serviceTypes.forEach(category => {
                    category.options.forEach(option => {
                        this.serviceOptions.push(option.label);
                    });
                });
            }
        }
        
        init() {
            this.render();
            this.bindEvents();
        }

        // Validation functions
        isStep1Complete() {
            return this.formData.legalIdentity && 
                   this.formData.businessCategory && 
                   this.formData.serviceTypes.length > 0 &&
                   this.formData.monthlyVolume;  // Added monthly volume as required
        }

        isStep2Complete() {
            return this.formData.merchantName.trim() && 
                   this.formData.tradingName.trim() && 
                   this.formData.domainName.trim();
        }

        isStep3Complete() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return this.formData.contactName.trim() && 
                   this.formData.designation.trim() && 
                   this.formData.email.trim() && 
                   emailRegex.test(this.formData.email) &&
                   this.formData.mobile.trim();
        }

        isStep4Complete() {
            // All file uploads are optional, so step 4 is always complete
            return true;
        }

        getStepStatus(stepNumber) {
            if (stepNumber < this.currentStep) {
                switch(stepNumber) {
                    case 1: return this.isStep1Complete() ? 'completed' : 'incomplete';
                    case 2: return this.isStep2Complete() ? 'completed' : 'incomplete';
                    case 3: return this.isStep3Complete() ? 'completed' : 'incomplete';
                    case 4: return this.isStep4Complete() ? 'completed' : 'incomplete';
                    default: return 'incomplete';
                }
            } else if (stepNumber === this.currentStep) {
                return 'current';
            } else {
                return 'future';
            }
        }

        getCurrentStepCompletion() {
            switch(this.currentStep) {
                case 1: return this.isStep1Complete();
                case 2: return this.isStep2Complete(); 
                case 3: return this.isStep3Complete();
                case 4: return this.isStep4Complete();
                default: return false;
            }
        }
        
        isStepComplete(stepNumber) {
            switch(stepNumber) {
                case 1: return this.isStep1Complete();
                case 2: return this.isStep2Complete();
                case 3: return this.isStep3Complete();
                case 4: return this.isStep4Complete();
                default: return false;
            }
        }
        
        canNavigateToStep(stepId) {
            // Can always stay on current step
            if (stepId === this.currentStep) return true;
            
            // Can go back to any previous step (or forward if user has been there before)
            if (stepId < this.currentStep) {
                return true; // Allow going back to any previous step
            }
            
            // Can go forward to next step if current step is complete
            if (stepId === this.currentStep + 1 && this.getCurrentStepCompletion()) {
                return true;
            }
            
            // Cannot go beyond next step
            return false;
        }
        
        getProgressHeight() {
            // Calculate progress based on completed steps
            let completedSteps = 0;
            for (let i = 1; i <= this.currentStep && i <= 4; i++) {
                if (i < this.currentStep || (i === this.currentStep && this.isStepComplete(i))) {
                    completedSteps++;
                }
            }
            // Return percentage (0%, 25%, 50%, 75%, or 100%)
            return (completedSteps / 4) * 100;
        }

        handleInputChange(field, value) {
            this.formData[field] = value;
            
            // Update available legal identities when business category changes
            if (field === 'businessCategory' && this.registrationOptions) {
                this.updateAvailableLegalIdentities(value);
                // Reset legal identity if not available in new category
                if (this.formData.legalIdentity && !this.isLegalIdentityAvailable(this.formData.legalIdentity)) {
                    this.formData.legalIdentity = '';
                }
                // Only update UI for category changes that need full re-render
                this.updateUI();
            } else {
                // For other fields, just validate without re-rendering
                this.validateField(field, value);
                // Update field validation display without full re-render
                this.updateFieldValidation(field, value);
            }
        }
        
        updateFieldValidation(field, value) {
            const container = $(`#moneybag-merchant-form-${this.config.widget_id}`);
            const fieldElement = container.find(`[data-field="${field}"]`);
            const formGroup = fieldElement.closest('.form-group');
            
            // Update field validation classes
            if (this.validationErrors[field]) {
                fieldElement.addClass('invalid').removeClass('valid');
                // Update or add error message
                let errorMsg = formGroup.find('.error-message');
                if (errorMsg.length) {
                    errorMsg.text(this.validationErrors[field]);
                } else {
                    formGroup.append(`<div class="error-message">${this.validationErrors[field]}</div>`);
                }
            } else {
                fieldElement.removeClass('invalid');
                if (value && value.toString().trim()) {
                    fieldElement.addClass('valid');
                }
                // Remove error message
                formGroup.find('.error-message').remove();
            }
        }
        
        updateAvailableLegalIdentities(businessCategory) {
            this.availableLegalIdentities = [];
            if (this.registrationOptions && businessCategory) {
                const categories = this.registrationOptions.businessCategories;
                for (const [catName, catData] of Object.entries(categories)) {
                    if (catData.value === businessCategory) {
                        this.availableLegalIdentities = Object.entries(catData.identities || {});
                        break;
                    }
                }
            }
        }
        
        isLegalIdentityAvailable(legalIdentity) {
            return this.availableLegalIdentities.some(([name, data]) => data.value === legalIdentity);
        }
        
        validateField(field, value) {
            let error = '';
            
            switch(field) {
                case 'legalIdentity':
                    if (!value) error = 'Legal identity is required';
                    break;
                case 'businessCategory':
                    if (!value) error = 'Business category is required';
                    break;
                case 'merchantName':
                    if (!value || value.trim().length < 2) error = 'Merchant name is required (min 2 characters)';
                    break;
                case 'tradingName':
                    if (!value || value.trim().length < 2) error = 'Trading name is required (min 2 characters)';
                    break;
                case 'domainName':
                    if (!value) {
                        error = 'Domain name is required';
                    } else if (!value.match(/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/)) {
                        error = 'Domain must be a valid URL starting with http:// or https://';
                    }
                    break;
                case 'contactName':
                    if (!value || value.trim().length < 2) error = 'Contact name is required (min 2 characters)';
                    break;
                case 'designation':
                    if (!value || value.trim().length < 2) error = 'Designation is required (min 2 characters)';
                    break;
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!value) {
                        error = 'Email is required';
                    } else if (!emailRegex.test(value)) {
                        error = 'Please enter a valid email address';
                    }
                    break;
                case 'mobile':
                    const phoneRegex = /^(\+880|880|0)?[1-9][0-9]{8,10}$/;
                    if (!value) {
                        error = 'Mobile number is required';
                    } else if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                        error = 'Please enter a valid Bangladesh mobile number';
                    }
                    break;
                case 'monthlyVolume':
                    if (!value) error = 'Monthly transaction volume is required';
                    break;
                case 'maxAmount':
                    if (value && isNaN(value)) error = 'Maximum amount must be a number';
                    break;
                case 'phone':
                    // Optional phone validation - only validate if value is provided
                    if (value && value.trim()) {
                        const phoneRegex = /^(\+880|880|0)?[1-9][0-9]{7,10}$/;
                        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                            error = 'Please enter a valid phone number';
                        }
                    }
                    break;
            }
            
            if (error) {
                this.validationErrors[field] = error;
            } else {
                delete this.validationErrors[field];
            }
            
            return !error;
        }

        handleServiceToggle(service) {
            if (this.formData.serviceTypes.includes(service)) {
                this.formData.serviceTypes = this.formData.serviceTypes.filter(s => s !== service);
            } else {
                this.formData.serviceTypes.push(service);
            }
            // Just update the checkbox state and validation, don't re-render
            const container = $(`#moneybag-merchant-form-${this.config.widget_id}`);
            const formGroup = container.find('.service-checkbox').closest('.form-group');
            
            // Update select all checkbox
            const allServices = ['Visa', 'Mastercard', 'Amex', 'DBBL-Nexus', 'bKash', 'Nagad', 'UnionPay', 'Rocket', 'Diners Club', 'Upay'];
            const allSelected = allServices.every(s => this.formData.serviceTypes.includes(s));
            container.find('.select-all-checkbox').prop('checked', allSelected);
            
            // Update error message display
            if (this.formData.serviceTypes.length === 0 && this.currentStep === 1) {
                if (!formGroup.find('.error-message').length) {
                    formGroup.append('<div class="error-message">Please select at least one service type</div>');
                }
            } else {
                formGroup.find('.error-message').remove();
            }
        }
        
        handleSelectAllServices(isChecked) {
            const allServices = ['Visa', 'Mastercard', 'Amex', 'DBBL-Nexus', 'bKash', 'Nagad', 'UnionPay', 'Rocket', 'Diners Club', 'Upay'];
            const container = $(`#moneybag-merchant-form-${this.config.widget_id}`);
            
            if (isChecked) {
                this.formData.serviceTypes = [...allServices];
                container.find('.service-checkbox').prop('checked', true);
            } else {
                this.formData.serviceTypes = [];
                container.find('.service-checkbox').prop('checked', false);
            }
            
            // Update error message
            const formGroup = container.find('.service-checkbox').closest('.form-group');
            if (this.formData.serviceTypes.length === 0 && this.currentStep === 1) {
                if (!formGroup.find('.error-message').length) {
                    formGroup.append('<div class="error-message">Please select at least one service type</div>');
                }
            } else {
                formGroup.find('.error-message').remove();
            }
        }

        handleNext() {
            // Validate current step before proceeding
            let canProceed = this.validateCurrentStep();
            
            // Debug validation
            console.log('Current step:', this.currentStep);
            console.log('Form data:', this.formData);
            console.log('Can proceed:', canProceed);
            
            if (!canProceed) {
                // Show specific validation errors for current step
                let missingFields = [];
                if (this.currentStep === 1) {
                    if (!this.formData.businessCategory) missingFields.push('Business Category');
                    if (!this.formData.legalIdentity) missingFields.push('Legal Identity');
                    if (!this.formData.monthlyVolume) missingFields.push('Monthly Volume');
                    if (this.formData.serviceTypes.length === 0) missingFields.push('Service Types');
                }
                
                const errorMsg = missingFields.length > 0 
                    ? `Please fill: ${missingFields.join(', ')}` 
                    : 'Please fill all required fields before proceeding to the next step.';
                    
                this.showInlineError(errorMsg);
                return;
            }
            
            // Clear any previous errors
            this.clearInlineError();
            
            if (this.currentStep < 4) {
                this.currentStep++;
                this.updateUI();
            } else {
                this.handleSubmit();
            }
        }
        
        validateCurrentStep() {
            switch(this.currentStep) {
                case 1: return this.isStep1Complete();
                case 2: return this.isStep2Complete();
                case 3: return this.isStep3Complete();
                case 4: return this.isStep4Complete();
                default: return false;
            }
        }

        handlePrevious() {
            if (this.currentStep > 1) {
                this.currentStep--;
                this.updateUI();
            }
        }

        async handleSubmit() {
            try {
                // Show loading
                this.showLoading();
                
                // Generate session ID if not exists
                if (!this.sessionId) {
                    this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 18);
                }

                // Prepare form data for sandbox API submission
                const submitData = {
                    business_name: this.formData.merchantName,
                    business_website: this.formData.domainName,
                    trading_name: this.formData.tradingName,
                    first_name: this.formData.contactName.split(' ')[0] || this.formData.contactName,
                    last_name: this.formData.contactName.split(' ').slice(1).join(' ') || '',
                    email: this.formData.email,
                    phone: this.formData.mobile.replace(/\s/g, ''),
                    designation: this.formData.designation,
                    business_category: this.formData.businessCategory,
                    legal_identity: this.formData.legalIdentity,
                    monthly_volume: this.formData.monthlyVolume,
                    max_amount: this.formData.maxAmount || '',
                    currency_type: this.formData.currencyType,
                    service_types: this.formData.serviceTypes.join(','),
                    office_phone: this.formData.phone || '',
                    session_id: this.sessionId
                };

                // Log the data being sent for debugging
                console.log('Submitting merchant registration data:', submitData);
                
                // Make API call to sandbox endpoint
                const response = await fetch(`${this.config.api_base_url}/sandbox/merchants/business-details`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(submitData)
                });

                let result;
                try {
                    result = await response.json();
                } catch (parseError) {
                    console.error('Failed to parse API response:', parseError);
                    throw new Error('Invalid response from server');
                }

                console.log('API Response:', { status: response.status, result });

                this.hideLoading();

                if (response.ok && result.success) {
                    this.isSubmitted = true;
                    this.showNotification('Registration submitted successfully! You will receive a confirmation email shortly.', 'success');
                    this.showSuccessScreen();
                    
                    // Redirect if configured
                    if (this.config.redirect_url) {
                        setTimeout(() => {
                            window.location.href = this.config.redirect_url;
                        }, 3000);
                    }
                } else {
                    // More detailed error handling
                    let errorMessage = 'Registration failed';
                    
                    if (result && result.message) {
                        errorMessage = result.message;
                    } else if (result && result.errors) {
                        errorMessage = Array.isArray(result.errors) ? result.errors.join(', ') : result.errors;
                    } else if (!response.ok) {
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    
                    throw new Error(errorMessage);
                }

            } catch (error) {
                this.hideLoading();
                this.showAlert('Registration failed: ' + error.message);
                console.error('Registration error:', error);
            }
        }

        showAlert(message, type = 'error') {
            this.showInlineError(message, type);
        }
        
        showInlineError(message, type = 'error') {
            // Remove any existing inline errors
            this.clearInlineError();
            
            // Add error message above the navigation buttons
            const formCard = document.querySelector(`#moneybag-merchant-form-${this.config.widget_id} .form-card`);
            if (formCard) {
                const errorDiv = document.createElement('div');
                errorDiv.className = `inline-error inline-error-${type}`;
                errorDiv.innerHTML = `
                    <div class="inline-error-content">
                        <span class="inline-error-icon">${type === 'error' ? '⚠' : type === 'success' ? '✓' : 'ℹ'}</span>
                        <span class="inline-error-message">${message}</span>
                    </div>
                `;
                
                // Insert before navigation
                const navigation = formCard.querySelector('.form-navigation');
                if (navigation) {
                    formCard.insertBefore(errorDiv, navigation);
                } else {
                    formCard.appendChild(errorDiv);
                }
            }
        }
        
        clearInlineError() {
            const existingError = document.querySelector(`#moneybag-merchant-form-${this.config.widget_id} .inline-error`);
            if (existingError) {
                existingError.remove();
            }
        }
        
        showNotification(message, type = 'error') {
            // Remove any existing notifications
            const existingNotification = document.querySelector('.notification-toast');
            if (existingNotification) {
                existingNotification.remove();
            }
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification-toast notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">
                        ${type === 'error' ? '⚠' : type === 'success' ? '✓' : 'ℹ'}
                    </div>
                    <div class="notification-message">${message}</div>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            // Add to page
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }

        showLoading() {
            const container = $(`#moneybag-merchant-form-${this.config.widget_id}`);
            container.html(`
                <div class="moneybag-loading">
                    <div class="loading-spinner"></div>
                    <p>Submitting registration...</p>
                </div>
            `);
        }

        hideLoading() {
            this.render();
        }

        showSuccessScreen() {
            const container = $(`#moneybag-merchant-form-${this.config.widget_id}`);
            container.html(`
                <div class="success-screen">
                    <div class="success-card">
                        <div class="success-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 class="success-title">Thank You!</h2>
                        <p class="success-description">
                            Your merchant registration has been submitted successfully. You will receive a confirmation email shortly.
                        </p>
                        <p class="success-note">
                            Processing time: 1-3 business days
                        </p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            Submit Another Application
                        </button>
                    </div>
                </div>
            `);
        }

        updateUI() {
            this.render();
        }

        bindEvents() {
            const container = $(`#moneybag-merchant-form-${this.config.widget_id}`);
            
            // Remove all existing event handlers first to prevent duplicates
            container.off();
            
            // Use event delegation for better handling
            container.on('click', '.step-item', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const stepId = parseInt($(e.currentTarget).data('step'));
                if (stepId && !isNaN(stepId)) {
                    if (this.canNavigateToStep(stepId)) {
                        this.currentStep = stepId;
                        this.updateUI();
                    } else {
                        this.showAlert('Please complete the current step before proceeding.');
                    }
                }
            });

            // Form inputs with proper event handling
            container.on('input', '.form-input', (e) => {
                e.stopPropagation();
                const field = $(e.target).data('field');
                const value = $(e.target).val();
                if (field) {
                    this.handleInputChange(field, value);
                }
            });
            
            container.on('change', '.form-select', (e) => {
                e.stopPropagation();
                const field = $(e.target).data('field');
                const value = $(e.target).val();
                if (field) {
                    this.handleInputChange(field, value);
                }
            });

            // Service checkboxes
            container.on('change', '.service-checkbox', (e) => {
                e.stopPropagation();
                const service = $(e.target).data('service');
                if (service) {
                    this.handleServiceToggle(service);
                }
            });
            
            // Select all services checkbox
            container.on('change', '.select-all-checkbox', (e) => {
                e.stopPropagation();
                const isChecked = $(e.target).prop('checked');
                this.handleSelectAllServices(isChecked);
            });

            // Navigation buttons
            container.on('click', '.btn-next', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleNext();
            });

            container.on('click', '.btn-previous', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handlePrevious();
            });

            // File upload with click handler fix
            container.on('click', '.file-upload', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).find('.file-input').trigger('click');
            });
            
            container.on('change', '.file-input', (e) => {
                e.stopPropagation();
                const field = $(e.target).data('field');
                const file = e.target.files[0];
                if (field && file) {
                    this.handleInputChange(field, file.name);
                }
            });
            
            // Prevent file input from triggering parent click
            container.on('click', '.file-input', (e) => {
                e.stopPropagation();
            });
        }

        render() {
            if (this.isSubmitted) {
                this.showSuccessScreen();
                return;
            }

            const container = $(`#moneybag-merchant-form-${this.config.widget_id}`);
            container.html(this.getFormHTML());
            this.bindEvents();
        }

        getFormHTML() {
            return `
                <div class="merchant-form-container">
                    ${this.getHeaderHTML()}
                    <div class="merchant-form-content">
                        ${this.getMainContentHTML()}
                    </div>
                </div>
            `;
        }

        getHeaderHTML() {
            return `
                <div class="merchant-form-header">
                    <div class="merchant-form-header-content">
                        <div></div>
                        <div class="merchant-form-header-nav">
                            <button>Need Assistance?</button>
                            <button>FAQ</button>
                        </div>
                    </div>
                </div>
            `;
        }

        getSidebarHTML() {
            return `
                <div class="steps-sidebar">
                    <h3 class="steps-title">Please fill this information first</h3>
                    <p class="steps-subtitle">After completing all steps you will be eligible for 7 days trial.</p>
                    
                    <div class="steps-list">
                        <div class="vertical-line-container">
                            <div class="vertical-line"></div>
                            <div class="vertical-line-fill" style="height: ${this.getProgressHeight()}%"></div>
                        </div>
                        ${this.steps.map((step, index) => {
                            const status = this.getStepStatus(step.id);
                            const isClickable = this.canNavigateToStep(step.id);
                            const isCompleted = status === 'completed';
                            return `
                                <div class="step-item step-${status} ${isClickable ? 'clickable' : 'disabled'}" data-step="${step.id}">
                                    <div class="step-marker ${status}"></div>
                                    <div class="step-content">
                                        <div class="step-title">Step ${step.id}: ${step.title}</div>
                                        ${status === 'completed' ? '<div class="step-status completed">✓ Completed</div>' : ''}
                                        ${status === 'incomplete' ? '<div class="step-status incomplete">⚠ Incomplete</div>' : ''}
                                        ${status === 'current' ? '<div class="step-status current">In Progress</div>' : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    ${this.getIllustrationHTML()}
                </div>
            `;
        }

        getIllustrationHTML() {
            return `
                <div class="steps-illustration">
                    <img src="${this.config.plugin_url}assets/images/img_join now.webp" alt="Join Now" class="illustration-image">
                </div>
            `;
        }

        getMainContentHTML() {
            return `
                <div class="form-progress-header">
                    <div class="merchant-form-header-nav">
                        <button>Need Assistance?</button>
                        <button>FAQ</button>
                    </div>
                    <div class="progress-section">
                        <div class="progress-text">${this.progressPercentage[this.currentStep]}% Progress</div>
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${this.progressPercentage[this.currentStep]}%"></div>
                        </div>
                    </div>
                </div>
                <div class="merchant-form-layout">
                    ${this.getSidebarHTML()}
                    <div class="form-card">
                        ${this.getStepContentHTML()}
                        ${this.getNavigationHTML()}
                    </div>
                    ${this.getInstructionsHTML()}
                </div>
            `;
        }

        getStepContentHTML() {
            switch(this.currentStep) {
                case 1: return this.getStep1HTML();
                case 2: return this.getStep2HTML();
                case 3: return this.getStep3HTML();
                case 4: return this.getStep4HTML();
                default: return '';
            }
        }

        getStep1HTML() {
            const hasLegalError = this.validationErrors.legalIdentity;
            const hasCategoryError = this.validationErrors.businessCategory;
            const hasVolumeError = this.validationErrors.monthlyVolume;
            const hasMaxAmountError = this.validationErrors.maxAmount;
            
            // Generate business category options from JSON
            let businessCategoryOptions = '<option value="">Select Business Category</option>';
            if (this.registrationOptions && this.registrationOptions.businessCategories) {
                for (const [categoryName, categoryData] of Object.entries(this.registrationOptions.businessCategories)) {
                    businessCategoryOptions += `<option value="${categoryData.value}" ${this.formData.businessCategory === categoryData.value ? 'selected' : ''}>${categoryName}</option>`;
                }
            }
            
            // Generate legal identity options based on selected business category
            let legalIdentityOptions = '<option value="">Select Legal Identity</option>';
            if (this.formData.businessCategory && this.availableLegalIdentities.length > 0) {
                this.availableLegalIdentities.forEach(([name, data]) => {
                    legalIdentityOptions += `<option value="${data.value}" ${this.formData.legalIdentity === data.value ? 'selected' : ''}>${name}</option>`;
                });
            } else if (!this.formData.businessCategory) {
                legalIdentityOptions = '<option value="" disabled>Please select Business Category first</option>';
            }
            
            return `
                <div class="step-content-1">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">
                                Business Category <span class="required-indicator">*</span>
                            </label>
                            <select class="form-select ${this.formData.businessCategory ? 'valid' : ''} ${hasCategoryError ? 'invalid' : ''}" 
                                    data-field="businessCategory">
                                ${businessCategoryOptions}
                            </select>
                            ${hasCategoryError ? `<div class="error-message">${this.validationErrors.businessCategory}</div>` : ''}
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                Legal Identity <span class="required-indicator">*</span>
                            </label>
                            <select class="form-select ${this.formData.legalIdentity ? 'valid' : ''} ${hasLegalError ? 'invalid' : ''}" 
                                    data-field="legalIdentity" ${!this.formData.businessCategory ? 'disabled' : ''}>
                                ${legalIdentityOptions}
                            </select>
                            ${hasLegalError ? `<div class="error-message">${this.validationErrors.legalIdentity}</div>` : ''}
                            ${this.formData.businessCategory && this.availableLegalIdentities.length > 0 ? 
                                `<small class="form-hint">${this.availableLegalIdentities.find(([n, d]) => d.value === this.formData.legalIdentity)?.[1]?.description || ''}</small>` : ''}
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">
                                Monthly Transaction Volume <span class="required-indicator">*</span>
                            </label>
                            <select class="form-select ${this.formData.monthlyVolume ? 'valid' : ''} ${hasVolumeError ? 'invalid' : ''}" data-field="monthlyVolume">
                                <option value="">Select Monthly Volume</option>
                                ${this.registrationOptions && this.registrationOptions.monthlyVolumes ? 
                                    this.registrationOptions.monthlyVolumes.map(volume => 
                                        `<option value="${volume.value}" ${this.formData.monthlyVolume === volume.value ? 'selected' : ''}>${volume.label}</option>`
                                    ).join('') : ''
                                }
                            </select>
                            ${hasVolumeError ? `<div class="error-message">${this.validationErrors.monthlyVolume}</div>` : ''}
                        </div>
                        <div class="form-group">
                            <label class="form-label">Maximum Amount in a Single Transaction</label>
                            <input type="number" class="form-input ${hasMaxAmountError ? 'invalid' : ''}" data-field="maxAmount" 
                                   value="${this.formData.maxAmount}" placeholder="Enter amount" min="0" step="any">
                            ${hasMaxAmountError ? `<div class="error-message">${this.validationErrors.maxAmount}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="form-row full-width">
                        <div class="form-group">
                            <label class="form-label">
                                Type of Service Needed <span class="required-indicator">*</span>
                            </label>
                            <div class="service-grid">
                                <div class="service-item">
                                    <input type="checkbox" class="select-all-checkbox" id="select-all-services">
                                    <label class="service-label" for="select-all-services">Select All</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-visa"
                                           data-service="Visa"
                                           ${this.formData.serviceTypes.includes('Visa') ? 'checked' : ''}>
                                    <label class="service-label" for="service-visa">Visa</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-mastercard"
                                           data-service="Mastercard"
                                           ${this.formData.serviceTypes.includes('Mastercard') ? 'checked' : ''}>
                                    <label class="service-label" for="service-mastercard">Mastercard</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-amex"
                                           data-service="Amex"
                                           ${this.formData.serviceTypes.includes('Amex') ? 'checked' : ''}>
                                    <label class="service-label" for="service-amex">Amex</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-dbbl-nexus"
                                           data-service="DBBL-Nexus"
                                           ${this.formData.serviceTypes.includes('DBBL-Nexus') ? 'checked' : ''}>
                                    <label class="service-label" for="service-dbbl-nexus">DBBL-Nexus</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-bkash"
                                           data-service="bKash"
                                           ${this.formData.serviceTypes.includes('bKash') ? 'checked' : ''}>
                                    <label class="service-label" for="service-bkash">bKash</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-nagad"
                                           data-service="Nagad"
                                           ${this.formData.serviceTypes.includes('Nagad') ? 'checked' : ''}>
                                    <label class="service-label" for="service-nagad">Nagad</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-unionpay"
                                           data-service="UnionPay"
                                           ${this.formData.serviceTypes.includes('UnionPay') ? 'checked' : ''}>
                                    <label class="service-label" for="service-unionpay">UnionPay</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-rocket"
                                           data-service="Rocket"
                                           ${this.formData.serviceTypes.includes('Rocket') ? 'checked' : ''}>
                                    <label class="service-label" for="service-rocket">Rocket</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-diners"
                                           data-service="Diners Club"
                                           ${this.formData.serviceTypes.includes('Diners Club') ? 'checked' : ''}>
                                    <label class="service-label" for="service-diners">Diners Club</label>
                                </div>
                                <div class="service-item">
                                    <input type="checkbox" class="service-checkbox" id="service-upay"
                                           data-service="Upay"
                                           ${this.formData.serviceTypes.includes('Upay') ? 'checked' : ''}>
                                    <label class="service-label" for="service-upay">Upay</label>
                                </div>
                            </div>
                            ${this.formData.serviceTypes.length === 0 && this.currentStep === 1 ? 
                                '<div class="error-message">Please select at least one service type</div>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        getStep2HTML() {
            const hasMerchantError = this.validationErrors.merchantName;
            const hasTradingError = this.validationErrors.tradingName;
            const hasDomainError = this.validationErrors.domainName;
            
            return `
                <div class="step-content-2">
                    <div class="form-row full-width">
                        <div class="form-group">
                            <label class="form-label">
                                Merchant Registered Name <span class="required-indicator">*</span>
                            </label>
                            <input type="text" class="form-input ${this.formData.merchantName.trim() ? 'valid' : ''} ${hasMerchantError ? 'invalid' : ''}" 
                                   data-field="merchantName" value="${this.formData.merchantName}" 
                                   placeholder="Enter registered business name">
                            ${hasMerchantError ? `<div class="error-message">${this.validationErrors.merchantName}</div>` : ''}
                        </div>
                    </div>
                    <div class="form-row full-width">
                        <div class="form-group">
                            <label class="form-label">
                                Trading Name (Name on the Shop) <span class="required-indicator">*</span>
                            </label>
                            <input type="text" class="form-input ${this.formData.tradingName.trim() ? 'valid' : ''} ${hasTradingError ? 'invalid' : ''}" 
                                   data-field="tradingName" value="${this.formData.tradingName}" 
                                   placeholder="Enter trading/shop name">
                            ${hasTradingError ? `<div class="error-message">${this.validationErrors.tradingName}</div>` : ''}
                        </div>
                    </div>
                    <div class="form-row full-width">
                        <div class="form-group">
                            <label class="form-label">
                                Domain Name <span class="required-indicator">*</span>
                            </label>
                            <input type="text" class="form-input ${this.formData.domainName.trim() && !hasDomainError ? 'valid' : ''} ${hasDomainError ? 'invalid' : ''}" 
                                   data-field="domainName" value="${this.formData.domainName}" 
                                   placeholder="https://www.example.com">
                            ${hasDomainError ? `<div class="error-message">${this.validationErrors.domainName}</div>` : ''}
                            <small class="form-hint">Enter your website URL starting with http:// or https://</small>
                        </div>
                    </div>
                </div>
            `;
        }

        getStep3HTML() {
            const hasNameError = this.validationErrors.contactName;
            const hasDesignationError = this.validationErrors.designation;
            const hasEmailError = this.validationErrors.email;
            const hasMobileError = this.validationErrors.mobile;
            const emailValid = this.formData.email.trim() && !hasEmailError;
            
            return `
                <div class="step-content-3">
                    <div class="form-row full-width">
                        <div class="form-group">
                            <label class="form-label">
                                Contact Name <span class="required-indicator">*</span>
                            </label>
                            <input type="text" class="form-input ${this.formData.contactName.trim() && !hasNameError ? 'valid' : ''} ${hasNameError ? 'invalid' : ''}" 
                                   data-field="contactName" value="${this.formData.contactName}" 
                                   placeholder="Full name">
                            ${hasNameError ? `<div class="error-message">${this.validationErrors.contactName}</div>` : ''}
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">
                                Designation <span class="required-indicator">*</span>
                            </label>
                            <input type="text" class="form-input ${this.formData.designation.trim() && !hasDesignationError ? 'valid' : ''} ${hasDesignationError ? 'invalid' : ''}" 
                                   data-field="designation" value="${this.formData.designation}" 
                                   placeholder="Job title/position">
                            ${hasDesignationError ? `<div class="error-message">${this.validationErrors.designation}</div>` : ''}
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                Email <span class="required-indicator">*</span>
                            </label>
                            <input type="email" class="form-input ${emailValid ? 'valid' : ''} ${hasEmailError ? 'invalid' : ''}" 
                                   data-field="email" value="${this.formData.email}" 
                                   placeholder="email@example.com">
                            ${hasEmailError ? `<div class="error-message">${this.validationErrors.email}</div>` : ''}
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">
                                Mobile Number <span class="required-indicator">*</span>
                            </label>
                            <input type="text" class="form-input ${this.formData.mobile.trim() && !hasMobileError ? 'valid' : ''} ${hasMobileError ? 'invalid' : ''}" 
                                   data-field="mobile" value="${this.formData.mobile}" 
                                   placeholder="+880 1XXXXXXXXX">
                            ${hasMobileError ? `<div class="error-message">${this.validationErrors.mobile}</div>` : ''}
                            <small class="form-hint">Bangladesh mobile number with or without country code</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone Number (Optional)</label>
                            <input type="text" class="form-input" data-field="phone" value="${this.formData.phone}" 
                                   placeholder="Office/landline number">
                        </div>
                    </div>
                </div>
            `;
        }

        getStep4HTML() {
            return `
                <div class="step-content-4">
                    ${this.getFileUploadHTML('logo', 'Business / Organization Logo', false)}
                    ${this.getFileUploadHTML('tradeLicense', 'Trade License', false)}
                    ${this.getFileUploadHTML('idDocument', 'NID / Passport / Birth Certificate / Driving License', false)}
                    ${this.getFileUploadHTML('tinCertificate', 'TIN Certificate', false)}
                </div>
            `;
        }

        getFileUploadHTML(field, label, required = false) {
            const hasFile = this.formData[field];
            
            return `
                <div class="form-row full-width">
                    <div class="form-group">
                        <label class="form-label">
                            ${label} ${required ? '<span class="required-indicator">*</span>' : '<span class="optional-indicator">(Optional)</span>'}
                        </label>
                        <div class="file-upload ${hasFile ? 'has-file' : ''}">
                            <div class="file-upload-content">
                                <span class="file-upload-text">
                                    ${hasFile || `Click to upload ${label.toLowerCase()}`}
                                </span>
                                <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                            </div>
                            <input type="file" class="file-input" data-field="${field}" 
                                   accept=".jpg,.jpeg,.png,.pdf" style="display: none;">
                        </div>
                        <small class="form-hint">Accepted formats: JPG, JPEG, PNG, PDF (Max 2MB)</small>
                    </div>
                </div>
            `;
        }

        getNavigationHTML() {
            const isComplete = this.getCurrentStepCompletion();
            
            return `
                <div class="form-navigation">
                    <div>
                        ${this.currentStep > 1 ? 
                            '<button class="btn btn-secondary btn-previous">Previous</button>' : 
                            '<div></div>'
                        }
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn btn-primary btn-next">
                            ${this.currentStep === 4 ? 'Submit' : 'Save & Next'}
                        </button>
                    </div>
                </div>
            `;
        }

        getInstructionsHTML() {
            const instructions = this.getInstructionsForStep(this.currentStep);
            
            return `
                <div class="instructions-panel">
                    <h3 class="instructions-title">Instructions</h3>
                    <ul class="instructions-list">
                        ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        getInstructionsForStep(step) {
            const instructionsMap = {
                1: [
                    '• Select your business type from the legal identity dropdown',
                    '• Enter your expected monthly transaction amount in BDT',
                    '• Specify the highest single transaction amount you expect to process',
                    '• Choose whether you serve domestic, international, or both customer types',
                    '• Select all payment methods you want to accept (you can add more later)',
                    '• All fields are required to proceed to the next step',
                    '• Ensure your transaction volumes are realistic to avoid delays in approval'
                ],
                2: [
                    '• Enter your official business name as registered with government authorities',
                    '• Trading name is what customers see (your shop/brand name)',
                    '• Domain Name should be your complete website URL (e.g., www.yourbusiness.com)',
                    '• If you don\'t have a website yet, enter \'N/A\' or your social media page',
                    '• Double-check spelling - this information will appear on your merchant account',
                    '• These details will be used for payment gateway integration'
                ],
                3: [
                    '• Provide details of the primary contact person for this merchant account',
                    '• This person will receive all account-related communications',
                    '• Email must be valid and actively monitored - verification code will be sent',
                    '• Mobile number must be a Bangladesh number starting with +88',
                    '• Phone number is optional but recommended for urgent support',
                    '• This contact will have admin access to the merchant dashboard'
                ],
                4: [
                    '• Company Logo - Square format (500x500px), PNG preferred',
                    '• Trade License: Current and valid trade license from city corporation/municipality',
                    '• Owner ID - NID/Passport/Birth Certificate/Driving License (both sides if needed)',
                    '• TIN Certificate: Tax Identification Number certificate from NBR',
                    '• All documents must be clear, readable, and unedited',
                    '• Accepted formats: JPG, JPEG, PNG, PDF (max 1MB per file)',
                    '• Documents must be valid and not expired',
                    '• Ensure all text is clearly visible - blurry documents will be rejected',
                    '• For ID documents, both sides must be uploaded if applicable',
                    '• Documents must match the business name provided in Step 2',
                    '• Processing takes 1-3 business days after submission'
                ]
            };

            return instructionsMap[step] || [];
        }
    }

    // Initialize the form when the page loads
    $(document).ready(function() {
        $('.moneybag-merchant-form-wrapper').each(function() {
            const config = $(this).data('config');
            const widgetId = config.widget_id;
            
            if (config && widgetId) {
                // Initialize the React-like form
                new MerchantRegistrationForm(config);
            }
        });
    });

})(jQuery);