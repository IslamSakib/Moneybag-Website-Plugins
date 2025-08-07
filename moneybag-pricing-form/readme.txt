=== MoneyBag Pricing Form ===
Contributors: Sakib Islam
Tags: elementor, form, pricing, quote, react
Requires at least: 5.0
Tested up to: 6.3
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A powerful multi-step pricing form widget for Elementor built with React.

== Description ==

MoneyBag Pricing Form is a sophisticated WordPress plugin that adds a multi-step pricing form widget to Elementor. Built with React for optimal performance and user experience, it guides users through a 4-step process to collect project requirements and generate personalized quotes.

**Features:**

* **Multi-Step Form**: 4-step guided process for better user experience
* **React-Powered**: Fast, interactive frontend built with React
* **Elementor Integration**: Seamless integration with Elementor page builder
* **Fully Customizable**: Customize colors, text, and styling through Elementor
* **Responsive Design**: Looks great on all devices
* **Form Validation**: Client-side and server-side validation
* **AJAX Submissions**: Smooth form submission without page reload
* **Translation Ready**: Fully translatable with included .pot file

**Form Steps:**

1. **Project Details**: Project type and budget selection
2. **Timeline & Features**: Timeline preferences and required features
3. **Contact Information**: Client contact details
4. **Requirements**: Detailed project description

**Perfect For:**

* Web agencies collecting project requirements
* Freelancers offering custom quotes
* Service providers needing detailed client information
* Any business offering customized solutions

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/moneybag-pricing-form/` directory
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Make sure Elementor is installed and activated
4. Go to any page/post editor with Elementor
5. Find "MoneyBag Pricing Form" widget in the widgets panel
6. Drag and drop it to your desired location
7. Customize the settings in the widget panel

**Build Process:**

If you're developing or customizing the plugin:

1. Navigate to the `build/` directory
2. Run `npm install` to install dependencies
3. Run `npm run build` for production build
4. Run `npm run dev` for development with file watching

== Frequently Asked Questions ==

= Does this require Elementor Pro? =

No, this plugin works with the free version of Elementor.

= Can I customize the form fields? =

The current version has predefined fields optimized for pricing forms. Custom fields may be added in future versions.

= Where is the form data stored? =

Form submissions can be handled via hooks. You can save to database, send emails, or integrate with third-party services.

= Is the plugin translation ready? =

Yes, all text strings are translatable and a .pot file is included.

== Screenshots ==

1. Step 1 - Project type and budget selection
2. Step 2 - Timeline and features selection
3. Step 3 - Contact information form
4. Step 4 - Detailed requirements
5. Success page after submission
6. Elementor widget settings panel

== Changelog ==

= 1.0.0 =
* Initial release
* Multi-step pricing form with React frontend
* Elementor widget integration
* Responsive design
* Form validation
* AJAX submissions

== Upgrade Notice ==

= 1.0.0 =
Initial release of MoneyBag Pricing Form plugin.

== Developer Information ==

**Hooks Available:**

* `moneybag_form_before_submit` - Before form submission
* `moneybag_form_after_submit` - After successful submission
* `moneybag_form_validation_failed` - When validation fails

**Filters Available:**

* `moneybag_form_validation_rules` - Modify validation rules
* `moneybag_form_success_message` - Customize success message
* `moneybag_form_email_content` - Modify email content

**JavaScript Events:**

* `moneyBagFormStepChange` - Fired when step changes
* `moneyBagFormSubmitStart` - Fired when submission starts
* `moneyBagFormSubmitComplete` - Fired when submission completes

For more developer documentation, visit: https://your-website.com/docs