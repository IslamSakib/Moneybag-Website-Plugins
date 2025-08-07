import React from "react";
import { createRoot } from "react-dom/client";
import MultiStepFormApp from "./components/MultiStepFormApp";
import "./styles.css";

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  // Find all instances of the form on the page
  const containers = document.querySelectorAll("#msfm-root");

  containers.forEach((container) => {
    // Get data attributes from the container
    const formTitle = container.dataset.formTitle || "Get Your Sandbox Access";
    const successMessage =
      container.dataset.successMessage ||
      "Your sandbox account has been created successfully!";

    // Create React root and render the app
    const root = createRoot(container);
    root.render(
      <MultiStepFormApp formTitle={formTitle} successMessage={successMessage} />
    );
  });
});

// Also expose for use in Elementor editor
if (window.elementorFrontend) {
  window.elementorFrontend.hooks.addAction(
    "frontend/element_ready/multi-step-form.default",
    ($scope) => {
      const container = $scope[0].querySelector("#msfm-root");
      if (container) {
        const formTitle =
          container.dataset.formTitle || "Get Your Sandbox Access";
        const successMessage =
          container.dataset.successMessage ||
          "Your sandbox account has been created successfully!";

        const root = createRoot(container);
        root.render(
          <MultiStepFormApp
            formTitle={formTitle}
            successMessage={successMessage}
          />
        );
      }
    }
  );
}
