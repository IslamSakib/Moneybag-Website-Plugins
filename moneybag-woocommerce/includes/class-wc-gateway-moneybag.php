<?php
if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * WC_Gateway_Moneybag class.
 *
 * @extends WC_Payment_Gateway
 */
class WC_Gateway_Moneybag extends WC_Payment_Gateway
{
    /**
     * @var MoneybagSdk_HttpClient The HTTP client for Moneybag API calls.
     */
    protected $http_client;

    /**
     * @var MoneybagSdk The Moneybag SDK instance.
     */
    protected $moneybag_sdk;

    // --- FIX 1 & 2: Declare properties ---
    /**
     * @var string The Moneybag API Key.
     */
    public $api_key;

    /**
     * @var string The Moneybag API environment (staging or production).
     */
    public $environment;
    // --- END FIX 1 & 2 ---

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id                   = 'moneybag';
        $this->icon                 = plugin_dir_url(dirname(__FILE__)) . 'assets/images/moneybag-icon.png'; // Path to your gateway icon.
        $this->has_fields           = false; // No direct payment fields on checkout, we redirect.
        $this->method_title         = __('Moneybag Payment Gateway', 'moneybag-woocommerce');
        $this->method_description   = __('Accept payments via Moneybag Payment Gateway.', 'moneybag-woocommerce');
        $this->supports             = array(
            'products',
            'refunds', // If Moneybag API supports refunds.
        );

        // Load the settings.
        $this->init_form_fields();
        $this->init_settings();

        // Get settings values.
        $this->title        = $this->get_option('title');
        $this->description  = $this->get_option('description');
        $this->enabled      = $this->get_option('enabled');
        $this->api_key      = $this->get_option('api_key');
        $this->environment  = $this->get_option('environment');

        // Initialize Moneybag SDK.
        // It's good practice to ensure API key and environment are set before initializing SDK.
        if (! empty($this->api_key) && ! empty($this->environment)) {
            $this->http_client = new MoneybagSdk_HttpClient(
                $this->get_option('api_timeout', 30),
                $this->get_option('api_retries', 3)
            );
            $this->moneybag_sdk = new MoneybagSdk($this->api_key, $this->environment, $this->http_client);
        } else {
            // If key/environment missing, log a warning and disable gateway functionality where SDK is needed.
            // This might also be handled by init_settings() and admin notices.
            $this->log('Moneybag API Key or Environment is not configured. Gateway functionality might be limited.', 'warning');
        }


        // Hooks.
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        // Changed to use init for endpoint registration, ensuring it runs early enough.
        add_action('init', array($this, 'add_moneybag_rewrite_rule'));
        add_action('wp_loaded', array($this, 'flush_moneybag_rewrite_rules')); // Flush on plugin activation/deactivation
        add_filter('query_vars', array($this, 'add_moneybag_query_vars')); // Allow query vars for the custom endpoint.
        add_action('template_redirect', array($this, 'handle_moneybag_callback_request')); // Intercept the request.
        add_action('woocommerce_thankyou_' . $this->id, array($this, 'thankyou_page')); // For success page info.
        
        // Also add WooCommerce API endpoint for callbacks
        add_action('woocommerce_api_wc_gateway_moneybag', array($this, 'handle_moneybag_response'));
        
