(function () {
  "use strict";

  const { useState, useEffect, createElement: h } = wp.element;

  // Format numbers with Bangladesh locale and abbreviations for large numbers
  const formatNumber = (num) => {
    if (num >= 1000000000000) {
      return (num / 1000000000000).toFixed(1) + "T";
    } else if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B";
    } else if (num >= 10000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000000) {
      return new Intl.NumberFormat("en-BD").format(num);
    } else {
      return new Intl.NumberFormat("en-BD").format(num);
    }
  };

  const formatBangladeshiNumber = (num) => {
    return new Intl.NumberFormat("en-BD").format(num);
  };

  const parseBangladeshiNumber = (str) => {
    return parseInt(str.replace(/,/g, "")) || 0;
  };

  // Parse percentage string to number (handles both "1.40%" and "30.20 BDT per Trnx")
  const parseRate = (rateStr) => {
    if (typeof rateStr === "number") return rateStr;
    if (typeof rateStr !== "string") return 0;

    // Extract percentage value
    const percentMatch = rateStr.match(/[\d.]+/);
    return percentMatch ? parseFloat(percentMatch[0]) : 0;
  };

  // Pricing rates from pricing-rules.json (v1.3 - updated 2025-11-11)
  // Accurately mapped from JSON source
  const getCategoryBasedRates = (category) => {
    const categoryRates = {
      Education: {
        visa: 1.5,
        mastercard: 1.5,
        diners_club: 1.5,
        unionpay: 1.5,
        american_express: 1.7,
        dbbl_nexus: 30.0, // BDT per Transaction (fixed amount, not percentage)
        bkash: 1.5,
        nagad: 1.7,
        upay: 1.5,
        rocket: 1.7,
      },
      eCommerce: {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
      fCommerce: {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
      "Health Service": {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
      "IT Services": {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
      "NGO/Donation": {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
      "Digital Service Platform": {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 15.0, // ⚠️ HIGHER RATE FOR BKASH IN THIS CATEGORY
        nagad: 1.8,
        upay: 1.6,
        rocket: 1.8,
      },
      "Membership & Subscriptions": {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
      "Event Management / Ticketing": {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
      "Consulting Services": {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
      Miscellaneous: {
        visa: 2.4,
        mastercard: 2.4,
        diners_club: 2.4,
        unionpay: 2.4,
        american_express: 3.4,
        dbbl_nexus: 2.1,
        bkash: 1.8,
        nagad: 1.8,
        upay: 1.5,
        rocket: 1.8,
      },
    };

    return categoryRates[category] || categoryRates["eCommerce"];
  };

  // Calculate savings based on volume, payment mix, and rates
  const calculateSavings = (
    monthlyVolume,
    paymentMix,
    competitorRates,
    moneybagRates
  ) => {
    let competitorCost = 0;
    let moneybagCost = 0;
    let totalMixPercentage = 0;

    Object.keys(paymentMix).forEach((method) => {
      const mixPercent = paymentMix[method] || 0;
      if (mixPercent > 0) {
        let compRate = 0;
        let mbRate = 0;

        // Get rates with proper fallback
        const fallbackRate = 2.6;

        if (method === "visa") {
          mbRate = parseRate(moneybagRates.visa) || 2.3;
          compRate = parseRate(
            competitorRates.visa || competitorRates.card || fallbackRate
          );
        } else if (method === "mastercard") {
          mbRate = parseRate(moneybagRates.mastercard) || 2.3;
          compRate = parseRate(
            competitorRates.mastercard ||
              competitorRates.visa ||
              competitorRates.card ||
              fallbackRate
          );
        } else if (method === "american_express") {
          mbRate = parseRate(moneybagRates.american_express) || 3.5;
          compRate = parseRate(
            competitorRates.american_express ||
              competitorRates.amex ||
              competitorRates.card ||
              fallbackRate
          );
        } else if (method === "diners_club") {
          mbRate = parseRate(moneybagRates.diners_club) || 2.5;
          compRate = parseRate(
            competitorRates.diners_club || competitorRates.card || fallbackRate
          );
        } else if (method === "unionpay") {
          mbRate = parseRate(moneybagRates.unionpay) || 2.5;
          compRate = parseRate(
            competitorRates.unionpay || competitorRates.card || fallbackRate
          );
        } else if (method === "dbbl_nexus") {
          mbRate = parseRate(moneybagRates.dbbl_nexus) || 2.2;
          compRate = parseRate(
            competitorRates.dbbl_nexus ||
              competitorRates.nexus ||
              competitorRates.card ||
              2.5
          );
        } else if (method === "bkash") {
          mbRate = parseRate(moneybagRates.bkash) || 1.95;
          compRate = parseRate(competitorRates.bkash || 2.25);
        } else if (method === "nagad") {
          mbRate = parseRate(moneybagRates.nagad) || 1.8;
          compRate = parseRate(competitorRates.nagad || 2.1);
        } else if (method === "rocket") {
          mbRate = parseRate(moneybagRates.rocket) || 2.0;
          compRate = parseRate(competitorRates.rocket || 2.3);
        } else if (method === "upay") {
          mbRate = parseRate(moneybagRates.upay) || 1.7;
          compRate = parseRate(competitorRates.upay || 2.0);
        }

        competitorCost +=
          (((monthlyVolume * mixPercent) / 100) * compRate) / 100;
        moneybagCost += (((monthlyVolume * mixPercent) / 100) * mbRate) / 100;
        totalMixPercentage += mixPercent;
      }
    });

    const monthlySavings = competitorCost - moneybagCost;
    const yearlySavings = monthlySavings * 12;

    const competitorAvgFee =
      totalMixPercentage > 0
        ? (competitorCost / ((monthlyVolume * totalMixPercentage) / 100)) * 100
        : 0;
    const moneybagAvgFee =
      totalMixPercentage > 0
        ? (moneybagCost / ((monthlyVolume * totalMixPercentage) / 100)) * 100
        : 0;
    const difference = competitorAvgFee - moneybagAvgFee;

    return {
      monthlySavings,
      yearlySavings,
      competitorAvgFee,
      moneybagAvgFee,
      difference,
    };
  };

  // Generate competitor rates from pricing rules (20-30% higher than Moneybag)
  const generateCompetitorRates = (businessCategory = "eCommerce") => {
    // Base Moneybag rates for this category
    const moneybagRates = getCategoryBasedRates(businessCategory);

    // Calculate competitor rates as 25% higher than Moneybag rates
    const competitorRates = {};
    Object.keys(moneybagRates).forEach((method) => {
      const mbRate = parseRate(moneybagRates[method]);
      // Add 25% to Moneybag rate
      competitorRates[method] = mbRate * 1.25;
    });

    // Special case: IT Services bKash should be 13.0 (high rate from competitor)
    if (businessCategory === "IT Services") {
      competitorRates.bkash = 13.0;
    }

    // Add card fallback
    competitorRates.card = competitorRates.visa;
    competitorRates.nexus = competitorRates.dbbl_nexus;
    competitorRates.amex = competitorRates.american_express;

    return competitorRates;
  };

  // Main Calculator Component
  function PriceComparisonCalculator({ config }) {
    const MONEYBAG_PLUGIN_URL =
      config.pluginUrl || "/wp-content/plugins/moneybag-wordpress-plugin/";
    const [monthlyVolume, setMonthlyVolume] = useState(
      config.default_volume || 1000000
    );
    const [currentGateway, setCurrentGateway] = useState(
      config.default_gateway || "sslcommerz"
    );
    const [businessCategory, setBusinessCategory] = useState("eCommerce");
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [showAllMethods, setShowAllMethods] = useState(false);

    const validator = new window.MoneybagValidator();

    const paymentMethods = [
      { id: "visa", name: "Visa", logo: "Visa.webp", default: true },
      {
        id: "mastercard",
        name: "Mastercard",
        logo: "Mastercard.webp",
        default: true,
      },
      { id: "bkash", name: "bKash", logo: "bKash.webp", default: true },
      { id: "nagad", name: "Nagad", logo: "Nagad.webp", default: false },
      { id: "rocket", name: "Rocket", logo: "Rocket.webp", default: false },
      { id: "upay", name: "Upay", logo: "Upay.webp", default: false },
      {
        id: "american_express",
        name: "American Express",
        logo: "American Express.webp",
        default: false,
      },
      {
        id: "dbbl_nexus",
        name: "DBBL Nexus",
        logo: "DBBL-Nexus.webp",
        default: false,
      },
      {
        id: "diners_club",
        name: "Diners Club",
        logo: "Diners Club.webp",
        default: false,
      },
      {
        id: "unionpay",
        name: "UnionPay",
        logo: "UnionPay.webp",
        default: false,
      },
    ];

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
      unionpay: 0,
    };

    const [paymentMix, setPaymentMix] = useState(initialPaymentMix);
    const [competitorRates, setCompetitorRates] = useState({});
    const [calculations, setCalculations] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const businessCategories = [
      { value: "Education", label: "Education" },
      { value: "eCommerce", label: "eCommerce" },
      { value: "fCommerce", label: "fCommerce" },
      { value: "Health Service", label: "Health Service" },
      { value: "IT Services", label: "IT Services" },
      { value: "NGO/Donation", label: "NGO/Donation" },
      { value: "Digital Service Platform", label: "Digital Service Platform" },
      {
        value: "Membership & Subscriptions",
        label: "Membership & Subscriptions",
      },
      {
        value: "Event Management / Ticketing",
        label: "Event Management / Ticketing",
      },
      { value: "Consulting Services", label: "Consulting Services" },
      { value: "Miscellaneous", label: "Miscellaneous" },
    ];

    // Generate competitor rates from pricing rules (20-30% higher than Moneybag)
    const generateCompetitorRates = (category) => {
      // Base Moneybag rates for this category
      const moneybagRates = getCategoryBasedRates(category);

      // Calculate competitor rates as 25% higher than Moneybag rates
      const competitorRates = {};
      Object.keys(moneybagRates).forEach((method) => {
        const mbRate = parseRate(moneybagRates[method]);
        // Add 25% to Moneybag rate
        competitorRates[method] = mbRate * 1.25;
      });

      // Add card fallback
      competitorRates.card = competitorRates.visa;
      competitorRates.nexus = competitorRates.dbbl_nexus;
      competitorRates.amex = competitorRates.american_express;

      return competitorRates;
    };

    useEffect(() => {
      const newCompetitorRates = generateCompetitorRates(businessCategory);
      setCompetitorRates(newCompetitorRates);
    }, [businessCategory]);

    useEffect(() => {
      const currentMoneybagRates = getCategoryBasedRates(businessCategory);
      const generatedCompetitorRates =
        generateCompetitorRates(businessCategory);
      const results = calculateSavings(
        monthlyVolume,
        paymentMix,
        generatedCompetitorRates,
        currentMoneybagRates
      );
      setCalculations(results);
    }, [monthlyVolume, paymentMix, businessCategory]);

    useEffect(() => {
      if (isCustomMode && window.innerWidth <= 480) {
        const handleScroll = (e) => {
          const element = e.target;
          if (element.scrollLeft > 10) {
            element.classList.add("scrolled");
            const grid = document.querySelector(".moneybag-calc-method-grid");
            if (grid) grid.classList.add("scrolled");
          } else {
            element.classList.remove("scrolled");
            const grid = document.querySelector(".moneybag-calc-method-grid");
            if (grid) grid.classList.remove("scrolled");
          }
        };

        const section = document.querySelector(
          ".moneybag-calc-custom-mode-section"
        );
        if (section) {
          section.addEventListener("scroll", handleScroll);
          return () => section.removeEventListener("scroll", handleScroll);
        }
      }
    }, [isCustomMode]);

    useEffect(() => {
      if (config.gateway_presets && config.gateway_presets[currentGateway]) {
        setCompetitorRates(config.gateway_presets[currentGateway]);
      } else {
        setCompetitorRates(generateCompetitorRates(businessCategory));
      }
    }, [currentGateway, config.gateway_presets, businessCategory]);

    const validateVolume = (value) => {
      if (value < 0) {
        setErrors((prev) => ({ ...prev, volume: "Volume must be positive" }));
        return false;
      }
      setErrors((prev) => ({ ...prev, volume: null }));
      return true;
    };

    const handleVolumeChange = (e) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, "");
      const value = parseInt(rawValue) || 0;

      if (validateVolume(value)) {
        setMonthlyVolume(value);
      }
    };

    const handleGatewayChange = (e) => {
      const newGateway = e.target.value;
      setCurrentGateway(newGateway);
      setCompetitorRates(generateCompetitorRates(businessCategory));
    };

    const handleBusinessCategoryChange = (e) => {
      const newCategory = e.target.value;

      const validationError = validator.validateField(
        "businessCategory",
        newCategory
      );
      if (validationError) {
        setErrors((prev) => ({ ...prev, businessCategory: validationError }));
      } else {
        setErrors((prev) => ({ ...prev, businessCategory: null }));
        setBusinessCategory(newCategory);
        const newCompetitorRates = generateCompetitorRates(newCategory);
        setCompetitorRates(newCompetitorRates);
      }
    };

    const handlePaymentMixChange = (method, value) => {
      const newValue = parseInt(value) || 0;
      const otherMethodsSum = Object.keys(paymentMix)
        .filter((key) => key !== method)
        .reduce((sum, key) => sum + (paymentMix[key] || 0), 0);

      const maxAllowed = 100 - otherMethodsSum;
      const cappedValue = Math.min(newValue, Math.max(0, maxAllowed));

      const newMix = { ...paymentMix, [method]: cappedValue };
      const sum = Object.values(newMix).reduce((a, b) => a + b, 0);

      setPaymentMix(newMix);

      const newFieldErrors = { ...errors };
      newFieldErrors.paymentMix = null;

      Object.keys(paymentMix).forEach((methodKey) => {
        const fieldValue = newMix[methodKey] || 0;

        if (
          methodKey === method &&
          newValue > cappedValue &&
          cappedValue >= 0
        ) {
          newFieldErrors[
            `${methodKey}_individual`
          ] = `(Exceed 100%). To increase this, decrease others first.`;

          setTimeout(() => {
            setErrors((prev) => ({
              ...prev,
              [`${methodKey}_individual`]: null,
            }));
          }, 5000);
        } else if (fieldValue < 0) {
          newFieldErrors[`${methodKey}_individual`] = "Cannot be negative";

          setTimeout(() => {
            setErrors((prev) => ({
              ...prev,
              [`${methodKey}_individual`]: null,
            }));
          }, 5000);
        } else {
          newFieldErrors[`${methodKey}_individual`] = null;
        }
      });

      if (sum < 100) {
        newFieldErrors.paymentMixGlobal = `Total: ${sum}% - Need ${
          100 - sum
        }% more`;
      } else {
        newFieldErrors.paymentMixGlobal = null;
      }

      setErrors(newFieldErrors);
    };

    const handleCompetitorRateChange = (method, value) => {
      const newValue = parseFloat(value) || 0;
      setCompetitorRates((prev) => ({ ...prev, [method]: newValue }));
    };

    const handleGetStarted = async () => {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("action", "handle_calculator_lead");
        formData.append("nonce", config.nonce);
        formData.append("monthly_volume", monthlyVolume);
        formData.append("current_gateway", currentGateway);
        formData.append("estimated_savings", calculations.yearlySavings);

        const response = await fetch(config.api_url, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          window.location.href = "/contact";
        }
      } catch (error) {
        console.error("Error submitting lead:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleCallNow = () => {
      window.location.href = "tel:+8801958109228";
    };

    const handleJoinAsMerchant = () => {
      window.location.href = "https://moneybag.com.bd/join-as-merchant/";
    };

    return h(
      "div",
      { className: "moneybag-calculator-wrapper" },
      h(
        "div",
        { className: "moneybag-calc-header" },
        h(
          "h1",
          { className: "moneybag-calc-title" },
          "Switch & Save with Moneybag"
        ),
        h(
          "p",
          { className: "moneybag-calc-subtitle" },
          "Calculate how much your business can save on payment processing fees"
        )
      ),

      h(
        "div",
        { className: "moneybag-calc-hero-card" },
        h(
          "svg",
          {
            className: "moneybag-calc-savings-arrow",
            xmlns: "http://www.w3.org/2000/svg",
            width: "48",
            height: "48",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "#10b981",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
          },
          h("path", { d: "M16 7h6v6" }),
          h("path", { d: "m22 7-8.5 8.5-5-5L2 17" })
        ),
        h(
          "div",
          { className: "moneybag-calc-savings-main-text" },
          h(
            "span",
            { className: "moneybag-calc-savings-line1" },
            "You could save"
          ),
          h(
            "span",
            {
              className: `moneybag-calc-savings-amount ${
                (calculations.monthlySavings || 0) < 0 ? "negative" : ""
              }`,
              id: "monthly-savings",
            },
            formatNumber(Math.round(calculations.monthlySavings || 0))
          ),
          h("span", { className: "moneybag-calc-savings-line3" }, "/ month")
        ),
        h(
          "div",
          { className: "moneybag-calc-savings-sub-text" },
          "and ",
          h(
            "span",
            {
              className: `moneybag-calc-yearly-amount ${
                (calculations.yearlySavings || 0) < 0 ? "negative" : ""
              }`,
              id: "yearly-savings",
            },
            formatNumber(Math.round(calculations.yearlySavings || 0))
          ),
          " / year with Moneybag"
        )
      ),

      h(
        "div",
        { className: "moneybag-calc-input-bar" },
        h(
          "div",
          { className: "moneybag-calc-input-group moneybag-calc-volume-group" },
          h("label", {}, "Monthly Volume"),
          h(
            "div",
            { className: "moneybag-calc-input-wrapper" },
            h("span", { className: "moneybag-calc-taka-icon" }, "৳"),
            h("input", {
              type: "text",
              id: "volume-input",
              className: errors.volume
                ? "moneybag-calc-input-field moneybag-calc-input-with-icon moneybag-calc-error"
                : "moneybag-calc-input-field moneybag-calc-input-with-icon",
              value: formatBangladeshiNumber(monthlyVolume),
              onChange: handleVolumeChange,
              pattern: "[0-9,]*",
              inputMode: "numeric",
            })
          ),
          errors.volume &&
            h(
              "span",
              { className: "moneybag-calc-error-message" },
              errors.volume
            )
        ),

        h(
          "div",
          { className: "moneybag-calc-input-group" },
          h(
            "label",
            {},
            "Business Category",
            h("span", { className: "required-indicator" }, " *")
          ),
          h(
            "select",
            {
              id: "business-category-select",
              className: errors.businessCategory
                ? "moneybag-calc-select-field moneybag-calc-error"
                : "moneybag-calc-select-field",
              value: businessCategory,
              onChange: handleBusinessCategoryChange,
            },
            businessCategories.map((category) =>
              h(
                "option",
                { key: category.value, value: category.value },
                category.label
              )
            )
          ),
          errors.businessCategory &&
            h(
              "span",
              { className: "moneybag-calc-error-message" },
              errors.businessCategory
            )
        ),

        h(
          "button",
          {
            id: "custom-mode-toggle",
            className: "moneybag-calc-toggle-btn",
            onClick: () => {
              setIsCustomMode(!isCustomMode);
              if (!isCustomMode) {
                setTimeout(() => {
                  const customSection = document.getElementById(
                    "custom-mode-section"
                  );
                  if (customSection) {
                    const rect = customSection.getBoundingClientRect();
                    const elementTop = rect.top + window.pageYOffset;
                    const elementHeight = rect.height;
                    const viewportHeight = window.innerHeight;
                    const scrollPosition =
                      elementTop + elementHeight / 2 - viewportHeight / 2;
                    const finalPosition = Math.max(0, scrollPosition - 50);

                    window.scrollTo({
                      top: finalPosition,
                      behavior: "smooth",
                    });
                  }
                }, 100);
              }
            },
          },
          h(
            "svg",
            {
              className: "moneybag-calc-toggle-icon",
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
            },
            h("path", {
              d: "M4 21v-7",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
            h("path", {
              d: "M4 10V3",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
            h("path", {
              d: "M12 21v-9",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
            h("path", {
              d: "M12 8V3",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
            h("path", {
              d: "M20 21v-5",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
            h("path", {
              d: "M20 12V3",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
            h("circle", { cx: "4", cy: "14", r: "2", strokeWidth: "2" }),
            h("circle", { cx: "12", cy: "11", r: "2", strokeWidth: "2" }),
            h("circle", { cx: "20", cy: "16", r: "2", strokeWidth: "2" })
          ),
          h(
            "span",
            { className: "moneybag-calc-toggle-text" },
            isCustomMode ? "Quick Mode" : "Custom Mode"
          )
        )
      ),

      h(
        "div",
        { className: "moneybag-calc-comparison-row" },
        h(
          "div",
          { className: "moneybag-calc-comparison-card" },
          h(
            "div",
            { className: "moneybag-calc-card-header" },
            "Your current avg fee"
          ),
          h(
            "div",
            { className: "moneybag-calc-card-value", id: "competitor-fee" },
            `${(calculations.competitorAvgFee || 0).toFixed(2)}%`
          )
        ),
        h(
          "div",
          { className: "moneybag-calc-comparison-card moneybag-calc-moneybag" },
          h("div", { className: "moneybag-calc-badge" }, "LOWEST RATES"),
          h(
            "div",
            { className: "moneybag-calc-logo" },
            h(
              "svg",
              {
                className: "moneybag-calc-logo-icon",
                xmlns: "http://www.w3.org/2000/svg",
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              h("path", {
                d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
              }),
              h("path", { d: "m15 9-6 6" }),
              h("path", { d: "M9 9h.01" }),
              h("path", { d: "M15 15h.01" })
            ),
            " Moneybag avg fee"
          ),
          h(
            "div",
            {
              className: "moneybag-calc-card-value moneybag-calc-primary",
              id: "moneybag-fee",
            },
            `${(calculations.moneybagAvgFee || 0).toFixed(2)}%`
          ),
          h(
            "div",
            { className: "moneybag-calc-guarantee-text" },
            "Guaranteed lowest in Bangladesh"
          )
        ),
        h(
          "div",
          { className: "moneybag-calc-comparison-card moneybag-calc-savings" },
          h(
            "div",
            { className: "moneybag-calc-card-header" },
            h(
              "svg",
              {
                className: "moneybag-calc-check-icon",
                xmlns: "http://www.w3.org/2000/svg",
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "#10b981",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              h("path", { d: "M16 17h6v-6" }),
              h("path", { d: "m22 17-8.5-8.5-5 5L2 7" })
            ),
            " You save"
          ),
          h(
            "div",
            {
              className: "moneybag-calc-card-value moneybag-calc-success",
              id: "difference",
            },
            `${(calculations.difference || 0).toFixed(2)}%`
          )
        )
      ),

      isCustomMode &&
        h(
          "div",
          {
            id: "custom-mode-section",
            className: "moneybag-calc-custom-mode-section",
          },
          h(
            "div",
            { className: "moneybag-calc-custom-header" },
            h(
              "h3",
              { className: "moneybag-calc-table-title" },
              "Custom Payment Mix"
            ),

            h(
              "div",
              { className: "moneybag-calc-show-more-container" },
              h(
                "button",
                {
                  className: "moneybag-calc-show-more-btn",
                  onClick: () => setShowAllMethods(!showAllMethods),
                },
                h(
                  "span",
                  { className: "moneybag-calc-toggle-text" },
                  showAllMethods ? "Show Less Methods" : "Show More Methods"
                ),
                h(
                  "svg",
                  {
                    className: "moneybag-calc-expand-icon",
                    width: "12",
                    height: "12",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2.5",
                    style: {
                      transform: showAllMethods
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    },
                  },
                  h("path", { d: "M6 9l6 6 6-6" })
                )
              )
            )
          ),

          h(
            "div",
            { className: "moneybag-calc-method-grid" },
            paymentMethods
              .filter((method) => showAllMethods || method.default)
              .map((method) => {
                const methodVolume =
                  (monthlyVolume * paymentMix[method.id]) / 100;

                let compRate = 0;
                let mbRate = 0;

                const currentMoneybagRates =
                  getCategoryBasedRates(businessCategory);
                const generatedCompetitorRates =
                  generateCompetitorRates(businessCategory);
                const fallbackRate =
                  businessCategory === "Digital Service Platform" ? 13 : 2.6;

                // Use generated competitor rates, not the editable ones
                if (method.id === "visa") {
                  compRate = generatedCompetitorRates.visa || 2.6;
                  mbRate = parseRate(currentMoneybagRates.visa) || 2.3;
                } else if (method.id === "mastercard") {
                  compRate = generatedCompetitorRates.mastercard || 2.6;
                  mbRate = parseRate(currentMoneybagRates.mastercard) || 2.3;
                } else if (method.id === "american_express") {
                  compRate = generatedCompetitorRates.american_express || 3.8;
                  mbRate =
                    parseRate(currentMoneybagRates.american_express) || 3.5;
                } else if (method.id === "diners_club") {
                  compRate = generatedCompetitorRates.diners_club || 2.8;
                  mbRate = parseRate(currentMoneybagRates.diners_club) || 2.5;
                } else if (method.id === "unionpay") {
                  compRate = generatedCompetitorRates.unionpay || 2.8;
                  mbRate = parseRate(currentMoneybagRates.unionpay) || 2.5;
                } else if (method.id === "dbbl_nexus") {
                  compRate = generatedCompetitorRates.dbbl_nexus || 2.5;
                  mbRate = parseRate(currentMoneybagRates.dbbl_nexus) || 2.2;
                } else if (method.id === "bkash") {
                  compRate = generatedCompetitorRates.bkash || 2.6;
                  mbRate = parseRate(currentMoneybagRates.bkash) || 1.95;
                } else if (method.id === "nagad") {
                  compRate = generatedCompetitorRates.nagad || 2.1;
                  mbRate = parseRate(currentMoneybagRates.nagad) || 1.8;
                } else if (method.id === "rocket") {
                  compRate = generatedCompetitorRates.rocket || 2.3;
                  mbRate = parseRate(currentMoneybagRates.rocket) || 2.0;
                } else if (method.id === "upay") {
                  compRate = generatedCompetitorRates.upay || 2.0;
                  mbRate = parseRate(currentMoneybagRates.upay) || 1.7;
                }

                const competitorCost = (methodVolume * compRate) / 100;
                const moneybagCost = (methodVolume * mbRate) / 100;
                const savings = competitorCost - moneybagCost;

                return h(
                  "div",
                  { className: "moneybag-calc-method-row", key: method.id },
                  h(
                    "div",
                    { className: "moneybag-calc-method-logo" },
                    h("img", {
                      src: MONEYBAG_PLUGIN_URL + "assets/image/" + method.logo,
                      alt: method.name,
                      className: "moneybag-calc-payment-logo",
                    })
                  ),
                  h(
                    "div",
                    { className: "moneybag-calc-method-cells" },
                    h(
                      "div",
                      { className: "moneybag-calc-cell-group" },
                      h(
                        "div",
                        { className: "moneybag-calc-cell-label" },
                        "Payment Mix (%)"
                      ),
                      h(
                        "div",
                        { className: "moneybag-calc-cell-box" },
                        h("input", {
                          type: "number",
                          value: paymentMix[method.id],
                          min: 0,
                          max: 100,
                          className: `moneybag-calc-method-input ${
                            errors[`${method.id}_individual`] ? "error" : ""
                          }`,
                          onChange: (e) =>
                            handlePaymentMixChange(method.id, e.target.value),
                        })
                      ),
                      errors[`${method.id}_individual`] &&
                        h(
                          "div",
                          { className: "moneybag-calc-input-error-inline" },
                          errors[`${method.id}_individual`]
                        )
                    ),
                    h(
                      "div",
                      { className: "moneybag-calc-cell-group" },
                      h(
                        "div",
                        { className: "moneybag-calc-cell-label" },
                        "Your Rate (%)"
                      ),
                      h(
                        "div",
                        { className: "moneybag-calc-cell-box" },
                        h("input", {
                          type: "number",
                          value: compRate.toFixed(2),
                          min: 0,
                          max: 100,
                          step: 0.01,
                          className: "moneybag-calc-method-input",
                          onChange: (e) =>
                            handleCompetitorRateChange(
                              method.id,
                              e.target.value
                            ),
                        })
                      )
                    ),
                    h(
                      "div",
                      { className: "moneybag-calc-cell-group" },
                      h(
                        "div",
                        { className: "moneybag-calc-cell-label" },
                        "Moneybag Rate"
                      ),
                      h(
                        "div",
                        {
                          className:
                            "moneybag-calc-cell-box moneybag-calc-readonly-box",
                        },
                        h(
                          "div",
                          { className: "moneybag-calc-cell-value" },
                          `${mbRate.toFixed(2)}%`
                        )
                      )
                    ),
                    h(
                      "div",
                      { className: "moneybag-calc-cell-group" },
                      h(
                        "div",
                        { className: "moneybag-calc-cell-label" },
                        "Savings"
                      ),
                      h(
                        "div",
                        {
                          className: `moneybag-calc-cell-box moneybag-calc-savings-box ${
                            (savings || 0) < 0 ? "negative" : ""
                          }`,
                        },
                        h(
                          "div",
                          {
                            className: `moneybag-calc-cell-value ${
                              (savings || 0) < 0 ? "negative" : ""
                            }`,
                          },
                          formatNumber(Math.round(savings || 0))
                        )
                      )
                    )
                  )
                );
              }),

            h(
              "div",
              { className: "moneybag-calc-method-row moneybag-calc-total-row" },
              h("div", { className: "moneybag-calc-method-name" }, "Total"),
              h(
                "div",
                { className: "moneybag-calc-method-cells" },
                h(
                  "div",
                  { className: "moneybag-calc-cell-group" },
                  h(
                    "div",
                    {
                      className:
                        "moneybag-calc-cell-box moneybag-calc-total-box",
                    },
                    h("div", { className: "moneybag-calc-cell-value" }, "100%")
                  )
                ),
                h(
                  "div",
                  { className: "moneybag-calc-cell-group" },
                  h(
                    "div",
                    {
                      className:
                        "moneybag-calc-cell-box moneybag-calc-total-box",
                    },
                    h(
                      "div",
                      { className: "moneybag-calc-cell-value" },
                      (calculations.competitorAvgFee || 0).toFixed(2)
                    )
                  )
                ),
                h(
                  "div",
                  { className: "moneybag-calc-cell-group" },
                  h(
                    "div",
                    {
                      className:
                        "moneybag-calc-cell-box moneybag-calc-total-box",
                    },
                    h(
                      "div",
                      { className: "moneybag-calc-cell-value" },
                      (calculations.moneybagAvgFee || 0).toFixed(2)
                    )
                  )
                ),
                h(
                  "div",
                  { className: "moneybag-calc-cell-group" },
                  h(
                    "div",
                    {
                      className: `moneybag-calc-cell-box moneybag-calc-total-savings-box ${
                        (calculations.monthlySavings || 0) < 0 ? "negative" : ""
                      }`,
                    },
                    h(
                      "div",
                      {
                        className: `moneybag-calc-cell-value ${
                          (calculations.monthlySavings || 0) < 0
                            ? "negative"
                            : ""
                        }`,
                      },
                      formatNumber(Math.round(calculations.monthlySavings || 0))
                    )
                  )
                )
              )
            )
          ),

          errors.paymentMixGlobal &&
            h(
              "div",
              { className: "moneybag-calc-payment-mix-status-container" },
              h(
                "div",
                {
                  className:
                    "moneybag-calc-status-message moneybag-calc-payment-mix-status",
                },
                errors.paymentMixGlobal
              )
            )
        ),

      h(
        "div",
        { className: "moneybag-calc-cta-section" },
        h(
          "h2",
          { className: "moneybag-calc-cta-title" },
          "Ready to Start Saving?"
        ),
        h(
          "p",
          { className: "moneybag-calc-cta-subtitle" },
          "Join hundreds of businesses across Bangladesh who are already saving thousands with Moneybag's industry-leading rates."
        ),

        h(
          "div",
          { className: "moneybag-calc-cta-content" },
          h(
            "div",
            { className: "moneybag-calc-cta-features" },
            h(
              "div",
              { className: "moneybag-calc-feature-item" },
              h(
                "svg",
                {
                  className: "moneybag-calc-feature-check",
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "24",
                  height: "24",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "#10b981",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                },
                h("path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }),
                h("path", { d: "m9 11 3 3L22 4" })
              ),
              h(
                "span",
                { className: "moneybag-calc-feature-text" },
                "Lowest transaction rates guaranteed in Bangladesh"
              )
            ),
            h(
              "div",
              { className: "moneybag-calc-feature-item" },
              h(
                "svg",
                {
                  className: "moneybag-calc-feature-check",
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "24",
                  height: "24",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "#10b981",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                },
                h("path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }),
                h("path", { d: "m9 11 3 3L22 4" })
              ),
              h(
                "span",
                { className: "moneybag-calc-feature-text" },
                "Easy integration with any website or app"
              )
            ),
            h(
              "div",
              { className: "moneybag-calc-feature-item" },
              h(
                "svg",
                {
                  className: "moneybag-calc-feature-check",
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "24",
                  height: "24",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "#10b981",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                },
                h("path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }),
                h("path", { d: "m9 11 3 3L22 4" })
              ),
              h(
                "span",
                { className: "moneybag-calc-feature-text" },
                "24/7 local support team based in Dhaka"
              )
            )
          ),

          h(
            "div",
            { className: "moneybag-calc-cta-promo-card" },
            h("img", {
              src:
                MONEYBAG_PLUGIN_URL +
                "assets/image/lowest-transaction-rate.webp",
              alt: "Moneybag Promotion",
              className: "moneybag-calc-promo-image",
            })
          )
        ),

        h(
          "div",
          { className: "moneybag-calc-cta-bottom-buttons" },
          h(
            "button",
            { className: "moneybag-calc-btn-call-now", onClick: handleCallNow },
            h("span", { className: "moneybag-calc-call-icon" }, "☎"),
            " Call +880 1958 109 228"
          ),
          h(
            "button",
            {
              className: "moneybag-calc-btn-try-sandbox",
              onClick: handleJoinAsMerchant,
            },
            "Join As a Merchant ",
            h("span", { className: "moneybag-calc-sandbox-arrow" }, "→")
          )
        )
      )
    );
  }

  function initCalculators() {
    const containers = document.querySelectorAll(
      '[id^="price-comparison-calculator-"]'
    );

    containers.forEach((container) => {
      const widgetId = container.id.replace("price-comparison-calculator-", "");
      const config =
        window.MoneybagPriceCalculatorConfig &&
        window.MoneybagPriceCalculatorConfig[widgetId];

      if (config) {
        const parsedConfig =
          typeof config === "string" ? JSON.parse(config) : config;
        wp.element.render(
          h(PriceComparisonCalculator, { config: parsedConfig }),
          container
        );
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalculators);
  } else {
    initCalculators();
  }

  if (window.elementor) {
    window.elementor.hooks.addAction(
      "panel/open_editor/widget/moneybag-price-comparison-calculator",
      initCalculators
    );
    jQuery(window).on("elementor/frontend/init", initCalculators);
  }
})();
