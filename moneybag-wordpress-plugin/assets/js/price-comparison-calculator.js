(function() {
    'use strict';
    
    const { useState, useEffect, createElement: h } = wp.element;
    
    // Format numbers with Bangladesh locale
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-BD').format(num);
    };
    
    // Calculate savings based on volume, payment mix, and rates
    const calculateSavings = (monthlyVolume, paymentMix, competitorRates, moneybagRates) => {
        // Calculate competitor total cost
        const competitorCost = (monthlyVolume * paymentMix.bkash / 100 * competitorRates.bkash / 100) +
                               (monthlyVolume * paymentMix.visa / 100 * competitorRates.visa / 100) +
                               (monthlyVolume * paymentMix.nagad / 100 * competitorRates.nagad / 100);
        
        // Calculate Moneybag total cost
        const moneybagCost = (monthlyVolume * paymentMix.bkash / 100 * moneybagRates.bkash / 100) +
                            (monthlyVolume * paymentMix.visa / 100 * moneybagRates.visa / 100) +
                            (monthlyVolume * paymentMix.nagad / 100 * moneybagRates.nagad / 100);
        
        // Calculate savings
        const monthlySavings = competitorCost - moneybagCost;
        const yearlySavings = monthlySavings * 12;
        
        // Calculate average fees
        const competitorAvgFee = (competitorRates.bkash * paymentMix.bkash + 
                                  competitorRates.visa * paymentMix.visa + 
                                  competitorRates.nagad * paymentMix.nagad) / 100;
        
        const moneybagAvgFee = (moneybagRates.bkash * paymentMix.bkash + 
                                moneybagRates.visa * paymentMix.visa + 
                                moneybagRates.nagad * paymentMix.nagad) / 100;
        
        const difference = competitorAvgFee - moneybagAvgFee;
        
        return {
            monthlySavings,
            yearlySavings,
            competitorAvgFee,
            moneybagAvgFee,
            difference
        };
    };
    
    // Main Calculator Component
    function PriceComparisonCalculator({ config }) {
        const MONEYBAG_PLUGIN_URL = config.pluginUrl || '/wp-content/plugins/moneybag-wordpress-plugin/';
        const [monthlyVolume, setMonthlyVolume] = useState(config.default_volume || 100000);
        const [currentGateway, setCurrentGateway] = useState(config.default_gateway || 'sslcommerz');
        const [isCustomMode, setIsCustomMode] = useState(false);
        const [paymentMix, setPaymentMix] = useState({ bkash: 60, visa: 25, nagad: 15 });
        const [competitorRates, setCompetitorRates] = useState(config.gateway_presets[currentGateway]);
        const [calculations, setCalculations] = useState({});
        const [isLoading, setIsLoading] = useState(false);
        const [errors, setErrors] = useState({});
        
        const moneybagRates = config.moneybag_rates;
        
        // Update calculations whenever inputs change
        useEffect(() => {
            const results = calculateSavings(monthlyVolume, paymentMix, competitorRates, moneybagRates);
            setCalculations(results);
        }, [monthlyVolume, paymentMix, competitorRates, moneybagRates]);
        
        // Add scroll detection for mobile swipe indicator
        useEffect(() => {
            if (isCustomMode && window.innerWidth <= 480) {
                const handleScroll = (e) => {
                    const element = e.target;
                    if (element.scrollLeft > 10) {
                        element.classList.add('scrolled');
                        // Also add to grid for dots
                        const grid = document.querySelector('.moneybag-calc-method-grid');
                        if (grid) grid.classList.add('scrolled');
                    } else {
                        element.classList.remove('scrolled');
                        const grid = document.querySelector('.moneybag-calc-method-grid');
                        if (grid) grid.classList.remove('scrolled');
                    }
                };
                
                const section = document.querySelector('.moneybag-calc-custom-mode-section');
                if (section) {
                    section.addEventListener('scroll', handleScroll);
                    return () => section.removeEventListener('scroll', handleScroll);
                }
            }
        }, [isCustomMode]);
        
        // Update competitor rates when gateway changes
        useEffect(() => {
            setCompetitorRates(config.gateway_presets[currentGateway]);
        }, [currentGateway, config.gateway_presets]);
        
        // Validate volume input
        const validateVolume = (value) => {
            if (value < 0) {
                setErrors(prev => ({ ...prev, volume: 'Volume must be positive' }));
                return false;
            }
            setErrors(prev => ({ ...prev, volume: null }));
            return true;
        };
        
        // Handle volume change
        const handleVolumeChange = (e) => {
            const value = parseInt(e.target.value) || 0;
            if (validateVolume(value)) {
                setMonthlyVolume(value);
            }
        };
        
        // Handle gateway change
        const handleGatewayChange = (e) => {
            setCurrentGateway(e.target.value);
        };
        
        // Handle payment mix change with validation
        const handlePaymentMixChange = (method, value) => {
            const newValue = parseInt(value) || 0;
            const newMix = { ...paymentMix, [method]: newValue };
            const sum = newMix.bkash + newMix.visa + newMix.nagad;
            
            // Update the payment mix
            setPaymentMix(newMix);
            
            // Check if sum equals 100
            if (sum !== 100) {
                if (sum > 100) {
                    setErrors(prev => ({ ...prev, paymentMix: `⚠️ Total exceeds 100% (currently ${sum}%). Please reduce one or more payment methods.` }));
                } else {
                    setErrors(prev => ({ ...prev, paymentMix: `⚠️ Total is only ${sum}%. Please increase payment methods to reach 100%.` }));
                }
            } else {
                setErrors(prev => ({ ...prev, paymentMix: null }));
            }
        };
        
        // Handle competitor rate change
        const handleCompetitorRateChange = (method, value) => {
            const newValue = parseFloat(value) || 0;
            setCompetitorRates(prev => ({ ...prev, [method]: newValue }));
        };
        
        // Handle CTA clicks
        const handleGetStarted = async () => {
            setIsLoading(true);
            // Send calculator data to CRM
            try {
                const formData = new FormData();
                formData.append('action', 'handle_calculator_lead');
                formData.append('nonce', config.nonce);
                formData.append('monthly_volume', monthlyVolume);
                formData.append('current_gateway', currentGateway);
                formData.append('estimated_savings', calculations.yearlySavings);
                
                const response = await fetch(config.api_url, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.success) {
                    window.location.href = '/contact';
                }
            } catch (error) {
                console.error('Error submitting lead:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        const handleContactSales = () => {
            window.location.href = '/contact';
        };
        
        const handleCallNow = () => {
            window.location.href = 'tel:+8801958109228';
        };
        
        const handleTrySandbox = () => {
            window.location.href = 'https://moneybag.com.bd/sandbox/';
        };
        
        return h('div', { className: 'moneybag-calculator-wrapper' },
            // Header Section
            h('div', { className: 'moneybag-calc-header' },
                h('h1', { className: 'moneybag-calc-title' }, 'Switch & Save with Moneybag'),
                h('p', { className: 'moneybag-calc-subtitle' }, 'Calculate how much your business can save on payment processing fees')
            ),
            
            // Hero Card - Shows savings amounts
            h('div', { className: 'moneybag-calc-hero-card' },
                h('svg', { 
                    className: 'moneybag-calc-savings-arrow',
                    xmlns: 'http://www.w3.org/2000/svg',
                    width: '48',
                    height: '48',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: '#10b981',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round'
                },
                    h('path', { d: 'M16 7h6v6' }),
                    h('path', { d: 'm22 7-8.5 8.5-5-5L2 17' })
                ),
                h('div', { className: 'moneybag-calc-savings-main-text' },
                    'You could save ',
                    h('span', { className: 'moneybag-calc-savings-amount', id: 'monthly-savings' }, 
                        formatNumber(Math.round(calculations.monthlySavings || 0))
                    ),
                    ' per month'
                ),
                h('div', { className: 'moneybag-calc-savings-sub-text' },
                    'and ',
                    h('span', { className: 'moneybag-calc-yearly-amount', id: 'yearly-savings' }, 
                        formatNumber(Math.round(calculations.yearlySavings || 0))
                    ),
                    ' per year with Moneybag'
                )
            ),
            
            // Input Controls Bar
            h('div', { className: 'moneybag-calc-input-bar' },
                // Monthly Volume Input
                h('div', { className: 'moneybag-calc-input-group' },
                    h('label', {}, 'Monthly Volume (৳)'),
                    h('input', {
                        type: 'number',
                        id: 'volume-input',
                        className: errors.volume ? 'moneybag-calc-input-field moneybag-calc-error' : 'moneybag-calc-input-field',
                        value: monthlyVolume,
                        onChange: handleVolumeChange,
                        min: 0
                    }),
                    errors.volume && h('span', { className: 'moneybag-calc-error-message' }, errors.volume)
                ),
                
                // Gateway Selection
                h('div', { className: 'moneybag-calc-input-group' },
                    h('label', {}, 'Current Gateway'),
                    h('select', {
                        id: 'gateway-select',
                        className: 'moneybag-calc-select-field',
                        value: currentGateway,
                        onChange: handleGatewayChange
                    },
                        h('option', { value: 'sslcommerz' }, 'SSLCommerz'),
                        h('option', { value: 'bkash' }, 'bKash'),
                        h('option', { value: 'shurjopay' }, 'shurjoPay'),
                        h('option', { value: 'aamarpay' }, 'aamarPay')
                    )
                ),
                
                // Mode Toggle Button
                h('button', {
                    id: 'custom-mode-toggle',
                    className: 'moneybag-calc-toggle-btn',
                    onClick: () => {
                        setIsCustomMode(!isCustomMode);
                        // Smooth scroll to custom mode section on ALL devices
                        if (!isCustomMode) {
                            setTimeout(() => {
                                const customSection = document.getElementById('custom-mode-section');
                                if (customSection) {
                                    // Get the element's position and height
                                    const rect = customSection.getBoundingClientRect();
                                    const elementTop = rect.top + window.pageYOffset;
                                    const elementHeight = rect.height;
                                    
                                    // Calculate position to center the table in viewport
                                    const viewportHeight = window.innerHeight;
                                    
                                    // Position the table in the middle of the screen
                                    // We want the middle of the table to be at the middle of the viewport
                                    const scrollPosition = elementTop + (elementHeight / 2) - (viewportHeight / 2);
                                    
                                    // Add a small offset to account for any fixed headers
                                    const finalPosition = Math.max(0, scrollPosition - 50);
                                    
                                    window.scrollTo({
                                        top: finalPosition,
                                        behavior: 'smooth'
                                    });
                                }
                            }, 100); // Small delay to allow section to render
                        }
                    }
                },
                    h('svg', { 
                        className: 'moneybag-calc-toggle-icon',
                        width: '16',
                        height: '16',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor'
                    },
                        // Sliders icon for mode switching
                        h('path', { 
                            d: 'M4 21v-7',
                            strokeWidth: '2',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round'
                        }),
                        h('path', { 
                            d: 'M4 10V3',
                            strokeWidth: '2',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round'
                        }),
                        h('path', { 
                            d: 'M12 21v-9',
                            strokeWidth: '2',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round'
                        }),
                        h('path', { 
                            d: 'M12 8V3',
                            strokeWidth: '2',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round'
                        }),
                        h('path', { 
                            d: 'M20 21v-5',
                            strokeWidth: '2',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round'
                        }),
                        h('path', { 
                            d: 'M20 12V3',
                            strokeWidth: '2',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round'
                        }),
                        h('circle', { 
                            cx: '4',
                            cy: '14',
                            r: '2',
                            strokeWidth: '2'
                        }),
                        h('circle', { 
                            cx: '12',
                            cy: '11',
                            r: '2',
                            strokeWidth: '2'
                        }),
                        h('circle', { 
                            cx: '20',
                            cy: '16',
                            r: '2',
                            strokeWidth: '2'
                        })
                    ),
                    h('span', { className: 'moneybag-calc-toggle-text' }, isCustomMode ? 'Quick Mode' : 'Custom Mode')
                )
            ),
            
            // Comparison Cards Row
            h('div', { className: 'moneybag-calc-comparison-row' },
                h('div', { className: 'moneybag-calc-comparison-card' },
                    h('div', { className: 'moneybag-calc-card-header' }, 'Your current avg fee'),
                    h('div', { className: 'moneybag-calc-card-value', id: 'competitor-fee' }, `${(calculations.competitorAvgFee || 0).toFixed(2)}%`)
                ),
                h('div', { className: 'moneybag-calc-comparison-card moneybag-calc-moneybag' },
                    h('div', { className: 'moneybag-calc-badge' }, 'LOWEST RATES'),
                    h('div', { className: 'moneybag-calc-logo' },
                        h('svg', { 
                            className: 'moneybag-calc-logo-icon',
                            xmlns: 'http://www.w3.org/2000/svg',
                            width: '20',
                            height: '20',
                            viewBox: '0 0 24 24',
                            fill: 'none',
                            stroke: 'currentColor',
                            strokeWidth: '2',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round'
                        },
                            h('path', { d: 'M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z' }),
                            h('path', { d: 'm15 9-6 6' }),
                            h('path', { d: 'M9 9h.01' }),
                            h('path', { d: 'M15 15h.01' })
                        ),
                        ' Moneybag avg fee'
                    ),
                    h('div', { className: 'moneybag-calc-card-value moneybag-calc-primary', id: 'moneybag-fee' }, `${(calculations.moneybagAvgFee || 0).toFixed(2)}%`),
                    h('div', { className: 'moneybag-calc-guarantee-text' }, 'Guaranteed lowest in Bangladesh')
                ),
                h('div', { className: 'moneybag-calc-comparison-card moneybag-calc-savings' },
                    h('div', { className: 'moneybag-calc-card-header' }, 
                        h('svg', { 
                            className: 'moneybag-calc-check-icon',
                            xmlns: 'http://www.w3.org/2000/svg',
                            width: '20',
                            height: '20',
                            viewBox: '0 0 24 24',
                            fill: 'none',
                            stroke: '#10b981',
                            strokeWidth: '2',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round'
                        },
                            h('path', { d: 'M16 17h6v-6' }),
                            h('path', { d: 'm22 17-8.5-8.5-5 5L2 7' })
                        ),
                        ' You save'
                    ),
                    h('div', { className: 'moneybag-calc-card-value moneybag-calc-success', id: 'difference' }, `${(calculations.difference || 0).toFixed(2)}%`)
                )
            ),
            
            // Custom Mode Section - Card Format
            isCustomMode && h('div', { id: 'custom-mode-section', className: 'moneybag-calc-custom-mode-section' },
                h('h3', { className: 'moneybag-calc-table-title' }, 'Custom Payment Mix'),
                
                // Method Rows
                h('div', { className: 'moneybag-calc-method-grid' },
                    ['bkash', 'visa', 'nagad'].map(method => {
                        const methodVolume = monthlyVolume * paymentMix[method] / 100;
                        const competitorCost = methodVolume * competitorRates[method] / 100;
                        const moneybagCost = methodVolume * moneybagRates[method] / 100;
                        const savings = competitorCost - moneybagCost;
                        
                        return h('div', { className: 'moneybag-calc-method-row', key: method },
                            h('div', { className: 'moneybag-calc-method-name' }, 
                                method === 'bkash' ? 'bKash' : method === 'visa' ? 'Visa/MC' : 'Nagad'
                            ),
                            h('div', { className: 'moneybag-calc-method-cells' },
                                h('div', { className: 'moneybag-calc-cell-group' },
                                    h('div', { className: 'moneybag-calc-cell-label' }, 'Payment Mix (%)'),
                                    h('div', { className: 'moneybag-calc-cell-box' },
                                        h('input', {
                                            type: 'number',
                                            value: paymentMix[method],
                                            min: 0,
                                            max: 100,
                                            className: 'moneybag-calc-method-input',
                                            onChange: (e) => handlePaymentMixChange(method, e.target.value)
                                        })
                                    )
                                ),
                                h('div', { className: 'moneybag-calc-cell-group' },
                                    h('div', { className: 'moneybag-calc-cell-label' }, 'Your Rate (%)'),
                                    h('div', { className: 'moneybag-calc-cell-box' },
                                        h('input', {
                                            type: 'number',
                                            value: competitorRates[method],
                                            min: 0,
                                            max: 10,
                                            step: 0.01,
                                            className: 'moneybag-calc-method-input',
                                            onChange: (e) => handleCompetitorRateChange(method, e.target.value)
                                        })
                                    )
                                ),
                                h('div', { className: 'moneybag-calc-cell-group' },
                                    h('div', { className: 'moneybag-calc-cell-label' }, 'Moneybag Rate'),
                                    h('div', { className: 'moneybag-calc-cell-box moneybag-calc-readonly-box' },
                                        h('div', { className: 'moneybag-calc-cell-value' }, 
                                            `${moneybagRates[method]}%`
                                        )
                                    )
                                ),
                                h('div', { className: 'moneybag-calc-cell-group' },
                                    h('div', { className: 'moneybag-calc-cell-label' }, 'Savings'),
                                    h('div', { className: 'moneybag-calc-cell-box moneybag-calc-savings-box' },
                                        h('div', { className: 'moneybag-calc-cell-value' }, 
                                            formatNumber(Math.round(savings || 0))
                                        )
                                    )
                                )
                            )
                        );
                    }),
                    
                    // Total Row
                    h('div', { className: 'moneybag-calc-method-row moneybag-calc-total-row' },
                        h('div', { className: 'moneybag-calc-method-name' }, 'Total'),
                        h('div', { className: 'moneybag-calc-method-cells' },
                            h('div', { className: 'moneybag-calc-cell-group' },
                                h('div', { className: 'moneybag-calc-cell-box moneybag-calc-total-box' },
                                    h('div', { className: 'moneybag-calc-cell-value' }, '100%')
                                )
                            ),
                            h('div', { className: 'moneybag-calc-cell-group' },
                                h('div', { className: 'moneybag-calc-cell-box moneybag-calc-total-box' },
                                    h('div', { className: 'moneybag-calc-cell-value' }, 
                                        (calculations.competitorAvgFee || 0).toFixed(3)
                                    )
                                )
                            ),
                            h('div', { className: 'moneybag-calc-cell-group' },
                                h('div', { className: 'moneybag-calc-cell-box moneybag-calc-total-box' },
                                    h('div', { className: 'moneybag-calc-cell-value' }, 
                                        (calculations.moneybagAvgFee || 0).toFixed(3)
                                    )
                                )
                            ),
                            h('div', { className: 'moneybag-calc-cell-group' },
                                h('div', { className: 'moneybag-calc-cell-box moneybag-calc-total-savings-box' },
                                    h('div', { className: 'moneybag-calc-cell-value' }, 
                                        formatNumber(Math.round(calculations.monthlySavings || 0))
                                    )
                                )
                            )
                        )
                    )
                ),
                
                // Payment Mix Error (at bottom of custom mode section)
                errors.paymentMix && h('div', { className: 'moneybag-calc-payment-mix-error-container' },
                    h('div', { className: 'moneybag-calc-error-message moneybag-calc-payment-mix-error' }, errors.paymentMix)
                )
            ),
            
            // Call to Action Section
            h('div', { className: 'moneybag-calc-cta-section' },
                h('h2', { className: 'moneybag-calc-cta-title' }, 'Ready to Start Saving?'),
                h('p', { className: 'moneybag-calc-cta-subtitle' }, 
                    'Join hundreds of businesses across Bangladesh who are already saving thousands with Moneybag\'s industry-leading rates.'
                ),
                
                h('div', { className: 'moneybag-calc-cta-content' },
                    // Left side - Features
                    h('div', { className: 'moneybag-calc-cta-features' },
                        h('div', { className: 'moneybag-calc-feature-item' },
                            h('svg', {
                                className: 'moneybag-calc-feature-check',
                                xmlns: 'http://www.w3.org/2000/svg',
                                width: '24',
                                height: '24',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: '#10b981',
                                strokeWidth: '2',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round'
                            },
                                h('path', { d: 'M21.801 10A10 10 0 1 1 17 3.335' }),
                                h('path', { d: 'm9 11 3 3L22 4' })
                            ),
                            h('span', { className: 'moneybag-calc-feature-text' }, 'Lowest transaction rates guaranteed in Bangladesh')
                        ),
                        h('div', { className: 'moneybag-calc-feature-item' },
                            h('svg', {
                                className: 'moneybag-calc-feature-check',
                                xmlns: 'http://www.w3.org/2000/svg',
                                width: '24',
                                height: '24',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: '#10b981',
                                strokeWidth: '2',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round'
                            },
                                h('path', { d: 'M21.801 10A10 10 0 1 1 17 3.335' }),
                                h('path', { d: 'm9 11 3 3L22 4' })
                            ),
                            h('span', { className: 'moneybag-calc-feature-text' }, 'Easy integration with any website or app')
                        ),
                        h('div', { className: 'moneybag-calc-feature-item' },
                            h('svg', {
                                className: 'moneybag-calc-feature-check',
                                xmlns: 'http://www.w3.org/2000/svg',
                                width: '24',
                                height: '24',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: '#10b981',
                                strokeWidth: '2',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round'
                            },
                                h('path', { d: 'M21.801 10A10 10 0 1 1 17 3.335' }),
                                h('path', { d: 'm9 11 3 3L22 4' })
                            ),
                            h('span', { className: 'moneybag-calc-feature-text' }, '24/7 local support team based in Dhaka')
                        )
                    ),
                    
                    // Right side - Promotional Image
                    h('div', { className: 'moneybag-calc-cta-promo-card' },
                        h('img', { 
                            src: MONEYBAG_PLUGIN_URL + 'assets/image/Moneybag-Campaign-Post-V8.webp',
                            alt: 'Moneybag Promotion',
                            className: 'moneybag-calc-promo-image'
                        })
                    )
                ),
                
                // Bottom buttons
                h('div', { className: 'moneybag-calc-cta-bottom-buttons' },
                    h('button', {
                        className: 'moneybag-calc-btn-call-now',
                        onClick: handleCallNow
                    }, 
                        h('span', { className: 'moneybag-calc-call-icon' }, '📞'),
                        ' Call +880 1958 109 228'
                    ),
                    h('button', {
                        className: 'moneybag-calc-btn-try-sandbox',
                        onClick: handleTrySandbox
                    }, 
                        'Try Our Sandbox ',
                        h('span', { className: 'moneybag-calc-sandbox-arrow' }, '→')
                    )
                )
            )
        );
    }
    
    // Initialize calculator instances
    function initCalculators() {
        const containers = document.querySelectorAll('[id^="price-comparison-calculator-"]');
        
        containers.forEach(container => {
            const widgetId = container.id.replace('price-comparison-calculator-', '');
            const config = window.MoneybagPriceCalculatorConfig && window.MoneybagPriceCalculatorConfig[widgetId];
            
            if (config) {
                // Parse config if it's a string
                const parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
                
                // Mount React component
                wp.element.render(
                    h(PriceComparisonCalculator, { config: parsedConfig }),
                    container
                );
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCalculators);
    } else {
        initCalculators();
    }
    
    // Re-initialize for Elementor editor
    if (window.elementor) {
        window.elementor.hooks.addAction('panel/open_editor/widget/moneybag-price-comparison-calculator', initCalculators);
        jQuery(window).on('elementor/frontend/init', initCalculators);
    }
})();