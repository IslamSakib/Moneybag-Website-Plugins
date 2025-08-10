<?php
// includes/moneybag-sdk/Exceptions/ApiException.php

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly to prevent unauthorized access.
}

/**
 * Custom exception for API-specific errors (e.g., 4xx, 5xx HTTP status codes).
 *
 * This exception should be thrown when the API call itself returns an error
 * response (not a network error, but an error status from the server).
 * It extends MoneybagSdk_MoneybagException to maintain the custom exception hierarchy.
 */
class MoneybagSdk_ApiException extends MoneybagSdk_MoneybagException
{

    /**
     * @var int The HTTP status code returned by the API.
     */
    protected $status_code;

    /**
     * Constructor for MoneybagSdk_ApiException.
     *
     * @param string         $message   A human-readable error message.
     * @param int            $status_code The HTTP status code (e.g., 400, 500).
     * @param string         $error_body The raw error response body from the API, if available.
     * @param Throwable|null $previous  The previous throwable used for the exception chaining.
     */
    public function __construct($message = '', $status_code = 0, $error_body = '', Throwable $previous = null)
    {
        // Call the parent constructor (MoneybagSdk_MoneybagException)
        parent::__construct($message, $status_code, $error_body, $previous);
        $this->status_code = $status_code;
    }

    /**
     * Get the HTTP status code.
     *
     * @return int
     */
    public function getStatusCode(): int
    {
        return $this->status_code;
    }

    /**
     * String representation of the exception.
     *
     * @return string
     */
    public function __toString()
    {
        return __CLASS__ . ": [HTTP Status {$this->status_code}]: {$this->message}" . PHP_EOL . "Response Body: {$this->error_body}" . PHP_EOL;
    }
}
