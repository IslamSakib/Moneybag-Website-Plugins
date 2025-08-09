# Moneybag Pricing Form - WordPress Elementor Widget

A custom Elementor widget built with React.js for creating multi-step pricing and consultation forms. Perfect for payment gateway services and financial consultations.

## Features

- **Multi-step Form**: 4-step process from pricing inquiry to consultation booking
- **Dynamic Pricing**: JSON-based pricing data that updates based on user selections
- **Responsive Design**: Mobile-friendly and fully responsive
- **Elementor Integration**: Seamless integration with Elementor page builder
- **React.js Powered**: Modern JavaScript framework for smooth interactions
- **API Ready**: Prepared for external API integration
- **Customizable**: Elementor controls for colors, text, and settings

## Installation

### 1. Plugin Structure

Create the following folder structure in your WordPress plugins directory:

```
wp-content/plugins/moneybag-pricing-form/
├── moneybag-pricing-form.php
├── includes/
│   └── widgets/
│       └── pricing-form-widget.php
├── assets/
│   ├── js/
│   │   └── moneybag-form.js
│   └── css/
│       └── moneybag-form.css
├── data/
│   └── pricing-data.json
└── README.md
```

### 2. File Installation

1. Copy all the provided files to their respective locations
2. Upload the plugin folder to `/wp-content/plugins/`
3. Activate the plugin through the WordPress admin panel

### 3. Requirements

- WordPress 5.0+
- Elementor Plugin (free or pro)
- PHP 7.4+
- Modern browser with JavaScript enabled

## Usage

### 1. Adding the Widget

1. Edit any page with Elementor
2. Search for "Moneybag Pricing Form" in the widget panel
3. Drag and drop the widget to your page
4. Configure the widget settings

### 2. Widget Settings

#### Content Tab

- **Widget Title**: Main heading for the form
- **Description**: Descriptive text shown in step 1
- **Enable API Integration**: Toggle for external API usage
- **API Endpoint**: URL for external API (when enabled)

#### Style Tab

- **Primary Color**: Main button and text color
- **Accent Color**: Secondary button and link color
- **Background Color**: Form background color

### 3. Customizing Pricing Data

The plugin now uses a sophisticated rules-based pricing system with the `data/pricing-data.json` file.

#### JSON Structure

```json
{
  "version": "1.0",
  "last_updated": "2025-08-09",
  "sets": {
    "documents": {
      "set_name": [
        { "id": "doc_id", "label": "Document Name", "optional": false }
      ]
    },
    "pricing": {
      "set_name": {
        "currency": "BDT",
        "monthly_fee": 0.023,
        "cards": { "visa": 0.023, "mastercard": 0.023 },
        "wallets": { "bkash": 0.023, "nagad": 0.023 },
        "negotiable": true,
        "negotiation_text": "Contact us to discuss..."
      }
    }
  },
  "rules": [
    {
      "id": "rule_name",
      "if": {
        "legal_identity": "Educational Institute",
        "business_category": "School",
        "monthly_txn_volume": { "between": [500000, 600000] },
        "service_type": "All"
      },
      "show": {
        "documents_set": "edu_school_standard",
        "pricing_set": "flat_2_3"
      }
    }
  ]
}
```

#### Key Features

**Document Sets**: Reusable document collections with optional flags

- Each document has an `id`, `label`, and `optional` boolean
- Optional documents display with "(Optional)" suffix

**Pricing Sets**: Reusable pricing configurations

- Decimal rates (e.g., 0.023 = 2.3%)
- Separate `cards` and `wallets` sections
- `negotiable` flag and custom `negotiation_text`

**Rules Engine**: Flexible condition matching

- Exact matches: `"legal_identity": "Corporation"`
- Range matches: `"monthly_txn_volume": { "between": [500000, 600000] }`
- Wildcards: `"service_type": { "any": true }`
- Catch-all: `"if": { "any": true }`

#### Rule Conditions

```json
{
  "if": {
    "legal_identity": "Educational Institute", // Exact match
    "business_category": "School", // Exact match
    "monthly_txn_volume": {
      "between": [500000, 600000] // Range check
    },
    "service_type": { "any": true } // Accept any value
  }
}
```

#### Adding New Rules

1. **Create Document Sets** in `sets.documents`
2. **Create Pricing Sets** in `sets.pricing`
3. **Add Rules** that reference these sets
4. **Order matters** - first matching rule wins

#### Example: Adding a New Business Type

