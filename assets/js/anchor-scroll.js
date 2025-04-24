import { smoothScrollTo } from "./scroll-utils.js";
// Function to smoothly scroll to a target element
// Handle anchor links on page load
document.addEventListener("DOMContentLoaded", () => {
  // Only execute on home page
  if (window.location.pathname === "/" && window.location.hash) {
    const targetId = window.location.hash.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Small delay to ensure all content is loaded
      setTimeout(() => {
        smoothScrollTo(targetElement);
      }, 100);
    }
  }
});

// Handle anchor link clicks
document.addEventListener("click", (e) => {
  if (e.target.matches('a[href^="#"]')) {
    e.preventDefault();
    const href = e.target.getAttribute("href");
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      smoothScrollTo(targetElement);
      // Update URL without triggering a scroll
      history.pushState(null, "", href);
    }
  }
});
