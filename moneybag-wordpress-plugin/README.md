# Moneybag WordPress Plugin

A comprehensive WordPress plugin providing Elementor widgets for Moneybag payment gateway integration with modern React-based forms, unified global CRM integration, and optimized styling system.

## 🎯 Overview

The Moneybag WordPress Plugin enables seamless integration of Moneybag payment services into WordPress websites through Elementor. It features four streamlined widgets for merchant registration, customer contact forms, pricing display, and sandbox testing - all powered by a unified global CRM system and optimized CSS architecture.

## ✨ Features

### Four Specialized Widgets

1. **Merchant Registration Widget**
   - Multi-step registration form with progress tracking
   - Real-time field validation with visual feedback
   - Document upload support
   - **Full CRM Integration** - automatic contact, opportunity, and notes creation
   - Mobile-responsive design with 2-column service layout
   - Success confirmation with contact details
   - No customization controls - uses global styling

2. **Contact Form Widget**
   - Professional contact form for customer inquiries
   - **Complete CRM Integration** - creates people, opportunities, and notes
   - Multiple inquiry types (General, Technical Support, Pricing, etc.)
   - Required fields: Name, Email, Phone, Company
   - Optional message field for detailed inquiries
   - Company information stored in dedicated CRM company fields
   - Responsive design with consistent styling
   - No customization controls - uses global styling

3. **Pricing Plan Widget**
   - Dynamic pricing calculation based on business category
   - Business category-based documentation requirements
   - Interactive consultation booking with CRM integration
   - Responsive typography scaling across all devices
   - Duplicate contact handling for existing customers
   - Optimized content positioning and spacing
   - No customization controls - uses global styling

4. **Sandbox Form Widget**
   - Test payment integration
   - Email and OTP verification
   - Multi-step form flow
   - API testing capabilities
   - No customization controls - uses global styling

### Key Capabilities
- 🚀 WordPress built-in React system (no build process required)
- 📱 Fully responsive design optimized for all devices
- 🎨 Elementor integration with live preview
- 🔒 Secure form handling with comprehensive validation
- 🎯 Unified global CSS system preventing conflicts
- ⚡ Optimized performance with minimal dependencies
- 🔧 Simplified widget implementation without customization complexity
- 🏢 **Unified Global CRM System** - single API call creates person, opportunity, and notes
- 🔄 **Centralized Validation** - consistent field validation across all widgets
- 🚫 **No Code Duplication** - all forms use the same backend methods

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
   - Moneybag Contact Form
   - Moneybag Pricing Plan
   - Moneybag Sandbox Form
4. **No configuration needed** - widgets use optimized global styles automatically

### Admin Configuration

