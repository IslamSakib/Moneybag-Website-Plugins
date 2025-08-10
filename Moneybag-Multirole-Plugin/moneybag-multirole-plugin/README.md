# MoneyBag Multirole Plugin

A comprehensive WordPress plugin that combines Merchant Registration, Pricing Forms, and Multi-Step Sandbox Registration forms for Elementor.

## Features

### 🎯 Three Powerful Form Widgets

1. **Merchant Registration Form**
   - 4-step registration process
   - Business information collection
   - Document upload capability
   - Instant field validation

2. **Pricing Calculator Form**
   - Dynamic pricing based on business criteria
   - Consultation booking
   - Real-time pricing display
   - CRM integration ready

3. **Multi-Step Sandbox Registration**
   - Email verification with OTP
   - Sandbox account creation
   - API credential generation
   - Secure authentication flow

### ⚡ Key Features

- **Instant Validation**: Real-time field validation without page refresh
- **Dynamic Forms**: Load form fields from JSON or API
- **Elementor Integration**: Seamless integration with Elementor page builder
- **CRM Integration**: Twenty CRM automatic sync
- **Responsive Design**: Mobile-friendly forms
- **No Dependencies**: Uses React from CDN (no node_modules required)
- **Admin Dashboard**: Comprehensive submission management

## Installation

1. Upload the `moneybag-multirole-plugin` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Ensure Elementor is installed and activated
4. Configure settings in WordPress Admin → MoneyBag

## Usage

### Adding Forms to Pages

1. Edit page with Elementor
2. Search for "MoneyBag" in the widget panel
3. Drag desired form widget to page:
   - Merchant Registration Form
   - Pricing Form
   - Multi-Step Sandbox Registration
4. Configure widget settings in Elementor panel
5. Publish/Update page

### Admin Configuration

#### Dashboard
- View submission statistics
- Recent submissions overview
- System status check

#### CRM Configuration
1. Navigate to MoneyBag → CRM Config
2. Enter Twenty CRM API credentials
3. Enable CRM sync
4. Test connection

#### Settings
- **General**: Set API environment (staging/production)
- **Validation**: Configure validation patterns
- **API**: View available endpoints
- **Export/Import**: Export submissions to CSV/JSON

## Form Configuration

### Dynamic Field Loading

Forms can load field configuration from:
- Local JSON files in `/data/` directory
- External API endpoints

### Validation Rules

Configure validation patterns in Settings:
```regex
Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
Phone: /^\+?[0-9]{10,15}$/
Mobile: /^\+?88[0-9]{10,11}$/
Website: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
```

## API Integration

### MoneyBag API Endpoints

**Staging**: `https://staging.api.moneybag.com.bd/api/v2`
**Production**: `https://api.moneybag.com.bd/api/v2`

### Available Endpoints
- `/sandbox/email-verification` - Send OTP
- `/sandbox/verify-otp` - Verify OTP code
- `/sandbox/merchants/business-details` - Create sandbox account

## Styling

### CSS Classes

Forms use BEM naming convention:
- `.moneybag-widget-container` - Main container
- `.form-field` - Field wrapper
- `.form-input` - Input element
- `.field-error` - Error message
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button

### Customization

Override styles in your theme:
```css
.moneybag-widget-container .btn-primary {
    background-color: #your-color;
}
```

## Database

Plugin creates table: `{prefix}_moneybag_submissions`

Fields:
- `id` - Submission ID
- `form_type` - Type of form
- `form_data` - JSON encoded form data
- `status` - Submission status
- `user_id` - WordPress user ID (if logged in)
- `ip_address` - Submitter IP
- `created_at` - Submission date
- `updated_at` - Last update date

## Hooks & Filters

### Actions
- `moneybag_after_submission` - After form submission
- `moneybag_before_validation` - Before validation
- `moneybag_crm_sync_complete` - After CRM sync

### Filters
- `moneybag_validation_rules` - Modify validation rules
- `moneybag_form_fields` - Modify form fields
- `moneybag_pricing_data` - Modify pricing data

## Requirements

- WordPress 5.0+
- PHP 7.2+
- Elementor 3.0+
- SSL certificate (for payment processing)

## Support

For support, please contact MoneyBag support team.

## License

Proprietary - MoneyBag © 2024