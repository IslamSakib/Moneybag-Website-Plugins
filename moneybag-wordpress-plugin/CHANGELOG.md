# Changelog

All notable changes to the Moneybag WordPress Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.8] - 2025-09-11

### Fixed
- **🎉 CRITICAL: TwentyOne CRM Opportunity Creation** - Resolved opportunity creation failure with comprehensive fixes:
  - Fixed stage enum error detection by preserving detailed error responses from CRM API
  - Implemented comprehensive stage auto-retry logic with 16+ common CRM stage values
  - Added intelligent stage mapping that tries alternative stages when workspace-specific enums fail
  - Enhanced debug logging with detailed opportunity creation flow tracking
- **✅ Note Creation ID Extraction** - Fixed note ID extraction from TwentyOne CRM API responses
  - Updated response parsing to handle `data.data.createNote.id` structure
  - Added comprehensive debug logging for note creation troubleshooting
- **🔧 AJAX Endpoint Regression** - Fixed empty response issue introduced in v2.3.5
  - Removed overly aggressive configuration checks that prevented AJAX responses
  - Restored proper error handling without breaking the endpoint functionality

### Enhanced
- **Comprehensive CRM Debug Logging** - Added detailed debug logging for all CRM operations:
  - `[OPPORTUNITY DEBUG]` entries show complete opportunity creation flow
  - `[NOTE DEBUG]` entries show note ID extraction attempts and results
  - Enhanced error reporting with workspace-specific stage enum information

### Technical
- **Global CRM Integration** - All widgets (merchant registration, pricing plan, contact form) now use the enhanced CRM system
- **Stage Auto-Discovery** - Plugin automatically finds valid opportunity stages for any TwentyOne CRM workspace
- **Error Response Preservation** - CRM API responses now preserve detailed error information for better debugging

## [2.3.0] - 2025-09-09

### Added
- **Visual Service Selection System** - Complete overhaul of payment service selection with payment service logos
  - Added logo-based checkboxes for all payment services (Visa, Mastercard, American Express, bKash, Nagad, etc.)
  - Implemented visual card-style selection with hover effects and proper selection states
  - Added responsive 3-column layout for tablet devices and 2-column layout for mobile
- **Enhanced Thank You Section** in pricing plan widget
  - Added demo sandbox text and "Explore Demo Sandbox" button with right arrow icon
  - Implemented responsive padding and typography scaling across all devices
  - Added structured contact information display with phone and email

