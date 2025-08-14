<?php
if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_OrderItem
{
    public $sku;
    public $product_name;
    public $product_category;
    public $quantity;
    public $unit_price;
    public $vat;
    public $convenience_fee;
    public $discount_amount;
    public $net_amount;
    public $metadata; // array

    // Setters (fluent interface)
    public function setSku($sku)
    {
        $this->sku = $sku;
        return $this;
    }
    public function setProductName($product_name)
    {
        $this->product_name = $product_name;
        return $this;
    }
    public function setProductCategory($product_category)
    {
        $this->product_category = $product_category;
        return $this;
    }
    public function setQuantity($quantity)
    {
        $this->quantity = $quantity;
        return $this;
    }
    public function setUnitPrice($unit_price)
    {
        $this->unit_price = $unit_price;
        return $this;
    }
    public function setVat($vat)
    {
        $this->vat = $vat;
        return $this;
    }
    public function setConvenienceFee($convenience_fee)
    {
        $this->convenience_fee = $convenience_fee;
        return $this;
    }
    public function setDiscountAmount($discount_amount)
    {
        $this->discount_amount = $discount_amount;
        return $this;
    }
    public function setNetAmount($net_amount)
    {
        $this->net_amount = $net_amount;
        return $this;
    }
    public function setMetadata(array $metadata)
    {
        $this->metadata = $metadata;
        return $this;
    }

    // Getters
    public function getSku()
    {
        return $this->sku;
    }
    public function getProductName()
    {
        return $this->product_name;
    }
    public function getProductCategory()
    {
        return $this->product_category;
    }
    public function getQuantity()
    {
        return $this->quantity;
    }
    public function getUnitPrice()
    {
        return $this->unit_price;
    }
    public function getVat()
    {
        return $this->vat;
    }
    public function getConvenienceFee()
    {
        return $this->convenience_fee;
    }
    public function getDiscountAmount()
    {
        return $this->discount_amount;
    }
    public function getNetAmount()
    {
        return $this->net_amount;
    }
    public function getMetadata()
    {
        return $this->metadata;
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
