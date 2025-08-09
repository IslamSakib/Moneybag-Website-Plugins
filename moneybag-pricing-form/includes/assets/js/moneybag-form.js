window.MoneybagPricingForm = function ({
  widgetTitle = "Pricing & Requirements",
  description = "Share your business details for a customized Moneybag pricing quote.",
  enableApi = false,
  apiEndpoint = "",
  primaryColor = "#374151",
  accentColor = "#3B82F6",
  backgroundColor = "#FEF8F9",
}) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    legalIdentity: "",
    businessCategory: "",
    monthlyTransactionVolume: "",
    serviceType: "",
    maxAmount: "",
    domainName: "",
    name: "",
    email: "",
    mobile: "",
  });
  const [pricingData, setPricingData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getPricingData = async () => {
    setLoading(true);
    setError("");

    try {
      const formDataObj = new FormData();
      formDataObj.append("action", "get_pricing_data");
      formDataObj.append("nonce", moneybagAjax.nonce);
      formDataObj.append("legalIdentity", formData.legalIdentity);
      formDataObj.append("businessCategory", formData.businessCategory);
      formDataObj.append(
        "monthlyTransactionVolume",
        formData.monthlyTransactionVolume
      );
      formDataObj.append("serviceType", formData.serviceType);

      const response = await fetch(moneybagAjax.ajaxurl, {
        method: "POST",
        body: formDataObj,
      });

      const result = await response.json();

      if (result.success) {
        setPricingData(result.data);
        nextStep();
      } else {
        setError("Failed to load pricing data");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      let submitEndpoint = moneybagAjax.ajaxurl;
      let submitData = new FormData();

      if (enableApi && apiEndpoint) {
        // Use external API
        submitEndpoint = apiEndpoint;
        submitData = JSON.stringify(formData);
      } else {
        // Use WordPress AJAX
        submitData.append("action", "submit_consultation");
        submitData.append("nonce", moneybagAjax.nonce);
        Object.keys(formData).forEach((key) => {
          submitData.append(key, formData[key]);
        });
      }

      const response = await fetch(submitEndpoint, {
        method: "POST",
        body: submitData,
        headers:
          enableApi && apiEndpoint
            ? {
                "Content-Type": "application/json",
              }
            : {},
      });

      const result = await response.json();

      if (result.success || response.ok) {
        setCurrentStep(4);
      } else {
        setError("Failed to submit consultation request");
      }
    } catch (err) {
      setError("Failed to submit form");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Initial Form
  const Step1 = () =>
    React.createElement(
      "div",
      { className: "form-container" },
      React.createElement(
        "div",
        { className: "form-content" },
        React.createElement(
          "div",
          { className: "form-section" },
          React.createElement(
            "h1",
            { className: "form-title" },
            widgetTitle.split("&").join("\n")
          ),

          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Legal Identity"),
            React.createElement(
              "select",
              {
                value: formData.legalIdentity,
                onChange: (e) =>
                  handleInputChange("legalIdentity", e.target.value),
                className: "form-select",
              },
              React.createElement("option", { value: "" }, "Select"),
              React.createElement(
                "option",
                { value: "Educational Institute" },
                "Educational Institute"
              ),
              React.createElement(
                "option",
                { value: "Corporation" },
                "Corporation"
              ),
              React.createElement(
                "option",
                { value: "Partnership" },
                "Partnership"
              ),
              React.createElement(
                "option",
                { value: "Sole Proprietorship" },
                "Sole Proprietorship"
              )
            )
          ),

          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Business Category"),
            React.createElement(
              "select",
              {
                value: formData.businessCategory,
                onChange: (e) =>
                  handleInputChange("businessCategory", e.target.value),
                className: "form-select",
              },
              React.createElement("option", { value: "" }, "Select"),
              React.createElement("option", { value: "School" }, "School"),
              React.createElement(
                "option",
                { value: "E-commerce" },
                "E-commerce"
              ),
              React.createElement(
                "option",
                { value: "Healthcare" },
                "Healthcare"
              ),
              React.createElement("option", { value: "Finance" }, "Finance")
            )
          ),

          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Monthly Transaction Volume"),
            React.createElement(
              "select",
              {
                value: formData.monthlyTransactionVolume,
                onChange: (e) =>
                  handleInputChange("monthlyTransactionVolume", e.target.value),
                className: "form-select",
              },
              React.createElement("option", { value: "" }, "Select"),
              React.createElement(
                "option",
                { value: "500000-600000" },
                "500000-600000"
              ),
              React.createElement(
                "option",
                { value: "100000-200000" },
                "100000-200000"
              ),
              React.createElement(
                "option",
                { value: "200000-300000" },
                "200000-300000"
              ),
              React.createElement(
                "option",
                { value: "300000-400000" },
                "300000-400000"
              )
            )
          ),

          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Type of Service Needed"),
            React.createElement(
              "select",
              {
                value: formData.serviceType,
                onChange: (e) =>
                  handleInputChange("serviceType", e.target.value),
                className: "form-select",
              },
              React.createElement("option", { value: "" }, "Multiple Select"),
              React.createElement("option", { value: "All" }, "All"),
              React.createElement(
                "option",
                { value: "Payment Gateway" },
                "Payment Gateway"
              ),
              React.createElement(
                "option",
                { value: "Merchant Account" },
                "Merchant Account"
              ),
              React.createElement(
                "option",
                { value: "API Integration" },
                "API Integration"
              )
            )
          ),

          error &&
            React.createElement("div", { className: "error-message" }, error),

          React.createElement(
            "button",
            {
              className: "primary-button",
              onClick: getPricingData,
              disabled:
                loading ||
                !formData.legalIdentity ||
                !formData.businessCategory ||
                !formData.monthlyTransactionVolume ||
                !formData.serviceType,
            },
            loading ? "Loading..." : "Get Pricing & Docs"
          )
        ),

        React.createElement(
          "div",
          { className: "description-section" },
          React.createElement(
            "p",
            { className: "description-text" },
            description
          )
        )
      )
    );

  // Step 2: Results with Pricing and Documents
  const Step2 = () =>
    React.createElement(
      "div",
      { className: "form-container" },
      React.createElement(
        "div",
        { className: "form-content" },
        React.createElement(
          "div",
          { className: "form-section" },
          React.createElement(
            "h1",
            { className: "form-title" },
            widgetTitle.split("&").join("\n")
          ),

          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Legal Identity"),
            React.createElement(
              "select",
              {
                value: formData.legalIdentity,
                onChange: (e) =>
                  handleInputChange("legalIdentity", e.target.value),
                className: "form-select",
              },
              React.createElement(
                "option",
                { value: formData.legalIdentity },
                formData.legalIdentity
              )
            )
          ),

          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Business Category"),
            React.createElement(
              "select",
              {
                value: formData.businessCategory,
                className: "form-select",
              },
              React.createElement(
                "option",
                { value: formData.businessCategory },
                formData.businessCategory
              )
            )
          ),

          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Monthly Transaction Volume"),
            React.createElement(
              "select",
              {
                value: formData.monthlyTransactionVolume,
                className: "form-select",
              },
              React.createElement(
                "option",
                { value: formData.monthlyTransactionVolume },
                formData.monthlyTransactionVolume
              )
            )
          ),

          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Type of Service Needed"),
            React.createElement(
              "select",
              {
                value: formData.serviceType,
                className: "form-select",
              },
              React.createElement(
                "option",
                { value: formData.serviceType },
                formData.serviceType
              )
            )
          ),

          React.createElement(
            "button",
            {
              className: "secondary-button",
              onClick: nextStep,
            },
            "Book an Appointment →"
          )
        ),

        React.createElement(
          "div",
          { className: "results-section" },
          React.createElement(
            "div",
            { className: "results-card documents-card" },
            React.createElement(
              "h3",
              { className: "card-title" },
              "Required Documents"
            ),
            React.createElement(
              "div",
              { className: "document-list" },
              pricingData && pricingData.documents
                ? pricingData.documents.map((doc, index) =>
                    React.createElement(
                      "div",
                      { className: "document-item", key: index },
                      "✓ ",
                      doc
                    )
                  )
                : [
                    React.createElement(
                      "div",
                      { className: "document-item", key: 0 },
                      "✓ Digital Business Identification Number (DBID)"
                    ),
                    React.createElement(
                      "div",
                      { className: "document-item", key: 1 },
                      "✓ TIN Certificate"
                    ),
                    React.createElement(
                      "div",
                      { className: "document-item", key: 2 },
                      "✓ MEF (Merchant Enrollment Form)"
                    ),
                    React.createElement(
                      "div",
                      { className: "document-item", key: 3 },
                      "✓ Trade License"
                    ),
                    React.createElement(
                      "div",
                      { className: "document-item", key: 4 },
                      "✓ VAT Document ",
                      React.createElement(
                        "span",
                        { className: "optional" },
                        "Optional"
                      )
                    ),
                    React.createElement(
                      "div",
                      { className: "document-item", key: 5 },
                      "✓ Authorization letter for signatories"
                    ),
                  ]
            )
          ),

          React.createElement(
            "div",
            { className: "results-card pricing-card" },
            React.createElement("h3", { className: "card-title" }, "Pricing"),
            React.createElement(
              "div",
              { className: "pricing-grid" },
              // Monthly Fee
              pricingData &&
                pricingData.pricing &&
                pricingData.pricing.monthlyFee &&
                React.createElement(
                  "div",
                  { className: "pricing-row header-row" },
                  React.createElement("span", null, "Monthly Fee"),
                  React.createElement(
                    "span",
                    null,
                    pricingData.pricing.monthlyFee
                  )
                ),

              // Cards Section
              pricingData &&
                pricingData.pricing &&
                (pricingData.pricing.visa ||
                  pricingData.pricing.mastercard ||
                  pricingData.pricing.amex) &&
                React.createElement(
                  "div",
                  { className: "pricing-section" },
                  React.createElement(
                    "div",
                    { className: "pricing-section-title" },
                    "Credit/Debit Cards"
                  ),
                  pricingData.pricing.visa &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "VISA"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.visa
                      )
                    ),
                  pricingData.pricing.mastercard &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "Mastercard"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.mastercard
                      )
                    ),
                  pricingData.pricing.amex &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "AMEX"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.amex
                      )
                    ),
                  pricingData.pricing.unionpay &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "UnionPay"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.unionpay
                      )
                    ),
                  pricingData.pricing.dinersClub &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "Diners Club"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.dinersClub
                      )
                    ),
                  pricingData.pricing.nexusCard &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "Nexus Card"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.nexusCard
                      )
                    )
                ),

              // Mobile Wallets Section
              pricingData &&
                pricingData.pricing &&
                (pricingData.pricing.bkash ||
                  pricingData.pricing.nagad ||
                  pricingData.pricing.rocket) &&
                React.createElement(
                  "div",
                  { className: "pricing-section" },
                  React.createElement(
                    "div",
                    { className: "pricing-section-title" },
                    "Mobile Wallets"
                  ),
                  pricingData.pricing.bkash &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "bKash"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.bkash
                      )
                    ),
                  pricingData.pricing.nagad &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "Nagad"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.nagad
                      )
                    ),
                  pricingData.pricing.rocket &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "Rocket"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.rocket
                      )
                    ),
                  pricingData.pricing.upay &&
                    React.createElement(
                      "div",
                      { className: "pricing-row" },
                      React.createElement("span", null, "Upay"),
                      React.createElement(
                        "span",
                        null,
                        pricingData.pricing.upay
                      )
                    )
                ),

              // Fallback to old structure if no specific cards/wallets data
              !pricingData ||
                (!pricingData.pricing.visa && !pricingData.pricing.bkash)
                ? [
                    React.createElement(
                      "div",
                      { className: "pricing-row", key: 0 },
                      React.createElement("span", null, "Monthly Fee"),
                      React.createElement("span", null, "2.3%")
                    ),
                    React.createElement(
                      "div",
                      { className: "pricing-row", key: 1 },
                      React.createElement("span", null, "VISA"),
                      React.createElement("span", null, "2.3%")
                    ),
                    React.createElement(
                      "div",
                      { className: "pricing-row", key: 2 },
                      React.createElement("span", null, "Mastercard"),
                      React.createElement("span", null, "2.3%")
                    ),
                    React.createElement(
                      "div",
                      { className: "pricing-row pricing-row-split", key: 3 },
                      React.createElement("span", null, "AMEX"),
                      React.createElement("span", null, "2.3%"),
                      React.createElement("span", null, "bKash"),
                      React.createElement("span", null, "2.3%")
                    ),
                    React.createElement(
                      "div",
                      { className: "pricing-row pricing-row-split", key: 4 },
                      React.createElement("span", null, "UnionPay"),
                      React.createElement("span", null, "2.3%"),
                      React.createElement("span", null, "Nagad"),
                      React.createElement("span", null, "2.3%")
                    ),
                    React.createElement(
                      "div",
                      { className: "pricing-row pricing-row-split", key: 5 },
                      React.createElement("span", null, "Diners Club"),
                      React.createElement("span", null, "2.3%"),
                      React.createElement("span", null, "Rocket"),
                      React.createElement("span", null, "2.3%")
                    ),
                    React.createElement(
                      "div",
                      { className: "pricing-row pricing-row-split", key: 6 },
                      React.createElement("span", null, "Nexus Card"),
                      React.createElement("span", null, "2.3%"),
                      React.createElement("span", null, "Upay"),
                      React.createElement("span", null, "2.3%")
                    ),
                  ]
                : null
            ),

            // Negotiation text
            pricingData && pricingData.negotiation_text
              ? React.createElement(
                  "p",
                  { className: "contact-text" },
                  React.createElement(
                    "a",
                    { href: "#", className: "contact-link" },
                    "Contact us"
                  ),
                  " ",
                  pricingData.negotiation_text.replace("Contact us", "").trim()
                )
              : React.createElement(
                  "p",
                  { className: "contact-text" },
                  React.createElement(
                    "a",
                    { href: "#", className: "contact-link" },
                    "Contact us"
                  ),
                  " to discuss your needs and negotiate a better price."
                )
          )
        )
      )
    );

  // Step 3: Expert Consultation Form
  const Step3 = () =>
    React.createElement(
      "div",
      { className: "form-container" },
      React.createElement(
        "div",
        { className: "form-content" },
        React.createElement(
          "div",
          { className: "form-section consultation-form" },
          React.createElement(
            "h1",
            { className: "form-title" },
            "50 minutes\nExpert Consultation"
          ),

          React.createElement(
            "div",
            { className: "form-row" },
            React.createElement(
              "div",
              { className: "form-group half-width" },
              React.createElement("label", null, "Legal Identity"),
              React.createElement(
                "select",
                {
                  value: formData.legalIdentity,
                  className: "form-select",
                },
                React.createElement(
                  "option",
                  { value: formData.legalIdentity },
                  formData.legalIdentity
                )
              )
            ),
            React.createElement(
              "div",
              { className: "form-group half-width" },
              React.createElement("label", null, "Business Category"),
              React.createElement(
                "select",
                {
                  value: formData.businessCategory,
                  className: "form-select",
                },
                React.createElement(
                  "option",
                  { value: formData.businessCategory },
                  formData.businessCategory
                )
              )
            )
          ),

          React.createElement(
            "div",
            { className: "form-row" },
            React.createElement(
              "div",
              { className: "form-group half-width" },
              React.createElement("label", null, "Monthly Transaction Volume"),
              React.createElement(
                "select",
                {
                  value: formData.monthlyTransactionVolume,
                  className: "form-select",
                },
                React.createElement(
                  "option",
                  { value: formData.monthlyTransactionVolume },
                  formData.monthlyTransactionVolume
                )
              )
            ),
            React.createElement(
              "div",
              { className: "form-group half-width" },
              React.createElement(
                "label",
                null,
                "Maximum Amount in a Single Transaction"
              ),
              React.createElement("input", {
                type: "text",
                value: formData.maxAmount,
                onChange: (e) => handleInputChange("maxAmount", e.target.value),
                className: "form-input",
              })
            )
          ),

          React.createElement(
            "div",
            { className: "form-row" },
            React.createElement(
              "div",
              { className: "form-group half-width" },
              React.createElement("label", null, "Domain Name"),
              React.createElement("input", {
                type: "text",
                value: formData.domainName,
                onChange: (e) =>
                  handleInputChange("domainName", e.target.value),
                className: "form-input",
              })
            ),
            React.createElement(
              "div",
              { className: "form-group half-width" },
              React.createElement("label", null, "Type of Service Needed"),
              React.createElement(
                "select",
                {
                  value: formData.serviceType,
                  className: "form-select",
                },
                React.createElement(
                  "option",
                  { value: formData.serviceType },
                  formData.serviceType
                )
              )
            )
          ),

          React.createElement(
            "div",
            { className: "form-row" },
            React.createElement(
              "div",
              { className: "form-group third-width" },
              React.createElement("label", null, "Name"),
              React.createElement("input", {
                type: "text",
                value: formData.name,
                onChange: (e) => handleInputChange("name", e.target.value),
                className: "form-input",
              })
            ),
            React.createElement(
              "div",
              { className: "form-group third-width" },
              React.createElement("label", null, "Email"),
              React.createElement("input", {
                type: "email",
                value: formData.email,
                onChange: (e) => handleInputChange("email", e.target.value),
                className: "form-input",
              })
            ),
            React.createElement(
              "div",
              { className: "form-group third-width" },
              React.createElement("label", null, "Mobile Number"),
              React.createElement("input", {
                type: "tel",
                value: formData.mobile,
                onChange: (e) => handleInputChange("mobile", e.target.value),
                className: "form-input",
              })
            )
          ),

          error &&
            React.createElement("div", { className: "error-message" }, error),

          React.createElement(
            "button",
            {
              className: "primary-button",
              onClick: handleSubmit,
              disabled:
                loading ||
                !formData.name ||
                !formData.email ||
                !formData.mobile,
            },
            loading ? "Submitting..." : "Submit"
          )
        ),

        React.createElement(
          "div",
          { className: "consultation-illustration" },
          React.createElement(
            "div",
            { className: "logo" },
            React.createElement("div", { className: "logo-icon" }, "M"),
            React.createElement("div", { className: "wifi-symbol" }, "📶")
          ),
          React.createElement(
            "div",
            { className: "meeting-illustration" },
            React.createElement(
              "div",
              { style: { textAlign: "center", padding: "40px" } },
              React.createElement("h3", null, "Expert Consultation"),
              React.createElement(
                "p",
                null,
                "Schedule your 50-minute consultation with our payment experts."
              )
            )
          )
        )
      )
    );

  // Step 4: Thank You Page
  const Step4 = () =>
    React.createElement(
      "div",
      { className: "form-container" },
      React.createElement(
        "div",
        { className: "thank-you-section" },
        React.createElement(
          "div",
          { className: "logo" },
          React.createElement("div", { className: "logo-icon" }, "M"),
          React.createElement("div", { className: "wifi-symbol" }, "📶")
        ),
        React.createElement(
          "h1",
          { className: "thank-you-title" },
          "Thank You!"
        ),
        React.createElement(
          "p",
          { className: "thank-you-text" },
          "All set! Our team will reach out within 24 hours to schedule your 50-minute consultation. Meanwhile, check your inbox for next steps."
        )
      )
    );

  const getBackgroundStyles = () => ({
    background: backgroundColor,
    "--primary-color": primaryColor,
    "--accent-color": accentColor,
    "--background-color": backgroundColor,
  });

  return React.createElement(
    "div",
    {
      className: "moneybag-app",
      style: getBackgroundStyles(),
    },
    React.createElement(
      "div",
      { className: "background-decoration" },
      React.createElement("div", { className: "circle-1" }),
      React.createElement("div", { className: "circle-2" }),
      React.createElement("div", { className: "wave-pattern" })
    ),

    currentStep === 1 && Step1(),
    currentStep === 2 && Step2(),
    currentStep === 3 && Step3(),
    currentStep === 4 && Step4()
  );
};
