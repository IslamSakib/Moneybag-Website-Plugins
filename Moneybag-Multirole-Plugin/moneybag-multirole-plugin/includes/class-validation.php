<?php
if (!defined('ABSPATH')) {
    exit;
}

class MoneyBagValidation {
    
    private $rules = [];
    
    public function __construct() {
        $this->rules = $this->get_validation_rules();
    }
    
    private function get_validation_rules() {
        return [
            'email' => [
                'required' => true,
                'pattern' => '/^[^\s@]+@[^\s@]+\.[^\s@]+$/',
                'message' => 'Please enter a valid email address'
            ],
            'phone' => [
                'required' => true,
                'pattern' => '/^\+?[0-9]{10,15}$/',
                'message' => 'Please enter a valid phone number'
            ],
            'mobile' => [
                'required' => true,
                'pattern' => '/^\+?88[0-9]{10,11}$/',
                'message' => 'Please enter a valid Bangladesh mobile number'
            ],
            'website' => [
                'required' => false,
                'pattern' => '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
                'message' => 'Please enter a valid website URL'
            ],
            'required_text' => [
                'required' => true,
                'minLength' => 2,
                'message' => 'This field is required'
            ],
            'password' => [
                'required' => true,
                'minLength' => 8,
                'pattern' => '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/',
                'message' => 'Password must be at least 8 characters with uppercase, lowercase and number'
            ],
            'amount' => [
                'required' => true,
                'pattern' => '/^[0-9]+(\.[0-9]{1,2})?$/',
                'min' => 0,
                'message' => 'Please enter a valid amount'
            ],
            'otp' => [
                'required' => true,
                'pattern' => '/^[0-9]{6}$/',
                'message' => 'OTP must be 6 digits'
            ]
        ];
    }
    
    public function validate_field($field_name, $value, $field_type = 'required_text') {
        $errors = [];
        
        if (!isset($this->rules[$field_type])) {
            $field_type = 'required_text';
        }
        
        $rule = $this->rules[$field_type];
        
        // Check required
        if ($rule['required'] && empty($value)) {
            $errors[] = $rule['message'] ?? 'This field is required';
            return $errors;
        }
        
        // Skip validation if not required and empty
        if (!$rule['required'] && empty($value)) {
            return $errors;
        }
        
        // Check pattern
        if (isset($rule['pattern']) && !preg_match($rule['pattern'], $value)) {
            $errors[] = $rule['message'];
        }
        
        // Check min length
        if (isset($rule['minLength']) && strlen($value) < $rule['minLength']) {
            $errors[] = sprintf('Minimum %d characters required', $rule['minLength']);
        }
        
        // Check max length
        if (isset($rule['maxLength']) && strlen($value) > $rule['maxLength']) {
            $errors[] = sprintf('Maximum %d characters allowed', $rule['maxLength']);
        }
        
        // Check min value
        if (isset($rule['min']) && is_numeric($value) && $value < $rule['min']) {
            $errors[] = sprintf('Minimum value is %d', $rule['min']);
        }
        
        // Check max value
        if (isset($rule['max']) && is_numeric($value) && $value > $rule['max']) {
            $errors[] = sprintf('Maximum value is %d', $rule['max']);
        }
        
        return $errors;
    }
    
    public function validate_step($form_type, $step, $data) {
        $errors = [];
        
        switch ($form_type) {
            case 'merchant':
                $errors = $this->validate_merchant_step($step, $data);
                break;
            case 'pricing':
                $errors = $this->validate_pricing_step($step, $data);
                break;
            case 'sandbox':
                $errors = $this->validate_sandbox_step($step, $data);
                break;
        }
        
        return $errors;
    }
    
