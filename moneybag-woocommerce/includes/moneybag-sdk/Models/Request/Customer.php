<?php
if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_Customer
{
    public $name;
    public $email;
    public $address;
    public $city;
    public $postcode;
    public $country;
    public $phone;

    // Setters (fluent interface)
    public function setName($name)
    {
        $this->name = $name;
        return $this;
    }
    public function setEmail($email)
    {
        $this->email = $email;
        return $this;
    }
    public function setAddress($address)
    {
        $this->address = $address;
        return $this;
    }
    public function setCity($city)
    {
        $this->city = $city;
        return $this;
    }
    public function setPostcode($postcode)
    {
        $this->postcode = $postcode;
        return $this;
    }
    public function setCountry($country)
    {
        $this->country = $country;
        return $this;
    }
    public function setPhone($phone)
    {
        $this->phone = $phone;
        return $this;
    }

    // Getters
    public function getName()
    {
        return $this->name;
    }
    public function getEmail()
    {
        return $this->email;
    }
    public function getAddress()
    {
        return $this->address;
    }
    public function getCity()
    {
        return $this->city;
    }
    public function getPostcode()
    {
        return $this->postcode;
    }
    public function getCountry()
    {
        return $this->country;
    }
    public function getPhone()
    {
        return $this->phone;
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
