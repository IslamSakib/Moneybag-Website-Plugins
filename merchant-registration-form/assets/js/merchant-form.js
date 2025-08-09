const { useState, useEffect } = React;

// Icon components
const CheckCircle = () =>
  React.createElement(
    "svg",
    {
      className: "w-12 h-12",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
    },
    React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    })
  );

const Upload = () =>
  React.createElement(
    "svg",
    {
      className: "mrf-file-icon",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
    },
    React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
    })
  );

const Download = () =>
  React.createElement(
    "svg",
    {
      className: "mrf-file-icon",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
    },
    React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    })
  );

// Illustration SVG Component
const FormIllustration = () =>
  React.createElement(
    "svg",
    {
      width: "160",
      height: "160",
      viewBox: "0 0 200 200",
      className: "mrf-illustration",
    },
    // Background circle
    React.createElement("circle", {
      cx: "100",
      cy: "100",
      r: "85",
      fill: "#FFF5F5",
      stroke: "#FED7D7",
      strokeWidth: "2",
    }),
    // Person body
    React.createElement("ellipse", {
      cx: "80",
      cy: "120",
      rx: "22",
      ry: "32",
      fill: "#F56565",
    }),
    // Person head
    React.createElement("circle", {
      cx: "80",
      cy: "75",
      r: "13",
      fill: "#FBB6CE",
    }),
    // Person arm
    React.createElement("ellipse", {
      cx: "105",
      cy: "100",
      rx: "7",
      ry: "18",
      fill: "#F56565",
      transform: "rotate(45 105 100)",
    }),
    // Mobile device
    React.createElement("rect", {
      x: "115",
      y: "85",
      width: "23",
      height: "38",
      rx: "4",
      fill: "#E2E8F0",
      stroke: "#CBD5E0",
      strokeWidth: "2",
    }),
    // Mobile screen
    React.createElement("rect", {
      x: "118",
      y: "90",
      width: "17",
      height: "23",
      rx: "2",
      fill: "#FFFFFF",
    }),
    // Mobile screen elements
    React.createElement("rect", {
      x: "120",
      y: "93",
      width: "13",
      height: "2",
      fill: "#FED7D7",
    }),
    React.createElement("rect", {
      x: "120",
      y: "97",
      width: "9",
      height: "2",
      fill: "#FED7D7",
    }),
    React.createElement("rect", {
      x: "120",
      y: "101",
      width: "11",
      height: "2",
      fill: "#FED7D7",
    }),
    // Decorative elements
    React.createElement("circle", {
      cx: "145",
      cy: "60",
      r: "2.5",
      fill: "#F6AD55",
    }),
    React.createElement("circle", {
      cx: "45",
      cy: "50",
      r: "2",
      fill: "#68D391",
    }),
    React.createElement("circle", {
      cx: "155",
      cy: "140",
      r: "2",
      fill: "#63B3ED",
    })
  );

