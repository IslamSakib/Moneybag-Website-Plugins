# Installation and Testing Guide

## Quick Installation

1. **Upload Plugin Files**
   - Upload the `moneybag-wordpress-plugin` folder to `/wp-content/plugins/`
   - Or install via WordPress Admin → Plugins → Add New → Upload Plugin

2. **Activate the Plugin**
   - Go to WordPress Admin → Plugins
   - Find "Moneybag WordPress Plugin" 
   - Click "Activate"

3. **Verify Elementor Compatibility**
   - Ensure Elementor is installed and activated
   - Plugin requires Elementor 3.0.0 or higher
   - Free or Pro version of Elementor works

4. **Configure Settings**
   - Navigate to Settings → Moneybag in WordPress Admin
   - Configure CRM API settings:
     - CRM API URL (e.g., `https://crm.dummy-dev.tubeonai.com/rest`)
     - CRM API Key
     - reCAPTCHA keys (if using)
     - Default redirect URLs

## Available Widgets

After installation, three widgets will be available in Elementor:

1. **Moneybag Merchant Registration** - Complete merchant onboarding form
2. **Moneybag Pricing Plan** - Dynamic pricing calculator with CRM integration
3. **Moneybag Sandbox Form** - Payment gateway testing environment

## Testing the Pricing Widget

1. **Add Widget to Page**
   - Edit any page with Elementor
   - Search for "Moneybag Pricing Plan" in widgets
   - Drag widget to your page
   - Configure style settings if needed

2. **Test Form Flow**
   - **Step 1**: Select Business Category and Legal Identity
   - **Step 2**: View pricing and required documents
   - **Step 3**: Fill consultation booking form with:
     - Business details (category, identity, domain)
     - Contact information (name, email, phone)
   - **Step 4**: Success confirmation page

3. **Test Validation**
   - Domain field requires full URL (https://example.com)
   - Email must be valid format
   - Phone accepts Bangladesh numbers (+880, 880, or 0 prefix)
   - All fields are mandatory

4. **CRM Integration Testing**
   - Form handles duplicate contacts gracefully
   - Existing contacts will be reused, not duplicated
   - Failed CRM calls fallback to local storage
   - Check browser console for detailed logs

## Troubleshooting

### Widget Not Appearing
- Check Elementor version (minimum 3.0.0)
- Verify plugin activation
- Clear Elementor cache: Elementor → Tools → Regenerate CSS & Data

### JavaScript Errors  
- Check browser console for errors
- Ensure WordPress React (wp-element) is loaded
- Verify no JavaScript conflicts with theme/plugins

### CRM Integration Issues
- Verify API credentials in Settings → Moneybag
- Check if contact already exists (duplicate error is handled)
- Monitor browser console for API responses
- Form will work even without CRM (saves locally)

### Styling Issues
- Widget uses scoped CSS to prevent conflicts
- Check for theme overrides
- Use Elementor's style controls to customize

### Validation Errors
- Domain: Must include http:// or https:// protocol
- Email: Standard email format required
- Phone: Bangladesh numbers only
- All fields are required except in specific forms

## File Structure

```
moneybag-wordpress-plugin/
├── moneybag-plugin.php          # Main plugin file
├── includes/
│   ├── admin/                   # Admin settings
│   └── widgets/                 # Elementor widget classes
├── assets/
│   ├── css/                     # Widget styles
│   ├── js/                      # React components
│   └── image/                   # Assets
├── data/                        # Configuration files
│   ├── pricing-rules.json       # Business categories & docs
│   └── merchant-registration-options.json
└── README.md

```

## File Permissions

Ensure proper file permissions:
```bash
chmod 755 moneybag-wordpress-plugin/
chmod 644 moneybag-wordpress-plugin/*.php
chmod 644 moneybag-wordpress-plugin/assets/css/*.css
chmod 644 moneybag-wordpress-plugin/assets/js/*.js
chmod 755 moneybag-wordpress-plugin/data/
chmod 644 moneybag-wordpress-plugin/data/*.json
```

## Production Checklist

Before going live:
- [ ] Configure real CRM API credentials
- [ ] Test all three widgets thoroughly
- [ ] Verify email notifications work
- [ ] Test on production domain
- [ ] Check responsive design on mobile
- [ ] Test with your WordPress theme
- [ ] Verify Elementor compatibility
- [ ] Test form submissions and validation
- [ ] Check CRM integration (people, opportunities, notes)
- [ ] Monitor for duplicate contact handling
- [ ] Test fallback local storage
- [ ] Review browser console for errors

## Support

For technical support:
- **Phone:** +880 1958 109 228
- **Email:** info@moneybag.com.bd
- **Website:** https://moneybag.com.bd

## Version History

- **v1.0.1** - Fixed CRM duplicate handling, improved validation
- **v1.0.0** - Initial release with three widgets