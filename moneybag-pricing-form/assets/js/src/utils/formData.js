export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone.replace(/\s/g, ""));
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const calculateEstimatedPrice = (formData) => {
  let basePrice = 5000;

  // Adjust based on project type
  const projectTypeMultipliers = {
    website: 1,
    ecommerce: 2,
    webapp: 3,
    mobile: 2.5,
    redesign: 0.7,
    other: 1.5,
  };

  // Adjust based on budget range
  const budgetMultipliers = {
    "under-5k": 0.8,
    "5k-10k": 1,
    "10k-25k": 1.5,
    "25k-50k": 2.5,
    "over-50k": 4,
  };

  // Adjust based on timeline
  const timelineMultipliers = {
    asap: 1.2,
    "1-month": 1.1,
    "2-3-months": 1,
    "3-6-months": 0.95,
    flexible: 0.9,
  };

  const projectType = formData.step1?.projectType;
  const budget = formData.step1?.budget;
  const timeline = formData.step2?.timeline;
  const features = formData.step2?.features || [];

  if (projectType) {
    basePrice *= projectTypeMultipliers[projectType] || 1;
  }

  if (budget) {
    basePrice *= budgetMultipliers[budget] || 1;
  }

  if (timeline) {
    basePrice *= timelineMultipliers[timeline] || 1;
  }

  // Add feature costs
  basePrice += features.length * 500;

  return Math.round(basePrice);
};