const MerchantRegistrationForm = ({ title, showProgress, theme }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [formData, setFormData] = useState({
    // Step 1 data
    legalIdentity: "",
    businessCategory: "",
    monthlyVolume: "500000-600000",
    maxAmount: "5000",
    currencyType: "",
    paymentMethods: {
      visa: false,
      mastercard: false,
      amex: false,
      unionPay: false,
      dinersClub: false,
      dbblNexus: false,
      bkash: false,
      nagad: false,
      rocket: false,
      upay: false,
    },
    // Step 2 data
    merchantRegisteredName: "",
    tradingName: "",
    domainName: "",
    // Step 3 data
    name: "",
    designation: "",
    email: "",
    mobileNumber: "",
    phoneNumber: "",
    // Step 4 data
    businessLogo: "",
    tradeLicense: "",
    idDocument: "",
    tinCertificate: "",
  });

  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    setErrors({});
  }, [currentStep]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: !prev.paymentMethods[method],
      },
    }));
  };

  const handleFileUpload = async (fieldName, file) => {
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append(fieldName, file);
    formDataUpload.append("action", "mrf_upload_file");
    formDataUpload.append("nonce", window.mrfAjax.nonce);

    setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));

    try {
      const response = await fetch(window.mrfAjax.ajaxUrl, {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.success) {
        handleInputChange(fieldName, result.data.files[fieldName].filename);
        setUploadProgress((prev) => ({ ...prev, [fieldName]: 100 }));
      } else {
        setErrors((prev) => ({ ...prev, [fieldName]: result.data.message }));
        setUploadProgress((prev) => ({ ...prev, [fieldName]: null }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "Upload failed. Please try again.",
      }));
      setUploadProgress((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const validateStep = async (stepNumber) => {
    const stepData = getStepData(stepNumber);

    try {
      const response = await fetch(window.mrfAjax.ajaxUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "mrf_validate_step",
          nonce: window.mrfAjax.nonce,
          step: stepNumber,
          data: JSON.stringify(stepData),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setErrors(result.data.errors || {});
        return result.data.valid;
      }
    } catch (error) {
      console.error("Validation error:", error);
    }

    return false;
  };

  const getStepData = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return {
          legalIdentity: formData.legalIdentity,
          businessCategory: formData.businessCategory,
          monthlyVolume: formData.monthlyVolume,
          maxAmount: formData.maxAmount,
          currencyType: formData.currencyType,
          paymentMethods: formData.paymentMethods,
        };
      case 2:
        return {
          merchantRegisteredName: formData.merchantRegisteredName,
          tradingName: formData.tradingName,
          domainName: formData.domainName,
        };
      case 3:
        return {
          name: formData.name,
          designation: formData.designation,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          phoneNumber: formData.phoneNumber,
        };
      case 4:
        return {
          businessLogo: formData.businessLogo,
          tradeLicense: formData.tradeLicense,
          idDocument: formData.idDocument,
          tinCertificate: formData.tinCertificate,
        };
      default:
        return {};
    }
  };

  const handleStepClick = async (stepNumber) => {
    if (stepNumber < currentStep) {
      setCurrentStep(stepNumber);
    } else if (stepNumber === currentStep + 1) {
      const isValid = await validateStep(currentStep);
      if (isValid) {
        setCurrentStep(stepNumber);
      }
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(window.mrfAjax.ajaxUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "mrf_submit_form",
          nonce: window.mrfAjax.nonce,
          formData: JSON.stringify(formData),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmissionResult({
          success: true,
          message: result.data.message,
          applicationId: result.data.application_id,
          registrationId: result.data.registration_id,
        });
        setIsSubmitted(true);
      } else {
        setSubmissionResult({
          success: false,
          message: result.data.message,
          errors: result.data.errors,
        });
        if (result.data.errors) {
          setErrors(result.data.errors);
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmissionResult({
        success: false,
        message:
          "An error occurred while submitting your application. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Business Info", active: currentStep === 1 },
    { number: 2, title: "Online Presence", active: currentStep === 2 },
    { number: 3, title: "Point Of Contact", active: currentStep === 3 },
    { number: 4, title: "Documents", active: currentStep === 4 },
  ];

  const getProgressPercentage = () => {
    switch (currentStep) {
      case 1:
        return 28;
      case 2:
        return 52;
      case 3:
        return 74;
      case 4:
        return 96;
      default:
        return 28;
    }
  };

  const renderThankYouPage = () => {
    return React.createElement(
      "div",
      { className: "mrf-min-h-screen mrf-bg-gradient" },
      React.createElement(
        "div",
        { className: "mrf-header" },
        React.createElement(
          "div",
          { className: "mrf-header-content" },
          React.createElement(
            "div",
            { className: "mrf-header-links" },
            React.createElement(
              "button",
              { className: "mrf-link" },
              "Need Assistance?"
            ),
            React.createElement("button", { className: "mrf-link" }, "FAQ")
          )
        )
      ),
      React.createElement(
        "div",
        { className: "mrf-container" },
        React.createElement(
          "div",
          { className: "mrf-thank-you-card" },
          React.createElement(
            "div",
            { className: "mrf-success-icon" },
            React.createElement(
              "div",
              { className: "mrf-icon-circle" },
              React.createElement(CheckCircle)
            )
          ),
          React.createElement(
            "h1",
            { className: "mrf-thank-you-title" },
            "Application Submitted Successfully!"
          ),
          React.createElement(
            "p",
            { className: "mrf-thank-you-message" },
            submissionResult?.message ||
              "Thank you for submitting your merchant account application. We have received your information and our team will review it shortly."
          ),
          React.createElement(
            "div",
            { className: "mrf-application-details" },
            React.createElement(
              "h3",
              { className: "mrf-details-title" },
              "Application Details"
            ),
            React.createElement(
              "div",
              { className: "mrf-details-content" },
              React.createElement(
                "div",
                { className: "mrf-detail-row" },
                React.createElement(
                  "span",
                  { className: "mrf-detail-label" },
                  "Business Name:"
                ),
                React.createElement(
                  "span",
                  { className: "mrf-detail-value" },
                  formData.merchantRegisteredName
                )
              ),
              React.createElement(
                "div",
                { className: "mrf-detail-row" },
                React.createElement(
                  "span",
                  { className: "mrf-detail-label" },
                  "Trading Name:"
                ),
                React.createElement(
                  "span",
                  { className: "mrf-detail-value" },
                  formData.tradingName
                )
              ),
              React.createElement(
                "div",
                { className: "mrf-detail-row" },
                React.createElement(
                  "span",
                  { className: "mrf-detail-label" },
                  "Contact Email:"
                ),
                React.createElement(
                  "span",
                  { className: "mrf-detail-value" },
                  formData.email
                )
              ),
              React.createElement(
                "div",
                { className: "mrf-detail-row" },
                React.createElement(
                  "span",
                  { className: "mrf-detail-label" },
                  "Application ID:"
                ),
                React.createElement(
                  "span",
                  { className: "mrf-application-id" },
                  submissionResult?.applicationId
                )
              ),
              React.createElement(
                "div",
                { className: "mrf-detail-row" },
                React.createElement(
                  "span",
                  { className: "mrf-detail-label" },
                  "Submitted:"
                ),
                React.createElement(
                  "span",
                  { className: "mrf-detail-value" },
                  new Date().toLocaleDateString()
                )
              )
            )
          ),
          React.createElement(
            "div",
            { className: "mrf-action-buttons" },
            React.createElement(
              "button",
              {
                className: "mrf-btn mrf-btn-primary",
                onClick: () => {
                  setIsSubmitted(false);
                  setCurrentStep(1);
                  setSubmissionResult(null);
                },
              },
              "Submit Another Application"
            ),
            React.createElement(
              "button",
              { className: "mrf-btn mrf-btn-secondary" },
              "Download Receipt"
            )
          )
        )
      )
    );
  };

  const renderFileUpload = (
    fieldName,
    label,
    accept = ".jpg,.jpeg,.png,.pdf"
  ) => {
    return React.createElement(
      "div",
      { className: "mrf-field-group" },
      React.createElement("label", { className: "mrf-label" }, label),
      React.createElement(
        "div",
        { className: "mrf-file-upload-container" },
        React.createElement("input", {
          type: "file",
          accept: accept,
          onChange: (e) => handleFileUpload(fieldName, e.target.files[0]),
          className: "mrf-file-input",
          id: `file-${fieldName}`,
        }),
        React.createElement(
          "label",
          {
            htmlFor: `file-${fieldName}`,
            className: "mrf-file-label",
          },
          React.createElement(
            "span",
            {
              className: formData[fieldName]
                ? "mrf-file-selected"
                : "mrf-file-placeholder",
            },
            formData[fieldName] || `Choose ${label.toLowerCase()} file...`
          ),
          React.createElement(formData[fieldName] ? Download : Upload)
        ),
        uploadProgress[fieldName] !== undefined &&
          uploadProgress[fieldName] !== null &&
          React.createElement(
            "div",
            { className: "mrf-upload-progress" },
            React.createElement(
              "div",
              { className: "mrf-progress-bar" },
              React.createElement("div", {
                className: "mrf-progress-fill",
                style: { width: `${uploadProgress[fieldName]}%` },
              })
            )
          ),
        errors[fieldName] &&
          React.createElement(
            "p",
            { className: "mrf-error" },
            errors[fieldName]
          )
      )
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return React.createElement(
          "div",
          { className: "mrf-step-content" },
          React.createElement(
            "div",
            { className: "mrf-form-grid" },
            // Legal Identity
            React.createElement(
              "div",
              { className: "mrf-field-group" },
              React.createElement(
                "label",
                { className: "mrf-label" },
                "Legal Identity"
              ),
              React.createElement(
                "div",
                { className: "mrf-select-container" },
                React.createElement(
                  "select",
                  {
                    className: `mrf-select ${
                      errors.legalIdentity ? "mrf-error-input" : ""
                    }`,
                    value: formData.legalIdentity,
                    onChange: (e) =>
                      handleInputChange("legalIdentity", e.target.value),
                  },
                  React.createElement("option", { value: "" }, "Select"),
                  React.createElement(
                    "option",
                    { value: "individual" },
                    "Individual"
                  ),
                  React.createElement(
                    "option",
                    { value: "company" },
                    "Company"
                  ),
                  React.createElement(
                    "option",
                    { value: "partnership" },
                    "Partnership"
                  )
                )
              ),
              errors.legalIdentity &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.legalIdentity
                )
            ),

            // Business Category
            React.createElement(
              "div",
              { className: "mrf-field-group" },
              React.createElement(
                "label",
                { className: "mrf-label" },
                "Business Category"
              ),
              React.createElement(
                "div",
                { className: "mrf-select-container" },
                React.createElement(
                  "select",
                  {
                    className: `mrf-select ${
                      errors.businessCategory ? "mrf-error-input" : ""
                    }`,
                    value: formData.businessCategory,
                    onChange: (e) =>
                      handleInputChange("businessCategory", e.target.value),
                  },
                  React.createElement("option", { value: "" }, "Select"),
                  React.createElement(
                    "option",
                    { value: "ecommerce" },
                    "E-commerce"
                  ),
                  React.createElement("option", { value: "retail" }, "Retail"),
                  React.createElement(
                    "option",
                    { value: "service" },
                    "Service"
                  ),
                  React.createElement(
                    "option",
                    { value: "manufacturing" },
                    "Manufacturing"
                  )
                )
              ),
              errors.businessCategory &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.businessCategory
                )
            ),

            // Monthly Transaction Volume
            React.createElement(
              "div",
              { className: "mrf-field-group" },
              React.createElement(
                "label",
                { className: "mrf-label" },
                "Monthly Transaction Volume"
              ),
              React.createElement(
                "div",
                { className: "mrf-select-container" },
                React.createElement(
                  "select",
                  {
                    className: `mrf-select ${
                      errors.monthlyVolume ? "mrf-error-input" : ""
                    }`,
                    value: formData.monthlyVolume,
                    onChange: (e) =>
                      handleInputChange("monthlyVolume", e.target.value),
                  },
                  React.createElement(
                    "option",
                    { value: "0-50000" },
                    "0-50,000"
                  ),
                  React.createElement(
                    "option",
                    { value: "50000-100000" },
                    "50,000-100,000"
                  ),
                  React.createElement(
                    "option",
                    { value: "100000-500000" },
                    "100,000-500,000"
                  ),
                  React.createElement(
                    "option",
                    { value: "500000-600000" },
                    "500,000-600,000"
                  ),
                  React.createElement(
                    "option",
                    { value: "600000+" },
                    "600,000+"
                  )
                )
              ),
              errors.monthlyVolume &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.monthlyVolume
                )
            ),

            // Maximum Amount in Single Transaction
            React.createElement(
              "div",
              { className: "mrf-field-group" },
              React.createElement(
                "label",
                { className: "mrf-label" },
                "Maximum Amount in a Single Transaction"
              ),
              React.createElement("input", {
                type: "number",
                className: `mrf-input ${
                  errors.maxAmount ? "mrf-error-input" : ""
                }`,
                value: formData.maxAmount,
                onChange: (e) => handleInputChange("maxAmount", e.target.value),
              }),
              errors.maxAmount &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.maxAmount
                )
            ),

            // Currency Type
            React.createElement(
              "div",
              { className: "mrf-field-group mrf-col-span-2" },
              React.createElement(
                "label",
                { className: "mrf-label" },
                "Currency Type"
              ),
              React.createElement(
                "div",
                { className: "mrf-select-container" },
                React.createElement(
                  "select",
                  {
                    className: `mrf-select ${
                      errors.currencyType ? "mrf-error-input" : ""
                    }`,
                    value: formData.currencyType,
                    onChange: (e) =>
                      handleInputChange("currencyType", e.target.value),
                  },
                  React.createElement("option", { value: "" }, "Select"),
                  React.createElement("option", { value: "BDT" }, "BDT"),
                  React.createElement("option", { value: "USD" }, "USD"),
                  React.createElement("option", { value: "EUR" }, "EUR")
                )
              ),
              errors.currencyType &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.currencyType
                )
            )
          ),

          // Type of Service Needed
          React.createElement(
            "div",
            { className: "mrf-services-section" },
            React.createElement(
              "label",
              { className: "mrf-label" },
              "Type of Service Needed"
            ),
            React.createElement(
              "div",
              { className: "mrf-checkbox-grid" },
              Object.entries(formData.paymentMethods).map(([method, checked]) =>
                React.createElement(
                  "label",
                  {
                    key: method,
                    className: "mrf-checkbox-item",
                  },
                  React.createElement("input", {
                    type: "checkbox",
                    checked: checked,
                    onChange: () => handleCheckboxChange(method),
                    className: "mrf-checkbox",
                  }),
                  React.createElement(
                    "span",
                    { className: "mrf-checkbox-label" },
                    method === "dbblNexus"
                      ? "DBBL-Nexus"
                      : method === "unionPay"
                      ? "UnionPay"
                      : method === "dinersClub"
                      ? "Diners Club"
                      : method.charAt(0).toUpperCase() + method.slice(1)
                  )
                )
              )
            ),
            errors.paymentMethods &&
              React.createElement(
                "p",
                { className: "mrf-error" },
                errors.paymentMethods
              )
          )
        );

      case 2:
        return React.createElement(
          "div",
          { className: "mrf-step-content" },
          // Merchant Registered Name
          React.createElement(
            "div",
            { className: "mrf-field-group" },
            React.createElement(
              "label",
              { className: "mrf-label" },
              "Merchant Registered Name"
            ),
            React.createElement("input", {
              type: "text",
              className: `mrf-input ${
                errors.merchantRegisteredName ? "mrf-error-input" : ""
              }`,
              value: formData.merchantRegisteredName,
              onChange: (e) =>
                handleInputChange("merchantRegisteredName", e.target.value),
            }),
            errors.merchantRegisteredName &&
              React.createElement(
                "p",
                { className: "mrf-error" },
                errors.merchantRegisteredName
              )
          ),

          // Trading Name
          React.createElement(
            "div",
            { className: "mrf-field-group" },
            React.createElement(
              "label",
              { className: "mrf-label" },
              "Trading Name (Name on the Shop)"
            ),
            React.createElement("input", {
              type: "text",
              className: `mrf-input ${
                errors.tradingName ? "mrf-error-input" : ""
              }`,
              value: formData.tradingName,
              onChange: (e) => handleInputChange("tradingName", e.target.value),
            }),
            errors.tradingName &&
              React.createElement(
                "p",
                { className: "mrf-error" },
                errors.tradingName
              )
          ),

          // Domain Name
          React.createElement(
            "div",
            { className: "mrf-field-group" },
            React.createElement(
              "label",
              { className: "mrf-label" },
              "Domain Name"
            ),
            React.createElement("input", {
              type: "text",
              className: `mrf-input ${
                errors.domainName ? "mrf-error-input" : ""
              }`,
              value: formData.domainName,
              onChange: (e) => handleInputChange("domainName", e.target.value),
              placeholder: "www.yourwebsite.com",
            }),
            errors.domainName &&
              React.createElement(
                "p",
                { className: "mrf-error" },
                errors.domainName
              )
          )
        );

      case 3:
        return React.createElement(
          "div",
          { className: "mrf-step-content" },
          // Name
          React.createElement(
            "div",
            { className: "mrf-field-group" },
            React.createElement("label", { className: "mrf-label" }, "Name"),
            React.createElement("input", {
              type: "text",
              className: `mrf-input ${errors.name ? "mrf-error-input" : ""}`,
              value: formData.name,
              onChange: (e) => handleInputChange("name", e.target.value),
            }),
            errors.name &&
              React.createElement("p", { className: "mrf-error" }, errors.name)
          ),

          // Designation and Email Row
          React.createElement(
            "div",
            { className: "mrf-form-grid" },
            React.createElement(
              "div",
              { className: "mrf-field-group" },
              React.createElement(
                "label",
                { className: "mrf-label" },
                "Designation"
              ),
              React.createElement("input", {
                type: "text",
                className: `mrf-input ${
                  errors.designation ? "mrf-error-input" : ""
                }`,
                value: formData.designation,
                onChange: (e) =>
                  handleInputChange("designation", e.target.value),
              }),
              errors.designation &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.designation
                )
            ),
            React.createElement(
              "div",
              { className: "mrf-field-group" },
              React.createElement("label", { className: "mrf-label" }, "Email"),
              React.createElement("input", {
                type: "email",
                className: `mrf-input ${errors.email ? "mrf-error-input" : ""}`,
                value: formData.email,
                onChange: (e) => handleInputChange("email", e.target.value),
              }),
              errors.email &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.email
                )
            )
          ),

          // Mobile Number and Phone Number Row
          React.createElement(
            "div",
            { className: "mrf-form-grid" },
            React.createElement(
              "div",
              { className: "mrf-field-group" },
              React.createElement(
                "label",
                { className: "mrf-label" },
                "Mobile Number"
              ),
              React.createElement("input", {
                type: "tel",
                className: `mrf-input ${
                  errors.mobileNumber ? "mrf-error-input" : ""
                }`,
                value: formData.mobileNumber,
                onChange: (e) =>
                  handleInputChange("mobileNumber", e.target.value),
                placeholder: "+88 01XXX XXX XXX",
              }),
              errors.mobileNumber &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.mobileNumber
                )
            ),
            React.createElement(
              "div",
              { className: "mrf-field-group" },
              React.createElement(
                "label",
                { className: "mrf-label" },
                "Phone Number (Optional)"
              ),
              React.createElement("input", {
                type: "tel",
                className: `mrf-input ${
                  errors.phoneNumber ? "mrf-error-input" : ""
                }`,
                value: formData.phoneNumber,
                onChange: (e) =>
                  handleInputChange("phoneNumber", e.target.value),
              }),
              errors.phoneNumber &&
                React.createElement(
                  "p",
                  { className: "mrf-error" },
                  errors.phoneNumber
                )
            )
          )
        );

      case 4:
        return React.createElement(
          "div",
          { className: "mrf-step-content" },
          renderFileUpload(
            "businessLogo",
            "Business / Organization Logo",
            ".jpg,.jpeg,.png"
          ),
          renderFileUpload(
            "tradeLicense",
            "Trade License",
            ".jpg,.jpeg,.png,.pdf"
          ),
          renderFileUpload(
            "idDocument",
            "NID / Passport / Birth Certificate / Driving License",
            ".jpg,.jpeg,.png,.pdf"
          ),
          renderFileUpload(
            "tinCertificate",
            "TIN Certificate",
            ".jpg,.jpeg,.png,.pdf"
          )
        );

      default:
        return null;
    }
  };

  const renderInstructions = () => {
    const instructions = {
      1: [
        "Select your business type from the Legal Identity dropdown",
        "Enter your expected monthly transaction amount in BDT",
        "Specify the highest single transaction amount you expect to process in a Single transaction",
        "Choose whether you serve domestic, international, or both customer types",
        "Select all payment methods you want to accept (you can add more later)",
        "All fields are required to proceed to the next step",
        "Ensure your transaction volumes are realistic to avoid delays in approval",
      ],
      2: [
        "Enter your official business name as registered with government authorities",
        "Trading name is what customers see (your shop/brand name)",
        "Domain Name should be your complete website URL (e.g. www.yourbusiness.com)",
        'If you don\'t have a website yet, enter "N/A" or your social media page',
        "Double-check spelling - this information will appear on your merchant account",
        "These details will be used for payment gateway integration",
      ],
      3: [
        "Provide details of the primary contact person for this merchant account",
        "This person will receive all account-related communications",
        "Email must be valid and actively monitored - verification code will be sent",
        "Mobile number must be a Bangladesh number starting with +88",
        "Phone number is optional but recommended for urgent support",
        "This contact will have admin access to the merchant dashboard",
      ],
      4: [
        "Company Logo - Square format (500x500px), PNG preferred",
        "Trade License: Current and valid trade license from city corporation/municipality",
        "Owner ID - NID/Passport/Birth Certificate/Driving License (both sides if needed)",
        "TIN Certificate: Tax Identification Number certificate from NBR",
        "All documents must be clear, readable, and unedited",
        "Accepted formats: JPG, JPEG, PNG, PDF (max 2MB per file)",
        "Documents must be valid and not expired",
        "Ensure all text is clearly visible - blurry documents will be rejected",
        "For ID documents, both sides must be uploaded if applicable",
        "Documents must match the business name provided in Step 2",
        "Processing takes 1-3 business days after submission",
      ],
    };

    return React.createElement(
      "ul",
      { className: "mrf-instructions-list" },
      instructions[currentStep]?.map((instruction, index) =>
        React.createElement(
          "li",
          { key: index, className: "mrf-instruction-item" },
          React.createElement("span", { className: "mrf-instruction-bullet" }),
          instruction
        )
      )
    );
  };

  if (isSubmitted) {
    return renderThankYouPage();
  }

  return React.createElement(
    "div",
    {
      className: `mrf-container-wrapper ${theme === "dark" ? "mrf-dark" : ""}`,
    },
    // Header with Need Assistance and FAQ
    React.createElement(
      "div",
      { className: "mrf-header" },
      React.createElement(
        "div",
        { className: "mrf-header-content" },
        React.createElement(
          "div",
          { className: "mrf-header-links" },
          React.createElement(
            "button",
            { className: "mrf-link" },
            "Need Assistance?"
          ),
          React.createElement("button", { className: "mrf-link" }, "FAQ")
        )
      )
    ),

    React.createElement(
      "div",
      { className: "mrf-main-container" },
      // Progress Bar
      showProgress === "yes" &&
        React.createElement(
          "div",
          { className: "mrf-progress-section" },
          React.createElement(
            "div",
            { className: "mrf-progress-info" },
            React.createElement(
              "span",
              { className: "mrf-progress-text" },
              `${getProgressPercentage()}% Progress`
            )
          ),
          React.createElement(
            "div",
            { className: "mrf-progress-bar-container" },
            React.createElement("div", {
              className: "mrf-progress-bar-fill",
              style: { width: `${getProgressPercentage()}%` },
            })
          )
        ),

      // Error Message
      submissionResult &&
        !submissionResult.success &&
        React.createElement(
          "div",
          { className: "mrf-error-banner" },
          React.createElement(
            "p",
            { className: "mrf-error-banner-text" },
            submissionResult.message
          )
        ),

      React.createElement(
        "div",
        { className: "mrf-content-grid" },
        // Left Sidebar - Steps
        React.createElement(
          "div",
          { className: "mrf-sidebar-left" },
          React.createElement(
            "div",
            { className: "mrf-sidebar-card" },
            React.createElement(
              "h3",
              { className: "mrf-sidebar-title" },
              title || "Please fill this information first"
            ),
            React.createElement(
              "p",
              { className: "mrf-sidebar-subtitle" },
              "After completing all steps you will be eligible for 7 days trial."
            ),
            React.createElement(
              "div",
              { className: "mrf-steps-list" },
              steps.map((step) =>
                React.createElement(
                  "div",
                  {
                    key: step.number,
                    className: `mrf-step-item ${
                      step.active ? "mrf-step-active" : ""
                    } ${
                      currentStep >= step.number
                        ? "mrf-step-clickable"
                        : "mrf-step-disabled"
                    }`,
                    onClick: () => handleStepClick(step.number),
                  },
                  React.createElement(
                    "span",
                    { className: "mrf-step-number" },
                    `Step ${step.number}:`
                  ),
                  React.createElement(
                    "span",
                    { className: "mrf-step-title" },
                    step.title
                  )
                )
              )
            ),
            // Add illustration
            React.createElement(
              "div",
              { className: "mrf-sidebar-illustration" },
              React.createElement(FormIllustration)
            )
          )
        ),

        // Main Form
        React.createElement(
          "div",
          { className: "mrf-main-form" },
          React.createElement(
            "div",
            { className: "mrf-form-card" },
            renderStepContent(),

            // Buttons
            React.createElement(
              "div",
              { className: "mrf-form-buttons" },
              currentStep > 1 &&
                React.createElement(
                  "button",
                  {
                    className: "mrf-btn mrf-btn-secondary",
                    onClick: handlePrevious,
                    disabled: isSubmitting,
                  },
                  "Previous"
                ),
              React.createElement(
                "button",
                {
                  className: "mrf-btn mrf-btn-primary",
                  onClick: currentStep === 4 ? handleSubmit : handleNext,
                  disabled: isSubmitting,
                },
                isSubmitting &&
                  React.createElement("div", { className: "mrf-spinner" }),
                currentStep === 4
                  ? isSubmitting
                    ? "Submitting..."
                    : "Submit"
                  : "Save & Next"
              )
            )
          )
        ),

        // Right Sidebar - Instructions
        React.createElement(
          "div",
          { className: "mrf-sidebar-right" },
          React.createElement(
            "div",
            { className: "mrf-sidebar-card" },
            React.createElement(
              "h3",
              { className: "mrf-sidebar-title" },
              "Instructions"
            ),
            renderInstructions()
          )
        )
      )
    )
  );
};

// Make it globally available
window.MerchantRegistrationForm = MerchantRegistrationForm;
