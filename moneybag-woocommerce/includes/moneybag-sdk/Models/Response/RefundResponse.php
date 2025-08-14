<?php
// includes/moneybag-sdk/Models/Response/RefundResponse.php

if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_RefundResponse
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Create a RefundResponse object from raw API response data.
     *
     * @param array $data The decoded JSON response data for the refund.
     * @return MoneybagSdk_RefundResponse
     */
    public static function fromJson(array $data): self
    {
        return new self($data);
    }

    /**
     * Checks if the refund was successful based on the API response.
     * **Adjust this logic based on your Moneybag API's success indicator.**
     * Common indicators: 'status' field, 'success' boolean, 'refund_status'.
     *
     * @return bool
     */
    public function isSuccess(): bool
    {
        // Example: Assuming Moneybag returns 'status' => 'REFUNDED' or 'success' => true
        return isset($this->data['status']) && in_array($this->data['status'], ['REFUNDED', 'SUCCESS']);
        // OR if they return a simple boolean success flag:
        // return isset($this->data['success']) && $this->data['success'] === true;
    }

    /**
     * Get the Moneybag refund ID, if provided.
     *
     * @return string|null
     */
    public function getRefundId(): ?string
    {
        // Adjust to the actual field name for refund ID in Moneybag's response.
        return $this->data['refund_id'] ?? $this->data['id'] ?? null;
    }

    /**
     * Get the transaction ID associated with the refund.
     *
     * @return string|null
     */
    public function getTransactionId(): ?string
    {
        // This might be the original transaction ID or a new one for the refund.
        return $this->data['transaction_id'] ?? $this->data['original_transaction_id'] ?? null;
    }

    /**
     * Get a message from the refund response.
     *
     * @return string|null
     */
    public function getMessage(): ?string
    {
        return $this->data['message'] ?? $this->data['error_message'] ?? 'Refund status not clearly indicated.';
    }

    /**
     * Get the refunded amount.
     *
     * @return float|null
     */
    public function getAmount(): ?float
    {
        return isset($this->data['amount']) ? (float) $this->data['amount'] : null;
    }

    /**
     * Get the raw data array.
     * @return array
     */
    public function toArray(): array
    {
        return $this->data;
    }
}