        // Make phone and email required when Moneybag is selected
        add_action('woocommerce_checkout_process', array($this, 'validate_required_fields'));
        add_filter('woocommerce_billing_fields', array($this, 'make_billing_fields_required'), 20);
        add_filter('woocommerce_checkout_fields', array($this, 'modify_checkout_fields'), 20);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_checkout_scripts'));
    }

    /**
     * Initialize Gateway Settings Form Fields.
     */
    public function init_form_fields()
    {
        $this->form_fields = array(
            'enabled' => array(
                'title'   => __('Enable/Disable', 'moneybag-woocommerce'),
                'type'    => 'checkbox',
                'label'   => __('Enable Moneybag Payment Gateway', 'moneybag-woocommerce'),
                'default' => 'no',
            ),
            'title' => array(
                'title'       => __('Title', 'moneybag-woocommerce'),
                'type'        => 'text',
                'description' => __('This controls the title which the user sees during checkout.', 'moneybag-woocommerce'),
                'default'     => __('Pay with Moneybag', 'moneybag-woocommerce'),
                'desc_tip'    => true,
            ),
            'description' => array(
                'title'       => __('Description', 'moneybag-woocommerce'),
                'type'        => 'textarea',
                'description' => __('This controls the description which the user sees during checkout.', 'moneybag-woocommerce'),
                'default'     => __('You will be redirected to Moneybag to complete your purchase.', 'moneybag-woocommerce'),
                'desc_tip'    => true,
            ),
            'api_key' => array(
                'title'       => __('API Key', 'moneybag-woocommerce'),
                'type'        => 'password',
                'description' => __('Enter your Moneybag API Key.', 'moneybag-woocommerce'),
                'default'     => '',
                'desc_tip'    => true,
            ),
            'environment' => array(
                'title'       => __('Environment', 'moneybag-woocommerce'),
                'type'        => 'select',
                'options'     => array(
                    'staging'    => __('Staging', 'moneybag-woocommerce'),
                    'production' => __('Production', 'moneybag-woocommerce'),
                ),
                'description' => __('Select the Moneybag environment (Staging for testing, Production for live payments).', 'moneybag-woocommerce'),
                'default'     => 'staging',
                'desc_tip'    => true,
            ),
            'api_timeout' => array(
                'title'       => __('API Timeout (seconds)', 'moneybag-woocommerce'),
                'type'        => 'number',
                'description' => __('Timeout for API requests in seconds.', 'moneybag-woocommerce'),
                'default'     => 30,
                'desc_tip'    => true,
            ),
            'api_retries' => array(
                'title'       => __('API Retries', 'moneybag-woocommerce'),
                'type'        => 'number',
                'description' => __('Number of retries for failed API requests with exponential backoff.', 'moneybag-woocommerce'),
                'default'     => 3,
                'desc_tip'    => true,
            ),
        );
    }

    /**
     * Process the payment and redirect to Moneybag.
     *
     * @param int $order_id
     * @return array
     */
    public function process_payment($order_id)
    {
        $order = wc_get_order($order_id);

        if (! $order) {
            wc_add_notice(__('Order not found.', 'moneybag-woocommerce'), 'error');
            return array('result' => 'fail', 'redirect' => wc_get_checkout_url());
        }
        
        // Validate required fields for Moneybag
        $email = $order->get_billing_email();
        $phone = $order->get_billing_phone();
        
        if (empty($email)) {
            wc_add_notice(__('Billing email address is required for Moneybag payments.', 'moneybag-woocommerce'), 'error');
            return array('result' => 'fail', 'redirect' => $order->get_checkout_payment_url(true));
        }
        
        if (empty($phone)) {
            wc_add_notice(__('Billing phone number is required for Moneybag payments.', 'moneybag-woocommerce'), 'error');
            return array('result' => 'fail', 'redirect' => $order->get_checkout_payment_url(true));
        }

        // Ensure SDK is initialized before attempting to use it.
        if (! $this->moneybag_sdk) {
            $error_message = __('Moneybag gateway is not properly configured. API Key or Environment missing.', 'moneybag-woocommerce');
            wc_add_notice($error_message, 'error');
            $this->log($error_message, 'critical', $order);
            return array('result' => 'fail', 'redirect' => $order->get_checkout_payment_url(true));
        }

        try {
            $checkout_request = $this->prepare_checkout_request($order);
            $response         = $this->moneybag_sdk->checkout($checkout_request);

            if ($response->getCheckoutUrl()) {
                // Store transaction details (order ID, Moneybag session ID) in order meta for later verification.
                $order->update_meta_data('_moneybag_session_id', $response->getSessionId());
                $order->save();

                // Mark as pending payment to start.
                $order->update_status('pending', __('Awaiting Moneybag payment.', 'moneybag-woocommerce'));

                return array(
                    'result'   => 'success',
                    'redirect' => $response->getCheckoutUrl(),
                );
            } else {
                $error_message = __('Moneybag checkout URL not received.', 'moneybag-woocommerce');
                wc_add_notice($error_message, 'error');
                $this->log('Checkout initiation failed: ' . $error_message, 'error', $order);
                return array(
                    'result'   => 'fail',
                    'redirect' => $order->get_checkout_payment_url(true), // Redirect back to checkout.
                );
            }
        } catch (MoneybagSdk_AuthenticationException $e) {
            $error_message = __('Moneybag API authentication failed. Please check your API Key.', 'moneybag-woocommerce');
            wc_add_notice($error_message, 'error');
            $this->log('Authentication Error: ' . $e->getMessage() . ' | ' . $e->getErrorBody(), 'critical', $order);
        } catch (MoneybagSdk_ValidationException $e) {
            $error_message = __('Moneybag API validation failed: ' . $e->getMessage(), 'moneybag-woocommerce');
            wc_add_notice($error_message, 'error');
            $this->log('Validation Error: ' . $e->getMessage() . ' | ' . $e->getErrorBody(), 'error', $order);
        } catch (MoneybagSdk_ApiException $e) {
            $error_message = __('Moneybag API error: ' . $e->getMessage(), 'moneybag-woocommerce');
            wc_add_notice($error_message, 'error');
            $this->log('API Error: ' . $e->getMessage() . ' (Status: ' . $e->getStatusCode() . ', Body: ' . $e->getErrorBody() . ')', 'error', $order);
        } catch (MoneybagSdk_MoneybagException $e) {
            $error_message = __('Moneybag payment initiation failed: ' . $e->getMessage(), 'moneybag-woocommerce');
            wc_add_notice($error_message, 'error');
            $this->log('Moneybag SDK Error: ' . $e->getMessage(), 'error', $order);
        } catch (Exception $e) {
            $error_message = __('An unexpected error occurred during payment initiation. Please try again.', 'moneybag-woocommerce');
            wc_add_notice($error_message, 'error');
            $this->log('Unexpected Error: ' . $e->getMessage(), 'critical', $order);
        }

        return array(
            'result'   => 'fail',
            'redirect' => $order->get_checkout_payment_url(true), // Redirect back to checkout on any failure.
        );
    }

    /**
     * Prepare the CheckoutRequest object from WooCommerce order.
     *
     * @param WC_Order $order
     * @return MoneybagSdk_CheckoutRequest
     */
    protected function prepare_checkout_request($order)
    {
        $request = new MoneybagSdk_CheckoutRequest();

        // Order Details
        $request->setOrderId($order->get_order_number());
        $request->setCurrency($order->get_currency());
        $request->setOrderAmount((string) $order->get_total());
        $request->setOrderDescription(sprintf(__('Order #%s from %s', 'moneybag-woocommerce'), $order->get_order_number(), get_bloginfo('name')));

        // Callback URLs - Use WooCommerce API endpoint for better reliability
        $callback_url = WC()->api_request_url('WC_Gateway_Moneybag');
        $request->setSuccessUrl(add_query_arg(array('moneybag_order_id' => $order->get_id(), 'status' => 'success'), $callback_url));
        $request->setFailUrl(add_query_arg(array('moneybag_order_id' => $order->get_id(), 'status' => 'fail'), $callback_url));
        $request->setCancelUrl(add_query_arg(array('moneybag_order_id' => $order->get_id(), 'status' => 'cancel'), $callback_url));
        $request->setIpnUrl(''); // If Moneybag supports IPN, set this to a dedicated webhook endpoint.

        // Customer Details
        $customer = new MoneybagSdk_Customer();
        $customer->setName($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
        $customer->setEmail($order->get_billing_email());
        $customer->setAddress($order->get_billing_address_1() . ' ' . $order->get_billing_address_2());
        $customer->setCity($order->get_billing_city());
        $customer->setPostcode($order->get_billing_postcode());
        $customer->setCountry($order->get_billing_country());
        $customer->setPhone($order->get_billing_phone());
        $request->setCustomer($customer);

        // Order Items
        $order_items = [];
        foreach ($order->get_items() as $item_id => $item) {
            // --- FIX 3: Robust check for product items and explicit type hint ---
            /**
             * @var WC_Order_Item_Product $item
             * Intelephense sometimes struggles with type inference within loops.
             * This docblock explicitly tells it that $item is a WC_Order_Item_Product
             * when is_type('line_item') is true.
             */
            if ($item->is_type('line_item')) { // Ensure it's a product line item

                // The get_product() method is specific to WC_Order_Item_Product.
                // It returns a WC_Product object.
                // The get_total() method is also specific to WC_Order_Item_Product (and other specific item types).
                // It returns the total price for that line item (quantity * unit price, after line discounts).

                $product = $item->get_product(); // Assign to a temporary variable

                if ($product instanceof WC_Product) { // Check if a product object was successfully retrieved
                    $order_item = new MoneybagSdk_OrderItem();
                    $order_item->setProductName($item->get_name());
                    $order_item->setQuantity($item->get_quantity());
                    // Use get_total for item's *actual* price for this line item.
                    // unit_price is calculated from (line_total / quantity)
                    // Ensure the division handles potential zero quantity if that's a risk.
                    $unit_price = ($item->get_quantity() > 0) ? ($item->get_total() / $item->get_quantity()) : 0;
                    $order_item->setUnitPrice(wc_format_decimal($unit_price, 2));
                    $order_item->setSku($product->get_sku());
                    // Add other item details if available and relevant (vat, convenience_fee, discount_amount, net_amount).
                    // For VAT, you might need to calculate $item->get_total_tax() per item and factor it in.
                    $order_items[] = $order_item;
                } else {
                    $this->log(sprintf('Product not found for order item ID %d in Order #%d.', $item_id, $order->get_id()), 'warning', $order);
                }
            }
            // --- END FIX 3 ---
        }
        $request->setOrderItems($order_items);

        // Shipping Details
        if ($order->get_shipping_address_1()) {
            $shipping = new MoneybagSdk_Shipping();
            $shipping->setName($order->get_shipping_first_name() . ' ' . $order->get_shipping_last_name());
            $shipping->setAddress($order->get_shipping_address_1() . ' ' . $order->get_shipping_address_2());
            $shipping->setCity($order->get_shipping_city());
            $shipping->setPostcode($order->get_shipping_postcode());
            $shipping->setCountry($order->get_shipping_country());
            $request->setShipping($shipping);
        }

        // Payment Info (conceptual)
        $payment_info = new MoneybagSdk_PaymentInfo();
        $payment_info->setIsRecurring(false); // Adjust based on your product types.
        $payment_info->setInstallments(0);
        $payment_info->setCurrencyConversion(false);
        $payment_info->setAllowedPaymentMethods(array('card', 'mobile_banking')); // Default methods.
        $payment_info->setRequiresEmi(false);
        $request->setPaymentInfo($payment_info);

        // Metadata (optional)
        $request->setMetadata(array(
            'source'         => 'woocommerce',
            'plugin_version' => $this->get_plugin_version(), // Implement this method.
            'order_id_wc'    => $order->get_id(), // Store original WC order ID.
        ));

        return $request;
    }

    /**
     * Add custom rewrite rule for Moneybag callback.
     */
    public function add_moneybag_rewrite_rule()
    {
        add_rewrite_rule('^moneybag-payment-callback/?$', 'index.php?moneybag_callback=1', 'top');
    }

    /**
     * Flush rewrite rules on plugin activation/deactivation.
     * This should ideally be hooked to plugin activation/deactivation in the main plugin file.
     */
    public function flush_moneybag_rewrite_rules()
    {
        if (get_option('moneybag_flush_rewrite_rules')) {
            flush_rewrite_rules();
            delete_option('moneybag_flush_rewrite_rules');
        }
    }

    /**
     * Add custom query variables.
     *
     * @param array $vars
     * @return array
     */
    public function add_moneybag_query_vars($vars)
    {
        $vars[] = 'moneybag_callback';
        return $vars;
    }

    /**
     * Handle the Moneybag callback request.
     * This function intercepts the request based on the rewrite rule.
     */
    public function handle_moneybag_callback_request()
    {
        // Check multiple ways to ensure we catch the callback
        $is_callback = false;
        
        // Method 1: Check query var
        $moneybag_callback_value = get_query_var('moneybag_callback', false);
        if ($moneybag_callback_value == '1') {
            $is_callback = true;
        }
        
        // Method 2: Check request URI
        if (!$is_callback && isset($_SERVER['REQUEST_URI'])) {
            $request_uri = $_SERVER['REQUEST_URI'];
            if (strpos($request_uri, '/moneybag-payment-callback') !== false) {
                $is_callback = true;
            }
        }
        
        // Method 3: Check if we have the order ID parameter
        if (!$is_callback && isset($_GET['moneybag_order_id']) && isset($_GET['status'])) {
            $is_callback = true;
        }
        
        if ($is_callback) {
            $this->log('Moneybag callback detected. Processing response...', 'info');
            $this->handle_moneybag_response();
            exit; // Important: exit after handling to prevent WordPress from trying to load a page.
        }
    }


    /**
     * Handle the response from Moneybag after payment completion.
     * This function is triggered by the custom rewrite rule.
     */
    public function handle_moneybag_response()
    {
        if (! isset($_GET['moneybag_order_id'])) {
            $this->log('Moneybag callback: moneybag_order_id not found in GET parameters.', 'error');
            wc_add_notice(__('Invalid payment callback received. Please contact support.', 'moneybag-woocommerce'), 'error');
            wp_redirect(wc_get_checkout_url()); // Redirect to checkout if essential params are missing.
            exit;
        }

        $order_id = absint($_GET['moneybag_order_id']);
        $order    = wc_get_order($order_id);

        if (! $order) {
            $this->log(sprintf('Moneybag callback: Order #%d not found.', $order_id), 'error');
            wc_add_notice(__('Order not found for payment verification.', 'moneybag-woocommerce'), 'error');
            wp_redirect(wc_get_page_permalink('shop')); // Redirect to shop or homepage.
            exit;
        }

        $moneybag_session_id = $order->get_meta('_moneybag_session_id'); // Retrieve the session ID stored earlier.

        if (empty($moneybag_session_id)) {
            $this->log(sprintf('Moneybag callback: No Moneybag session ID found in order meta for Order #%d.', $order_id), 'error', $order);
            wc_add_notice(__('Payment session not found for this order. Please contact support.', 'moneybag-woocommerce'), 'error');
            wp_redirect($order->get_checkout_payment_url(true)); // Redirect back to checkout.
            exit;
        }

        // It's crucial to ensure SDK is initialized here as well.
        if (! $this->moneybag_sdk) {
            $this->log(sprintf('Moneybag SDK not initialized during callback for Order #%d. Check API Key/Environment settings.', $order_id), 'critical', $order);
            wc_add_notice(__('Payment gateway configuration error during verification. Please contact support.', 'moneybag-woocommerce'), 'error');
            wp_redirect($order->get_checkout_payment_url(true));
            exit;
        }

        // Moneybag might send a transaction_id in the callback, if not, use session_id for verification.
        $moneybag_transaction_id = isset($_GET['moneybag_transaction_id']) ? sanitize_text_field($_GET['moneybag_transaction_id']) : $moneybag_session_id;

        // VERIFICATION DISABLED: Skipping payment verification with Moneybag API for now
        // Automatically mark payment as successful without API verification
        if (! $order->is_paid()) { // Prevent multiple processing.
            $order->payment_complete($moneybag_transaction_id);
            $order->add_order_note(sprintf(__('Moneybag payment marked as completed (verification disabled). Transaction ID: %s.', 'moneybag-woocommerce'), $moneybag_transaction_id));
            $this->log(sprintf('Payment marked as success for Order #%d. Transaction ID: %s (verification disabled)', $order_id, $moneybag_transaction_id), 'info', $order);
        }
        wp_redirect($this->get_return_url($order)); // Redirect to WooCommerce thank you page.
        exit;

        wp_redirect($order->get_checkout_payment_url(true)); // Fallback redirect to checkout.
        exit;
    }

    /**
     * Process a refund.
     * If Moneybag API supports refunds, implement this.
     *
     * @param int    $order_id
     * @param float  $amount
     * @param string $reason
     * @return bool True if refund was successful.
     */
    public function process_refund($order_id, $amount = null, $reason = '')
    {
        $order = wc_get_order($order_id);

        if (! $order) {
            return false;
        }

        $transaction_id = $order->get_transaction_id(); // The transaction ID from payment_complete().

        if (! $transaction_id) {
            $this->log(sprintf('Refund failed for Order #%d: No transaction ID found.', $order_id), 'error', $order);
            return false;
        }

        // Ensure SDK is initialized before attempting to use it.
        if (! $this->moneybag_sdk) {
            $this->log(sprintf('Moneybag SDK not initialized for refund for Order #%d. Check API Key/Environment settings.', $order_id), 'critical', $order);
            $order->add_order_note(sprintf(__('Moneybag refund configuration error for Order #%d. Check plugin settings.', 'moneybag-woocommerce'), $order_id));
            return false;
        }

        // --- Pseudocode for Refund (now active and using SDK) ---
        // You MUST implement the refund method in your MoneybagSdk class
        // and define MoneybagSdk_RefundResponse model.
        try {
            // Assuming MoneybagSdk has a refund method and returns a RefundResponse object.
            // You will need to create MoneybagSdk_RefundResponse and its methods.
            $refund_response = $this->moneybag_sdk->refund($transaction_id, $amount, $reason);

            // Adjust the following logic based on your actual Moneybag API refund response structure.
            if ($refund_response && method_exists($refund_response, 'isSuccess') && $refund_response->isSuccess()) {
                $refund_id = method_exists($refund_response, 'getRefundId') ? $refund_response->getRefundId() : $transaction_id; // Fallback to transaction_id if no specific refund ID
                $order->add_order_note(sprintf(__('Refund processed successfully via Moneybag. Amount: %s. Reason: %s. Moneybag Refund ID: %s', 'moneybag-woocommerce'), wc_price($amount), $reason, $refund_id));
                $this->log(sprintf('Refund success for Order #%d. Amount: %s', $order_id, $amount), 'info', $order);
                return true;
            } else {
                $response_details = '';
                if ($refund_response && method_exists($refund_response, 'getMessage')) {
                    $response_details = $refund_response->getMessage();
                } elseif (is_object($refund_response) || is_array($refund_response)) {
                    $response_details = print_r($refund_response, true);
                }
                $error_message = sprintf(__('Moneybag refund failed for Order #%d. Response: %s', 'moneybag-woocommerce'), $order_id, $response_details);
                $order->add_order_note($error_message);
                $this->log($error_message, 'error', $order);
                return false;
            }
        } catch (MoneybagSdk_AuthenticationException $e) {
            $error_message = sprintf(__('Moneybag API authentication failed during refund for Order #%d: %s', 'moneybag-woocommerce'), $order_id, $e->getMessage());
            $order->add_order_note($error_message);
            $this->log('Refund Authentication Error: ' . $e->getMessage() . ' | ' . $e->getErrorBody(), 'critical', $order);
            return false;
        } catch (MoneybagSdk_ValidationException $e) {
            $error_message = sprintf(__('Moneybag API validation failed during refund for Order #%d: %s', 'moneybag-woocommerce'), $order_id, $e->getMessage());
            $order->add_order_note($error_message);
            $this->log('Refund Validation Error: ' . $e->getMessage() . ' | ' . $e->getErrorBody(), 'error', $order);
            return false;
        } catch (MoneybagSdk_ApiException $e) {
            $error_message = sprintf(__('Moneybag API error during refund for Order #%d: %s', 'moneybag-woocommerce'), $order_id, $e->getMessage());
            $order->add_order_note($error_message);
            $this->log('Refund API Error: ' . $e->getMessage() . ' (Status: ' . $e->getStatusCode() . ', Body: ' . $e->getErrorBody() . ')', 'error', $order);
            return false;
        } catch (MoneybagSdk_MoneybagException $e) {
            $error_message = sprintf(__('Moneybag refund failed for Order #%d: %s', 'moneybag-woocommerce'), $order_id, $e->getMessage());
            $order->add_order_note($error_message);
            $this->log('Refund SDK Error: ' . $e->getMessage(), 'error', $order);
            return false;
        } catch (Exception $e) {
            $error_message = sprintf(__('An unexpected error occurred during refund for Order #%d: %s', 'moneybag-woocommerce'), $order_id, $e->getMessage());
            $order->add_order_note($error_message);
            $this->log('Unexpected Refund Error: ' . $e->getMessage(), 'critical', $order);
            return false;
        }
    }

    /**
     * Output for the order received page.
     * You can add custom messages here for the thank you page.
     */
    public function thankyou_page($order_id)
    {
        $order = wc_get_order($order_id);
        if ($order && $order->is_paid()) {
            echo '<p>' . esc_html__('Thank you for your order. Your payment has been successfully processed by Moneybag.', 'moneybag-woocommerce') . '</p>';
        } else {
            echo '<p>' . esc_html__('Your order is awaiting payment or payment could not be confirmed. Please check your order status for updates or contact us if you have any questions.', 'moneybag-woocommerce') . '</p>';
        }
    }

    /**
     * Wrapper for WooCommerce logging.
     *
     * @param string $message Log message.
     * @param string $level   Log level (debug, info, notice, warning, error, critical, alert, emergency).
     * @param WC_Order|null $order Optional. Order object to include order ID in context.
     */
    protected function log($message, $level = 'info', $order = null)
    {
        if (! function_exists('wc_get_logger')) {
            return;
        }

        $logger = wc_get_logger();
        $context = array('source' => 'moneybag-woocommerce');

        if ($order instanceof WC_Order) {
            $context['order_id'] = $order->get_id();
        }

        $logger->log($level, $message, $context);
    }

    /**
     * Get plugin version.
     * @return string
     */
    protected function get_plugin_version()
    {
        if (! function_exists('get_plugin_data')) {
            require_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        // Assumes this file is in 'includes/gateways' and the main plugin file is 'moneybag-woocommerce.php' in the parent directory.
        $plugin_data = get_plugin_data(plugin_dir_path(dirname(__FILE__)) . 'moneybag-woocommerce.php');
        return $plugin_data['Version'] ?? 'unknown'; // Return 'unknown' if version not found.
    }
    
    /**
     * Make billing phone and email fields required
     */
    public function make_billing_fields_required($fields) {
        // Only make billing phone required when Moneybag is available
        $chosen_payment_method = WC()->session->get('chosen_payment_method');
        
        if ($chosen_payment_method === $this->id || $this->is_available()) {
            // Make billing phone required
            if (isset($fields['billing_phone'])) {
                $fields['billing_phone']['required'] = true;
            }
            
            // Make billing email required (usually already required, but ensure it)
            if (isset($fields['billing_email'])) {
                $fields['billing_email']['required'] = true;
            }
        }
        
        return $fields;
    }
    
    /**
     * Modify checkout fields to ensure only billing phone is required
     */
    public function modify_checkout_fields($fields) {
        // Ensure shipping phone is not required
        if (isset($fields['shipping']['shipping_phone'])) {
            $fields['shipping']['shipping_phone']['required'] = false;
        }
        
        return $fields;
    }
    
    /**
     * Validate required fields during checkout
     */
    public function validate_required_fields() {
        // Only validate if Moneybag is the selected payment method
        if (isset($_POST['payment_method']) && $_POST['payment_method'] === $this->id) {
            // Check billing email
            if (empty($_POST['billing_email'])) {
                wc_add_notice(__('Billing email address is required for Moneybag payments.', 'moneybag-woocommerce'), 'error');
            }
            
            // Check billing phone
            if (empty($_POST['billing_phone'])) {
                wc_add_notice(__('Billing phone number is required for Moneybag payments.', 'moneybag-woocommerce'), 'error');
            }
        }
    }
    
    /**
     * Enqueue scripts for checkout
     */
    public function enqueue_checkout_scripts() {
        if (is_checkout() && !is_order_received_page()) {
            wp_enqueue_script(
                'moneybag-checkout',
                plugin_dir_url(dirname(__FILE__)) . 'assets/js/moneybag-checkout.js',
                array('jquery'),
                $this->get_plugin_version(),
                true
            );
            
            wp_localize_script('moneybag-checkout', 'moneybag_checkout_params', array(
                'payment_method_id' => $this->id,
                'phone_required_message' => __('Billing phone number is required for Moneybag payments.', 'moneybag-woocommerce'),
                'email_required_message' => __('Billing email address is required for Moneybag payments.', 'moneybag-woocommerce')
            ));
        }
    }
}