Navigate to **WordPress Admin → Settings → Moneybag** to configure:
- API endpoints
- API keys
- **CRM API settings** (URL and API key for contact/opportunity creation)
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
│   ├── class-moneybag-api.php       # API integration layer
│   └── widgets/
│       ├── merchant-registration-widget.php
│       ├── contact-form-widget.php
│       ├── pricing-plan-widget.php
│       └── sandbox-form-widget.php
├── assets/
│   ├── css/
│   │   └── moneybag-global.css      # Unified, optimized global styles
│   ├── js/
│   │   ├── merchant-registration-wp.js  # Merchant form React component
│   │   ├── contact-form.js              # Contact form React component
│   │   ├── pricing-plan.js              # Pricing widget with CRM integration
│   │   ├── sandbox-form.js              # Sandbox testing form
│   │   ├── admin-crm.js                 # Admin panel scripts
│   │   ├── editor.js                    # Elementor editor enhancements
│   │   └── form-validator.js            # Form validation utilities
│   └── image/
│       ├── Right.webp
│       ├── emojione_e-mail.webp
│       ├── icon_moneybag.webp
│       ├── img_join now.webp
│       └── streamline-freehand-color_password-approved.webp
├── data/
│   ├── merchant-registration-options.json
│   └── pricing-rules.json           # Business categories & document requirements
├── README.md
└── package.json
```

## 🔌 API Integration

### Supported Endpoints

**Merchant Registration:**
- Stores data locally in WordPress
- **Full CRM Integration:**
  - Automatic contact/person creation with proper data mapping
  - Business opportunity creation linked to contact
  - Detailed notes with all registration information
  - Bangladesh phone number formatting (+880 country code)
- Email notifications to admin and merchant
- Custom registration ID generation

**Contact Form:**
- **Complete CRM Integration:**
  - Creates people in CRM with company information in dedicated company field
  - Creates opportunities linked to person with company data
  - Generates detailed notes with all inquiry information
  - Handles existing contacts gracefully (no duplicates)
- Multiple inquiry types: General, Account Setup, Technical Support, etc.
- Required fields validation: Name, Email, Phone, Company
- Optional detailed message field

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

## 🎨 Styling System

### Global CSS Architecture
All widgets now use a unified global CSS system:
- **Single CSS file:** `moneybag-global.css` (optimized and deduplicated)
- **Consistent styling** across all widgets
- **Responsive design** with optimized typography scaling
- **Performance optimized** with removed duplicate styles and keyframes

### CSS Classes
- `.moneybag-form` - Global form styling
- `.merchant-form-container` - Merchant registration specific
- `.pricing-plan-container` - Pricing plan specific
- `.moneybag-form-container` - Sandbox form specific

### Responsive Breakpoints
- **Desktop (1400px+):** Full-featured layout
- **Medium Laptop (max-width: 1400px):** Scaled layout
- **Laptop (1024px-1200px):** Optimized for smaller screens
- **Tablet (768px-1024px):** Single column with adapted typography
- **Mobile (max-width: 768px):** Mobile-first optimized layout

## 📱 Mobile Optimization

- Responsive grid layouts with automatic column adjustment
- Touch-friendly form controls with proper spacing
- Optimized typography scaling for all device sizes
- Single-column layouts on small screens
- Center-aligned content and contact information
- 2-column service checkboxes on mobile devices
- Reordered elements for mobile user experience

## 🚀 Performance Optimizations

- **CSS Optimization:** Removed duplicate keyframes and redundant styles
- **File Size Reduction:** Global CSS optimized by ~20 lines
- **No Build Dependencies:** Leverages WordPress's built-in React
- **Lazy Loading:** Optimized image delivery
- **Minimal JavaScript:** Efficient form handling
- **Scoped Styles:** Prevents theme conflicts

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

**CRM Integration Issues:**
- Contact Form and Merchant Registration both require CRM API configuration
- The plugin handles existing contacts gracefully (no duplicates)
- Company information is stored in dedicated CRM company fields
- All form submissions create linked opportunities and detailed notes
- Check WordPress debug logs for detailed API response information

**Styling issues:**
- All styling is now handled globally
- No widget-level customization needed
- Contact support if conflicts persist

**Domain Validation Issues:**
- Domain field requires full URL (e.g., https://example.com)
- Both http:// and https:// protocols are accepted
- Domain is required for pricing form submission

## 📞 Support

For technical support and feature requests:
- **Contact:** +8801950025990
- **Email:** info@moneybag.com.bd
- **Website:** https://moneybag.com.bd

## 🔄 Recent Updates

### Version 2.0.1 (Latest - Code Cleanup)
- **Code Cleanup & Optimization:**
  - Removed duplicate `submit_merchant_registration()` legacy method
  - Eliminated duplicate `init_admin()` function that caused fatal errors
  - Fixed method name conflicts in main plugin file
  - Streamlined AJAX handlers for better maintainability
- **Architecture Improvements:**
  - All merchant registration now uses modern `handle_merchant_api` endpoint
  - Removed legacy email notification system code
  - Cleaner separation between API methods
  - Improved error handling and validation flow
- **Security Enhancements:**
  - Consolidated API validation in centralized handlers
  - Removed redundant security checks
  - Improved nonce verification consistency
- **Performance Optimizations:**
  - Reduced plugin file size by removing duplicate code
  - Faster loading with streamlined function calls
  - Cleaner memory usage with removed legacy methods

### Version 2.0.0 (Major Release)
- **New Contact Form Widget:** Professional contact form with complete CRM integration
- **Major Refactor:** Unified all widget styling into global CSS system  
- **Widget Simplification:** Removed all Elementor customization controls
- **Enhanced CRM Integration:** Complete CRM integration for both merchant registration and contact forms
- **CSS Optimization:** Removed duplicate styles, keyframes, and dead code
- **Responsive Enhancement:** Improved typography scaling across all devices
- **Mobile Optimization:** Enhanced mobile layouts and spacing

### v2.1.0 (December 2025) - Global CRM System
- 🌟 **Global CRM Integration:** Unified CRM system across all widgets
- 🔄 **Single API Calls:** Each form makes one unified CRM submission
- 🚫 **Eliminated Duplicates:** Removed old individual CRM handlers
- 📱 **Mobile Number Validation:** Enhanced Bangladesh phone number support
- ⚡ **Performance Boost:** Reduced API calls and code complexity  
- 🔧 **Centralized Validation:** All forms use global validation system
- 🎨 **Form Consistency:** Unified error handling and visual feedback

### Previous Updates (v2.0.1)
- **Major Refactor:** Unified all widget styling into global CSS system
- **Widget Simplification:** Removed all Elementor customization controls
- **Enhanced CRM Integration:** Complete CRM integration for forms
- **CSS Optimization:** Removed duplicate styles and dead code
- **Responsive Enhancement:** Improved typography scaling
- **Mobile Optimization:** Enhanced mobile layouts and spacing

### Previous Updates (v1.0.1)
- Fixed CRM duplicate person handling
- Added search-before-create logic for contacts
- Implemented fallback storage for failed CRM submissions
- Made domain field properly mandatory with validation
- Cleaned up unused JavaScript files
- Improved error handling and user feedback

## 📄 License

This plugin is licensed under GPL v2 or later.

## 🙏 Credits

**Developed by:** Sakib Islam  
**Contact:** +8801950025990  
**Company:** Moneybag  
**Version:** 2.1.0  
**Last Updated:** December 2025

---

*For the latest updates and documentation, visit the official Moneybag website.*