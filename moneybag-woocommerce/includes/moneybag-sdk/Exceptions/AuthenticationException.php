<?php
// includes/moneybag-sdk/Exceptions/AuthenticationException.php

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly to prevent unauthorized access.
}

/**
 * Custom exception for authentication-related errors (e.g., invalid API key,
 * forbidden access).
 *
 * This exception should be thrown when an API call fails due to issues
 * with authentication credentials. It extends MoneybagSdk_MoneybagException
 * to maintain the custom exception hierarchy.
 */
class MoneybagSdk_AuthenticationException extends MoneybagSdk_MoneybagException
{

    /**
     * Constructor for MoneybagSdk_AuthenticationException.
     *
     * @param string        $message    A human-readable error message.
     * @param int           $code       An error code, often an HTTP status code like 401 or 403.
     * @param string        $error_body The raw error response body from the API, if available.
     * @param Throwable|null $previous   The previous throwable used for the exception chaining.
     */
    public function __construct($message = '', $code = 0, $error_body = '', Throwable $previous = null)
    {
        // Call the parent constructor (MoneybagSdk_MoneybagException)
        // Authentication errors typically correspond to 401 (Unauthorized) or 403 (Forbidden) HTTP codes.
        parent::__construct($message, $code, $error_body, $previous);
    }

    /**
     * String representation of the exception.
     *
     * @return string
     */
    public function __toString()
    {
        return __CLASS__ . ": [Code {$this->code}]: {$this->message}" . PHP_EOL . "Response Body: {$this->error_body}" . PHP_EOL;
    }
}
