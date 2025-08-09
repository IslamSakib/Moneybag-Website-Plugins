import axios from "axios";

const API_BASE =
  window.msfm_ajax?.api_base ||
  "https://sandbox.api.moneybag.com.bd/api/v2/sandbox";
const AJAX_URL = window.msfm_ajax?.ajax_url || "/wp-admin/admin-ajax.php";
const NONCE = window.msfm_ajax?.nonce || "";

// Create axios instance for API calls
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Create axios instance for WordPress AJAX calls
const wpClient = axios.create({
  baseURL: AJAX_URL,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

// Helper function to convert object to form data
const objectToFormData = (obj) => {
  const formData = new FormData();
  Object.keys(obj).forEach((key) => {
    formData.append(key, obj[key]);
  });
  return formData;
};

// API functions
export const api = {
  // Email verification
  sendEmailVerification: async (email) => {
    const formData = objectToFormData({
      action: "msfm_email_verification",
      nonce: NONCE,
      email: email,
    });

    try {
      const response = await wpClient.post("", formData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.data?.message ||
          "Failed to send verification email"
      );
    }
  },

  // OTP verification
  verifyOTP: async (sessionId, otp) => {
    const formData = objectToFormData({
      action: "msfm_verify_otp",
      nonce: NONCE,
      session_id: sessionId,
      otp: otp,
    });

    try {
      const response = await wpClient.post("", formData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.data?.message || "Failed to verify OTP"
      );
    }
  },

  // Submit business details
  submitBusinessDetails: async (formData, sessionId) => {
    const data = objectToFormData({
      action: "msfm_submit_business_details",
      nonce: NONCE,
      ...formData,
      session_id: sessionId,
    });

    try {
      const response = await wpClient.post("", data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.data?.message ||
          "Failed to submit business details"
      );
    }
  },
};

export default api;
