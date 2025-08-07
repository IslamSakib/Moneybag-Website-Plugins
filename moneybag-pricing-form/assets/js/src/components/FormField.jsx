import React from "react";

const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  options = [],
  required = false,
  error = "",
  className = "",
  ...props
}) => {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const renderInput = () => {
    if (type === "select") {
      return (
        <select
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`form-control ${error ? "error" : ""} ${className}`}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`form-control ${error ? "error" : ""} ${className}`}
          required={required}
          {...props}
        />
      );
    }

    return (
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`form-control ${error ? "error" : ""} ${className}`}
        required={required}
        {...props}
      />
    );
  };

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FormField;
