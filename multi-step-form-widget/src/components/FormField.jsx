import React, { useState } from "react";

const FormField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  placeholder,
  options = [],
  showPassword = false,
  onTogglePassword,
  disabled = false,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const inputClasses = `
        msfm-input 
        ${error ? "msfm-input-error" : ""} 
        ${isFocused ? "msfm-input-focused" : ""}
    `;

  if (type === "select") {
    return (
      <div className="msfm-field">
        <label className="msfm-label">
          {label} {required && <span className="msfm-required">*</span>}
        </label>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={inputClasses}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="msfm-error">{error}</span>}
      </div>
    );
  }

  if (type === "password") {
    return (
      <div className="msfm-field">
        <label className="msfm-label">
          {label} {required && <span className="msfm-required">*</span>}
        </label>
        <div className="msfm-password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={inputClasses}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button
            type="button"
            className="msfm-password-toggle"
            onClick={onTogglePassword}
            tabIndex="-1"
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
        {error && <span className="msfm-error">{error}</span>}
      </div>
    );
  }

  return (
    <div className="msfm-field">
      <label className="msfm-label">
        {label} {required && <span className="msfm-required">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClasses}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {error && <span className="msfm-error">{error}</span>}
    </div>
  );
};

export default FormField;