```json
{
  "sets": {
    "documents": {
      "restaurant_standard": [
        {
          "id": "dbid",
          "label": "Digital Business Identification Number (DBID)",
          "optional": false
        },
        {
          "id": "food_license",
          "label": "Food Service License",
          "optional": false
        },
        {
          "id": "health_cert",
          "label": "Health Department Certificate",
          "optional": false
        }
      ]
    },
    "pricing": {
      "restaurant_rates": {
        "currency": "BDT",
        "monthly_fee": 0.025,
        "cards": { "visa": 0.025, "mastercard": 0.025 },
        "wallets": { "bkash": 0.022, "nagad": 0.022 },
        "negotiable": true,
        "negotiation_text": "Special rates available for restaurants."
      }
    }
  },
  "rules": [
    {
      "id": "restaurant_rule",
      "if": {
        "legal_identity": "Corporation",
        "business_category": "Restaurant",
        "monthly_txn_volume": { "any": true },
        "service_type": { "any": true }
      },
      "show": {
        "documents_set": "restaurant_standard",
        "pricing_set": "restaurant_rates"
      }
    }
  ]
}
```

## Form Flow

### Step 1: Initial Requirements

Users select:

- Legal Identity
- Business Category
- Monthly Transaction Volume
- Type of Service Needed

### Step 2: Pricing & Documents

Displays:

- Dynamic pricing based on selections
- Required documents list
- Option to book consultation

### Step 3: Expert Consultation

Additional fields:

- Maximum transaction amount
- Domain name
- Contact information (Name, Email, Mobile)

### Step 4: Thank You

Confirmation message with next steps

## API Integration

### WordPress AJAX (Default)

The plugin uses WordPress AJAX by default:

- Pricing data: `wp_ajax_get_pricing_data`
- Form submission: `wp_ajax_submit_consultation`

### External API

Enable "API Integration" in widget settings and provide endpoint URL.

#### Expected API Format:

```javascript
// POST request with JSON data
{
  "legalIdentity": "Educational Institute",
  "businessCategory": "School",
  "monthlyTransactionVolume": "500000-600000",
  "serviceType": "All",
  "maxAmount": "50000",
  "domainName": "example.com",
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+8801234567890"
}
```

## Database

The plugin creates a table `wp_moneybag_consultations` to store form submissions:

```sql
CREATE TABLE wp_moneybag_consultations (
  id mediumint(9) NOT NULL AUTO_INCREMENT,
  legal_identity varchar(100) NOT NULL,
  business_category varchar(100) NOT NULL,
  monthly_transaction_volume varchar(50) NOT NULL,
  service_type varchar(100) NOT NULL,
  max_amount varchar(50),
  domain_name varchar(255),
  name varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  mobile varchar(20) NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

## Customization

### Styling

Modify `assets/css/moneybag-form.css` or use Elementor's custom CSS.

### Form Fields

Edit the React component in `assets/js/moneybag-form.js` to add/remove fields.

### Pricing Logic

Modify the `filter_pricing_data()` method in the main plugin file.

## Testing Your Configuration

Use the included `test-pricing-rules.php` file to verify your JSON rules work correctly:

1. **Set up test file**: Place it in the same directory as the main plugin file
2. **Run tests**: Open the file in a browser or run via PHP CLI
3. **Review results**: See which rules match different input combinations

The test file will show:

- Which rule matched for each scenario
- Documents required
- Pricing structure
- Negotiation text

### Sample Test Output

```
Educational Institute - School - High Volume
Input: Educational Institute, School, 500000-600000, All
Matched Rule: edu_school_500k_600k_all
Documents: DBID, TIN Certificate, MEF, Trade License, VAT Document (Optional)
Pricing: Monthly Fee: 2.3%, VISA: 2.3%, Mastercard: 2.3%
```

## Troubleshooting

### Common Issues

1. **Widget not appearing**: Ensure Elementor is active
2. **Styling issues**: Check if CSS file is loading properly
3. **JavaScript errors**: Verify React libraries are loading
4. **Form not submitting**: Check AJAX endpoints and nonce verification
5. **Wrong pricing displayed**: Use test file to debug JSON rules
6. **Rules not matching**: Check rule order (first match wins)

### Debug Mode

Add to `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## License

This plugin is licensed under the GPL v2 or later.

## Support

For support and customization requests, please contact the development team.

## Changelog

### Version 1.1.0 (Updated)

- **NEW**: Rules-based pricing system with sophisticated JSON structure
- **NEW**: Reusable document and pricing sets
- **NEW**: Range-based volume matching (between conditions)
- **NEW**: Wildcard support for flexible rules (`any: true`)
- **NEW**: Separate card and wallet pricing display
- **NEW**: Optional document flags with automatic labeling
- **NEW**: Custom negotiation text per pricing set
- **NEW**: Test file for debugging JSON rules
- **IMPROVED**: Better pricing display with sections
- **IMPROVED**: More maintainable and scalable configuration
- **IMPROVED**: Enhanced fallback system

### Version 1.0.0

- Initial release
- Multi-step form functionality
- Elementor widget integration
- Basic JSON-based pricing system
- React.js implementation
- Mobile responsive design
