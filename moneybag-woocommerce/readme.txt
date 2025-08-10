=== Moneybag Payment Gateway for WooCommerce ===
Contributors: moneybag, islamsakib
Tags: payment gateway, moneybag, woocommerce, bangladesh, payment
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 2.0.1
Requires PHP: 7.4
License: MIT
License URI: https://opensource.org/licenses/MIT

Official Moneybag Payment Gateway for WooCommerce. Accept payments securely through Moneybag for your Bangladesh-based business.

== Description ==

The Moneybag Payment Gateway plugin seamlessly integrates Moneybag's secure payment processing into your WooCommerce store. Perfect for Bangladesh merchants looking to accept online payments.

= Features =

* **Secure Payment Processing** - Direct integration with Moneybag's PCI-compliant payment gateway
* **Real-time Payment Verification** - Automatic payment status verification
* **Smart Field Validation** - Ensures billing email and phone are collected
* **Modern Checkout Support** - Works with both classic and WooCommerce Blocks checkout
* **Comprehensive Logging** - Detailed transaction logs for easy debugging
* **Dual Environment Support** - Switch between staging and production modes

= Requirements =

* WordPress 5.0 or higher
* WooCommerce 5.0 or higher
* PHP 7.4 or higher
* Valid Moneybag Merchant Account
* SSL Certificate (for production)

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/moneybag-woocommerce/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to WooCommerce > Settings > Payments
4. Click on "Moneybag Payment Gateway" to configure
5. Enter your API credentials and save

= Configuration =

1. **Enable/Disable** - Turn the payment method on/off
2. **Title** - Payment method title shown to customers
3. **Description** - Payment method description
4. **API Key** - Your Moneybag merchant API key
5. **Environment** - Choose between Staging (testing) or Production
6. **API Timeout** - Request timeout in seconds (default: 30)
7. **API Retries** - Number of retry attempts (default: 3)

== Frequently Asked Questions ==

= Do I need an SSL certificate? =

Yes, for production use, an SSL certificate is required to ensure secure transmission of payment data.

= What customer information is required? =

The plugin requires billing email and phone number for all Moneybag transactions.

= Does it support WooCommerce Blocks? =

Yes, the plugin supports both classic checkout and the new WooCommerce Blocks-based checkout.

= Where can I find my API credentials? =

Log into your Moneybag merchant account and navigate to the API section to find your credentials.

= How do I test the payment gateway? =

Set the environment to "Staging" and use test credentials provided by Moneybag.

== Screenshots ==

1. Payment method on checkout page
2. Plugin configuration settings
3. Payment method in WooCommerce settings
4. Successful payment confirmation

== Changelog ==

= 2.0.1 =
* Added billing phone and email validation
* Implemented WooCommerce Blocks support
* Fixed API response handling
* Improved error messages
* Enhanced checkout field validation

= 2.0.0 =
* Complete rewrite with improved SDK
* Better error handling
* Support for payment verification
* Added retry logic for failed requests

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 2.0.1 =
This version adds required field validation for billing phone and email. These fields are now mandatory for Moneybag payments.