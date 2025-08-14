<?php
if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_PaymentInfo
{
    public $is_recurring;
    public $installments;
    public $currency_conversion;
    public $allowed_payment_methods; // array of strings
    public $requires_emi;

    // Setters (fluent interface)
    public function setIsRecurring($is_recurring)
    {
        $this->is_recurring = (bool) $is_recurring;
        return $this;
    }
    public function setInstallments($installments)
    {
        $this->installments = (int) $installments;
        return $this;
    }
    public function setCurrencyConversion($currency_conversion)
    {
        $this->currency_conversion = (bool) $currency_conversion;
        return $this;
    }
    public function setAllowedPaymentMethods(array $allowed_payment_methods)
    {
        $this->allowed_payment_methods = $allowed_payment_methods;
        return $this;
    }
    public function setRequiresEmi($requires_emi)
    {
        $this->requires_emi = (bool) $requires_emi;
        return $this;
    }

    // Getters
    public function getIsRecurring()
    {
        return $this->is_recurring;
    }
    public function getInstallments()
    {
        return $this->installments;
    }
    public function getCurrencyConversion()
    {
        return $this->currency_conversion;
    }
    public function getAllowedPaymentMethods()
    {
        return $this->allowed_payment_methods;
    }
    public function getRequiresEmi()
    {
        return $this->requires_emi;
    }

    /**
     * Converts the object properties to an associative array,
     * converting property names to snake_case for API compatibility.
     *
     * @return array
     */
    public function toArray(): array
    {
        $data = [];
        foreach (get_object_vars($this) as $key => $value) {
            if (null !== $value) { // Only include non-null values
                $api_key = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key));
                $data[$api_key] = $value;
            }
        }
        return $data;
    }
}
