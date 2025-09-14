# Moneybag WordPress Plugin - Claude Code Documentation

## 🤖 AI Development Context

This documentation is specifically designed for **Claude Code** and other AI assistants to understand the plugin architecture, make informed modifications, and maintain code consistency.

## 📊 Plugin Overview

**Version:** 2.4.0
**Architecture:** WordPress Plugin + Elementor + React (wp-element)
**Security Level:** Enterprise
**Performance:** Optimized Global CSS System (Production Ready)  

## 🏗️ File Structure & Responsibilities

```
moneybag-wordpress-plugin/
├── 📄 moneybag-plugin.php           # Main plugin file - entry point
├── 📄 README.md                     # User documentation
├── 📄 CLAUDE.md                     # AI/Developer documentation
├── 📄 package.json                  # NPM package info (no build process)
│
├── 📁 includes/                     # PHP Backend Logic
│   ├── 📁 admin/
│   │   └── admin-settings.php       # WordPress admin panel
│   ├── class-moneybag-api.php       # 🔒 Secure API handler (ALL API calls)
│   └── 📁 widgets/                  # Elementor widget classes
│       ├── merchant-registration-widget.php    # NO controls (simplified)
│       ├── pricing-plan-widget.php             # NO controls (simplified)  
│       └── sandbox-form-widget.php             # NO controls (simplified)
│
├── 📁 assets/                       # Frontend Assets
│   ├── 📁 css/
│   │   └── moneybag-global.css      # 🎨 UNIFIED CSS (optimized, no duplicates)
│   ├── 📁 js/                       # React Components (wp-element)
│   │   ├── admin-crm.js             # Admin-only scripts
│   │   ├── editor.js                # Elementor editor enhancements
│   │   ├── form-validator.js        # 🔄 GLOBAL validation (reused)
│   │   ├── merchant-registration-wp.js  # Merchant form React
│   │   ├── pricing-plan.js          # Pricing widget React + CRM
│   │   └── sandbox-form.js          # Sandbox testing React
│   └── 📁 image/                    # Optimized assets (.webp format)
│       ├── Right.webp               # Arrow icons
│       ├── emojione_e-mail.webp     # Email illustrations  
│       ├── icon_moneybag.webp       # Brand logo
│       ├── img_join now.webp        # CTA illustrations
│       └── streamline-freehand-color_password-approved.webp
│
└── 📁 data/                         # JSON Configuration
    ├── merchant-registration-options.json    # Form options (loaded client-side)
    └── pricing-rules.json                    # Business categories & pricing
```

## 🔄 Data Flow Architecture (Cleaned & Optimized)

### **Modern API Request Flow:**
```
React Component → WordPress AJAX → handle_merchant_api() → class-moneybag-api.php → External API
                                                                                ↓
WordPress Database ← Sanitized Response ← Processed Response ← API Response ←┘
```

### **Security Chain (Enhanced):**
```
User Input → JS Validation → Nonce Verification → Input Sanitization → Centralized API Handler → Response Escaping
```

### **Removed Legacy Components:**
- ❌ `submit_merchant_registration()` (deprecated)
- ❌ `generate_merchant_note()` (legacy email system)
- ❌ Duplicate `init_admin()` method
- ✅ **Modern:** `handle_merchant_api()` with centralized routing

## 🎨 CSS Architecture (Global System)

### **Critical Rules:**
- **Single CSS file:** `moneybag-global.css` serves ALL widgets
- **No widget-specific CSS:** All styling is unified and consistent
- **Scoped classes:** `.moneybag-form`, `.pricing-plan-container`, etc.
- **Responsive:** Mobile-first with optimized breakpoints

### **CSS Hierarchy:**
```css
.moneybag-form                    /* Global form base */
├── .pricing-plan-container       /* Pricing widget specific */
├── .merchant-form-container      /* Merchant widget specific */
└── .moneybag-form-container      /* Sandbox widget specific */
```

