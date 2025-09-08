# Changelog

All notable changes to the Moneybag WordPress Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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