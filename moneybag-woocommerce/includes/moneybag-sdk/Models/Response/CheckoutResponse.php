<?php
if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_CheckoutResponse
{
    protected $checkout_url;
    protected $session_id;
    protected $expires_at;

    public function __construct($checkout_url, $session_id, $expires_at)
    {
        $this->checkout_url = $checkout_url;
        $this->session_id   = $session_id;
        $this->expires_at   = $expires_at;
    }

    /**
     * Creates a CheckoutResponse object from an array (e.g., JSON decoded API response).
     * @param array $data
     * @return self
     */
    public static function fromJson(array $data): self
    {
        return new self(
            $data['checkout_url'] ?? null,
            $data['session_id'] ?? null,
            $data['expires_at'] ?? null
        );
    }

    // Getter methods
    public function getCheckoutUrl()
    {
        return $this->checkout_url;
    }
    public function getSessionId()
    {
        return $this->session_id;
    }
    public function getExpiresAt()
    {
        return $this->expires_at;
    }
}
