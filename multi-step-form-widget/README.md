# Multi-Step Form Widget for Elementor (Moneybag Integration)

A React-based multi-step form widget for Elementor that handles email verification, OTP verification, and business details collection through **Moneybag API integration**.

## 🎯 Pre-configured for Moneybag

✅ **Staging API**: `https://staging.api.moneybag.com.bd`  
✅ **All 3 endpoints**: Email verification, OTP verification, Business details  
✅ **Bangladesh business types**: Includes local business structures  
✅ **Ready to use**: No additional configuration needed

## Features

- **Multi-step process**: Email verification → OTP verification → Business details
- **Moneybag API integration**: Pre-configured for staging environment
- **Real-time validation**: Client-side and server-side validation
- **Responsive design**: Mobile-friendly interface
- **Elementor integration**: Full integration with Elementor page builder
- **Customizable styling**: Full control over appearance through Elementor
- **Progress indicator**: Visual progress tracking with clickable steps
- **OTP handling**: Automatic input focus and paste support
- **Resend functionality**: OTP resend with countdown timer

## API Endpoints (Pre-configured)

The plugin integrates with these Moneybag API endpoints:

- `POST /api/v2/sandbox/email-verification` - Email verification
- `POST /api/v2/sandbox/verify-otp` - OTP verification
- `POST /api/v2/sandbox/merchants/business-details` - Business details submission

**Base URL**: `https://staging.api.moneybag.com.bd`

## Installation

1. **Upload the plugin** to your WordPress `/wp-content/plugins/` directory
2. **Activate the plugin** through the 'Plugins' menu in WordPress
3. **Install dependencies** (if developing):
   ```bash
   npm install
   ```
