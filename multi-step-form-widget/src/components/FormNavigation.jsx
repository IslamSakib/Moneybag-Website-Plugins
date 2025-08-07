import React from "react";

const FormNavigation = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isLoading,
  nextButtonText = "Next",
  showPrevious = true,
  showNext = true,
}) => {
  return (
    <div className="msfm-navigation">
      {showPrevious && currentStep > 1 && (
        <button
          type="button"
          onClick={onPrevious}
          className="msfm-btn msfm-btn-secondary"
          disabled={isLoading}
        >
          Previous
        </button>
      )}

      {showNext && (
        <button
          type="submit"
          onClick={onNext}
          className="msfm-btn msfm-btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="msfm-spinner"></span>
              Processing...
            </>
          ) : (
            nextButtonText
          )}
        </button>
      )}
    </div>
  );
};

export default FormNavigation;
