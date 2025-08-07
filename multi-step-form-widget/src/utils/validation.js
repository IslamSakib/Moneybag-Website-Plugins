// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number validation regex (Bangladesh format)
const phoneRegex = /^(\+?88)?0?1[3-9]\d{8}$/;

// Password strength regex
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// URL validation regex
const urlRegex =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export const validators = {
  email: (value) => {
    if (!value) return "Email is required";
    if (!emailRegex.test(value)) return "Invalid email address";
    return null;
  },

  otp: (value) => {
    if (!value) return "OTP is required";
    if (value.length !== 6) return "OTP must be 6 digits";
    if (!/^\d+$/.test(value)) return "OTP must contain only numbers";
    return null;
  },

  firstName: (value) => {
    if (!value) return "First name is required";
    if (value.length < 2) return "First name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(value))
      return "First name must contain only letters";
    return null;
  },

  lastName: (value) => {
    if (!value) return "Last name is required";
    if (value.length < 2) return "Last name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(value))
      return "Last name must contain only letters";
    return null;
  },

  mobileNumber: (value) => {
    if (!value) return "Mobile number is required";
    if (!phoneRegex.test(value)) return "Invalid Bangladesh mobile number";
    return null;
  },

  businessName: (value) => {
    if (!value) return "Business name is required";
    if (value.length < 3) return "Business name must be at least 3 characters";
    return null;
  },

  websiteAddress: (value) => {
    // Optional field - no validation if empty
    if (!value) return null;
    // Only validate if a value is provided
    if (value && !urlRegex.test(value)) return "Invalid website URL";
    return null;
  },

  password: (value) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!passwordRegex.test(value)) {
      return "Password must contain uppercase, lowercase, number and special character";
    }
    return null;
  },

  confirmPassword: (value, password) => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return null;
  },

  legalIdentityType: (value) => {
    if (!value) return "Legal identity type is required";
    return null;
  },
};

export const validateForm = (formData, step) => {
  const errors = {};

  switch (step) {
    case 1:
      const emailError = validators.email(formData.email);
      if (emailError) errors.email = emailError;
      break;

    case 2:
      const otpError = validators.otp(formData.otp);
      if (otpError) errors.otp = otpError;
      break;

    case 3:
      const firstNameError = validators.firstName(formData.firstName);
      if (firstNameError) errors.firstName = firstNameError;

      const lastNameError = validators.lastName(formData.lastName);
      if (lastNameError) errors.lastName = lastNameError;

      const mobileError = validators.mobileNumber(formData.mobileNumber);
      if (mobileError) errors.mobileNumber = mobileError;

      const legalIdError = validators.legalIdentityType(
        formData.legalIdentityType
      );
      if (legalIdError) errors.legalIdentityType = legalIdError;

      const businessNameError = validators.businessName(formData.businessName);
      if (businessNameError) errors.businessName = businessNameError;

      const websiteError = validators.websiteAddress(formData.websiteAddress);
      if (websiteError) errors.websiteAddress = websiteError;

      const passwordError = validators.password(formData.password);
      if (passwordError) errors.password = passwordError;

      const confirmPasswordError = validators.confirmPassword(
        formData.confirmPassword,
        formData.password
      );
      if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
      break;
  }

  return errors;
};
