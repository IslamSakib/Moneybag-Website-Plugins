import React, { useState, useCallback } from "react";

const PricingForm = ({ settings }) => {
  const [formData, setFormData] = useState({
    legalIdentity: "Educational Institute",
    businessCategory: "School",
    transactionVolume: "500000-600000",
    serviceType: "All",
  });
  const [showPricing, setShowPricing] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const legalIdentityOptions = [
    "Educational Institute",
    "Private Limited Company",
    "Public Limited Company",
    "Partnership Firm",
    "Sole Proprietorship",
    "NGO/Non-profit",
    "Government Organization",
  ];

  const businessCategoryOptions = [
    "School",
    "University",
    "E-commerce",
    "Healthcare",
    "Technology",
    "Manufacturing",
    "Retail",
    "Restaurant",
    "Travel & Tourism",
    "Financial Services",
    "Real Estate",
    "Others",
  ];

  const transactionVolumeOptions = [
    "Below 100,000",
    "100,000 - 500,000",
    "500,000 - 600,000",
    "600,000 - 1,000,000",
    "1,000,000 - 5,000,000",
    "Above 5,000,000",
  ];

  const serviceTypeOptions = [
    "All",
    "Online Payment Gateway",
    "Point of Sale (POS)",
    "Mobile Banking Integration",
    "Card Payment Processing",
    "Digital Wallet Integration",
    "Recurring Billing",
    "International Payments",
  ];

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.legalIdentity)
      newErrors.legalIdentity = "Please select legal identity";
    if (!formData.businessCategory)
      newErrors.businessCategory = "Please select business category";
    if (!formData.transactionVolume)
      newErrors.transactionVolume = "Please select transaction volume";
    if (!formData.serviceType)
      newErrors.serviceType = "Please select service type";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetPricing = () => {
    if (validateForm()) {
      setShowPricing(true);
    }
  };

  const handleBookAppointment = () => {
    setShowConsultation(true);
  };

  const validateConsultation = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.mobile?.trim())
      newErrors.mobile = "Mobile number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateConsultation()) return;

    setIsSubmitting(true);

    try {
      // WordPress AJAX submission
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("action", "submit_pricing_form");
      formDataToSubmit.append("nonce", window.moneyBagAjax.nonce);
      formDataToSubmit.append("form_data", JSON.stringify(formData));

      const response = await fetch(window.moneyBagAjax.ajaxurl, {
        method: "POST",
        body: formDataToSubmit,
      });

      const result = await response.json();

      if (result.success) {
        setShowThankYou(true);
      } else {
        alert("There was an error submitting the form. Please try again.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("There was an error submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showThankYou) {
    return (
      <div className="moneybag-thank-you">
        <div className="moneybag-logo">
          <svg width="80" height="80" viewBox="0 0 80 80" className="logo-svg">
            <defs>
              <style>
                {`.wifi-signal { fill: #ef4444; }`}
                {`.logo-m { fill: #64748b; font-family: Georgia, serif; font-size: 48px; font-weight: bold; }`}
              </style>
            </defs>
            {/* WiFi Signal */}
            <g className="wifi-signal" transform="translate(45, 15)">
              <path d="M0 5 L20 5 L17 0 L14 3 L11 0 Z" />
              <path d="M2 8 L18 8 L16 3 L14 6 L12 3 Z" />
              <path d="M4 11 L16 11 L15 6 L14 9 L13 6 Z" />
            </g>
            {/* Letter M */}
            <text x="40" y="55" textAnchor="middle" className="logo-m">
              M
            </text>
          </svg>
        </div>
        <h1>Thank You!</h1>
        <p>
          All set! Our team will reach out within 24 hours to schedule your
          50-minute consultation. Meanwhile, check your inbox for next steps.
        </p>
      </div>
    );
  }

  return (
    <div
      className="moneybag-pricing-form"
      style={{
        "--primary-color": settings?.primary_color || "#0ea5e9",
        "--secondary-color": settings?.secondary_color || "#f1f5f9",
      }}
    >
      <div
        className={`form-layout ${showConsultation ? "consultation-mode" : ""}`}
      >
        {/* LEFT SIDE - Form */}
        <div className="form-section">
          <div className="form-header">
            <h2>
              {showConsultation ? (
                <>
                  50 minutes
                  <br />
                  Expert Consultation
                </>
              ) : (
                <>
                  Pricing &<br />
                  Requirements
                </>
              )}
            </h2>
            {!showConsultation && (
              <p>
                Share your business details for a customized MoneyBag pricing
                quote and the exact documents needed to start accepting payments
                seamlessly.
              </p>
            )}
          </div>

          <div className="form-fields">
            <div className="main-fields">
              <div className="form-field">
                <label>Legal Identity</label>
                <select
                  value={formData.legalIdentity || ""}
                  onChange={(e) =>
                    updateFormData({ legalIdentity: e.target.value })
                  }
                  className={errors.legalIdentity ? "error" : ""}
                >
                  {legalIdentityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.legalIdentity && (
                  <div className="error-message">{errors.legalIdentity}</div>
                )}
              </div>

              <div className="form-field">
                <label>Business Category</label>
                <select
                  value={formData.businessCategory || ""}
                  onChange={(e) =>
                    updateFormData({ businessCategory: e.target.value })
                  }
                  className={errors.businessCategory ? "error" : ""}
                >
                  {businessCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.businessCategory && (
                  <div className="error-message">{errors.businessCategory}</div>
                )}
              </div>

              <div className="form-field">
                <label>Monthly Transaction Volume</label>
                <select
                  value={formData.transactionVolume || ""}
                  onChange={(e) =>
                    updateFormData({ transactionVolume: e.target.value })
                  }
                  className={errors.transactionVolume ? "error" : ""}
                >
                  {transactionVolumeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.transactionVolume && (
                  <div className="error-message">
                    {errors.transactionVolume}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Type of Service Needed</label>
                <select
                  value={formData.serviceType || ""}
                  onChange={(e) =>
                    updateFormData({ serviceType: e.target.value })
                  }
                  className={errors.serviceType ? "error" : ""}
                >
                  {serviceTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.serviceType && (
                  <div className="error-message">{errors.serviceType}</div>
                )}
              </div>
            </div>

            {/* Consultation Fields */}
            {showConsultation && (
              <div className="consultation-fields">
                <div className="form-row">
                  <div className="form-field">
                    <label>Domain Name</label>
                    <input
                      type="text"
                      value={formData.domainName || ""}
                      onChange={(e) =>
                        updateFormData({ domainName: e.target.value })
                      }
                      placeholder="yourdomain.com"
                    />
                  </div>

                  <div className="form-field">
                    <label>Maximum Amount in a Single Transaction</label>
                    <input
                      type="number"
                      value={formData.maxAmount || ""}
                      onChange={(e) =>
                        updateFormData({ maxAmount: e.target.value })
                      }
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div className="form-row-three">
                  <div className="form-field">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      placeholder="Your full name"
                      className={errors.name ? "error" : ""}
                    />
                    {errors.name && (
                      <div className="error-message">{errors.name}</div>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        updateFormData({ email: e.target.value })
                      }
                      placeholder="your@email.com"
                      className={errors.email ? "error" : ""}
                    />
                    {errors.email && (
                      <div className="error-message">{errors.email}</div>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      value={formData.mobile || ""}
                      onChange={(e) =>
                        updateFormData({ mobile: e.target.value })
                      }
                      placeholder="+880 1234567890"
                      className={errors.mobile ? "error" : ""}
                    />
                    {errors.mobile && (
                      <div className="error-message">{errors.mobile}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            {!showPricing && (
              <button className="btn-primary" onClick={handleGetPricing}>
                Get Pricing & Docs
              </button>
            )}

            {showPricing && !showConsultation && (
              <button
                className="btn-appointment"
                onClick={handleBookAppointment}
              >
                Book an Appointment →
              </button>
            )}

            {showConsultation && (
              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Content */}
        <div className="content-section">
          {!showPricing && (
            <div className="description-content">
              <p>
                Share your business details for a customized MoneyBag pricing
                quote and the exact documents needed to start accepting payments
                seamlessly.
              </p>
            </div>
          )}

          {showPricing && !showConsultation && (
            <div className="pricing-cards">
              {/* Required Documents Card */}
              <div className="card documents-card">
                <h3>Required Documents</h3>
                <div className="documents-list">
                  <div className="document-item">
                    <span className="checkmark">✓</span>
                    <span>Digital Business Identification Number (DBID)</span>
                  </div>
                  <div className="document-item">
                    <span className="checkmark">✓</span>
                    <span>TIN Certificate</span>
                  </div>
                  <div className="document-item">
                    <span className="checkmark">✓</span>
                    <span>MEF (Merchant Enrollment Form)</span>
                  </div>
                  <div className="document-item">
                    <span className="checkmark">✓</span>
                    <span>Trade License</span>
                  </div>
                  <div className="document-item">
                    <span className="checkmark">✓</span>
                    <span>VAT Document</span>
                    <span className="optional">Optional</span>
                  </div>
                  <div className="document-item">
                    <span className="checkmark">✓</span>
                    <span>Authorization letter for Signatories</span>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="card pricing-card">
                <h3>Pricing</h3>
                <div className="pricing-grid">
                  <div className="pricing-row">
                    <span>Monthly Fee</span>
                    <span>2.3%</span>
                  </div>
                  <div className="pricing-row">
                    <span>VISA</span>
                    <span>2.3%</span>
                  </div>
                  <div className="pricing-row">
                    <span>Mastercard</span>
                    <span>2.3%</span>
                  </div>
                  <div className="pricing-row">
                    <span>AMEX</span>
                    <span>2.3%</span>
                    <span>bKash</span>
                    <span>2.3%</span>
                  </div>
                  <div className="pricing-row">
                    <span>UnionPay</span>
                    <span>2.3%</span>
                    <span>Nagad</span>
                    <span>2.3%</span>
                  </div>
                  <div className="pricing-row">
                    <span>Diners Club</span>
                    <span>2.3%</span>
                    <span>Rocket</span>
                    <span>2.3%</span>
                  </div>
                  <div className="pricing-row">
                    <span>Nexus Card</span>
                    <span>2.3%</span>
                    <span>Upay</span>
                    <span>2.3%</span>
                  </div>
                </div>
                <p className="contact-note">
                  <a href="#">Contact us</a> to discuss your needs and negotiate
                  a better price.
                </p>
              </div>
            </div>
          )}

          {/* Consultation Right Side - Logo & Illustration */}
          {showConsultation && (
            <div className="consultation-content">
              <div className="consultation-illustration">
                <div className="moneybag-logo-consultation">
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 60 60"
                    className="logo-svg"
                  >
                    <defs>
                      <style>
                        {`.wifi-signal { fill: #ef4444; }`}
                        {`.logo-m { fill: #64748b; font-family: Georgia, serif; font-size: 36px; font-weight: bold; }`}
                      </style>
                    </defs>
                    {/* WiFi Signal */}
                    <g className="wifi-signal" transform="translate(35, 10)">
                      <path d="M0 4 L15 4 L13 0 L11 2 L9 0 Z" />
                      <path d="M2 6 L13 6 L12 2 L11 4 L10 2 Z" />
                      <path d="M3 8 L12 8 L11 4 L11 6 L10 4 Z" />
                    </g>
                    {/* Letter M */}
                    <text x="30" y="42" textAnchor="middle" className="logo-m">
                      M
                    </text>
                  </svg>
                </div>
                <div className="illustration-placeholder">
                  {/* This would be replaced with actual consultation illustration */}
                  <img
                    src="/wp-content/plugins/moneybag-pricing-form/assets/images/consultation-illustration.svg"
                    alt="Consultation"
                    className="consultation-img"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingForm;
