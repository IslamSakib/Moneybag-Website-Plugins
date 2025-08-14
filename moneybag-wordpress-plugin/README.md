# Moneybag WordPress Plugin

A WordPress plugin that provides Elementor widgets for Moneybag payment integration using React.js forms.

## Features

- Multi-step sandbox account registration form
- Real-time form validation
- Responsive design
- Elementor widget integration
- API integration with Moneybag sandbox endpoints
- Scoped CSS to prevent styling conflicts

## Installation

1. Upload the plugin folder to `/wp-content/plugins/`
2. Activate the plugin through the WordPress admin
3. Ensure Elementor is installed and activated (minimum version 3.0.0)
4. The widget will appear in Elementor under "Moneybag" category

## Usage

### Adding the Widget
1. Edit a page with Elementor
2. Search for "Moneybag Sandbox Form" widget
3. Drag and drop it to your page
4. Configure the settings in the widget panel

### Widget Settings
- **Form Title**: Customize the form title
- **API Base URL**: Set the Moneybag API endpoint (default: https://sandbox.api.moneybag.com.bd/api/v2)
- **Success Redirect URL**: URL to redirect users after successful registration
- **Primary Color**: Customize the form's primary color theme

### Form Steps
1. **Email Verification**: User enters email, receives OTP
2. **OTP Verification**: User enters 6-digit code
3. **Business Details**: Complete registration form
4. **Success**: Confirmation and next steps

## Development

### Prerequisites
- Node.js and npm
- WordPress development environment
- Elementor plugin

### Setup
```bash
cd wp-content/plugins/moneybag-wordpress-plugin
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

### File Structure
```
moneybag-wordpress-plugin/
├── moneybag-plugin.php          # Main plugin file
├── includes/
│   └── widgets/
│       └── sandbox-form-widget.php  # Elementor widget class
├── assets/
│   ├── js/
│   │   ├── sandbox-form.js      # React form component
│   │   └── editor.js           # Elementor editor scripts
│   └── css/
│       └── sandbox-form.css    # Form styles
├── package.json                # Node.js dependencies
└── README.md                  # This file
```

## API Integration

The form integrates with three Moneybag API endpoints:

1. **Email Verification**: `/api/v2/sandbox/email-verification`
2. **OTP Verification**: `/api/v2/sandbox/verify-otp`  
3. **Business Details**: `/api/v2/sandbox/merchants/business-details`

## Form Validation

The form includes real-time validation for:
- Email format validation
- OTP length (6 digits)
- Password strength (minimum 8 characters)
- Phone number format (Bangladesh format)
- Required field validation
- Password confirmation matching

## Styling

The CSS is scoped with `.moneybag-sandbox-form-wrapper` to prevent conflicts with theme styles. All form elements use this prefix to ensure isolation.

## Compatibility

- WordPress 5.0+
- Elementor 3.0+
- PHP 7.4+
- Modern browsers with ES6 support

## Support

For support and feature requests, please contact the Moneybag development team.

## License

This plugin is licensed under GPL v2 or later.