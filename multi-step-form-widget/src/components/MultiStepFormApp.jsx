import React, { useState, useCallback } from "react";
import FormProgress from "./FormProgress";
import FormStep from "./FormStep";
import SuccessMessage from "./SuccessMessage";
import { validateForm } from "../utils/validation";
import api from "../utils/api";

const MultiStepFormApp = ({
  formTitle,
  successMessage,
  sandboxUrl,
  showHeader = true,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [sessionId, setSessionId] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    firstName: "",
    lastName: "",
    mobileNumber: "",
    legalIdentityType: "",
    businessName: "",
    websiteAddress: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear error for this field when user types
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [errors]
  );

  const handleNext = async () => {
    // Validate current step
    const validationErrors = validateForm(formData, currentStep);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      switch (currentStep) {
        case 1:
          // Send email verification
          const emailResponse = await api.sendEmailVerification(formData.email);
          if (emailResponse.success) {
            // Store session_id from the response
            if (emailResponse.data?.session_id) {
              setSessionId(emailResponse.data.session_id);
            }
            setCurrentStep(2);
          } else {
            setErrors({
              email:
                emailResponse.data?.message ||
                "Failed to send verification email",
            });
          }
          break;

        case 2:
          // Verify OTP with session_id
          const otpResponse = await api.verifyOTP(sessionId, formData.otp);
          if (otpResponse.success && otpResponse.data?.verified) {
            setCurrentStep(3);
          } else {
            setErrors({ otp: otpResponse.data?.message || "Invalid OTP" });
          }
          break;

        case 3:
          // Submit business details with session_id
          const businessData = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            mobile_number: formData.mobileNumber,
            legal_identity_type: formData.legalIdentityType,
            business_name: formData.businessName,
            website_address: formData.websiteAddress,
            password: formData.password,
            email: formData.email,
          };

          const businessResponse = await api.submitBusinessDetails(
            businessData,
            sessionId
          );
          console.log("Business Details Response:", businessResponse);

          if (businessResponse.success) {
            // Log the actual data structure
            console.log("Success Data:", businessResponse.data);
            // Include the email in success details
            const successData = {
              ...businessResponse.data,
              email: formData.email,
            };
            setSuccessDetails(successData);
            setIsSuccess(true);
          } else {
            setErrors({
              general:
                businessResponse.data?.message || "Failed to create account",
            });
          }
          break;
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({
        general: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await api.sendEmailVerification(formData.email);
      if (response.success) {
        // Update session_id if provided
        if (response.data?.session_id) {
          setSessionId(response.data.session_id);
        }
      } else {
        setErrors({ otp: "Failed to resend OTP. Please try again." });
      }
    } catch (error) {
      setErrors({ otp: "Failed to resend OTP. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SuccessMessage
        message={successMessage}
        details={successDetails}
        sandboxUrl={sandboxUrl}
      />
    );
  }

  return (
    <>
      {showHeader && (
        <div className="msfm-page-header">
          <h1 className="msfm-page-title">Create Sandbox Account</h1>
          <p className="msfm-page-subtitle">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod
          </p>
        </div>
      )}
      <div className="msfm-container">
        <FormProgress currentStep={currentStep} totalSteps={3} />

        {errors.general && (
          <div className="msfm-error-box">{errors.general}</div>
        )}

        <FormStep
          step={currentStep}
          formData={formData}
          errors={errors}
          onChange={handleChange}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isLoading={isLoading}
          onResendOTP={handleResendOTP}
        />
      </div>
    </>
  );
};

export default MultiStepFormApp;
