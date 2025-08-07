import React from "react";

const FormProgress = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;

  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="msfm-progress-container">
      <div className="msfm-progress-bar">
        <div className="msfm-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="msfm-progress-steps">
        {steps.map((step) => (
          <div
            key={step}
            className={`msfm-progress-step ${
              step <= currentStep ? "msfm-progress-step-active" : ""
            }`}
          >
            <div className="msfm-progress-step-circle">
              {step < currentStep ? "✓" : step}
            </div>
            <span className="msfm-progress-step-label">
              {step === 1 && "Email"}
              {step === 2 && "Verify"}
              {step === 3 && "Details"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormProgress;