### Changed
- **Updated Validation Messages** across all widgets for better user experience
  - Changed "Forgot password?" links to "Login" with updated URL (https://sandbox.moneybag.com.bd/)
  - Removed unnecessary "already exists" validation from pricing plan widget
  - Maintained consistent error messaging across merchant registration and sandbox forms
- **Improved Merchant Registration UI**
  - Service selection now displays payment service logos instead of text-only checkboxes
  - Replaced text labels with professional logo images for better visual identification
  - Updated "LOGIN TO SANDBOX" button text to "Go to sandbox"
- **Enhanced Responsive Design**
  - Optimized service grid layout: 5+ columns (desktop), 3 columns (tablet), 2 columns (mobile)
  - Improved mobile padding and spacing throughout thank you sections
  - Better text sizing and line breaks across all device sizes

### Fixed
- **CSS Grid Layout Issues** - Resolved service selection display problems
  - Fixed conflicting flexbox styles that prevented proper grid layout
  - Added specific CSS overrides for logo-style service items
  - Ensured proper alignment and spacing in service selection grid
- **Button and Animation Fixes**
  - Removed sandbox login button animations for cleaner user experience
  - Fixed border thickness inconsistencies (standardized to 1px borders)
  - Removed red background overlay on service selection, keeping only border color changes
- **Responsive Layout Improvements**
  - Fixed mobile padding issues in thank you containers
  - Resolved text overflow and spacing problems on smaller screens
  - Ensured consistent button and element sizing across devices

### Removed
- Text labels from payment service selection (replaced with logo-only display)
- Excessive animations from sandbox login button
- Redundant background color overlays from selected service items
- Pricing plan widget "already exists" validation logic (not needed for this widget)

### Technical Improvements
- Added payment service logo mapping system with proper file path resolution
- Implemented CSS-based responsive design with media query overrides
- Enhanced service selection state management with visual feedback
- Optimized component re-rendering and hover state handling

## [2.2.0] - 2025-09-08

### Added
- Improved Elementor detection system in admin settings
- Enhanced PHP-based plugin detection for accurate status reporting
- Comprehensive project cleanup and optimization

### Changed
- Made business website field truly optional in merchant registration form
- Updated form validation to use `optionalDomain` validation rule
- Improved admin settings JavaScript for better Elementor status detection

### Fixed
- Fixed Elementor Integration status always showing "❌ Not Found" in admin
- Resolved sandbox form redirect issues (now properly redirects to https://sandbox.moneybag.com.bd/)
- Fixed business website field validation errors when left empty

### Removed
- **Complete file upload system removal from merchant registration form**
  - Removed all file upload JavaScript handlers and UI components
  - Removed `handleFileUpload()` function and `renderStep4()` step
  - Removed `handle_document_upload()` PHP method and API routing
  - Removed all file upload CSS styles and components
  - Removed Step 4 (Documents) from form flow - now 3 steps instead of 4
  - Removed upload directory creation from plugin activation
- Removed obsolete CSS files (merchant-registration.css, pricing-plan.css, sandbox-form.css)
- Removed debug files (debug.log, test-sandbox-button-fix.html)
- Removed empty editor.js placeholder file
- Cleaned up all commented-out code blocks and legacy comments
- Removed unused file upload validation and processing code

### Security
- Enhanced server-side Elementor detection using `is_plugin_active()`
- Maintained secure API handling without file upload vulnerabilities
- Cleaned up potential security risks from file upload functionality

## [2.1.1] - 2025-09-08

### Added
- Dynamic pricing system from Excel data integration
- Improved spinner animations with smooth cubic-bezier easing
- Professional dual-circle SVG spinner design
- Browser compatibility prefixes for animations
- Comprehensive .gitignore for GitHub
- Detailed README documentation
- CHANGELOG file for version tracking

### Changed
- Updated pricing-rules.json with comprehensive MSF rates for all business categories
- Enhanced spinner animations from linear to smooth cubic-bezier transitions
- Improved SVG spinner design with better visual feedback
- Optimized animation duration from 1s to 0.8s for better perceived performance

### Fixed
- Spinner animation stuck issue when buttons are disabled
- Animation not working due to CSS conflicts
- Transform origin issues for rotating elements

### Removed
- editor.js (empty Elementor editor enhancement file)
- package.json (no build process defined)
- INSTALL.md (redundant with README)
- Legacy production_request() API function
- Commented out get_api_base() function
- Test files and temporary files

## [2.1.0] - 2025-09-01

### Added
- Merchant form UI enhancement with direct support links
- FAQ button linking to moneybag.com.bd

### Changed
- Consolidated all widget CSS into single moneybag-global.css file
- Improved file structure and organization

### Removed
- Individual widget CSS files (merchant-registration.css, pricing-plan.css, sandbox-form.css)
- Debug logs and testing documentation

## [2.0.0] - 2025-08-15

### Added
- Unified global CSS system for all widgets
- Centralized API handling through class-moneybag-api.php
- Enhanced security implementation
- Mobile-first responsive design
- React-based form components using wp-element

### Changed
- Complete refactor of widget architecture
- Removed all Elementor customization controls
- Simplified widget configuration
- Improved performance optimizations

### Security
- Added comprehensive input sanitization
- Implemented nonce verification for all AJAX calls
- Added output escaping for all dynamic content
- Secured API key storage

## [1.0.1] - 2025-07-01

### Added
- Basic CRM integration
- Individual CSS files for each widget

### Fixed
- Minor bug fixes and improvements

## [1.0.0] - 2025-06-01

### Added
- Initial release
- Merchant Registration Widget
- Pricing Plan Widget
- Sandbox Form Widget
- Contact Form Widget
- Basic Elementor integration
- Admin settings panel

---

## Legend

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes