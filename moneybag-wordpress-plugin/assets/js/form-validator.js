/**
 * Moneybag Global Form Validation
 * 
 * Centralized validation for all Moneybag forms
 * All forms can access this for consistent validation
 */

(function(window) {
    'use strict';

    // Validation rules configuration
    const validationRules = {
        name: {
            required: true,
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-zA-Z\s\.\'\-]+$/,
<<<<<<< Updated upstream
=======
            customValidator: function(value) {
                if (!value) return '';
                
                // Check for too many repeating characters (like "aaaaaaa")
                const repeatingPattern = /(.)\1{4,}/; // 5 or more of the same character in a row
                if (repeatingPattern.test(value)) {
                    return 'Name contains too many repeating characters';
                }
                
                // Check if the entire string is just repetitions of a short pattern
                if (value.length >= 6) {
                    // Check for 2-character patterns repeated
                    const twoCharPattern = /^(.{1,2})\1{3,}$/;
                    if (twoCharPattern.test(value.replace(/\s/g, ''))) {
                        return 'Name contains too many repeating patterns';
                    }
                }
                
                return '';
            },
>>>>>>> Stashed changes
            messages: {
                required: 'Name is required',
                minLength: 'Name must be at least 2 characters',
                maxLength: 'Name is too long',
                pattern: 'Name can only contain letters and spaces'
            }
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
<<<<<<< Updated upstream
            maxLength: 320,
            messages: {
                required: 'Email is required',
                pattern: 'Please enter a valid email address',
                maxLength: 'Email address is too long'
=======
            maxLength: 30,  // Database constraint is varchar(30)
            customValidator: function(value) {
                if (!value) return '';
                
                // Check for too many repeating characters in local part
                const localPart = value.split('@')[0];
                if (localPart) {
                    // Check for 5+ repeating characters
                    const repeatingPattern = /(.)\1{4,}/;
                    if (repeatingPattern.test(localPart)) {
                        return 'Email contains too many repeating characters';
                    }
                    
                    // Check for repeating patterns
                    if (localPart.length >= 6) {
                        const twoCharPattern = /^(.{1,2})\1{3,}$/;
                        if (twoCharPattern.test(localPart)) {
                            return 'Email contains too many repeating patterns';
                        }
                    }
                }
                
                // Additional length check for clarity
                if (value.length > 30) {
                    return 'Email must be 30 characters or less';
                }
                
                return '';
            },
            messages: {
                required: 'Email is required',
                pattern: 'Please enter a valid email address',
                maxLength: 'Email must be 30 characters or less'
>>>>>>> Stashed changes
            }
        },
        mobile: {
            required: true,
<<<<<<< Updated upstream
            pattern: /^(\+8801|01)[0-9]{9}$/,
=======
            pattern: /^(\+880|0)?1[3-9]\d{8}$/,
>>>>>>> Stashed changes
            messages: {
                required: 'Mobile number is required',
                pattern: 'Please enter a valid Bangladesh mobile number (e.g., +8801712345678 or 01712345678)'
            }
        },
        phone: {
            required: false,
<<<<<<< Updated upstream
            pattern: /^(\+8801|01)[0-9]{9}$/,
=======
            pattern: /^(\+880|0)?1[3-9]\d{8}$/,
>>>>>>> Stashed changes
            messages: {
                pattern: 'Please enter a valid Bangladesh phone number (e.g., +8801712345678 or 01712345678)'
            }
        },
        password: {
            required: true,
            minLength: 8,
            maxLength: 50,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
            messages: {
                required: 'Password is required',
                minLength: 'Password must be at least 8 characters',
                maxLength: 'Password is too long',
                pattern: 'Password must contain uppercase, lowercase, and numbers'
            }
        },
        website: {
            required: false,
            pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            messages: {
                pattern: 'Please enter a valid website URL'
            }
        },
        businessName: {
            required: true,
            minLength: 2,
            maxLength: 200,
<<<<<<< Updated upstream
=======
            customValidator: function(value) {
                if (!value) return '';
                
                // Check for too many repeating characters (like "aaaaaaa" or "1111111")
                // This matches what the API validates
                const repeatingPattern = /(.)\1{4,}/; // 5 or more of the same character in a row
                if (repeatingPattern.test(value)) {
                    return 'Business name contains too many repeating characters';
                }
                
                // Check if the entire string is just repetitions of a short pattern
                // For example: "abababab" or "123123123"
                if (value.length >= 6) {
                    // Check for 2-character patterns repeated
                    const twoCharPattern = /^(.{1,2})\1{3,}$/;
                    if (twoCharPattern.test(value.replace(/\s/g, ''))) {
                        return 'Business name contains too many repeating patterns';
                    }
                }
                
                return '';
            },
>>>>>>> Stashed changes
            messages: {
                required: 'Business name is required',
                minLength: 'Business name must be at least 2 characters',
                maxLength: 'Business name is too long'
            }
        },
        designation: {
            required: true,
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-zA-Z\s\.\'\-\/\(\)]+$/,
            messages: {
                required: 'Designation is required',
                minLength: 'Designation must be at least 2 characters',
                maxLength: 'Designation is too long',
                pattern: 'Designation can only contain letters, spaces, and common punctuation'
            }
        },
        maxAmount: {
            required: false,
            pattern: /^\d*\.?\d+$/,
            customValidator: function(value) {
                if (value && parseFloat(value) < 0) {
                    return 'Amount must be a positive number';
                }
                if (value && parseFloat(value) > 10000000) {
                    return 'Amount is too large';
                }
                return '';
            },
            messages: {
                pattern: 'Please enter a valid amount'
            }
        },
        url: {
            required: true,
            pattern: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            messages: {
                required: 'Domain name is required',
                pattern: 'Please enter a valid domain name (e.g., example.com or www.example.com)'
            }
        },
        domain: {
            required: true,
            pattern: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            messages: {
                required: 'Domain name is required',
                pattern: 'Please enter a valid domain name (e.g., example.com or www.example.com)'
            }
        },
        businessCategory: {
            required: true,
            messages: {
                required: 'Please select a business category'
            }
        },
        legalIdentity: {
            required: true,
            messages: {
                required: 'Please select a legal identity type'
            }
        },
        monthlyVolume: {
            required: true,
            messages: {
                required: 'Please select your monthly transaction volume'
            }
        },
        serviceTypes: {
            required: true,
            customValidator: function(value) {
                // value should be an array for serviceTypes
                if (!Array.isArray(value) || value.length === 0) {
                    return 'Please select at least one service type';
                }
                return '';
            },
            messages: {
                required: 'Please select at least one service type'
            }
        },
<<<<<<< Updated upstream
=======
        company: {
            required: true,
            minLength: 2,
            maxLength: 100,
            messages: {
                required: 'Company name is required',
                minLength: 'Company name must be at least 2 characters',
                maxLength: 'Company name is too long'
            }
        },
        message: {
            required: false,
            minLength: 10,
            maxLength: 1000,
            messages: {
                minLength: 'Message must be at least 10 characters if provided',
                maxLength: 'Message is too long (max 1000 characters)'
            }
        },
        otherSubject: {
            required: false,
            minLength: 2,
            maxLength: 100,
            messages: {
                required: 'Please specify the subject',
                minLength: 'Subject must be at least 2 characters',
                maxLength: 'Subject is too long'
            }
        },
>>>>>>> Stashed changes
        identifier: {
            required: true,
            customValidator: function(value) {
                if (!value || !value.trim()) {
                    return 'Email or phone number is required';
                }
                
                const trimmedValue = value.trim();
                
                // Check if it's a valid email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isValidEmail = emailRegex.test(trimmedValue);
                
                // Check if it's a valid Bangladesh phone number
<<<<<<< Updated upstream
                const phoneRegex = /^(\+8801|01)[0-9]{9}$/;
=======
                const phoneRegex = /^(\+880|0)?1[3-9]\d{8}$/;
>>>>>>> Stashed changes
                const isValidPhone = phoneRegex.test(trimmedValue.replace(/[\s\-]/g, ''));
                
                if (!isValidEmail && !isValidPhone) {
                    return 'Please enter a valid email address or phone number (e.g., user@example.com, +8801712345678, or 01712345678)';
                }
                
                return ''; // Valid
            },
            messages: {
                required: 'Email or phone number is required'
            }
        }
    };

    /**
     * Main validation function
     * @param {string} fieldName - Name of the field to validate
     * @param {string} value - Value to validate
     * @param {object} customRules - Optional custom rules to override defaults
     * @returns {string} - Error message or empty string if valid
     */
    function validateField(fieldName, value, customRules = null) {
        // Get rules for this field
        const rules = customRules || validationRules[fieldName];
        
        // If no rules defined for this field, consider it valid
        if (!rules) {
            return '';
        }

        // Handle arrays differently - don't convert to string
        let processedValue = value;
        if (!Array.isArray(value)) {
            // Trim the value only if it's not an array
            processedValue = value ? value.toString().trim() : '';
        }

        // Check required
        if (rules.required) {
            // Special handling for arrays
            if (Array.isArray(processedValue)) {
                if (processedValue.length === 0) {
                    return rules.messages.required || `${fieldName} is required`;
                }
            } else if (!processedValue) {
                return rules.messages.required || `${fieldName} is required`;
            }
        }

        // If not required and empty, it's valid
        if (!rules.required) {
            if (Array.isArray(processedValue)) {
                if (processedValue.length === 0) {
                    return '';
                }
            } else if (!processedValue) {
                return '';
            }
        }

        // Check custom validator function first (for arrays and special cases)
        if (rules.customValidator && typeof rules.customValidator === 'function') {
            const customError = rules.customValidator(processedValue);
            if (customError) {
                return customError;
            }
        }

        // Only apply string-based validations to non-array values
        if (!Array.isArray(processedValue)) {
            // Check min length
            if (rules.minLength && processedValue.length < rules.minLength) {
                return rules.messages.minLength || `${fieldName} must be at least ${rules.minLength} characters`;
            }

            // Check max length
            if (rules.maxLength && processedValue.length > rules.maxLength) {
                return rules.messages.maxLength || `${fieldName} is too long`;
            }

            // Check pattern
            if (rules.pattern && !rules.pattern.test(processedValue)) {
                return rules.messages.pattern || `${fieldName} format is invalid`;
            }
        }

        return ''; // Valid
    }

    /**
     * Validate multiple fields at once
     * @param {object} data - Object with field names as keys and values as values
     * @param {array} fieldsToValidate - Optional array of field names to validate
     * @returns {object} - Object with field names as keys and error messages as values
     */
    function validateFields(data, fieldsToValidate = null) {
        const errors = {};
        const fields = fieldsToValidate || Object.keys(data);

        fields.forEach(fieldName => {
            const error = validateField(fieldName, data[fieldName]);
            if (error) {
                errors[fieldName] = error;
            }
        });

        return errors;
    }

    /**
     * Check if all required fields are filled
     * @param {object} data - Form data
     * @param {array} requiredFields - Array of required field names
     * @returns {object} - Object with missing fields and their error messages
     */
    function checkRequiredFields(data, requiredFields) {
        const errors = {};

        requiredFields.forEach(fieldName => {
            const value = data[fieldName];
            if (!value || !value.toString().trim()) {
                const rules = validationRules[fieldName];
                errors[fieldName] = rules?.messages?.required || `${fieldName} is required`;
            }
        });

        return errors;
    }

    /**
     * Format phone number for Bangladesh
     * @param {string} phone - Phone number to format
     * @returns {string} - Formatted phone number
     */
    function formatBangladeshPhone(phone) {
        if (!phone) return phone;

        // Remove all non-digits
        let digits = phone.replace(/\D/g, '');

        // Add Bangladesh country code if not present
        if (digits.startsWith('1') && digits.length === 10) {
            digits = '880' + digits;
        } else if (digits.startsWith('0') && digits.length === 11) {
            digits = '88' + digits;
        }

        // Format: +880 1XXX-XXXXXX
        if (digits.startsWith('880') && digits.length === 13) {
            return `+${digits.slice(0, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
        }

        return phone; // Return original if can't format
    }

    /**
     * Filter input to allow only specific characters
     * @param {string} value - Input value
     * @param {string} type - Type of filtering (numeric, alpha, alphanumeric, etc.)
     * @returns {string} - Filtered value
     */
    function filterInput(value, type) {
        switch (type) {
            case 'numeric':
                return value.replace(/[^\d]/g, '');
            case 'phone':
                return value.replace(/[^\d\+\-\s]/g, '');
            case 'alpha':
                return value.replace(/[^a-zA-Z\s]/g, '');
            case 'alphanumeric':
                return value.replace(/[^a-zA-Z0-9\s]/g, '');
            case 'name':
                return value.replace(/[^a-zA-Z\s\.\'\-]/g, '');
            case 'businessName':
                return value.replace(/[^a-zA-Z0-9\s\.\'\-\(\)&,]/g, '');
            case 'designation':
                return value.replace(/[^a-zA-Z\s\.\'\-\/\(\)]/g, '');
            case 'amount':
                return value.replace(/[^\d\.]/g, '');
            default:
                return value;
        }
    }

    /**
     * Add validation rules for a new field type
     * @param {string} fieldName - Name of the field type
     * @param {object} rules - Validation rules for this field
     */
    function addValidationRule(fieldName, rules) {
        validationRules[fieldName] = rules;
    }

    /**
     * Get validation rules for a field
     * @param {string} fieldName - Name of the field
     * @returns {object} - Validation rules
     */
    function getValidationRules(fieldName) {
        return validationRules[fieldName] || null;
    }

    /**
     * Check if a field has errors
     * @param {string} fieldName - Name of the field
     * @param {string} value - Value to check
     * @returns {boolean} - True if field has errors
     */
    function hasError(fieldName, value) {
        return validateField(fieldName, value) !== '';
    }

    /**
     * Validate merchant registration step completion
     * @param {number} stepNumber - Step number to validate
     * @param {object} formData - Form data object
     * @returns {boolean} - True if step is complete and valid
     */
    function validateMerchantStep(stepNumber, formData) {
        switch(stepNumber) {
            case 1:
                return formData.businessCategory && 
                       formData.legalIdentity && 
                       formData.monthlyVolume &&
                       Array.isArray(formData.serviceTypes) && formData.serviceTypes.length > 0 &&
                       !validateField('businessCategory', formData.businessCategory) &&
                       !validateField('legalIdentity', formData.legalIdentity) &&
                       !validateField('monthlyVolume', formData.monthlyVolume) &&
                       !validateField('serviceTypes', formData.serviceTypes);
            
            case 2:
                // For no-auth API: businessName is required, domainName is optional
                return formData.businessName && formData.businessName.trim() &&
                       !validateField('businessName', formData.businessName);
            
            case 3:
                // For no-auth API: firstName, lastName, email, mobile are required
                return formData.firstName && formData.firstName.trim() &&
                       formData.lastName && formData.lastName.trim() &&
                       formData.email && formData.email.trim() &&
                       formData.mobile && formData.mobile.trim() &&
                       !validateField('name', formData.firstName) &&
                       !validateField('name', formData.lastName) &&
                       !validateField('email', formData.email) &&
                       !validateField('mobile', formData.mobile);
            
            default:
                return false;
        }
    }

    /**
     * Validate all fields in a merchant registration step
     * @param {number} stepNumber - Step number to validate
     * @param {object} formData - Form data object
     * @returns {object} - Object with field validation errors
     */
    function validateMerchantStepFields(stepNumber, formData) {
        const errors = {};
        
        switch(stepNumber) {
            case 1:
                const businessCategoryError = validateField('businessCategory', formData.businessCategory);
                const legalIdentityError = validateField('legalIdentity', formData.legalIdentity);
                const monthlyVolumeError = validateField('monthlyVolume', formData.monthlyVolume);
                const serviceTypesError = validateField('serviceTypes', formData.serviceTypes);
                
                if (businessCategoryError) errors.businessCategory = businessCategoryError;
                if (legalIdentityError) errors.legalIdentity = legalIdentityError;
                if (monthlyVolumeError) errors.monthlyVolume = monthlyVolumeError;
                if (serviceTypesError) errors.serviceTypes = serviceTypesError;
                break;
                
            case 2:
                // For no-auth API: businessName is required, domainName is optional
                const businessNameError = validateField('businessName', formData.businessName);
                const domainError = formData.domainName ? validateField('domain', formData.domainName) : null;
                
                if (businessNameError) errors.businessName = businessNameError;
                if (domainError) errors.domainName = domainError;
                break;
                
            case 3:
                // For no-auth API: firstName, lastName, email, mobile are required
                const firstNameError = validateField('name', formData.firstName);
                const lastNameError = validateField('name', formData.lastName);
                const emailError = validateField('email', formData.email);
                const mobileError = validateField('mobile', formData.mobile);
                
                if (firstNameError) errors.firstName = firstNameError;
                if (lastNameError) errors.lastName = lastNameError;
                if (emailError) errors.email = emailError;
                if (mobileError) errors.mobile = mobileError;
                break;
        }
        
        return errors;
    }

    // Expose the validation API globally
    window.MoneybagValidation = {
        validateField,
        validateFields,
        checkRequiredFields,
        formatBangladeshPhone,
        filterInput,
        addValidationRule,
        getValidationRules,
        hasError,
        validateMerchantStep,
        validateMerchantStepFields,
        
        // Export validation rules for reference
        rules: validationRules
    };

    // Moneybag Validation loaded successfully

})(window);

/**
 * MoneybagValidator class for backward compatibility
 * This provides the same interface that other forms are using
 */
class MoneybagValidator {
    constructor() {
        this.validation = window.MoneybagValidation;
    }
    
    validateRequired(value) {
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return value && value.toString().trim().length > 0;
    }
    
    validateEmail(email) {
        const error = this.validation.validateField('email', email);
        return !error;
    }
    
    validatePhone(phone) {
        const error = this.validation.validateField('mobile', phone);
        return !error;
    }
    
    validateField(fieldName, value) {
        return this.validation.validateField(fieldName, value);
    }
    
    validateFields(data, fieldsToValidate) {
        return this.validation.validateFields(data, fieldsToValidate);
    }
}

// Make it globally available
window.MoneybagValidator = MoneybagValidator;