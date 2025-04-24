// Function to get the visual offset of an element
function getVisualOffset(element) {
  const rect = element.getBoundingClientRect();
  return window.scrollY + rect.top;
}

// Function to smoothly scroll to a target element
async function smoothScrollTo(targetElement) {
  if (!targetElement) {
    return;
  }

  // Try multiple times to account for any dynamic content or parallax effects
  for (let i = 0; i < 10; i++) {
    let targetPosition = getVisualOffset(targetElement);
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

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
