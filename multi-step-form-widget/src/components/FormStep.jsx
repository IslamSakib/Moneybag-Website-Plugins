import React, { useState, useEffect } from "react";
import FormField from "./FormField";
import FormNavigation from "./FormNavigation";

const FormStep = ({
  step,
  formData,
  errors,
  onChange,
  onNext,
  onPrevious,
  isLoading,
  onResendOTP,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleResendOTP = () => {
    setTimer(300);
    setCanResend(false);
    onResendOTP();
  };

  const getNextButtonText = () => {
    if (step === 1) return "Send Verification Code";
    if (step === 2) return "Verify";
    if (step === 3) return "Get My Sandbox Access";
    return "Next";
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      {step === 1 && (
        <>
          <div className="msfm-step-header">
            <div className="msfm-icon">📧</div>
            <p className="msfm-step-description">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod
            </p>
          </div>
          <FormField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            error={errors.email}
            placeholder="Enter your email"
            required
          />
        </>
      )}

      {step === 2 && (
        <>
          <div className="msfm-step-header">
            <div className="msfm-icon">✅</div>
            <p className="msfm-step-description">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod
            </p>
            <div className="msfm-timer">{formatTimer(timer)}</div>
          </div>
          <FormField
            label="OTP"
            type="text"
            name="otp"
            value={formData.otp}
            onChange={onChange}
            error={errors.otp}
            placeholder="Enter 6-digit OTP"
            required
          />
          {canResend && (
            <button
              type="button"
              onClick={handleResendOTP}
              className="msfm-resend-btn"
            >
              Resend OTP
            </button>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div className="msfm-form-grid">
            <FormField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={onChange}
              error={errors.firstName}
              required
            />
            <FormField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={onChange}
              error={errors.lastName}
              required
            />
            <FormField
              label="Mobile Number"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={onChange}
              error={errors.mobileNumber}
              placeholder="01XXXXXXXXX"
              required
            />
            <FormField
              label="Legal Identity Type"
              type="select"
              name="legalIdentityType"
              value={formData.legalIdentityType}
              onChange={onChange}
              error={errors.legalIdentityType}
              options={[
                {
                  value: "Educational Institution",
                  label: "Educational Institution",
                },
                { value: "Corporation", label: "Corporation" },
                { value: "Sole Proprietorship", label: "Sole Proprietorship" },
                { value: "Partnership", label: "Partnership" },
                {
                  value: "Limited Liability Company",
                  label: "Limited Liability Company",
                },
                { value: "Public Company", label: "Public Company" },
                {
                  value: "Non-Governmental Organization",
                  label: "Non-Governmental Organization",
                },
                { value: "Other", label: "Other" },
              ]}
              required
            />
            <FormField
              label="Business Name"
              name="businessName"
              value={formData.businessName}
              onChange={onChange}
              error={errors.businessName}
              required
            />
            <FormField
              label="Website Address"
              name="websiteAddress"
              value={formData.websiteAddress}
              onChange={onChange}
              error={errors.websiteAddress}
              placeholder="https://example.com"
            />
            <FormField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              error={errors.password}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              required
            />
            <FormField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={onChange}
              error={errors.confirmPassword}
              showPassword={showConfirmPassword}
              onTogglePassword={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              required
            />
          </div>
          <div className="msfm-captcha">
            <input type="checkbox" id="human-verify" />
            <label htmlFor="human-verify">Verify you are human</label>
            <img
              src="https://via.placeholder.com/120x40?text=CAPTCHA"
              alt="CAPTCHA"
            />
          </div>
        </>
      )}

      <FormNavigation
        currentStep={step}
        totalSteps={3}
        onNext={onNext}
        onPrevious={onPrevious}
        isLoading={isLoading}
        nextButtonText={getNextButtonText()}
        showPrevious={step > 1}
      />
    </form>
  );
};

export default FormStep;
