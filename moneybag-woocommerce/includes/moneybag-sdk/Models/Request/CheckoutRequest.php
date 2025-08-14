<?php
if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_CheckoutRequest
{
    public $order_id;
    public $currency;
    public $order_amount;
    public $order_description;
    public $success_url;
    public $cancel_url;
    public $fail_url;
    public $ipn_url;
    public $customer; // MoneybagSdk_Customer object
    public $shipping; // MoneybagSdk_Shipping object
    public $order_items; // Array of MoneybagSdk_OrderItem objects
    public $payment_info; // MoneybagSdk_PaymentInfo object
    public $metadata; // Array

    // Setter methods (fluent interface recommended)
    public function setOrderId($order_id)
    {
        $this->order_id = $order_id;
        return $this;
    }
    public function setCurrency($currency)
    {
        $this->currency = $currency;
        return $this;
    }
    public function setOrderAmount($order_amount)
    {
        $this->order_amount = $order_amount;
        return $this;
    }
    public function setOrderDescription($order_description)
    {
        $this->order_description = $order_description;
        return $this;
    }
    public function setSuccessUrl($success_url)
    {
        $this->success_url = $success_url;
        return $this;
    }
    public function setCancelUrl($cancel_url)
    {
        $this->cancel_url = $cancel_url;
        return $this;
    }
    public function setFailUrl($fail_url)
    {
        $this->fail_url = $fail_url;
        return $this;
    }
    public function setIpnUrl($ipn_url)
    {
        $this->ipn_url = $ipn_url;
        return $this;
    }
    public function setCustomer(MoneybagSdk_Customer $customer)
    {
        $this->customer = $customer;
        return $this;
    }
    public function setShipping(MoneybagSdk_Shipping $shipping)
    {
        $this->shipping = $shipping;
        return $this;
    }
    public function setOrderItems(array $order_items)
    {
        $this->order_items = $order_items;
        return $this;
    }
    public function setPaymentInfo(MoneybagSdk_PaymentInfo $payment_info)
    {
        $this->payment_info = $payment_info;
        return $this;
    }
    public function setMetadata(array $metadata)
    {
        $this->metadata = $metadata;
        return $this;
    }

    // Getter methods (optional, but good for accessing data)
    public function getOrderId()
    {
        return $this->order_id;
    }
    public function getCurrency()
    {
        return $this->currency;
    }
    public function getOrderAmount()
    {
        return $this->order_amount;
    }
    public function getSuccessUrl()
    {
        return $this->success_url;
    }
    public function getFailUrl()
    {
        return $this->fail_url;
    }
    public function getCancelUrl()
    {
        return $this->cancel_url;
    }
    public function getCustomer()
    {
        return $this->customer;
    }

    /**
     * Converts the object to a JSON string for API request.
     * Handles nested objects.
     * @return string
     */
    public function toJson(): string
    {
        $data = [];
        foreach (get_object_vars($this) as $key => $value) {
            // Convert property names to snake_case for API (e.g., 'orderId' -> 'order_id')
            $api_key = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key));

            if (is_object($value) && method_exists($value, 'toArray')) {
                $data[$api_key] = $value->toArray();
            } elseif (is_array($value)) {
                // Check if this is the metadata field and should be an object
                if ($api_key === 'metadata' && $this->isAssociativeArray($value)) {
                    $data[$api_key] = $value; // Keep as associative array, json_encode will make it an object
                } else {
                    $items_array = [];
                    foreach ($value as $item) {
                        if (is_object($item) && method_exists($item, 'toArray')) {
                            $items_array[] = $item->toArray();
                        } else {
                            $items_array[] = $item;
                        }
                    }
                    $data[$api_key] = $items_array;
                }
            } else {
                // Skip empty string values that should be null (like ipn_url)
                if ($value === '') {
                    continue;
                }
                $data[$api_key] = $value;
            }
        }
        return json_encode($data);
    }

    /**
     * Check if an array is associative (has string keys)
     * @param array $array
     * @return bool
     */
    private function isAssociativeArray(array $array): bool
    {
        if (empty($array)) return false;
        return array_keys($array) !== range(0, count($array) - 1);
    }

    /**
     * Converts the object to an array (useful for nested serialization).
     * @return array
     */
    public function toArray(): array
    {
        $data = [];
        foreach (get_object_vars($this) as $key => $value) {
            $api_key = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key));

            if (is_object($value) && method_exists($value, 'toArray')) {
                $data[$api_key] = $value->toArray();
            } elseif (is_array($value)) {
                $items_array = [];
                foreach ($value as $item) {
                    if (is_object($item) && method_exists($item, 'toArray')) {
                        $items_array[] = $item->toArray();
                    } else {
                        $items_array[] = $item;
                    }
                }
                $data[$api_key] = $items_array;
            } else {
                // Skip empty string values that should be null (like ipn_url)
                if ($value === '') {
                    continue;
                }
                $data[$api_key] = $value;
            }
        }
        return $data;
    }
}
