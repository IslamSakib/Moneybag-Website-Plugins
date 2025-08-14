<?php
// includes/moneybag-sdk/Exceptions/ValidationException.php

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly to prevent unauthorized access.
}

/**
 * Custom exception for validation-related errors.
 *
 * This exception should be thrown when input data (either from the merchant
 * application or from the API response) fails validation rules. It extends
 * MoneybagSdk_MoneybagException to maintain the custom exception hierarchy.
 */
class MoneybagSdk_ValidationException extends MoneybagSdk_MoneybagException
{

    /**
     * Constructor for MoneybagSdk_ValidationException.
     *
     * @param string         $message   A human-readable error message explaining the validation failure.
     * @param int            $code      An error code, often an HTTP status code like 400 or 422 if from API.
     * @param string         $error_body The raw error response body from the API, if available,
     * or details about the invalid input if client-side validation.
     * @param Throwable|null $previous  The previous throwable used for the exception chaining.
     */
    public function __construct($message = '', $code = 0, $error_body = '', Throwable $previous = null)
    {
        // Call the parent constructor (MoneybagSdk_MoneybagException)
        // Validation errors often correspond to 400 (Bad Request) or 422 (Unprocessable Entity) HTTP codes.
        parent::__construct($message, $code, $error_body, $previous);
    }

    /**
     * String representation of the exception.
     *
     * @return string
     */
    public function __toString()
    {
        return __CLASS__ . ": [Code {$this->code}]: {$this->message}" . PHP_EOL . "Details: {$this->error_body}" . PHP_EOL;
    }
}
