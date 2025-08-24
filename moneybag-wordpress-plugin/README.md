# Moneybag WordPress Plugin

A comprehensive WordPress plugin providing Elementor widgets for Moneybag payment gateway integration with modern React-based forms.

## 🎯 Overview

The Moneybag WordPress Plugin enables seamless integration of Moneybag payment services into WordPress websites through Elementor. It features three powerful widgets for merchant registration, pricing display, and sandbox testing.

## ✨ Features

### Three Specialized Widgets

1. **Merchant Registration Widget**
   - Multi-step registration form with progress tracking
   - Real-time field validation
   - Document upload support
   - Mobile-responsive design
   - Success confirmation with contact details

2. **Pricing Plan Widget**
   - Dynamic pricing calculation based on business category
   - Business category-based documentation requirements
   - Interactive consultation booking with CRM integration
   - Customizable pricing display with expandable service list
   - Duplicate contact handling for existing customers
   - Fallback local storage for offline/error scenarios

3. **Sandbox Form Widget**
   - Test payment integration
   - Email and OTP verification
   - Multi-step form flow
   - API testing capabilities

### Key Capabilities
- 🚀 WordPress built-in React system (no build process required)
- 📱 Fully responsive design for all devices
- 🎨 Elementor integration with live preview
- 🔒 Secure form handling with validation
- 🎯 Scoped CSS to prevent conflicts
- ⚡ Optimized performance without external dependencies

## 📋 Requirements

- WordPress 5.0 or higher
- Elementor 3.0 or higher (Free or Pro)
- PHP 7.4 or higher
- Modern browser with JavaScript enabled

## 🔧 Installation

1. **Download** the plugin folder
2. **Upload** to `/wp-content/plugins/moneybag-wordpress-plugin/`
3. **Activate** the plugin through WordPress admin panel
4. **Ensure** Elementor is installed and activated
5. **Configure** API settings in WordPress admin (optional)

## 📖 Usage

### Adding Widgets to Your Pages

1. **Edit** your page with Elementor
2. **Search** for "Moneybag" in the widgets panel
3. **Drag and drop** your desired widget:
   - Moneybag Merchant Registration
   - Moneybag Pricing Plan
   - Moneybag Sandbox Form
4. **Configure** widget settings as needed

### Admin Configuration

Navigate to **WordPress Admin → Settings → Moneybag** to configure:
- API endpoints
- API keys
- reCAPTCHA settings
- Default redirect URLs
- Email notifications

## 🏗️ File Structure

```
moneybag-wordpress-plugin/
├── moneybag-plugin.php              # Main plugin file
├── includes/
│   ├── admin/
│   │   └── admin-settings.php       # Admin configuration panel
│   └── widgets/
│       ├── merchant-registration-widget.php
│       ├── pricing-plan-widget.php
│       └── sandbox-form-widget.php
├── assets/
│   ├── css/
│   │   ├── merchant-registration.css
│   │   ├── pricing-plan.css
│   │   └── sandbox-form.css
│   ├── js/
│   │   ├── merchant-registration-wp.js  # Merchant form React component
│   │   ├── pricing-plan.js              # Pricing widget with CRM integration
│   │   ├── sandbox-form.js              # Sandbox testing form
│   │   ├── admin-crm.js                 # Admin panel scripts
│   │   └── editor.js                    # Elementor editor enhancements
│   └── image/
│       └── [brand assets]
├── data/
│   ├── merchant-registration-options.json
│   └── pricing-rules.json           # Business categories & document requirements
├── README.md
├── INSTALL.md                        # Installation guide
└── PRICING-PLAN-TESTING.md         # Testing documentation
```

## 🔌 API Integration

### Supported Endpoints

**Merchant Registration:**
- Stores data locally in WordPress
- Email notifications to admin and merchant
- Custom registration ID generation

**Pricing Plan:**
- Dynamic pricing calculation
- Business category mapping
- Document requirements lookup

**Sandbox Testing:**
- `/api/v2/sandbox/email-verification`
- `/api/v2/sandbox/verify-otp`
- `/api/v2/sandbox/merchants/business-details`

## 🛡️ Security Features

- WordPress nonce verification for AJAX requests
- Input sanitization and validation
- Secure API key storage in WordPress options
- XSS protection through proper escaping
- CSRF protection on all forms

## 🎨 Customization

### CSS Customization
All styles are scoped to prevent conflicts:
- `.moneybag-merchant-form-wrapper`
- `.moneybag-pricing-plan-wrapper`
- `.moneybag-sandbox-form-wrapper`

### Hooks and Filters
The plugin provides WordPress hooks for extensibility:
- Form submission actions
- Validation filters
- Email customization

## 📱 Mobile Optimization

- Responsive grid layouts
- Touch-friendly form controls
- Optimized spacing for mobile devices
- Single-column layouts on small screens
- Center-aligned contact information

## 🚀 Performance

- No external build dependencies
- Leverages WordPress's built-in React
- Lazy loading for images
- Optimized CSS delivery
- Minimal JavaScript footprint

## 🐛 Troubleshooting

### Common Issues

**Widget not appearing in Elementor:**
- Ensure Elementor is activated
- Check minimum version requirements
- Clear browser cache

**Forms not submitting:**
- Verify API settings in admin panel
- Check browser console for errors
- Ensure proper WordPress permissions
- Check if CRM API key is configured correctly

**CRM Duplicate Contact Errors:**
- The plugin now handles existing contacts gracefully
- Duplicate submissions will use existing contact records
- Form submissions continue even if contact exists

**Styling conflicts:**
- Check theme compatibility
- Use scoped CSS classes
- Contact support if issues persist

**Domain Validation Issues:**
- Domain field requires full URL (e.g., https://example.com)
- Both http:// and https:// protocols are accepted
- Domain is a required field for pricing form submission

## 📞 Support

For technical support and feature requests:
- **Phone:** +880 1958 109 228
- **Email:** info@moneybag.com.bd
- **Website:** https://moneybag.com.bd

## 🔄 Recent Updates

### Version 1.0.1
- Fixed CRM duplicate person handling
- Added search-before-create logic for contacts
- Implemented fallback storage for failed CRM submissions
- Made domain field properly mandatory with validation
- Cleaned up unused JavaScript files
- Improved error handling and user feedback

## 📄 License

This plugin is licensed under GPL v2 or later.

## 🙏 Credits

Developed by: Sakib Islam  
Company: Moneybag  
Version: 1.0.1

---

*For the latest updates and documentation, visit the official Moneybag website.*