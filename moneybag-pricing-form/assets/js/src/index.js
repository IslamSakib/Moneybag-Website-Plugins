import React from "react";
import ReactDOM from "react-dom";
import PricingForm from "./components/PricingForm";
import "./styles/form.scss";

// Create the MoneyBag object
const MoneyBagPricingForm = {
  init: function (containerId, settings) {
    console.log("MoneyBagPricingForm.init called with:", containerId, settings);

    const container = document.getElementById(containerId);
    if (container) {
      console.log("Container found, rendering React component");
      ReactDOM.render(
        React.createElement(PricingForm, { settings: settings }),
        container
      );
    } else {
      console.error("Container not found:", containerId);
    }
  },
};

// IMPORTANT: Set global object immediately
window.MoneyBagPricingForm = MoneyBagPricingForm;

console.log(
  "Global MoneyBagPricingForm set:",
  typeof window.MoneyBagPricingForm
);
console.log("Init function available:", typeof window.MoneyBagPricingForm.init);

// For webpack compatibility - don't use default export
module.exports = MoneyBagPricingForm;
