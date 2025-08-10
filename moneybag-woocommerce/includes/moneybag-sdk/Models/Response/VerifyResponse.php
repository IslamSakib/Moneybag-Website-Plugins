<?php
if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_VerifyResponse
{
    protected $transaction_id;
    protected $order_id;
    protected $verified;
    protected $status;
    protected $amount;
    protected $currency;
    protected $payment_method;
    protected $payment_reference_id;
    protected $customer; // MoneybagSdk_Customer object (reusing the request model for simplicity if structure is same)

    public function __construct(
        $transaction_id,
        $order_id,
        $verified,
        $status,
        $amount,
        $currency,
        $payment_method,
        $payment_reference_id,
        $customer_data // array for customer
    ) {
        $this->transaction_id       = $transaction_id;
        $this->order_id             = $order_id;
        $this->verified             = (bool) $verified;
        $this->status               = $status;
        $this->amount               = $amount;
        $this->currency             = $currency;
        $this->payment_method       = $payment_method;
        $this->payment_reference_id = $payment_reference_id;

        // Populate customer object
        if (! empty($customer_data)) {
            $customer = new MoneybagSdk_Customer();
            $customer->setName($customer_data['name'] ?? null);
            $customer->setEmail($customer_data['email'] ?? null);
            $customer->setAddress($customer_data['address'] ?? null);
            $customer->setCity($customer_data['city'] ?? null);
            $customer->setPostcode($customer_data['postcode'] ?? null);
            $customer->setCountry($customer_data['country'] ?? null);
            $customer->setPhone($customer_data['phone'] ?? null);
            $this->customer = $customer;
        }
    }

    /**
     * Creates a VerifyResponse object from an array (e.g., JSON decoded API response).
     * @param array $data
     * @return self
     */
    public static function fromJson(array $data): self
    {
        return new self(
            $data['transaction_id'] ?? null,
            $data['order_id'] ?? null,
            $data['verified'] ?? false,
            $data['status'] ?? null,
            $data['amount'] ?? null,
            $data['currency'] ?? null,
            $data['payment_method'] ?? null,
            $data['payment_reference_id'] ?? null,
            $data['customer'] ?? [] // Pass customer data as array to constructor
        );
    }

    // Getter methods
    public function getTransactionId()
    {
        return $this->transaction_id;
    }
    public function getOrderId()
    {
        return $this->order_id;
    }
    public function isVerified(): bool
    {
        return $this->verified;
    }
    public function getStatus()
    {
        return $this->status;
    }
    public function getAmount()
    {
        return $this->amount;
    }
    public function getCurrency()
    {
        return $this->currency;
    }
    public function getPaymentMethod()
    {
        return $this->payment_method;
    }
    public function getPaymentReferenceId()
    {
        return $this->payment_reference_id;
    }
    public function getCustomer(): ?MoneybagSdk_Customer
    {
        return $this->customer;
    }
}
