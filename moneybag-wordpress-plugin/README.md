# Moneybag WordPress Plugin

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
![WordPress](https://img.shields.io/badge/WordPress-5.0%2B-green.svg)
![Elementor](https://img.shields.io/badge/Elementor-3.0%2B-purple.svg)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4.svg)
![License](https://img.shields.io/badge/license-GPL--2.0--or--later-orange.svg)

A comprehensive, enterprise-grade WordPress plugin for Moneybag payment gateway integration. Features merchant registration, pricing calculators, and sandbox testing capabilities through optimized Elementor widgets with React components.

## 🚀 Features

### Core Functionality
- **🏪 Merchant Registration**: Multi-step form for business onboarding
- **💰 Dynamic Pricing Calculator**: Real-time pricing based on business category
- **🧪 Sandbox Testing**: Test payment gateway integration
- **📞 Contact Form**: Integrated customer support system
- **🔒 Enterprise Security**: Input sanitization, nonce verification, and secure API handling

### Technical Features
- **Elementor Integration**: Drag-and-drop widgets with no configuration required
- **React Components**: Modern UI built with WordPress's wp-element
- **Responsive Design**: Mobile-first approach with optimized breakpoints
- **Global CSS System**: Unified styling across all widgets (single CSS file)
- **CRM Integration**: Automatic lead capture and management
- **reCAPTCHA Support**: Bot protection for forms
- **Code Optimization**: Clean, maintainable codebase with enterprise standards
- **Performance Optimized**: Minimal file loading and efficient resource management

## 📦 Installation

### Requirements
- WordPress 5.0 or higher
- Elementor Page Builder 3.0+
- PHP 7.4 or higher
- MySQL 5.6 or higher

### Installation Steps

1. **Download the Plugin**
   ```bash
   git clone https://github.com/yourusername/moneybag-wordpress-plugin.git
   ```

2. **Upload to WordPress**
   - Copy the `moneybag-wordpress-plugin` folder to `/wp-content/plugins/`
   - Or upload the ZIP file through WordPress Admin > Plugins > Add New

3. **Activate the Plugin**
   - Navigate to WordPress Admin > Plugins
   - Find "Moneybag Payment Gateway" and click "Activate"

4. **Configure Settings**
   - Go to WordPress Admin > Moneybag Settings
   - Enter your API credentials:
     - Sandbox API URL
     - CRM API Key
     - reCAPTCHA Keys (optional)

## 🎨 Available Widgets

### 1. Merchant Registration Widget
Streamlined 3-step registration form with:
- Business information collection
- Online presence details (optional business website)
- Contact information and legal identity selection
- Secure API integration without file uploads
- Simplified user experience

### 2. Pricing Plan Widget
Interactive pricing calculator featuring:
- Business category selection
- Legal identity options
- Dynamic document requirements
- Real-time pricing display

### 3. Sandbox Form Widget
Test environment integration with:
- Email/phone verification
- OTP authentication with countdown timer
- Business details submission
- Direct sandbox login redirect

### 4. Contact Form Widget
Customer support form with:
- Name, email, and phone fields
- Message submission
- CRM integration

## 🔧 Configuration

### API Settings
Navigate to **WordPress Admin > Moneybag Settings** to configure:

```php
// Sandbox API URL
https://sandbox-api.moneybag.com.bd/api/v1

// CRM API Endpoint
https://api.close.com/api/v1
```

### Widget Usage
1. Edit any page with Elementor
2. Search for "Moneybag" in the widget panel
3. Drag desired widget to your page
4. No additional configuration needed (uses global settings)

## 🏗️ Project Structure

```
moneybag-wordpress-plugin/
├── assets/
│   ├── css/
│   │   └── moneybag-global.css    # Unified styles
│   ├── js/
│   │   ├── merchant-registration-wp.js
│   │   ├── pricing-plan.js
│   │   ├── sandbox-form.js
│   │   └── form-validator.js
│   └── image/                     # Optimized WebP images
├── includes/
│   ├── admin/
│   │   └── admin-settings.php    # Admin panel
│   ├── widgets/                  # Elementor widgets
│   └── class-moneybag-api.php    # API handler
├── data/
│   ├── pricing-rules.json        # Pricing configuration
│   └── merchant-registration-options.json
└── moneybag-plugin.php          # Main plugin file
```

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized using WordPress functions
- **Output Escaping**: All outputs are properly escaped
- **Nonce Verification**: AJAX requests include security nonces
- **API Key Protection**: Sensitive data stored securely in WordPress options
- **SQL Injection Prevention**: Uses WordPress prepared statements
- **XSS Protection**: Content Security Policy headers

## 🎯 Development

### Requirements for Development
- Node.js 14+ (for development tools)
- Composer (for PHP dependencies)
- Local WordPress environment (XAMPP, WAMP, Local, etc.)

### Code Standards
- **PHP**: WordPress Coding Standards
- **JavaScript**: ES6+ with WordPress's wp-element (React)
- **CSS**: BEM methodology with responsive design

### Key Technologies
- **Frontend**: React (wp-element), ES6 JavaScript
- **Backend**: PHP 7.4+, WordPress APIs
- **Styling**: Custom CSS with Poppins font
- **Build**: No build process required (uses WordPress's built-in React)

## 📊 Browser Support

- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)
- ⚠️ Internet Explorer (not supported)

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Guidelines
- Follow WordPress Coding Standards
- Add inline documentation for complex functions
- Test on multiple devices and browsers
- Ensure no console errors
- Update CHANGELOG.md for significant changes

## ✨ Recent Improvements (v2.2.0)

### Major Cleanup & Code Optimization
- **File Upload System Removal**: Completely removed file upload functionality from merchant registration
  - Eliminated all document upload features (logo, trade license, ID documents, TIN certificate)
  - Reduced form from 4 steps to streamlined 3 steps
  - Removed 150+ lines of file upload handling code
  - Enhanced security by eliminating file upload vulnerabilities
- **Code Quality**: Cleaned up all commented-out code and legacy functions
- **Bug Fixes**: 
  - Fixed sandbox form redirect issues (now properly redirects to sandbox.moneybag.com.bd)
  - Fixed Elementor Integration status detection in admin settings
  - Made business website field truly optional in merchant registration
- **Performance**: Optimized codebase by removing unused files and redundant code
- **Architecture**: Improved code organization and removed deprecated functionality

### Enhanced User Experience
- **Simplified Registration**: Streamlined merchant registration with no file upload complexity
- **Better Admin Interface**: Accurate plugin status reporting with improved Elementor detection
- **Form Validation**: Enhanced validation system with proper optional field handling
- **Mobile Responsiveness**: Improved mobile experience without upload UI complexity

## 📝 License

This project is licensed under the GPL v2.0 or later - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:
- **Email**: info@moneybag.com.bd
- **Phone**: +880 1958 109 228
- **Website**: [https://moneybag.com.bd](https://moneybag.com.bd)

## 👥 Authors

- **Sakib Islam** - Lead Developer - [+8801950025990](tel:+8801950025990)

## 🙏 Acknowledgments

- WordPress Community
- Elementor Page Builder Team
- All contributors and testers

## 📈 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes.

---

**Note**: This plugin requires an active Moneybag merchant account and API credentials. Contact Moneybag support to obtain your credentials.