    private function validate_merchant_step($step, $data) {
        $errors = [];
        
        switch ($step) {
            case 1: // Business Info
                if (empty($data['legalIdentity'])) {
                    $errors['legalIdentity'] = 'Please select legal identity';
                }
                if (empty($data['businessCategory'])) {
                    $errors['businessCategory'] = 'Please select business category';
                }
                if (empty($data['monthlyVolume'])) {
                    $errors['monthlyVolume'] = 'Please select monthly transaction volume';
                }
                if (empty($data['maxAmount'])) {
                    $errors['maxAmount'] = 'Please enter maximum transaction amount';
                } elseif (!is_numeric($data['maxAmount']) || $data['maxAmount'] <= 0) {
                    $errors['maxAmount'] = 'Please enter a valid amount';
                }
                if (empty($data['currencyType'])) {
                    $errors['currencyType'] = 'Please select currency type';
                }
                if (empty($data['serviceTypes']) || !is_array($data['serviceTypes']) || count($data['serviceTypes']) === 0) {
                    $errors['serviceTypes'] = 'Please select at least one service type';
                }
                break;
                
            case 2: // Online Presence
                if (empty($data['merchantName'])) {
                    $errors['merchantName'] = 'Merchant name is required';
                } elseif (strlen($data['merchantName']) < 3) {
                    $errors['merchantName'] = 'Merchant name must be at least 3 characters';
                }
                if (empty($data['tradingName'])) {
                    $errors['tradingName'] = 'Trading name is required';
                }
                if (!empty($data['domainName'])) {
                    $domain_errors = $this->validate_field('domainName', $data['domainName'], 'website');
                    if (!empty($domain_errors)) {
                        $errors['domainName'] = $domain_errors[0];
                    }
                }
                break;
                
            case 3: // Point of Contact
                if (empty($data['contactName'])) {
                    $errors['contactName'] = 'Contact name is required';
                }
                if (empty($data['designation'])) {
                    $errors['designation'] = 'Designation is required';
                }
                if (empty($data['email'])) {
                    $errors['email'] = 'Email is required';
                } else {
                    $email_errors = $this->validate_field('email', $data['email'], 'email');
                    if (!empty($email_errors)) {
                        $errors['email'] = $email_errors[0];
                    }
                }
                if (empty($data['mobile'])) {
                    $errors['mobile'] = 'Mobile number is required';
                } else {
                    $mobile_errors = $this->validate_field('mobile', $data['mobile'], 'mobile');
                    if (!empty($mobile_errors)) {
                        $errors['mobile'] = $mobile_errors[0];
                    }
                }
                break;
                
            case 4: // Documents
                if (empty($data['logo'])) {
                    $errors['logo'] = 'Business logo is required';
                }
                if (empty($data['tradeLicense'])) {
                    $errors['tradeLicense'] = 'Trade license is required';
                }
                if (empty($data['idDocument'])) {
                    $errors['idDocument'] = 'ID document is required';
                }
                if (empty($data['tinCertificate'])) {
                    $errors['tinCertificate'] = 'TIN certificate is required';
                }
                break;
        }
        
        return $errors;
    }
    
    private function validate_pricing_step($step, $data) {
        $errors = [];
        
        switch ($step) {
            case 1: // Basic Info
                if (empty($data['legalIdentity'])) {
                    $errors['legalIdentity'] = 'Please select legal identity';
                }
                if (empty($data['businessCategory'])) {
                    $errors['businessCategory'] = 'Please select business category';
                }
                if (empty($data['monthlyVolume'])) {
                    $errors['monthlyVolume'] = 'Please select monthly volume';
                }
                if (empty($data['serviceType'])) {
                    $errors['serviceType'] = 'Please select service type';
                }
                break;
                
            case 2: // Consultation Form
                if (empty($data['businessName'])) {
                    $errors['businessName'] = 'Business name is required';
                }
                if (empty($data['domain'])) {
                    $errors['domain'] = 'Domain is required';
                } else {
                    $domain_errors = $this->validate_field('domain', $data['domain'], 'website');
                    if (!empty($domain_errors)) {
                        $errors['domain'] = $domain_errors[0];
                    }
                }
                if (empty($data['name'])) {
                    $errors['name'] = 'Name is required';
                }
                if (empty($data['email'])) {
                    $errors['email'] = 'Email is required';
                } else {
                    $email_errors = $this->validate_field('email', $data['email'], 'email');
                    if (!empty($email_errors)) {
                        $errors['email'] = $email_errors[0];
                    }
                }
                if (empty($data['mobile'])) {
                    $errors['mobile'] = 'Mobile is required';
                } else {
                    $mobile_errors = $this->validate_field('mobile', $data['mobile'], 'mobile');
                    if (!empty($mobile_errors)) {
                        $errors['mobile'] = $mobile_errors[0];
                    }
                }
                break;
        }
        
        return $errors;
    }
    
