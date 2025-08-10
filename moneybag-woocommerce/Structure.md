moneybag-woocommerce/
├── moneybag-woocommerce.php  <-- Main plugin file
├── includes/
│   ├── class-wc-gateway-moneybag.php  <-- Main payment gateway class
│   └── moneybag-sdk/  <-- Directory for your conceptual Moneybag SDK classes
│       ├── MoneybagSdk.php
│       ├── HttpClient.php
│       ├── Exceptions/
│       │   ├── MoneybagException.php
│       │   ├── AuthenticationException.php
│       │   ├── ValidationException.php
│       │   └── ApiException.php
│       └── Models/
│           ├── Request/
│           │   ├── CheckoutRequest.php
│           │   ├── Customer.php
│           │   ├── Shipping.php
│           │   ├── OrderItem.php
│           │   └── PaymentInfo.php
│           └── Response/
│               ├── CheckoutResponse.php
│               └── VerifyResponse.php
├── assets/
│   ├── images/
│   │   └── moneybag-icon.png  <-- Your payment gateway icon
│   └── css/
│   └── js/
└── languages/
    └── moneybag-woocommerce.pot  <-- For translations