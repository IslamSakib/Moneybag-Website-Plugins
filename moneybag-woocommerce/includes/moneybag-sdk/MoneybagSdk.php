<?php
// Namespace (optional but recommended for larger projects)
// namespace Moneybag\Sdk;

if (! defined('ABSPATH')) {
    exit;
}

// Ensure other SDK classes are loaded or use Composer for autoloading in a real project.
// For this standalone plugin, they are included in the main plugin file.

// Assuming these are already loaded via your main plugin file, e.g., moneybag-woocommerce.php
// require_once __DIR__ . '/HttpClient.php';
// require_once __DIR__ . '/Exceptions/MoneybagException.php';
// require_once __DIR__ . '/Exceptions/AuthenticationException.php';
// require_once __DIR__ . '/Exceptions/ValidationException.php';
// require_once __DIR__ . '/Exceptions/ApiException.php';
// require_once __DIR__ . '/Models/Request/CheckoutRequest.php'; // Required for checkout method
// require_once __DIR__ . '/Models/Response/CheckoutResponse.php'; // Required for checkout method
// require_once __DIR__ . '/Models/Response/VerifyResponse.php'; // Required for verify method
// require_once __DIR__ . '/Models/Response/RefundResponse.php'; // <--- NEW: You need to create this file!

class MoneybagSdk
{
    private $api_key;
    private $base_url;
    private $http_client;
    private $environment;

    public function __construct($api_key, $environment = 'staging', MoneybagSdk_HttpClient $http_client = null)
    {
        $this->api_key = $api_key;
        $this->environment = $environment;
        $this->setBaseUrl(); // Set base URL based on environment.
        $this->http_client = $http_client ?: new MoneybagSdk_HttpClient(); // Use provided client or default.
    }

    private function setBaseUrl()
    {
        if ('production' === $this->environment) {
            $this->base_url = 'https://api.moneybag.com.bd/api/v2'; // Production URL
        } else {
            $this->base_url = 'https://staging.api.moneybag.com.bd/api/v2'; // Staging URL
        }
    }

    public function getBaseUrl()
    {
        return $this->base_url;
    }

    public function setHttpClient(MoneybagSdk_HttpClient $http_client)
    {
        $this->http_client = $http_client;
    }

    /**
     * Initiates a payment checkout session.
     *
     * @param MoneybagSdk_CheckoutRequest $request
     * @return MoneybagSdk_CheckoutResponse
     * @throws MoneybagSdk_MoneybagException
     */
    public function checkout(MoneybagSdk_CheckoutRequest $request): MoneybagSdk_CheckoutResponse
    {
        $this->validateCheckoutRequest($request);

        $headers = $this->getHeaders();
        $url     = $this->base_url . '/payments/checkout';
        $body    = $request->toJson();

        $response_data = $this->http_client->post($url, $headers, $body);

        if (isset($response_data['success']) && $response_data['success'] && isset($response_data['data'])) {
            return MoneybagSdk_CheckoutResponse::fromJson($response_data['data']);
        } else {
            throw $this->handleApiError($response_data);
        }
    }

    /**
     * Verifies the status of a payment transaction.
     *
     * @param string $transactionId
     * @return MoneybagSdk_VerifyResponse
     * @throws MoneybagSdk_MoneybagException
     */
    public function verify(string $transactionId): MoneybagSdk_VerifyResponse
    {
        if (empty($transactionId)) {
            throw new MoneybagSdk_ValidationException('Transaction ID is required for verification.');
        }

        $headers = $this->getHeaders();
        // Sanitize for URL path segment. Using rawurlencode for safety.
        $url     = $this->base_url . '/payments/verify/' . rawurlencode($transactionId);

        $response_data = $this->http_client->get($url, $headers);

        if (isset($response_data['success']) && $response_data['success'] && isset($response_data['data'])) {
            return MoneybagSdk_VerifyResponse::fromJson($response_data['data']);
        } else {
            throw $this->handleApiError($response_data);
        }
    }

    
    protected function getHeaders(): array
    {
        return [
            'Content-Type'       => 'application/json',
            'X-Merchant-API-Key' => $this->api_key,
        ];
    }