    private function validate_sandbox_step($step, $data) {
        $errors = [];
        
        switch ($step) {
            case 1: // Email Verification
                if (empty($data['email'])) {
                    $errors['email'] = 'Email is required';
                } else {
                    $email_errors = $this->validate_field('email', $data['email'], 'email');
                    if (!empty($email_errors)) {
                        $errors['email'] = $email_errors[0];
                    }
                }
                break;
                
            case 2: // OTP Verification
                if (empty($data['otp'])) {
                    $errors['otp'] = 'OTP is required';
                } else {
                    $otp_errors = $this->validate_field('otp', $data['otp'], 'otp');
                    if (!empty($otp_errors)) {
                        $errors['otp'] = $otp_errors[0];
                    }
                }
                break;
                
            case 3: // Business Details
                if (empty($data['firstName'])) {
                    $errors['firstName'] = 'First name is required';
                }
                if (empty($data['lastName'])) {
                    $errors['lastName'] = 'Last name is required';
                }
                if (empty($data['mobile'])) {
                    $errors['mobile'] = 'Mobile is required';
                } else {
                    $mobile_errors = $this->validate_field('mobile', $data['mobile'], 'mobile');
                    if (!empty($mobile_errors)) {
                        $errors['mobile'] = $mobile_errors[0];
                    }
                }
                if (empty($data['legalIdentity'])) {
                    $errors['legalIdentity'] = 'Legal identity is required';
                }
                if (empty($data['businessName'])) {
                    $errors['businessName'] = 'Business name is required';
                }
                if (empty($data['password'])) {
                    $errors['password'] = 'Password is required';
                } else {
                    $password_errors = $this->validate_field('password', $data['password'], 'password');
                    if (!empty($password_errors)) {
                        $errors['password'] = $password_errors[0];
                    }
                }
                if (empty($data['confirmPassword'])) {
                    $errors['confirmPassword'] = 'Please confirm password';
                } elseif ($data['password'] !== $data['confirmPassword']) {
                    $errors['confirmPassword'] = 'Passwords do not match';
                }
                break;
        }
        
        return $errors;
    }
    
    public function validate_merchant_form($data) {
        $all_errors = [];
        
        for ($step = 1; $step <= 4; $step++) {
            $errors = $this->validate_merchant_step($step, $data);
            if (!empty($errors)) {
                $all_errors = array_merge($all_errors, $errors);
            }
        }
        
        return $all_errors;
    }
    
    public function validate_consultation_form($data) {
        return $this->validate_pricing_step(2, $data);
    }
    
    public function validate_sandbox_form($data) {
        return $this->validate_sandbox_step(3, $data);
    }
    
    public function get_instant_validation_rules() {
        return [
            'email' => [
                'pattern' => $this->rules['email']['pattern'],
                'message' => $this->rules['email']['message']
            ],
            'phone' => [
                'pattern' => $this->rules['phone']['pattern'],
                'message' => $this->rules['phone']['message']
            ],
            'mobile' => [
                'pattern' => $this->rules['mobile']['pattern'],
                'message' => $this->rules['mobile']['message']
            ],
            'website' => [
                'pattern' => $this->rules['website']['pattern'],
                'message' => $this->rules['website']['message']
            ],
            'amount' => [
                'pattern' => $this->rules['amount']['pattern'],
                'message' => $this->rules['amount']['message']
            ],
            'password' => [
                'pattern' => $this->rules['password']['pattern'],
                'message' => $this->rules['password']['message']
            ],
            'otp' => [
                'pattern' => $this->rules['otp']['pattern'],
                'message' => $this->rules['otp']['message']
            ]
        ];
    }
}