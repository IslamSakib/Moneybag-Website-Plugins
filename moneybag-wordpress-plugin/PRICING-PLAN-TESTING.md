# Pricing Plan Widget Testing Guide

## Setup Instructions

1. **Activate Plugin**
   - Ensure the Moneybag WordPress Plugin is activated
   - Verify Elementor is installed and activated

2. **Configure CRM Settings**
   - Go to WordPress Admin → Moneybag → CRM Integration
   - Enter your CRM API key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YmZkMzA3NC01ZDZlLTQxZTctOTc4Yi1iZTE0NjQ4NTdhZTEiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiOWJmZDMwNzQtNWQ2ZS00MWU3LTk3OGItYmUxNDY0ODU3YWUxIiwiaWF0IjoxNzU0Mjg5NDE0LCJleHAiOjQ5MDc4ODk0MTMsImp0aSI6ImM2M2ViZGUzLTU3MjUtNGNjNy05Nzk4LTY0NGE3MGNhMTExYiJ9.U-7fRhp5_ZQ-VUkpAi2EChln5080Th0lOiPVdvi6uws`
   - Set CRM API URL: `https://crm.dummy-dev.tubeonai.com/rest`
   - Click "Save Changes"
   - Test the connection using "Test CRM Connection" button

## Testing Workflow

### Step 1: Add Widget to Page
1. Edit a page with Elementor
2. Search for "Moneybag Pricing Plan" widget
3. Drag and drop to page
4. Configure widget settings:
   - Form Title: "Pricing & Requirements"
   - CRM API URL: Use default or override
   - Consultation Duration: 50 minutes
   - Success Redirect URL: (optional)

### Step 2: Test Form Steps

#### Step 1 - Requirements Form
**Test Fields:**
- Legal Identity: Select "Educational Institution"
- Business Category: Select "School"
- Monthly Volume: Select "500000-1000000"
- Service Type: Select "All"

**Validation Tests:**
- Try submitting without selecting fields - should show button as disabled
- Select all fields - "Get Pricing & Docs" button should become enabled

#### Step 2 - Pricing & Documents Display
**Expected Results:**
- Should show pricing based on selected business details
- Educational Institution + School should trigger:
  - Standard Plan (2.5% card rate, 1.8% wallet rate)
  - Standard documents list
  - Special offer: "50% off setup fee for educational institutions"
- Form fields should be disabled (showing selected values)
- "Book an Appointment →" button should be active

#### Step 3 - Consultation Form
**Test Fields:**
- Previous selections should be disabled/pre-filled
- Domain Name: Enter "abc.edu.bd" (test domain validation)
- Maximum Amount: Enter "10000" (test number validation)
- Name: Enter "John Doe" (test required field)
- Email: Enter valid email (test email validation)
- Mobile: Enter "+8801712345678" (test phone validation)

**Validation Tests:**
- Invalid domain: "invalid-domain" - should show error
- Invalid email: "not-an-email" - should show error
- Invalid phone: "123" - should show error
- Empty required fields - should show errors
- Valid data - should enable Submit button

#### Step 4 - Thank You Page
**Expected Results:**
- Should show success message
- Mention 50-minute consultation
- Show WiFi logo with animation

### Step 3: Verify CRM Integration

After successful form submission, check your CRM for:

1. **New Person Created:**
   - Name: John Doe
   - Email: (submitted email)
   - Phone: +880XXXXXXXXX

2. **New Opportunity Created:**
   - Name: "TubeOnAI – merchant onboarding"
   - Stage: "NEW"
   - Linked to the created person

3. **New Note Created:**
   - Title: "Pricing form submission data"
   - Contains all form data in markdown format
   - Linked to the opportunity

## Test Scenarios

### Scenario 1: Educational Institution
- Legal Identity: Educational Institution
- Business Category: School
- Expected: Standard Plan + Special Offer

### Scenario 2: High Volume Corporation
- Legal Identity: Corporation
- Monthly Volume: 10000000+
- Expected: Enterprise Plan (Custom pricing)

### Scenario 3: Basic Sole Proprietorship
- Legal Identity: Sole Proprietorship
- Monthly Volume: 0-500000
- Expected: Basic Gateway Plan

## Troubleshooting

### Common Issues:
1. **Widget not appearing**: Check Elementor version and plugin activation
2. **Pricing not showing**: Verify pricing-rules.json is accessible
3. **CRM integration failing**: Test API connection in admin panel
4. **Form validation not working**: Check browser console for JavaScript errors
5. **CSS conflicts**: Ensure pricing-plan.css is loaded and scoped properly

### Debug Steps:
1. Check WordPress Admin → Moneybag Settings for configuration
2. Test CRM connection in admin panel
3. Check browser developer tools for console errors
4. Verify JSON file is accessible at `/wp-content/plugins/moneybag-wordpress-plugin/data/pricing-rules.json`

## Success Criteria

✅ **Form Functionality:**
- All 4 steps work correctly
- Dynamic pricing calculation works
- Instant validation functions properly
- Form data persists between steps

✅ **CRM Integration:**
- Person, Opportunity, Note, and Note Target created successfully
- All form data captured in CRM note
- No API errors or timeouts

✅ **User Experience:**
- Responsive design works on mobile/desktop
- Loading states and error messages display properly
- CSS styles don't conflict with theme
- Form flows logically from step to step