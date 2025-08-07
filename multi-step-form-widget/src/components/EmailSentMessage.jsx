import React from "react";

const EmailSentMessage = ({ email, sandboxUrl }) => {
  return (
    <div className="msfm-email-sent-container">
      <div className="msfm-email-icon">📧</div>
      <h2 className="msfm-email-title">
        You're almost there! We sent an email to
      </h2>
      <p className="msfm-email-address">{email}</p>
      <p className="msfm-email-description">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      </p>

      {sandboxUrl && (
        <a
          href={sandboxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="msfm-sandbox-link"
        >
          My Sandbox →
        </a>
      )}
    </div>
  );
};

export default EmailSentMessage;
