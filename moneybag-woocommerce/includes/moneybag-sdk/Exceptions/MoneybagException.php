<?php
if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_MoneybagException extends Exception
{
    protected $error_body;

    public function __construct($message = '', $code = 0, $error_body = '', Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->error_body = $error_body;
    }

    public function getErrorBody()
    {
        return $this->error_body;
    }

    public function __toString()
    {
        return __CLASS__ . ": [{$this->code}]: {$this->message}" . PHP_EOL . "Response Body: {$this->error_body}" . PHP_EOL;
    }
}
