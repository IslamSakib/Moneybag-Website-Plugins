# Moneybag Payment Gateway for WooCommerce
Official WooCommerce Payment Gateway plugin for Moneybag, enabling seamless payment integration for Bangladesh merchants.

## Description
This plugin integrates the Moneybag Payment Gateway with your WooCommerce store, allowing you to accept payments securely via Moneybag. Customers will be redirected to the Moneybag payment page to complete their transactions.

## Installation

1.  **Download** the plugin ZIP file.
2.  **Upload** the plugin through the 'Plugins > Add New' screen in your WordPress dashboard.
3.  **Activate** the 'Moneybag Payment Gateway for WooCommerce' plugin from your Plugins page.
4.  **Configure** the plugin by navigating to 'WooCommerce > Settings > Payments' and selecting 'Moneybag Payment Gateway'. Enter your API Key and choose the environment (Staging or Production).

## Quick Start
1.  Install and activate the plugin.
2.  Go to `WooCommerce > Settings > Payments`.
3.  Enable the "Moneybag Payment Gateway".
4.  Enter your `X-Merchant-API-Key` provided by Moneybag.
5.  Select `Staging` for testing, or `Production` for live payments.
6.  Save changes.
7.  During checkout, customers can now select "Pay with Moneybag".

## Configuration
Access the plugin settings under `WooCommerce > Settings > Payments > Moneybag Payment Gateway`.

* **Enable/Disable:** Turn the payment gateway on or off.
* **Title:** The title customers see during checkout.
* **Description:** The description customers see during checkout.
* **API Key:** Your unique API key from Moneybag.
* **Environment:** Choose between `Staging` (for testing) and `Production` (for live transactions).
* **API Timeout (seconds):** Configure the timeout for API requests.
* **API Retries:** Configure the number of retries for failed API requests.

## Features

* **Secure Payment Processing:** Direct integration with Moneybag's secure payment gateway
* **Automatic Payment Verification:** Real-time payment status verification
* **Required Field Validation:** Ensures billing email and phone are provided for Moneybag transactions
* **WooCommerce Blocks Support:** Compatible with both classic and block-based checkout
* **Comprehensive Logging:** Detailed transaction logs for debugging and monitoring
* **Staging/Production Modes:** Easy switching between test and live environments

## Usage

### Checkout
When a customer selects Moneybag as their payment method and proceeds with the order, they will be redirected to the Moneybag hosted payment page. Upon successful payment, they will be redirected back to your WooCommerce Thank You page.

### Required Fields
The plugin requires the following customer information for Moneybag payments:
* **Billing Email Address** (required)
* **Billing Phone Number** (required)

### Verify Payment
The plugin automatically verifies payment status with the Moneybag API after the customer returns from the Moneybag payment page. This ensures the payment is confirmed before updating the order status in WooCommerce.

## Error Handling
The plugin uses WooCommerce's built-in logging system. Any errors or issues during payment processing will be logged and can be viewed under `WooCommerce > Status > Logs`.

## API Reference
For detailed API specifications, please refer to the official Moneybag API Integration Guide: [https://docs.moneybag.com.bd](https://docs.moneybag.com.bd)

## Contributing
We welcome contributions to the Moneybag WooCommerce Payment Gateway. Please refer to our [CONTRIBUTING.md](./DEVELOPMENT.md) for guidelines.

## License
This plugin is released under the MIT License. See the `LICENSE` file for more details.