    /**
     * Basic validation for CheckoutRequest. Add more robust validation here.
     *
     * @param MoneybagSdk_CheckoutRequest $request
     * @throws MoneybagSdk_ValidationException
     */
    private function validateCheckoutRequest(MoneybagSdk_CheckoutRequest $request)
    {
        if (empty($request->getOrderId())) {
            throw new MoneybagSdk_ValidationException('Order ID is required.');
        }
        if (! preg_match('/^[A-Z]{3}$/', $request->getCurrency())) {
            throw new MoneybagSdk_ValidationException('Invalid currency format. Must be 3 uppercase letters (e.g., BDT).');
        }
        if (! is_numeric($request->getOrderAmount()) || (float) $request->getOrderAmount() <= 0) {
            throw new MoneybagSdk_ValidationException('Order amount must be a positive number.');
        }
        if (! filter_var($request->getSuccessUrl(), FILTER_VALIDATE_URL)) {
            throw new MoneybagSdk_ValidationException('Success URL is invalid.');
        }
        if (! filter_var($request->getFailUrl(), FILTER_VALIDATE_URL)) {
            throw new MoneybagSdk_ValidationException('Fail URL is invalid.');
        }
        if (! filter_var($request->getCancelUrl(), FILTER_VALIDATE_URL)) {
            throw new MoneybagSdk_ValidationException('Cancel URL is invalid.');
        }

        // Customer validation
        if (! $request->getCustomer() || empty($request->getCustomer()->getName())) {
            throw new MoneybagSdk_ValidationException('Customer name is required.');
        }
        if (! $request->getCustomer() || ! filter_var($request->getCustomer()->getEmail(), FILTER_VALIDATE_EMAIL)) {
            throw new MoneybagSdk_ValidationException('Customer email is invalid or missing.');
        }
        // ... add more detailed validations as per your API documentation.
    }


    /**
     * Handles API error responses and throws appropriate exceptions.
     *
     * @param array $response_data The decoded JSON response from the API.
     * @throws MoneybagSdk_AuthenticationException
     * @throws MoneybagSdk_ValidationException
     * @throws MoneybagSdk_ApiException
     * @throws MoneybagSdk_MoneybagException
     */
    protected function handleApiError(array $response_data)
    {
        $status_code = isset($response_data['status_code']) ? (int) $response_data['status_code'] : 0;
        $message     = isset($response_data['message']) ? $response_data['message'] : 'Unknown API error.';
        $error_body  = json_encode($response_data); // Entire response as error body

        // Attempt to get a more specific message if available
        if (isset($response_data['data']) && is_string($response_data['data'])) {
            $message = $response_data['data'];
        } elseif (isset($response_data['errors']) && is_array($response_data['errors'])) {
            // If the API returns a structured errors array
            $error_messages = [];
            foreach ($response_data['errors'] as $field => $errors) {
                if (is_array($errors)) {
                    $error_messages[] = sprintf('%s: %s', $field, implode(', ', $errors));
                } else {
                    $error_messages[] = $errors;
                }
            }
            $message = implode('; ', $error_messages) ?: $message;
        }

        switch ($status_code) {
            case 401: // Unauthorized
            case 403: // Forbidden
                throw new MoneybagSdk_AuthenticationException($message, $status_code, $error_body);
            case 400: // Bad Request (often validation errors)
            case 422: // Unprocessable Entity (validation errors)
                throw new MoneybagSdk_ValidationException($message, $status_code, $error_body);
            case 404: // Not Found (e.g., endpoint not found)
            case 500: // Internal Server Error
            case 502: // Bad Gateway
            case 503: // Service Unavailable
            case 504: // Gateway Timeout
                throw new MoneybagSdk_ApiException($message, $status_code, $error_body);
            default:
                // If 'success' is false but no specific status code, or an unexpected code.
                throw new MoneybagSdk_MoneybagException('Moneybag API error: ' . $message, $status_code, $error_body);
        }
    }
}