### **Responsive Breakpoints:**
- **Desktop:** 1400px+
- **Laptop:** 1024px-1400px  
- **Tablet:** 768px-1024px
- **Mobile:** <768px

## 🔒 Security Implementation

### **Input Sanitization Functions:**
```php
sanitize_text_field()    # Text inputs
sanitize_email()         # Email addresses  
esc_url_raw()           # URLs
sanitize_textarea_field() # Textarea content
intval()                # Numeric values
```

### **Output Escaping Functions:**
```php
esc_html()              # HTML content
esc_attr()              # HTML attributes
wp_kses_post()          # Rich content
esc_url()               # URLs in output
```

### **Nonce Implementation:**
```php
// Creation
wp_create_nonce('moneybag_nonce')

// Verification  
wp_verify_nonce($_POST['nonce'], 'moneybag_nonce')
```

## ⚛️ React Component Guidelines

### **WordPress React Usage:**
- Use `wp.element` (WordPress's React build)
- No external React imports needed
- Use `wp.api-fetch` for AJAX calls

### **Component Structure:**
```javascript
const { useState, useEffect } = wp.element;

// Component with validation
function MyWidget({ config }) {
    const [formData, setFormData] = useState({});
    
    // Always use global validation
    const validator = new MoneybagValidator();
    
    // API calls through WordPress AJAX only
    const handleSubmit = async () => {
        const response = await wp.apiFetch({
            path: '/wp-admin/admin-ajax.php',
            method: 'POST',
            body: new FormData(...)
        });
    };
}
```

## 🔧 Development Guidelines

### **When Adding New Features:**

1. **New Widget:**
   ```php
   // extends \Elementor\Widget_Base
   // register_controls() should be empty or minimal
   // Use global CSS classes
   // Create corresponding React component
   ```

2. **New API Endpoint:**
   ```php
   // Add to class-moneybag-api.php
   // Add AJAX handler to main plugin file
   // Sanitize inputs, escape outputs
   // Include nonce verification
   ```

3. **New CSS Styling:**
   ```css
   /* Add to moneybag-global.css ONLY */
   /* Use existing class hierarchy */
   /* Follow responsive breakpoint pattern */
   /* Test across all widgets */
   ```

## 🚨 Critical Constraints

### **❌ DO NOT:**
- Add widget-level customization controls
- Create separate CSS files
- Make direct API calls from JavaScript
- Hardcode API keys in code
- Skip input sanitization/output escaping
- Break the global CSS system

### **✅ ALWAYS:**
- Use global CSS system
- Route API calls through class-moneybag-api.php
- Validate and sanitize all inputs
- Escape all outputs
- Use WordPress React (wp-element)
- Follow responsive design patterns
- Test all three widgets after changes

## 📋 Testing Checklist

### **After Any Changes:**
- [ ] All three widgets render correctly
- [ ] Mobile responsiveness maintained
- [ ] No JavaScript console errors
- [ ] Forms submit successfully
- [ ] Security validations pass
- [ ] Global CSS consistency preserved
- [ ] API requests work through backend only

## 🔍 Common Modification Patterns

### **Adding Form Field:**
```javascript
// 1. Add to React state
const [newField, setNewField] = useState('');

// 2. Add to form JSX with global classes
<input 
    className="input-field"
    value={newField}
    onChange={(e) => setNewField(e.target.value)}
/>

// 3. Add validation if needed
validator.validateField('newField', newField);

// 4. Add to submission data
const formData = { ...existingData, newField };
```

### **Styling Changes:**
```css
/* Add to moneybag-global.css */
.moneybag-form .new-element {
    /* Desktop styles */
}

@media (max-width: 1024px) {
    .moneybag-form .new-element {
        /* Tablet styles */
    }
}

@media (max-width: 768px) {
    .moneybag-form .new-element {
        /* Mobile styles */
    }
}
```

### **New API Integration:**
```php
// In class-moneybag-api.php
public static function new_api_method($data) {
    $api_key = self::get_api_key();
    $sanitized_data = [
        'field1' => sanitize_text_field($data['field1'] ?? ''),
        'field2' => sanitize_email($data['field2'] ?? '')
    ];
    
    $response = wp_remote_post($endpoint, [
        'headers' => ['Authorization' => 'Bearer ' . $api_key],
        'body' => json_encode($sanitized_data)
    ]);
    
    return self::process_api_response($response);
}

// In main plugin file - add AJAX handler
add_action('wp_ajax_new_action', [$this, 'handle_new_action']);
add_action('wp_ajax_nopriv_new_action', [$this, 'handle_new_action']);
```

## 🎯 Version History Context

### **v2.4.0 (Current - Business Category Integration & UX Improvements):**
- **Price Calculator Business Logic:** Replaced Current Gateway field with Business Category selection
- **Dynamic Pricing:** Implemented category-based Moneybag rates from pricing-rules.json
- **Form Validation:** Added required field validation for Business Category with global validator
- **Localization:** Implemented Bangladeshi comma formatting for monetary inputs (10,00,000 format)
- **Data Integration:** Connected 11 business categories with specific pricing tiers
- **User Experience:** Enhanced calculator with contextual rates based on business type
- **Performance:** Maintained real-time calculations with dynamic rate switching

### **v2.3.8 (Production Ready & UI Enhancements):**
- **Price Calculator Enhancement:** Added custom payment mix table with responsive scroll on mobile
- **Mobile UX:** Implemented swipe indicators with arrows for better mobile navigation
- **UI Polish:** Fixed margin-bottom for comparison cards on mobile devices
- **Code Cleanup:** Commented out all debug logging for production deployment
- **Performance:** Removed test files and debug logs for cleaner codebase
- **Responsive Design:** Optimized table layouts across all device sizes

### **v2.1.1 (Merchant Form Enhancement):**
- **UI Enhancement:** Updated support and FAQ buttons with direct links to moneybag.com.bd
- **Code Cleanup:** Removed unused individual CSS files (merchant-registration.css, pricing-plan.css, sandbox-form.css)
- **File Optimization:** Cleaned up debug logs and testing documentation files
- **Global CSS:** Fully consolidated to single moneybag-global.css file
- **Performance:** Reduced file count and improved loading efficiency

### **v2.0.0 (Major Refactor):**
- Unified global CSS system
- Removed all widget customization controls  
- Centralized API handling
- Enhanced security implementation
- Performance optimizations
- Mobile-first responsive design

### **v1.0.1 (Legacy):**
- Individual widget CSS files
- Elementor customization controls
- Basic CRM integration

## 🤝 AI Assistant Guidelines

### **For Code Analysis:**
- Focus on security validation (sanitization/escaping)
- Check CSS changes don't break other widgets
- Verify API calls go through class-moneybag-api.php
- Confirm responsive design principles

### **For Debugging:**
- Check browser console for JavaScript errors
- Verify AJAX requests include proper nonces
- Test across all device breakpoints
- Validate form submission flows

### **For Enhancement Requests:**
- Maintain global CSS system consistency
- Preserve security architecture
- Keep widgets simplified (no controls)
- Follow established patterns

---

## 📞 Technical Support Context

**For AI Assistants:** This plugin follows enterprise WordPress development standards with React integration. All security, performance, and compatibility requirements have been implemented and tested. When making modifications, preserve the architectural decisions documented above.

**Last Updated:** September 2025 by Claude Code
**Plugin Version:** 2.4.0 (Business Category Integration & UX Improvements)
**Developer:** Sakib Islam (+8801950025990)
**WordPress Compatibility:** 5.0+
**Elementor Compatibility:** 3.0+
**PHP Compatibility:** 7.4-8.2+