(function () {
  "use strict";

  const { useState, useEffect, createElement: h } = wp.element;

  // Contact Form Component
  window.MoneybagContactForm = function ({
    ajaxUrl,
    nonce,
    widgetId,
    config = {},
  }) {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      phone: "",
      company: "",
      inquiryType: "General Inquiry",
      otherSubject: "",
      message: "",
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
    const [validator, setValidator] = useState(null);

    // --- reCAPTCHA State ---
    const [recaptchaResponse, setRecaptchaResponse] = useState("");
    const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

    // Inquiry type options
    const inquiryOptions = [
      "General Inquiry",
      "Account Setup & Onboarding",
      "Technical Integration Support",
      "Transaction & Payment Issues",
      "API Documentation & SDKs",
      "Pricing & Billing Questions",
      "Settlement & Reconciliation",
      "Other",
    ];

    // Initialize validator
    useEffect(() => {
      const checkValidator = () => {
        if (typeof window.MoneybagValidator !== "undefined") {
          setValidator(new window.MoneybagValidator());
        } else if (typeof window.MoneybagValidation !== "undefined") {
          setValidator(window.MoneybagValidation);
        }
      };
      checkValidator();
      if (!validator) {
        const timer = setTimeout(checkValidator, 100);
        return () => clearTimeout(timer);
      }
    }, []);

    // --- reCAPTCHA useEffect & Functions ---
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

      if (!config.recaptcha_site_key) {
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
        if (!config.recaptcha_site_key) {
          resolve(null);
          return;
        }

        if (!window.grecaptcha || !window.grecaptcha.ready) {
          console.warn("reCAPTCHA library not loaded yet.");
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
                console.error("reCAPTCHA execute failed", error);
                resolve(null);
              });
          } catch (error) {
            console.error("reCAPTCHA execute error", error);
            resolve(null);
          }
        });
      });
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

    // Handle input changes
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      let processedValue = value;
      if (name === "phone") {
        processedValue = value.replace(/[^0-9+]/g, "");
        if (processedValue.indexOf("+") > 0) {
          processedValue = processedValue.replace(/\+/g, "");
        }
      }
      setFormData((prev) => ({
        ...prev,
        [name]: processedValue,
      }));
    };

    // Validate form
    const validateForm = () => {
      const newErrors = {};
      if (!window.MoneybagValidation) {
        console.warn("MoneybagValidation not loaded");
        return false;
      }
      const nameError = window.MoneybagValidation.validateField(
        "name",
        formData.name
      );
      if (nameError) newErrors.name = nameError;
      const emailError = window.MoneybagValidation.validateField(
        "email",
        formData.email
      );
      if (emailError) newErrors.email = emailError;
      const phoneError = window.MoneybagValidation.validateField(
        "mobile",
        formData.phone
      );
      if (phoneError) newErrors.phone = phoneError;
      const companyError = window.MoneybagValidation.validateField(
        "company",
        formData.company
      );
      if (companyError) newErrors.company = companyError;
      if (formData.message && formData.message.trim()) {
        const messageError = window.MoneybagValidation.validateField(
          "message",
          formData.message
        );
        if (messageError) newErrors.message = messageError;
      }
      if (formData.inquiryType === "Other") {
        if (!formData.otherSubject || !formData.otherSubject.trim()) {
          newErrors.otherSubject = "Please specify the subject";
        } else {
          const subjectError = window.MoneybagValidation.validateField(
            "otherSubject",
            formData.otherSubject
          );
          if (subjectError) newErrors.otherSubject = subjectError;
        }
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus({ type: "", message: "" });

      // 1. Execute reCAPTCHA
      const recaptchaToken = await executeRecaptcha();

      // 2. Check if token failed
      if (!recaptchaToken && config.recaptcha_site_key) {
        setIsSubmitting(false);
        setSubmitStatus({
          type: "error",
          message: "CAPTCHA verification failed. Please try again.",
        });
        return;
      }

      // 3. Prepare form data
      const submitData = new FormData();
      submitData.append("action", "moneybag_contact_form");
      submitData.append("nonce", nonce);
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("company", formData.company);
      submitData.append("inquiry_type", formData.inquiryType);
      submitData.append("other_subject", formData.otherSubject);
      submitData.append("message", formData.message);

      // 4. Add token to form data
      if (recaptchaToken) {
        submitData.append("recaptcha_token", recaptchaToken);
      }

      try {
        const response = await fetch(ajaxUrl, {
          method: "POST",
          body: submitData,
          credentials: "same-origin",
        });

        const data = await response.json();

        if (data.success) {
          setSubmitStatus({
            type: "success",
            message:
              "Thank you for contacting us! We will get back to you soon.",
          });
          setFormData({
            name: "",
            email: "",
            phone: "",
            company: "",
            inquiryType: "General Inquiry",
            otherSubject: "",
            message: "",
          });
        } else {
          // --- MODIFIED: Restored your custom error logic ---
          // Check for the specific duplicate key error from the CRM
          if (
            data.data?.message &&
            data.data.message.includes("IDX_UNIQUE_87914cd3ce963115f8cb943e2ac")
          ) {
            setSubmitStatus({
              type: "error",
              message:
                'You are already in our system! Call us for instan response <a href="tel:+8801958109228" style="color: #ffff; text-decoration: underline;">+880 1958 109 228</a>',
            });
          } else {
            // Use the server error message if available, otherwise a generic one
            setSubmitStatus({
              type: "error",
              message:
                data.data?.message ||
                'Something went wrong! Hotline <a href="tel:+8801958109228" style="color: #ff4444; text-decoration: underline;">+880 1958 109 228</a>',
            });
          }
          // --- END MODIFICATION ---
        }
      } catch (error) {
        setSubmitStatus({
          type: "error",
          message: "Network error. Please check your connection and try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    // --- RENDER (Your original render function with CSS) ---
    return h(
      "div",
      { className: "contact-form-wrapper moneybag-form" },
      h(
        "form",
        {
          className: "contact-form",
          onSubmit: handleSubmit,
          noValidate: true,
        },
        // Status message
        submitStatus.message &&
          h("div", {
            className: `form-status ${
              submitStatus.type === "success" ? "success" : "error"
            }`,
            dangerouslySetInnerHTML: { __html: submitStatus.message },
          }),

        // Name field
        h(
          "div",
          { className: "form-group" },
          h("input", {
            type: "text",
            name: "name",
            placeholder: "Name",
            value: formData.name,
            onChange: handleInputChange,
            onBlur: (e) =>
              validateAndSetFieldError("name", e.target.value, "name"),
            className: `input-field ${errors.name ? "error" : ""} ${
              formData.name ? "valid" : ""
            }`,
            disabled: isSubmitting,
          }),
          errors.name && h("span", { className: "error-message" }, errors.name)
        ),

        // Email and Phone row with icons
        h(
          "div",
          { className: "form-row two-columns" },
          h(
            "div",
            { className: "form-group with-icon" },
            h(
              "div",
              { className: "input-wrapper" },
              h(
                "svg",
                {
                  className: "input-icon",
                  width: "20",
                  height: "20",
                  viewBox: "0 0 20 20",
                  fill: "none",
                },
                h("path", {
                  d: "M2.5 7.5L10 12.5L17.5 7.5M3.5 16.5H16.5C17.0523 16.5 17.5 16.0523 17.5 15.5V4.5C17.5 3.94772 17.0523 3.5 16.5 3.5H3.5C2.94772 3.5 2.5 3.94772 2.5 4.5V15.5C2.5 16.0523 2.94772 16.5 3.5 16.5Z",
                  stroke: "#6B7280",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                })
              ),
              h("input", {
                type: "email",
                name: "email",
                placeholder: "Email",
                value: formData.email,
                onChange: handleInputChange,
                onBlur: (e) =>
                  validateAndSetFieldError("email", e.target.value, "email"),
                className: `input-field with-icon-padding ${
                  errors.email ? "error" : ""
                } ${formData.email ? "valid" : ""}`,
                disabled: isSubmitting,
              })
            ),
            errors.email &&
              h("span", { className: "error-message" }, errors.email)
          ),
          h(
            "div",
            { className: "form-group with-icon" },
            h(
              "div",
              { className: "input-wrapper" },
              h(
                "svg",
                {
                  className: "input-icon",
                  width: "20",
                  height: "20",
                  viewBox: "0 0 20 20",
                  fill: "none",
                },
                h("path", {
                  d: "M2 4.5C2 3.67157 2.67157 3 3.5 3H6.5C7.05228 3 7.5 3.44772 7.5 4V7C7.5 7.55228 7.05228 8 6.5 8H5C5 11.866 8.13401 15 12 15V13.5C12 12.9477 12.4477 12.5 13 12.5H16C16.5523 12.5 17 12.9477 17 13.5V16.5C17 17.3284 16.3284 18 15.5 18H14C7.37258 18 2 12.6274 2 6V4.5Z",
                  stroke: "#6B7280",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                })
              ),
              h("input", {
                type: "tel",
                name: "phone",
                placeholder: "+8801XXXXXXXXX",
                value: formData.phone,
                onChange: handleInputChange,
                onBlur: (e) =>
                  validateAndSetFieldError("mobile", e.target.value, "phone"),
                onKeyPress: (e) => {
                  const char = String.fromCharCode(e.which || e.keyCode);
                  if (!/[0-9+]/.test(char) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                },
                pattern: "[0-9+]*",
                inputMode: "numeric",
                className: `input-field with-icon-padding ${
                  errors.phone ? "error" : ""
                } ${formData.phone ? "valid" : ""}`,
                disabled: isSubmitting,
              })
            ),
            errors.phone &&
              h("span", { className: "error-message" }, errors.phone)
          )
        ),

        // Company field
        h(
          "div",
          { className: "form-group" },
          h("input", {
            type: "text",
            name: "company",
            placeholder: "Company Name",
            value: formData.company,
            onChange: handleInputChange,
            onBlur: (e) =>
              validateAndSetFieldError("company", e.target.value, "company"),
            className: `input-field ${errors.company ? "error" : ""} ${
              formData.company ? "valid" : ""
            }`,
            disabled: isSubmitting,
          }),
          errors.company &&
            h("span", { className: "error-message" }, errors.company)
        ),

        // Inquiry type dropdown and Other subject row
        h(
          "div",
          { className: "form-row two-columns" },
          h(
            "div",
            { className: "form-group" },
            h(
              "select",
              {
                className: `input-field ${errors.inquiryType ? "error" : ""} ${
                  formData.inquiryType ? "valid" : ""
                }`,
                value: formData.inquiryType,
                onChange: (e) => {
                  const newValue = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    inquiryType: newValue,
                    otherSubject: newValue === "Other" ? prev.otherSubject : "",
                  }));
                  if (newValue !== "Other") {
                    setErrors((prev) => ({
                      ...prev,
                      otherSubject: "",
                    }));
                  }
                },
                disabled: isSubmitting,
              },
              inquiryOptions.map((option) =>
                h(
                  "option",
                  {
                    key: option,
                    value: option,
                  },
                  option
                )
              )
            )
          ),
          h(
            "div",
            { className: "form-group" },
            h("input", {
              type: "text",
              name: "otherSubject",
              placeholder:
                formData.inquiryType === "Other"
                  ? "Please specify subject *"
                  : "Other Topic Subject",
              value: formData.otherSubject,
              onChange: handleInputChange,
              onBlur: (e) =>
                formData.inquiryType === "Other"
                  ? validateAndSetFieldError(
                      "otherSubject",
                      e.target.value,
                      "otherSubject"
                    )
                  : null,
              className: `input-field ${errors.otherSubject ? "error" : ""} ${
                formData.otherSubject && formData.inquiryType === "Other"
                  ? "valid"
                  : ""
              }`,
              disabled: isSubmitting || formData.inquiryType !== "Other",
              required: formData.inquiryType === "Other",
            }),
            errors.otherSubject &&
              h("span", { className: "error-message" }, errors.otherSubject)
          )
        ),

        // Message field
        h(
          "div",
          { className: "form-group" },
          h("textarea", {
            name: "message",
            placeholder: "Message",
            value: formData.message,
            onChange: handleInputChange,
            onBlur: (e) => {
              if (e.target.value.trim()) {
                const error =
                  e.target.value.trim().length < 10
                    ? "Message must be at least 10 characters if provided"
                    : "";
                setErrors((prev) => ({ ...prev, message: error }));
              } else {
                setErrors((prev) => ({ ...prev, message: "" }));
              }
            },
            rows: 4,
            className: `textarea-field ${errors.message ? "error" : ""} ${
              formData.message ? "valid" : ""
            }`,
            disabled: isSubmitting,
          }),
          errors.message &&
            h("span", { className: "error-message" }, errors.message)
        ),

        // Submit button
        h(
          "div",
          { className: "form-actions" },
          h(
            "button",
            {
              type: "submit",
              className: "primary-btn submit-button",
              disabled: isSubmitting,
            },
            isSubmitting ? "Submitting..." : "Submit"
          )
        )
      )
    );
  };
})();
