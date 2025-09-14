(function() {
    'use strict';
    
    const { useState, useEffect, createElement: h } = wp.element;
    
    // Format numbers with Bangladesh locale and abbreviations for large numbers
    const formatNumber = (num) => {
        // For very large numbers, use abbreviations
        if (num >= 1000000000000) { // Trillion
            return (num / 1000000000000).toFixed(1) + 'T';
        } else if (num >= 1000000000) { // Billion
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 10000000) { // 10+ Million - abbreviate
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000000) { // Million - show full
            return new Intl.NumberFormat('en-BD').format(num);
        } else {
            return new Intl.NumberFormat('en-BD').format(num);
        }
    };

    // Format numbers with Bangladeshi comma format (for input display)
    const formatBangladeshiNumber = (num) => {
        return new Intl.NumberFormat('en-BD').format(num);
    };

    // Remove commas and convert to number (for input parsing)
    const parseBangladeshiNumber = (str) => {
        return parseInt(str.replace(/,/g, '')) || 0;
    };
    
    // Calculate savings based on volume, payment mix, and rates
    const calculateSavings = (monthlyVolume, paymentMix, competitorRates, moneybagRates) => {
        let competitorCost = 0;
        let moneybagCost = 0;
        let totalMixPercentage = 0;
        
        // Calculate costs for all payment methods
        Object.keys(paymentMix).forEach(method => {
            const mixPercent = paymentMix[method] || 0;
            if (mixPercent > 0) {
                // Get rates - use visa rate for card methods, specific rates for wallets
                let compRate = 0;
                let mbRate = 0;
                
                // Get specific rates for each payment method
                if (method === 'visa') {
                    compRate = competitorRates.visa || competitorRates.card || 2.45;
                    mbRate = moneybagRates.visa || 2.1;
                } else if (method === 'mastercard') {
                    compRate = competitorRates.mastercard || competitorRates.visa || competitorRates.card || 2.45;
                    mbRate = moneybagRates.mastercard || 2.1;
                } else if (method === 'american_express') {
                    compRate = competitorRates.american_express || competitorRates.amex || competitorRates.card || 3.5;
                    mbRate = moneybagRates.american_express || 3.3;
                } else if (method === 'diners_club') {
                    compRate = competitorRates.diners_club || competitorRates.card || 2.5;
                    mbRate = moneybagRates.diners_club || 2.3;
                } else if (method === 'unionpay') {
                    compRate = competitorRates.unionpay || competitorRates.card || 2.5;
                    mbRate = moneybagRates.unionpay || 2.3;
                } else if (method === 'dbbl_nexus') {
                    compRate = competitorRates.dbbl_nexus || competitorRates.nexus || competitorRates.card || 2.2;
                    mbRate = moneybagRates.dbbl_nexus || 2.0;
                } else if (method === 'bkash') {
                    compRate = competitorRates.bkash || 2.0;
                    mbRate = moneybagRates.bkash || 1.75;
                } else if (method === 'nagad') {
                    compRate = competitorRates.nagad || 1.85;
                    mbRate = moneybagRates.nagad || 1.6;
                } else if (method === 'rocket') {
                    compRate = competitorRates.rocket || 2.0;
                    mbRate = moneybagRates.rocket || 1.8;
                } else if (method === 'upay') {
                    compRate = competitorRates.upay || 1.8;
                    mbRate = moneybagRates.upay || 1.5;
                }
                
                competitorCost += (monthlyVolume * mixPercent / 100 * compRate / 100);
                moneybagCost += (monthlyVolume * mixPercent / 100 * mbRate / 100);
                totalMixPercentage += mixPercent;
            }
        });
        
        // Calculate savings
        const monthlySavings = competitorCost - moneybagCost;
        const yearlySavings = monthlySavings * 12;
        
        // Calculate weighted average fees
        const competitorAvgFee = totalMixPercentage > 0 ? (competitorCost / (monthlyVolume * totalMixPercentage / 100)) * 100 : 0;
        const moneybagAvgFee = totalMixPercentage > 0 ? (moneybagCost / (monthlyVolume * totalMixPercentage / 100)) * 100 : 0;
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
        const [monthlyVolume, setMonthlyVolume] = useState(config.default_volume || 1000000);
        const [currentGateway, setCurrentGateway] = useState(config.default_gateway || 'sslcommerz');
        const [businessCategory, setBusinessCategory] = useState('eCommerce');
        const [isCustomMode, setIsCustomMode] = useState(false);
        const [showAllMethods, setShowAllMethods] = useState(false);

        // Global validator instance
        const validator = new window.MoneybagValidator();
        
        // All payment methods with display configuration
        const paymentMethods = [
            { id: 'visa', name: 'Visa', logo: 'Visa.webp', default: true },
            { id: 'mastercard', name: 'Mastercard', logo: 'Mastercard.webp', default: true },
            { id: 'bkash', name: 'bKash', logo: 'bKash.webp', default: true },
            { id: 'nagad', name: 'Nagad', logo: 'Nagad.webp', default: false },
            { id: 'rocket', name: 'Rocket', logo: 'Rocket.webp', default: false },
            { id: 'upay', name: 'Upay', logo: 'Upay.webp', default: false },
            { id: 'american_express', name: 'American Express', logo: 'American Express.webp', default: false },
            { id: 'dbbl_nexus', name: 'DBBL Nexus', logo: 'DBBL-Nexus.webp', default: false },
            { id: 'diners_club', name: 'Diners Club', logo: 'Diners Club.webp', default: false },
            { id: 'unionpay', name: 'UnionPay', logo: 'UnionPay.webp', default: false }
        ];
        
        // Initialize payment mix with all methods
        const initialPaymentMix = {
            visa: 15,
            mastercard: 10,
            bkash: 60,
            nagad: 10,
            rocket: 3,
            upay: 2,
            american_express: 0,
            dbbl_nexus: 0,
            diners_club: 0,
            unionpay: 0
        };
        
        const [paymentMix, setPaymentMix] = useState(initialPaymentMix);
        const [competitorRates, setCompetitorRates] = useState(config.gateway_presets[currentGateway]);
        const [calculations, setCalculations] = useState({});
        const [isLoading, setIsLoading] = useState(false);
        const [errors, setErrors] = useState({});

        // Business categories from pricing rules
        const businessCategories = [
            { value: 'Education', label: 'Education' },
            { value: 'eCommerce', label: 'eCommerce' },
            { value: 'fCommerce', label: 'fCommerce' },
            { value: 'Health Service', label: 'Health Service' },
            { value: 'IT Services', label: 'IT Services' },
            { value: 'NGO/Donation', label: 'NGO/Donation' },
            { value: 'Digital Service Platform', label: 'Digital Service Platform' },
            { value: 'Membership & Subscriptions', label: 'Membership & Subscriptions' },
            { value: 'Event Management / Ticketing', label: 'Event Management / Ticketing' },
            { value: 'Consulting Services', label: 'Consulting Services' },
            { value: 'Miscellaneous', label: 'Miscellaneous' }
        ];

        // Dynamic Moneybag rates based on business category
        const getCategoryBasedRates = (category) => {
            const categoryRates = {
                'Education': {
                    bkash: 1.20,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.45,
                    visa: 1.20,
                    mastercard: 1.20,
                    diners_club: 1.30,
                    unionpay: 1.30,
                    american_express: 1.50,
                    dbbl_nexus: 30 // BDT per transaction
                },
                'eCommerce': {
                    bkash: 1.75,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'fCommerce': {
                    bkash: 1.75,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'Health Service': {
                    bkash: 1.75,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'IT Services': {
                    bkash: 2.30,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'NGO/Donation': {
                    bkash: 1.75,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'Digital Service Platform': {
                    bkash: 12.50, // Special high rate for this category
                    nagad: 1.60,
                    upay: 1.40,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'Membership & Subscriptions': {
                    bkash: 1.75,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'Event Management / Ticketing': {
                    bkash: 1.75,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'Consulting Services': {
                    bkash: 1.75,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                },
                'Miscellaneous': {
                    bkash: 1.75,
                    nagad: 1.60,
                    upay: 1.50,
                    rocket: 1.80,
                    visa: 2.10,
                    mastercard: 2.10,
                    diners_club: 2.30,
                    unionpay: 2.30,
                    american_express: 3.30,
                    dbbl_nexus: 2.00
                }
            };

            return categoryRates[category] || categoryRates['eCommerce'];
        };

        const moneybagRates = getCategoryBasedRates(businessCategory);
        
        // Update competitor rates when gateway changes
        useEffect(() => {
            if (config.gateway_presets && config.gateway_presets[currentGateway]) {
                setCompetitorRates(config.gateway_presets[currentGateway]);
            }
        }, [currentGateway]);
        
        // Update calculations whenever inputs change
        useEffect(() => {
            const currentMoneybagRates = getCategoryBasedRates(businessCategory);
            const results = calculateSavings(monthlyVolume, paymentMix, competitorRates, currentMoneybagRates);
            setCalculations(results);
        }, [monthlyVolume, paymentMix, competitorRates, businessCategory]);
        
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
            // Get the raw input value and remove commas to get the actual number
            const rawValue = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters including commas
            const value = parseInt(rawValue) || 0;

            if (validateVolume(value)) {
                setMonthlyVolume(value);
            }
        };
        
        // Handle gateway change
        const handleGatewayChange = (e) => {
            const newGateway = e.target.value;
            setCurrentGateway(newGateway);
            // Update competitor rates based on selected gateway
            if (config.gateway_presets && config.gateway_presets[newGateway]) {
                setCompetitorRates(config.gateway_presets[newGateway]);
            }
        };

        // Handle business category change
        const handleBusinessCategoryChange = (e) => {
            const newCategory = e.target.value;

            // Validate the business category
            const validationError = validator.validateField('businessCategory', newCategory);
            if (validationError) {
                setErrors(prev => ({ ...prev, businessCategory: validationError }));
            } else {
                setErrors(prev => ({ ...prev, businessCategory: null }));
                setBusinessCategory(newCategory);
            }
        };
        
        // Handle payment mix change with validation
        const handlePaymentMixChange = (method, value) => {
            const newValue = parseInt(value) || 0;
            const newMix = { ...paymentMix, [method]: newValue };
            const sum = Object.values(newMix).reduce((a, b) => a + b, 0);
            
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
        
        const handleJoinAsMerchant = () => {
            window.location.href = 'https://moneybag.com.bd/join-as-merchant/';
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
                    h('span', { className: 'moneybag-calc-savings-line1' }, 'You could save'),
                    h('span', { className: 'moneybag-calc-savings-amount', id: 'monthly-savings' }, 
                        formatNumber(Math.round(calculations.monthlySavings || 0))
                    ),
                    h('span', { className: 'moneybag-calc-savings-line3' }, '/ month')
                ),
                h('div', { className: 'moneybag-calc-savings-sub-text' },
                    'and ',
                    h('span', { className: 'moneybag-calc-yearly-amount', id: 'yearly-savings' }, 
                        formatNumber(Math.round(calculations.yearlySavings || 0))
                    ),
                    ' / year with Moneybag'
                )
            ),
            
            // Input Controls Bar
            h('div', { className: 'moneybag-calc-input-bar' },
                // Monthly Volume Input
                h('div', { className: 'moneybag-calc-input-group moneybag-calc-volume-group' },
                    h('label', {}, 'Monthly Volume'),
                    h('div', { className: 'moneybag-calc-input-wrapper' },
                        h('span', { className: 'moneybag-calc-taka-icon' }, '৳'),
                        h('input', {
                            type: 'text', // Changed to text to control input better
                            id: 'volume-input',
                            className: errors.volume ? 'moneybag-calc-input-field moneybag-calc-input-with-icon moneybag-calc-error' : 'moneybag-calc-input-field moneybag-calc-input-with-icon',
                            value: formatBangladeshiNumber(monthlyVolume),
                            onChange: handleVolumeChange,
                            pattern: '[0-9,]*',
                            inputMode: 'numeric'
                        })
                    ),
                    errors.volume && h('span', { className: 'moneybag-calc-error-message' }, errors.volume)
                ),
                
                // Business Category Selection
                h('div', { className: 'moneybag-calc-input-group' },
                    h('label', {},
                        'Business Category',
                        h('span', { className: 'required-indicator' }, ' *')
                    ),
                    h('select', {
                        id: 'business-category-select',
                        className: errors.businessCategory ? 'moneybag-calc-select-field moneybag-calc-error' : 'moneybag-calc-select-field',
                        value: businessCategory,
                        onChange: handleBusinessCategoryChange
                    },
                        businessCategories.map(category =>
                            h('option', { key: category.value, value: category.value }, category.label)
                        )
                    ),
                    errors.businessCategory && h('span', { className: 'moneybag-calc-error-message' }, errors.businessCategory)
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
                // Header with title and button side by side
                h('div', { className: 'moneybag-calc-custom-header' },
                    h('h3', { className: 'moneybag-calc-table-title' }, 'Custom Payment Mix'),
                    
                    // Show More/Less Button
                    h('div', { className: 'moneybag-calc-show-more-container' },
                        h('button', {
                            className: 'moneybag-calc-show-more-btn',
                            onClick: () => setShowAllMethods(!showAllMethods)
                        },
                            h('span', { className: 'moneybag-calc-toggle-text' }, 
                                showAllMethods ? 'Show Less Methods' : 'Show More Methods'
                            ),
                            h('svg', {
                                className: 'moneybag-calc-expand-icon',
                                width: '12',
                                height: '12',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: '2.5',
                                style: { transform: showAllMethods ? 'rotate(180deg)' : 'rotate(0deg)' }
                            },
                                h('path', { d: 'M6 9l6 6 6-6' })
                            )
                        )
                    )
                ),
                
                // Method Rows
                h('div', { className: 'moneybag-calc-method-grid' },
                    paymentMethods
                        .filter(method => showAllMethods || method.default)
                        .map(method => {
                        const methodVolume = monthlyVolume * paymentMix[method.id] / 100;
                        
                        // Determine rates based on method type
                        let compRate = 0;
                        let mbRate = 0;
                        
                        // Get dynamic Moneybag rates based on selected business category
                        const currentMoneybagRates = getCategoryBasedRates(businessCategory);

                        // Get specific rates for each payment method
                        if (method.id === 'visa') {
                            compRate = competitorRates.visa || competitorRates.card || 2.45;
                            mbRate = currentMoneybagRates.visa || 2.1;
                        } else if (method.id === 'mastercard') {
                            compRate = competitorRates.mastercard || competitorRates.visa || competitorRates.card || 2.45;
                            mbRate = currentMoneybagRates.mastercard || 2.1;
                        } else if (method.id === 'american_express') {
                            compRate = competitorRates.american_express || competitorRates.amex || competitorRates.card || 3.5;
                            mbRate = currentMoneybagRates.american_express || 3.3;
                        } else if (method.id === 'diners_club') {
                            compRate = competitorRates.diners_club || competitorRates.card || 2.5;
                            mbRate = currentMoneybagRates.diners_club || 2.3;
                        } else if (method.id === 'unionpay') {
                            compRate = competitorRates.unionpay || competitorRates.card || 2.5;
                            mbRate = currentMoneybagRates.unionpay || 2.3;
                        } else if (method.id === 'dbbl_nexus') {
                            compRate = competitorRates.dbbl_nexus || competitorRates.nexus || competitorRates.card || 2.2;
                            mbRate = currentMoneybagRates.dbbl_nexus || 2.0;
                        } else if (method.id === 'bkash') {
                            compRate = competitorRates.bkash || 2.0;
                            mbRate = currentMoneybagRates.bkash || 1.75;
                        } else if (method.id === 'nagad') {
                            compRate = competitorRates.nagad || 1.85;
                            mbRate = currentMoneybagRates.nagad || 1.6;
                        } else if (method.id === 'rocket') {
                            compRate = competitorRates.rocket || 2.0;
                            mbRate = currentMoneybagRates.rocket || 1.8;
                        } else if (method.id === 'upay') {
                            compRate = competitorRates.upay || 1.8;
                            mbRate = currentMoneybagRates.upay || 1.5;
                        }
                        
                        const competitorCost = methodVolume * compRate / 100;
                        const moneybagCost = methodVolume * mbRate / 100;
                        const savings = competitorCost - moneybagCost;
                        
                        return h('div', { className: 'moneybag-calc-method-row', key: method.id },
                            h('div', { className: 'moneybag-calc-method-logo' }, 
                                h('img', {
                                    src: MONEYBAG_PLUGIN_URL + 'assets/image/' + method.logo,
                                    alt: method.name,
                                    className: 'moneybag-calc-payment-logo'
                                })
                            ),
                            h('div', { className: 'moneybag-calc-method-cells' },
                                h('div', { className: 'moneybag-calc-cell-group' },
                                    h('div', { className: 'moneybag-calc-cell-label' }, 'Payment Mix (%)'),
                                    h('div', { className: 'moneybag-calc-cell-box' },
                                        h('input', {
                                            type: 'number',
                                            value: paymentMix[method.id],
                                            min: 0,
                                            max: 100,
                                            className: 'moneybag-calc-method-input',
                                            onChange: (e) => handlePaymentMixChange(method.id, e.target.value)
                                        })
                                    )
                                ),
                                h('div', { className: 'moneybag-calc-cell-group' },
                                    h('div', { className: 'moneybag-calc-cell-label' }, 'Your Rate (%)'),
                                    h('div', { className: 'moneybag-calc-cell-box' },
                                        h('input', {
                                            type: 'number',
                                            value: compRate,
                                            min: 0,
                                            max: 10,
                                            step: 0.01,
                                            className: 'moneybag-calc-method-input',
                                            onChange: (e) => handleCompetitorRateChange(method.id, e.target.value)
                                        })
                                    )
                                ),
                                h('div', { className: 'moneybag-calc-cell-group' },
                                    h('div', { className: 'moneybag-calc-cell-label' }, 'Moneybag Rate'),
                                    h('div', { className: 'moneybag-calc-cell-box moneybag-calc-readonly-box' },
                                        h('div', { className: 'moneybag-calc-cell-value' }, 
                                            `${mbRate}%`
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
                        onClick: handleJoinAsMerchant
                    }, 
                        'Join As a Merchant ',
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