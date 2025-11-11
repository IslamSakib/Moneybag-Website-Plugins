(function () {
  "use strict";

  const { useState, useEffect, createElement } = wp.element;

  const SandboxSignupForm = ({ config }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerActive, setTimerActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [resendingOTP, setResendingOTP] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [sessionId, setSessionId] = useState("");

    const [formData, setFormData] = useState({
      identifier: "", // Can be email or phone
      otp: "",
      firstName: "",
      lastName: "",
      email: "", // Email address (required when phone was used for verification)
      mobile: "",
      legalIdType: "",
      businessName: "",
      website: "",
      humanVerified: false,
    });

    const [recaptchaResponse, setRecaptchaResponse] = useState("");
    const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

    useEffect(() => {
      let interval = null;
      if (timerActive && timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft((prevTime) => prevTime - 1);
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
      if (
        window.grecaptcha ||
        document.querySelector('script[src*="recaptcha"]')
      ) {
        setRecaptchaLoaded(true);
        return;
      }

      const script = document.createElement("script");
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
            window.grecaptcha
              .execute(config.recaptcha_site_key, { action: "submit" })
              .then((token) => {
                setRecaptchaResponse(token);
                resolve(token);
              })
              .catch((error) => {
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
      return `0${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const renderCountdown = (timeString) => {
      const digits = timeString.split("");
      return digits.map((digit, index) => {
        if (digit === ":") {
          return createElement(
            "span",
            {
              key: index,
              className: "countdown-colon",
            },
            ":"
          );
        }
        return createElement(
          "div",
          {
            key: index,
            className: "countdown-digit",
          },
          digit
        );
      });
    };

    // No client-side validation - API handles everything
    // Use centralized validation
    const validateField = (fieldName, value) => {
      if (!window.MoneybagValidation) {
        return "";
      }
      return window.MoneybagValidation.validateField(fieldName, value);
    };

    // Validate and set field error
    const validateAndSetFieldError = (
      fieldName,
      value,
      formFieldName = null
    ) => {
      if (!window.MoneybagValidation) {
        return "";
      }

      const error = window.MoneybagValidation.validateField(fieldName, value);
      const errorKey = formFieldName || fieldName;

      setErrors((prev) => ({
        ...prev,
        [errorKey]: error || "",
      }));

      return error;
    };

    // This is just for UX to show field is required
    const isFieldEmpty = (name, value) => {
      const requiredFields = [
        "identifier",
        "otp",
        "firstName",
        "lastName",
        "mobile",
        "businessName",
        "legalIdType",
      ];
      return requiredFields.includes(name) && !value;
    };

    // Helper function to detect if identifier is email or phone
    const isEmail = (identifier) => {
      return identifier.includes("@") && identifier.includes(".");
    };

    const isPhone = (identifier) => {
      const phoneRegex = /^01[3-9]\d{8}$/;
      return phoneRegex.test(identifier.replace(/\s/g, ""));
    };

    const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      let processedValue = type === "checkbox" ? checked : value;

      // Use centralized input filtering
      if (window.MoneybagValidation && type !== "checkbox") {
        const fieldMap = {
          identifier: "text", // Can be email or phone, don't filter
          firstName: "name",
          lastName: "name",
          mobile: "phone",
          email: "text",
          businessName: "businessName",
          website: "text",
          otp: "numeric", // Only allow numbers for OTP
        };

        const filterType = fieldMap[name];
        if (filterType) {
          processedValue = window.MoneybagValidation.filterInput(
            value,
            filterType
          );
        }
      }

      // For OTP, limit to 6 digits
      if (name === "otp" && processedValue.length > 6) {
        processedValue = processedValue.slice(0, 6);
      }

      setFormData((prev) => ({
        ...prev,
        [name]: processedValue,
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    };

    // Secure API call through WordPress backend
    const apiCall = async (action, data) => {
      const formData = new FormData();
      formData.append("action", "moneybag_sandbox_api");
      formData.append("nonce", moneybagAjax.nonce);
      formData.append("api_action", action);
      formData.append("data", JSON.stringify(data));

      try {
        const response = await fetch(moneybagAjax.ajaxurl, {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });

        const responseData = await response.json();

        // API call response received

        if (!responseData.success) {
          // API call failed
          throw new Error(
            responseData.data ||
              'Something went wrong! Hotline <a href="tel:+8801958109228" style="color: #ff4444; text-decoration: underline;">+880 1958 109 228</a>'
          );
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
        const validationError = window.MoneybagValidation.validateField(
          "identifier",
          formData.identifier
        );
        if (validationError) {
          setErrors((prev) => ({ ...prev, identifier: validationError }));
          return;
        }
      }

      setLoading(true);
      try {
        const response = await apiCall("email_verification", {
          identifier: formData.identifier,
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
          throw new Error(
            'Something went wrong! Hotline <a href="tel:+8801958109228" style="color: #ff4444; text-decoration: underline;">+880 1958 109 228</a>'
          );
        }
      } catch (error) {
        // Identifier verification error
        let errorMessage = error.message;

        // Check if it's an "already exists" error for sandbox
        if (
          errorMessage &&
          (errorMessage.toLowerCase().includes("already registered") ||
            errorMessage.toLowerCase().includes("already exists") ||
            errorMessage.toLowerCase().includes("already associated"))
        ) {
          // Add login link for sandbox
          errorMessage =
            errorMessage.replace(/\.?$/, "") +
            ' or <a href="https://sandbox.moneybag.com.bd/" target="_blank" style="color: #ff4444; text-decoration: underline;">Login</a> instead.';
        }

        setErrors((prev) => ({ ...prev, identifier: errorMessage }));
      } finally {
        setLoading(false);
      }
    };

    const verifyOTP = async () => {
      // Clear previous errors
      setErrors((prev) => ({ ...prev, otp: "" }));

      // Basic validation - check if OTP is provided
      if (!formData.otp || !formData.otp.trim()) {
        setErrors((prev) => ({
          ...prev,
          otp: "Please enter the verification code",
        }));
        return;
      }

      // Validate OTP format (6 digits)
      if (formData.otp.length !== 6) {
        setErrors((prev) => ({
          ...prev,
          otp: "Verification code must be 6 digits",
        }));
        return;
      }

      // Validate OTP contains only numbers
      if (!/^\d{6}$/.test(formData.otp)) {
        setErrors((prev) => ({
          ...prev,
          otp: "Verification code must contain only numbers",
        }));
        return;
      }

      setVerifyingOTP(true);
      try {
        const response = await apiCall("verify_otp", {
          otp: formData.otp,
          session_id: sessionId,
        });

        // OTP verification response received

        // If we get a response without error, consider it successful
        if (response) {
          // Check for explicit verification status if available
          if (response.verified === false) {
            throw new Error("Invalid verification code. Please try again.");
          }
          goToStep(3);
        }
      } catch (error) {
        // OTP verification error
        setErrors((prev) => ({ ...prev, otp: error.message }));
      } finally {
        setVerifyingOTP(false);
      }
    };

    const submitBusinessDetails = async () => {
      // Basic validation for required fields
      const newErrors = {};

      if (!formData.firstName) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName) {
        newErrors.lastName = "Last name is required";
      }
      if (!formData.businessName) {
        newErrors.businessName = "Business name is required";
      }
      if (!formData.legalIdType) {
        newErrors.legalIdType = "Please select a legal identity type";
      }

      // Check mobile or email based on verification method
      if (isEmail(formData.identifier)) {
        if (!formData.mobile) {
          newErrors.mobile = "Mobile number is required";
        } else if (window.MoneybagValidation) {
          const mobileError = window.MoneybagValidation.validateField(
            "mobile",
            formData.mobile
          );
          if (mobileError) {
            newErrors.mobile = mobileError;
          }
        }
      } else {
        if (!formData.email) {
          newErrors.email = "Email address is required";
        } else if (window.MoneybagValidation) {
          const emailError = window.MoneybagValidation.validateField(
            "email",
            formData.email
          );
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
        // Execute reCAPTCHA v3
        const recaptchaToken = await executeRecaptcha();

        const requestData = {
          business_name: formData.businessName,
          business_website: formData.website || "",
          first_name: formData.firstName,
          last_name: formData.lastName,
          legal_identity: formData.legalIdType,
          session_id: sessionId,
          recaptcha_token: recaptchaToken,
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

        const response = await apiCall("business_details", requestData);

        // Handle response - if we get here without error, it was successful
        if (response) {
          goToStep(4);
        }
      } catch (error) {
        // Parse error message to see if it's a field-specific validation error
        const errorMsg = error.message.toLowerCase();

        if (errorMsg.includes("url") || errorMsg.includes("website")) {
          setErrors((prev) => ({
            ...prev,
            website: "Please enter a valid website URL (e.g., example.com)",
          }));
        } else if (
          errorMsg.includes("business") ||
          errorMsg.includes("business_name")
        ) {
          setErrors((prev) => ({ ...prev, businessName: error.message }));
        } else if (
          errorMsg.includes("first") ||
          errorMsg.includes("first_name")
        ) {
          setErrors((prev) => ({ ...prev, firstName: error.message }));
        } else if (
          errorMsg.includes("last") ||
          errorMsg.includes("last_name")
        ) {
          setErrors((prev) => ({ ...prev, lastName: error.message }));
        } else if (errorMsg.includes("email")) {
          let emailErrorMessage = error.message;

          // Check if it's an "already exists" error for email
          if (
            emailErrorMessage &&
            (emailErrorMessage.toLowerCase().includes("already registered") ||
              emailErrorMessage.toLowerCase().includes("already exists") ||
              emailErrorMessage.toLowerCase().includes("already associated"))
          ) {
            // Use the login_url from config
            const loginUrl = config.login_url || "/wp-login.php"; // Use config or a fallback
            emailErrorMessage =
              emailErrorMessage.replace(/\.?$/, "") +
              ` or <a href="${loginUrl}">Login</a>`;
          }

          setErrors((prev) => ({ ...prev, email: emailErrorMessage }));
        } else if (errorMsg.includes("phone") || errorMsg.includes("mobile")) {
          let mobileErrorMessage = error.message;

          // Check if it's an "already exists" error for mobile
          if (
            mobileErrorMessage &&
            (mobileErrorMessage.toLowerCase().includes("already registered") ||
              mobileErrorMessage.toLowerCase().includes("already exists") ||
              mobileErrorMessage.toLowerCase().includes("already associated"))
          ) {
            // Add login link for mobile
            mobileErrorMessage =
              mobileErrorMessage.replace(/\.?$/, "") +
              ' or <a href="https://sandbox.moneybag.com.bd/" target="_blank" style="color: #ff4444; text-decoration: underline;">Login</a> instead.';
          }

          setErrors((prev) => ({ ...prev, mobile: mobileErrorMessage }));
        } else if (
          errorMsg.includes("legal") ||
          errorMsg.includes("identity")
        ) {
          setErrors((prev) => ({ ...prev, legalIdType: error.message }));
        } else {
          // Generic error - could show in a toast or alert instead of submit error
          console.error("Submission error:", error.message);
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
      // Validate if timer has expired
      if (timeLeft > 0) {
        setErrors((prev) => ({
          ...prev,
          otp: `Please wait ${formatTime(
            timeLeft
          )} before requesting a new code`,
        }));
        return;
      }

      // Clear any previous errors
      setErrors((prev) => ({ ...prev, otp: "" }));

      setResendingOTP(true);
      try {
        const response = await apiCall("email_verification", {
          identifier: formData.identifier,
        });

        // Update sessionId with new session from resend response
        if (response && response.data && response.data.session_id) {
          setSessionId(response.data.session_id);
        } else if (response && response.session_id) {
          // Fallback for direct session_id
          setSessionId(response.session_id);
        }

        // Show success message temporarily
        setErrors((prev) => ({
          ...prev,
          otp: `✓ Verification code sent successfully to ${formData.identifier}`,
        }));

        // Clear success message after 3 seconds
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, otp: "" }));
        }, 3000);

        setTimeLeft(60);
        setTimerActive(true);
      } catch (error) {
        setErrors((prev) => ({ ...prev, otp: error.message }));
      } finally {
        setResendingOTP(false);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !loading) {
        e.preventDefault();
        if (currentStep === 1) sendIdentifierVerification();
        else if (currentStep === 2) verifyOTP();
        else if (currentStep === 3) submitBusinessDetails();
      }
    };

    const renderInput = (
      name,
      type = "text",
      placeholder = "",
      options = {}
    ) => {
      const label =
        name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1");
      let helperText = null;

      if (name === "mobile") {
        helperText = "Format: 01712345678";
      } else if (name === "identifier") {
        helperText = "Enter your email address or phone number";
      }

      // Map field names to validation field types
      const validationFieldMap = {
        identifier: "identifier",
        firstName: "name",
        lastName: "name",
        mobile: "mobile",
        email: "email",
        businessName: "businessName",
        website: "website",
      };

      const validationField = validationFieldMap[name] || name;

      // Determine if field is required
      const isRequired = options.required !== false && name !== "website";

      return createElement(
        "div",
        { className: "field-group" },
        createElement(
          "label",
          { className: "field-label" },
          name === "identifier" ? "Email or Phone" : label,
          isRequired &&
            createElement("span", { className: "required-indicator" }, " *")
        ),
        createElement("input", {
          type,
          className: `input-field ${errors[name] ? "error" : ""} ${
            formData[name] ? "valid" : ""
          }`,
          name,
          value: formData[name],
          onChange: handleInputChange,
          onBlur: (e) =>
            validateAndSetFieldError(validationField, e.target.value, name),
          placeholder:
            options.placeholder ||
            placeholder ||
            (name === "mobile"
              ? "01712345678"
              : name === "identifier"
              ? "user@example.com or 01712345678"
              : ""),
          maxLength:
            options.maxLength ||
            (name === "email"
              ? 30
              : name === "mobile"
              ? 14
              : name === "identifier"
              ? 50
              : null),
          onKeyPress: handleKeyPress,
          required: options.required || false,
        }),
        helperText &&
          !errors[name] &&
          createElement(
            "span",
            {
              className: "field-helper-text",
            },
            helperText
          ),
        errors[name] &&
          createElement(
            "span",
            {
              className: "error-message",
              dangerouslySetInnerHTML:
                typeof errors[name] === "string" && errors[name].includes("<a")
                  ? { __html: errors[name] }
                  : undefined,
            },
            typeof errors[name] === "string" && errors[name].includes("<a")
              ? null
              : errors[name]
          )
      );
    };

    return createElement(
      "div",
      {
        className:
          "moneybag-form-container moneybag-form sandbox-step-" + currentStep,
        onKeyPress: handleKeyPress,
      },
      // Step 1: Email Input - New Design (2-column layout)
      currentStep === 1 &&
        createElement(
          "div",
          { className: "sandbox-step1-layout" },
          createElement(
            "div",
            { className: "sandbox-step1-left" },
            createElement(
              "div",
              { className: "sandbox-step1-content" },
              createElement(
                "div",
                { className: "sandbox-step1-heading" },
                "Enter your email or phone number to receive secure ",
                createElement(
                  "span",
                  { className: "sandbox-heading-highlight" },
                  "Sandbox Credentials"
                ),
                " & start testing right away."
              ),
              createElement(
                "div",
                { className: "sandbox-step1-icon-info" },
                createElement(
                  "div",
                  { className: "sandbox-phone-icon" },
                  createElement("img", {
                    src:
                      config.plugin_url +
                      "assets/image/fluent-color_phone-20.svg",
                    alt: "Email or Phone verification",
                    className: "sandbox-icon-img",
                  })
                ),
                createElement(
                  "p",
                  { className: "sandbox-info-text" },
                  "Secure email verification ensures your sandbox credentials are delivered safely to the right person."
                )
              ),
              createElement(
                "div",
                { className: "sandbox-step1-form" },
                createElement(
                  "label",
                  { className: "sandbox-input-label" },
                  "Email or Phone no."
                ),
                createElement("input", {
                  type: "text",
                  className: `sandbox-input-field ${
                    errors.identifier ? "error" : ""
                  } ${formData.identifier ? "valid" : ""}`,
                  name: "identifier",
                  value: formData.identifier,
                  onChange: handleInputChange,
                  onBlur: (e) =>
                    validateAndSetFieldError(
                      "identifier",
                      e.target.value,
                      "identifier"
                    ),
                  onKeyPress: handleKeyPress,
                  placeholder: "",
                  disabled: loading,
                }),
                errors.identifier &&
                  createElement(
                    "span",
                    {
                      className: "error-message",
                      dangerouslySetInnerHTML:
                        typeof errors.identifier === "string" &&
                        errors.identifier.includes("<a")
                          ? { __html: errors.identifier }
                          : undefined,
                    },
                    typeof errors.identifier === "string" &&
                      errors.identifier.includes("<a")
                      ? null
                      : errors.identifier
                  ),
                createElement(
                  "div",
                  { className: "sandbox-step1-actions" },
                  createElement(
                    "button",
                    {
                      className: "sandbox-send-btn",
                      onClick: sendIdentifierVerification,
                      disabled: loading || !!errors.identifier,
                    },
                    loading
                      ? createElement(
                          "span",
                          { className: "btn-content" },
                          createElement("span", {
                            className: "spinner",
                            dangerouslySetInnerHTML: {
                              __html:
                                '<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.3)" stroke-width="4" fill="none"/><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="80 50" stroke-linecap="round"/></svg>',
                            },
                          }),
                          "Sending..."
                        )
                      : "Send Verification Code"
                  ),
                  createElement(
                    "span",
                    { className: "sandbox-or-text" },
                    "Or, "
                  ),
                  createElement(
                    "a",
                    {
                      href: "https://sandbox.moneybag.com.bd/",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "sandbox-login-link",
                    },
                    "Login"
                  )
                )
              )
            )
          ),
          createElement(
            "div",
            { className: "sandbox-step1-right" },
            createElement(
              "div",
              { className: "sandbox-demo-header" },
              createElement(
                "span",
                { className: "sandbox-demo-title" },
                "Try the demo"
              ),
              " risk-free no registration required."
            ),
            createElement(
              "a",
              {
                href: "https://demo.sandbox.moneybag.com.bd/",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "sandbox-demo-btn",
              },
              "Try Our Free Demo",
              createElement("img", {
                src: config.plugin_url + "assets/image/mouse-pointer.svg",
                alt: "Click",
                className: "sandbox-demo-icon",
              })
            ),
            createElement(
              "ul",
              { className: "sandbox-demo-benefits" },
              createElement("li", null, "No account needed"),
              createElement("li", null, "See a complete payment flow"),
              createElement(
                "li",
                null,
                "Perfect for a quick look before integrating"
              )
            )
          )
        ),

      // Step 2: OTP Input - New Design (2-column layout like Step 1)
      currentStep === 2 &&
        createElement(
          "div",
          { className: "sandbox-step2-layout" },
          createElement(
            "div",
            { className: "sandbox-step2-left" },
            createElement(
              "div",
              { className: "sandbox-step2-content" },
              createElement(
                "div",
                { className: "sandbox-step2-icon-info" },
                createElement(
                  "div",
                  { className: "sandbox-lock-icon" },
                  createElement("img", {
                    src:
                      config.plugin_url +
                      "assets/image/flat-color-icons_lock.svg",
                    alt: "Security lock",
                    className: "sandbox-icon-img",
                  })
                ),
                createElement(
                  "p",
                  { className: "sandbox-info-text" },
                  `Enter the 6-digit verification code sent to your ${
                    isEmail(formData.identifier) ? "email" : "number"
                  }. Code expires in 1 minute for security.`
                )
              ),
              createElement(
                "div",
                { className: "sandbox-step2-form" },
                createElement(
                  "div",
                  { className: "sandbox-otp-header" },
                  createElement(
                    "label",
                    { className: "sandbox-input-label" },
                    "OTP"
                  ),
                  createElement(
                    "div",
                    { className: "sandbox-countdown" },
                    formatTime(timeLeft)
                  )
                ),
                createElement("input", {
                  type: "text",
                  className: `sandbox-input-field ${
                    errors.otp ? "error" : ""
                  } ${formData.otp ? "valid" : ""}`,
                  name: "otp",
                  value: formData.otp,
                  onChange: handleInputChange,
                  onKeyPress: handleKeyPress,
                  placeholder: "",
                  maxLength: 6,
                  disabled: verifyingOTP || resendingOTP,
                }),
                errors.otp &&
                  createElement(
                    "span",
                    {
                      className: errors.otp.startsWith("✓")
                        ? "error-message success-message"
                        : "error-message",
                      dangerouslySetInnerHTML:
                        typeof errors.otp === "string" &&
                        errors.otp.includes("<a")
                          ? { __html: errors.otp }
                          : undefined,
                    },
                    typeof errors.otp === "string" && errors.otp.includes("<a")
                      ? null
                      : errors.otp
                  ),
                createElement(
                  "div",
                  { className: "sandbox-step2-actions" },
                  createElement(
                    "button",
                    {
                      className: "sandbox-verify-btn",
                      onClick: verifyOTP,
                      disabled: verifyingOTP || resendingOTP,
                    },
                    verifyingOTP
                      ? createElement(
                          "span",
                          { className: "btn-content" },
                          createElement("span", {
                            className: "spinner",
                            dangerouslySetInnerHTML: {
                              __html:
                                '<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.3)" stroke-width="4" fill="none"/><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="80 50" stroke-linecap="round"/></svg>',
                            },
                          }),
                          "Verifying..."
                        )
                      : "Verify"
                  ),
                  createElement(
                    "button",
                    {
                      className: "sandbox-resend-btn",
                      onClick: resendOTP,
                      disabled: resendingOTP || verifyingOTP,
                    },
                    resendingOTP ? "Resending..." : "Resend"
                  )
                )
              )
            )
          ),
          createElement(
            "div",
            { className: "sandbox-step2-right" },
            createElement(
              "div",
              { className: "sandbox-demo-header" },
              createElement(
                "span",
                { className: "sandbox-demo-title" },
                "Try the demo"
              ),
              " risk-free no registration required."
            ),
            createElement(
              "a",
              {
                href: "https://demo.sandbox.moneybag.com.bd/",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "sandbox-demo-btn",
              },
              "Try Our Free Demo",
              createElement("img", {
                src: config.plugin_url + "assets/image/mouse-pointer.svg",
                alt: "Click",
                className: "sandbox-demo-icon",
              })
            ),
            createElement(
              "ul",
              { className: "sandbox-demo-benefits" },
              createElement("li", null, "No account needed"),
              createElement("li", null, "See a complete payment flow"),
              createElement(
                "li",
                null,
                "Perfect for a quick look before integrating"
              )
            )
          )
        ),

      // Step 3: Registration Form - 2 column layout
      currentStep === 3 &&
        createElement(
          "div",
          { className: "sandbox-step3-layout" },
          createElement(
            "div",
            { className: "sandbox-step3-left" },
            createElement(
              "div",
              { className: "sandbox-step3-content" },
              createElement(
                "div",
                { className: "sandbox-step3-form" },
                // Row 1: First Name, Last Name, Mobile
                createElement(
                  "div",
                  { className: "sandbox-step3-row" },
                  createElement(
                    "div",
                    { className: "sandbox-step3-field" },
                    createElement(
                      "label",
                      { className: "sandbox-input-label" },
                      "First Name",
                      createElement(
                        "span",
                        { className: "required-indicator" },
                        " *"
                      )
                    ),
                    createElement("input", {
                      type: "text",
                      className: `sandbox-input-field ${
                        errors.firstName ? "error" : ""
                      } ${formData.firstName ? "valid" : ""}`,
                      name: "firstName",
                      value: formData.firstName,
                      onChange: handleInputChange,
                      onBlur: (e) =>
                        validateAndSetFieldError(
                          "name",
                          e.target.value,
                          "firstName"
                        ),
                      placeholder: "",
                      disabled: loading,
                    }),
                    errors.firstName &&
                      createElement(
                        "span",
                        { className: "error-message" },
                        errors.firstName
                      )
                  ),
                  createElement(
                    "div",
                    { className: "sandbox-step3-field" },
                    createElement(
                      "label",
                      { className: "sandbox-input-label" },
                      "Last Name",
                      createElement(
                        "span",
                        { className: "required-indicator" },
                        " *"
                      )
                    ),
                    createElement("input", {
                      type: "text",
                      className: `sandbox-input-field ${
                        errors.lastName ? "error" : ""
                      } ${formData.lastName ? "valid" : ""}`,
                      name: "lastName",
                      value: formData.lastName,
                      onChange: handleInputChange,
                      onBlur: (e) =>
                        validateAndSetFieldError(
                          "name",
                          e.target.value,
                          "lastName"
                        ),
                      placeholder: "",
                      disabled: loading,
                    }),
                    errors.lastName &&
                      createElement(
                        "span",
                        { className: "error-message" },
                        errors.lastName
                      )
                  ),
                  createElement(
                    "div",
                    { className: "sandbox-step3-field" },
                    createElement(
                      "label",
                      { className: "sandbox-input-label" },
                      isEmail(formData.identifier) ? "Mobile Number" : "Email",
                      createElement(
                        "span",
                        { className: "required-indicator" },
                        " *"
                      )
                    ),
                    createElement("input", {
                      type: isEmail(formData.identifier) ? "tel" : "email",
                      className: `sandbox-input-field ${
                        (
                          isEmail(formData.identifier)
                            ? errors.mobile
                            : errors.email
                        )
                          ? "error"
                          : ""
                      } ${
                        (
                          isEmail(formData.identifier)
                            ? formData.mobile
                            : formData.email
                        )
                          ? "valid"
                          : ""
                      }`,
                      name: isEmail(formData.identifier) ? "mobile" : "email",
                      value: isEmail(formData.identifier)
                        ? formData.mobile
                        : formData.email,
                      onChange: handleInputChange,
                      onBlur: (e) => {
                        if (isEmail(formData.identifier)) {
                          validateAndSetFieldError(
                            "mobile",
                            e.target.value,
                            "mobile"
                          );
                        } else {
                          validateAndSetFieldError(
                            "email",
                            e.target.value,
                            "email"
                          );
                        }
                      },
                      placeholder: isEmail(formData.identifier)
                        ? "01712345678"
                        : "",
                      disabled: loading,
                    }),
                    (isEmail(formData.identifier)
                      ? errors.mobile
                      : errors.email) &&
                      createElement(
                        "span",
                        {
                          className: "error-message",
                          dangerouslySetInnerHTML:
                            typeof (isEmail(formData.identifier)
                              ? errors.mobile
                              : errors.email) === "string" &&
                            (isEmail(formData.identifier)
                              ? errors.mobile
                              : errors.email
                            ).includes("<a")
                              ? {
                                  __html: isEmail(formData.identifier)
                                    ? errors.mobile
                                    : errors.email,
                                }
                              : undefined,
                        },
                        typeof (isEmail(formData.identifier)
                          ? errors.mobile
                          : errors.email) === "string" &&
                          (isEmail(formData.identifier)
                            ? errors.mobile
                            : errors.email
                          ).includes("<a")
                          ? null
                          : isEmail(formData.identifier)
                          ? errors.mobile
                          : errors.email
                      )
                  )
                ),
                // Row 2: Legal Identity Type, Business Name, Website
                createElement(
                  "div",
                  { className: "sandbox-step3-row" },
                  createElement(
                    "div",
                    { className: "sandbox-step3-field" },
                    createElement(
                      "label",
                      { className: "sandbox-input-label" },
                      "Legal Identity Type",
                      createElement(
                        "span",
                        { className: "required-indicator" },
                        " *"
                      )
                    ),
                    createElement(
                      "select",
                      {
                        className: `sandbox-input-field ${
                          errors.legalIdType ? "error" : ""
                        } ${formData.legalIdType ? "valid" : ""}`,
                        name: "legalIdType",
                        value: formData.legalIdType,
                        onChange: handleInputChange,
                        onBlur: (e) => {
                          if (!e.target.value) {
                            setErrors((prev) => ({
                              ...prev,
                              legalIdType:
                                "Please select a legal identity type",
                            }));
                          } else {
                            setErrors((prev) => ({ ...prev, legalIdType: "" }));
                          }
                        },
                        disabled: loading,
                      },
                      createElement("option", { value: "" }, "Select"),
                      createElement(
                        "option",
                        { value: "Educational Institution" },
                        "Educational Institution"
                      ),
                      createElement(
                        "option",
                        { value: "Corporation" },
                        "Corporation"
                      ),
                      createElement(
                        "option",
                        { value: "Sole Proprietorship" },
                        "Sole Proprietorship"
                      ),
                      createElement(
                        "option",
                        { value: "Partnership" },
                        "Partnership"
                      ),
                      createElement(
                        "option",
                        { value: "Limited Liability Company" },
                        "Limited Liability Company"
                      ),
                      createElement(
                        "option",
                        { value: "Public Company" },
                        "Public Company"
                      ),
                      createElement(
                        "option",
                        { value: "Non-Governmental Organization" },
                        "Non-Governmental Organization"
                      ),
                      createElement("option", { value: "Other" }, "Other")
                    ),
                    errors.legalIdType &&
                      createElement(
                        "span",
                        { className: "error-message" },
                        errors.legalIdType
                      )
                  ),
                  createElement(
                    "div",
                    { className: "sandbox-step3-field" },
                    createElement(
                      "label",
                      { className: "sandbox-input-label" },
                      "Business Name",
                      createElement(
                        "span",
                        { className: "required-indicator" },
                        " *"
                      )
                    ),
                    createElement("input", {
                      type: "text",
                      className: `sandbox-input-field ${
                        errors.businessName ? "error" : ""
                      } ${formData.businessName ? "valid" : ""}`,
                      name: "businessName",
                      value: formData.businessName,
                      onChange: handleInputChange,
                      onBlur: (e) =>
                        validateAndSetFieldError(
                          "businessName",
                          e.target.value,
                          "businessName"
                        ),
                      placeholder: "",
                      disabled: loading,
                    }),
                    errors.businessName &&
                      createElement(
                        "span",
                        { className: "error-message" },
                        errors.businessName
                      )
                  ),
                  createElement(
                    "div",
                    { className: "sandbox-step3-field" },
                    createElement(
                      "label",
                      { className: "sandbox-input-label" },
                      "Website Address ",
                      createElement("span", { className: "required-star" }, "*")
                    ),
                    createElement("input", {
                      type: "text",
                      className: `sandbox-input-field ${
                        errors.website ? "error" : ""
                      } ${formData.website ? "valid" : ""}`,
                      name: "website",
                      value: formData.website,
                      onChange: handleInputChange,
                      onBlur: (e) => {
                        if (e.target.value) {
                          validateAndSetFieldError(
                            "website",
                            e.target.value,
                            "website"
                          );
                        }
                      },
                      placeholder: "example.com",
                      disabled: loading,
                    }),
                    errors.website &&
                      createElement(
                        "span",
                        { className: "error-message" },
                        errors.website
                      )
                  )
                ),
                // Submit button
                createElement(
                  "div",
                  { className: "sandbox-step3-actions" },
                  createElement(
                    "button",
                    {
                      className: "sandbox-submit-btn",
                      onClick: submitBusinessDetails,
                      disabled: loading,
                    },
                    loading
                      ? createElement(
                          "span",
                          { className: "btn-content" },
                          createElement("span", {
                            className: "spinner",
                            dangerouslySetInnerHTML: {
                              __html:
                                '<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.3)" stroke-width="4" fill="none"/><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="80 50" stroke-linecap="round"/></svg>',
                            },
                          }),
                          "Creating Account..."
                        )
                      : "Get My Sandbox Access"
                  )
                )
              )
            )
          ),
          createElement(
            "div",
            { className: "sandbox-step3-right" },
            createElement(
              "div",
              { className: "sandbox-demo-header" },
              createElement(
                "span",
                { className: "sandbox-demo-title" },
                "Try the demo"
              ),
              " risk-free no registration required."
            ),
            createElement(
              "a",
              {
                href: "https://demo.sandbox.moneybag.com.bd/",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "sandbox-demo-btn",
              },
              "Try Our Free Demo",
              createElement("img", {
                src: config.plugin_url + "assets/image/mouse-pointer.svg",
                alt: "Click",
                className: "sandbox-demo-icon",
              })
            ),
            createElement(
              "ul",
              { className: "sandbox-demo-benefits" },
              createElement("li", null, "No account needed"),
              createElement("li", null, "See a complete payment flow"),
              createElement(
                "li",
                null,
                "Perfect for a quick look before integrating"
              )
            )
          )
        ),

      // Step 4: Success - 2 column layout like other steps
      currentStep === 4 &&
        createElement(
          "div",
          { className: "sandbox-step4-layout" },
          createElement(
            "div",
            { className: "sandbox-step4-left" },
            createElement(
              "div",
              { className: "sandbox-step4-content" },
              createElement(
                "h2",
                { className: "sandbox-step4-heading" },
                "Sandbox account is Ready!"
              ),
              createElement(
                "div",
                { className: "sandbox-step4-icon" },
                createElement("img", {
                  src: config.plugin_url + "assets/image/Vector (4).svg",
                  alt: "Email verification",
                  className: "sandbox-email-icon",
                })
              ),
              createElement(
                "p",
                { className: "sandbox-step4-text" },
                isEmail(formData.identifier)
                  ? "You're almost there! We sent an email to"
                  : "You're almost there! We sent a message to"
              ),
              createElement(
                "div",
                { className: "sandbox-step4-email" },
                formData.identifier || "user@example.com"
              ),
              createElement(
                "p",
                { className: "sandbox-step4-info" },
                `Check your ${
                  isEmail(formData.identifier) ? "inbox" : "messages"
                } for Login, sandbox API credentials and documentation links.`
              ),
              createElement(
                "a",
                {
                  href: "https://sandbox.moneybag.com.bd/",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "sandbox-step4-btn",
                },
                "Access Sandbox"
              )
            )
          ),
          createElement(
            "div",
            { className: "sandbox-step4-right" },
            createElement(
              "div",
              { className: "sandbox-demo-header" },
              createElement(
                "span",
                { className: "sandbox-demo-title" },
                "Try the demo"
              ),
              " risk-free no registration required."
            ),
            createElement(
              "a",
              {
                href: "https://demo.sandbox.moneybag.com.bd/",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "sandbox-demo-btn",
              },
              "Try Our Free Demo",
              createElement("img", {
                src: config.plugin_url + "assets/image/mouse-pointer.svg",
                alt: "Click",
                className: "sandbox-demo-icon",
              })
            ),
            createElement(
              "ul",
              { className: "sandbox-demo-benefits" },
              createElement("li", null, "No account needed"),
              createElement("li", null, "See a complete payment flow"),
              createElement(
                "li",
                null,
                "Perfect for a quick look before integrating"
              )
            )
          )
        )
    );
  };

  // Initialize forms when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    const formWrappers = document.querySelectorAll(
      ".moneybag-sandbox-form-wrapper"
    );

    formWrappers.forEach((wrapper) => {
      const config = JSON.parse(wrapper.dataset.config || "{}");

      // Set default values if not provided
      const safeConfig = {
        widget_id: config.widget_id || "default",
        redirect_url: config.redirect_url || "",
        form_title: config.form_title || "Sandbox Account Registration",
        primary_color: config.primary_color || "#f85149",
        recaptcha_site_key: config.recaptcha_site_key || "",
        plugin_url: config.plugin_url || "",
        ...config,
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
