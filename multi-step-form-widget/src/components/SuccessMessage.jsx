import React from "react";

const SuccessMessage = ({ message, details, sandboxUrl = "/sandbox" }) => {
  // Get the email from the details if available
  const email = details?.email || "user@memberstack.com";

  return (
    <div className="msfm-success-container">
      <div className="msfm-email-icon">📧</div>
      <p className="msfm-email-subtitle">
        You're almost there! We sent an email to
      </p>
      <p className="msfm-email-address">{email}</p>
      <p className="msfm-email-description">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      </p>

      <a href={sandboxUrl} className="msfm-sandbox-link">
        My Sandbox →
      </a>
    </div>
  );
};

export default SuccessMessage;
