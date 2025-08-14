# Installation and Testing Guide

## Quick Installation

1. **Activate the Plugin**
   - Go to WordPress Admin → Plugins
   - Find "Moneybag WordPress Plugin" 
   - Click "Activate"

2. **Verify Elementor Compatibility**
   - Ensure Elementor is installed and activated
   - Plugin requires Elementor 3.0.0 or higher

3. **Test Widget Availability**
   - Edit any page with Elementor
   - Search for "Moneybag Sandbox Form" in widgets
   - Widget should appear under "Moneybag" category

## Development Setup (Optional)

If you want to modify the JavaScript or CSS:

```bash
cd wp-content/plugins/moneybag-wordpress-plugin
npm install
npm run dev  # For development with file watching
npm run build  # For production build
```

## Testing the Form

1. **Add Widget to Page**
   - Create new page or edit existing
   - Add "Moneybag Sandbox Form" widget
   - Configure settings:
     - API Base URL: `https://sandbox.api.moneybag.com.bd/api/v2`
     - Set redirect URL (optional)
     - Customize colors/typography

2. **Test Form Flow**
   - Step 1: Enter valid email → Should send OTP
   - Step 2: Enter OTP → Should verify and proceed
   - Step 3: Fill business details → Should create account
   - Step 4: Success confirmation

3. **Test Validation**
   - Try invalid email formats
   - Try short passwords
   - Leave required fields empty
   - Check real-time validation messages

## Troubleshooting

### Widget Not Appearing
- Check Elementor version (minimum 3.0.0)
- Verify plugin activation
- Clear Elementor cache

### JavaScript Errors  
- Check browser console for errors
- Ensure wp-element is loaded
- Verify API endpoints are accessible

### Styling Issues
- Check for CSS conflicts
- Verify sandbox-form.css is loading
- Test on different themes

### API Issues
- Verify API base URL is correct
- Check network connectivity
- Monitor browser network tab for API calls

## File Permissions

Ensure proper file permissions:
```bash
chmod 755 moneybag-wordpress-plugin/
chmod 644 moneybag-wordpress-plugin/*.php
chmod 644 moneybag-wordpress-plugin/assets/css/*.css
chmod 644 moneybag-wordpress-plugin/assets/js/*.js
```

## Production Checklist

Before going live:
- [ ] Test all form steps
- [ ] Verify API integration
- [ ] Test responsive design
- [ ] Check validation messages
- [ ] Test with different WordPress themes
- [ ] Verify Elementor compatibility
- [ ] Test redirect functionality
- [ ] Check error handling