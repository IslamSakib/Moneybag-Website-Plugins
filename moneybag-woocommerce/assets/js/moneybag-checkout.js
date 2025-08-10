/**
 * Moneybag Checkout JavaScript
 * Makes phone and email fields required when Moneybag is selected
 */
jQuery(function($) {
    'use strict';
    
    var moneybag_checkout = {
        init: function() {
            // Listen for payment method changes
            $('body').on('change', 'input[name="payment_method"]', this.onPaymentMethodChange);
            
            // Also check on page load
            this.onPaymentMethodChange();
            
            // Listen for checkout form submission
            $('form.checkout').on('checkout_place_order_' + moneybag_checkout_params.payment_method_id, this.validateFields);
        },
        
        onPaymentMethodChange: function() {
            var selectedMethod = $('input[name="payment_method"]:checked').val();
            var billingPhoneField = $('#billing_phone_field');
            var billingEmailField = $('#billing_email_field');
            
            if (selectedMethod === moneybag_checkout_params.payment_method_id) {
                // Make billing fields required when Moneybag is selected
                billingPhoneField.find('label .optional').remove();
                billingPhoneField.find('label .required').remove(); // Remove existing required marker
                billingPhoneField.find('label').append(' <abbr class="required" title="required">*</abbr>');
                $('#billing_phone').prop('required', true).addClass('validate-required');
                
                billingEmailField.find('label .optional').remove();
                billingEmailField.find('label .required').remove(); // Remove existing required marker
                billingEmailField.find('label').append(' <abbr class="required" title="required">*</abbr>');
                $('#billing_email').prop('required', true).addClass('validate-required');
                
                // Ensure shipping phone is not required
                $('#shipping_phone').prop('required', false).removeClass('validate-required');
                $('#shipping_phone_field').find('label .required').remove();
            }
        },
        
        validateFields: function() {
            var phone = $('#billing_phone').val();
            var email = $('#billing_email').val();
            var errors = [];
            
            if (!email || email.trim() === '') {
                errors.push(moneybag_checkout_params.email_required_message);
            }
            
            if (!phone || phone.trim() === '') {
                errors.push(moneybag_checkout_params.phone_required_message);
            }
            
            if (errors.length > 0) {
                // Display errors
                $.each(errors, function(index, error) {
                    // Remove any existing error messages
                    $('.woocommerce-error').remove();
                    
                    // Add new error message
                    var errorHtml = '<ul class="woocommerce-error" role="alert"><li>' + error + '</li></ul>';
                    $('form.checkout').prepend(errorHtml);
                    
                    // Scroll to top to show error
                    $('html, body').animate({
                        scrollTop: ($('form.checkout').offset().top - 100)
                    }, 1000);
                });
                
                return false; // Prevent form submission
            }
            
            return true; // Allow form submission
        }
    };
    
    moneybag_checkout.init();
});