export async function smoothScrollTo(targetElement) {
  if (!targetElement) {
    return;
  }

  // Get the element's position accounting for transforms and dynamic content
  const getVisualOffset = (element) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return rect.top + scrollTop;
  };

  // Function to perform a single scroll step
  const scrollStep = async (targetPosition) => {
    return new Promise((resolve) => {
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });

      // Wait for scroll to complete
      const checkScroll = () => {
        const currentPosition =
          window.pageYOffset || document.documentElement.scrollTop;
        if (Math.abs(currentPosition - targetPosition) < 1) {
          resolve();
        } else {
          requestAnimationFrame(checkScroll);
        }
      };

      // Start checking after a short delay to allow smooth scroll to begin
      setTimeout(checkScroll, 100);
    });
  };

  // Get initial target position
  let targetPosition = getVisualOffset(targetElement);
  let lastPosition = -1;
  let attempts = 0;
  const maxAttempts = 10;

  // Keep scrolling until we reach the target or max attempts
  while (attempts < maxAttempts) {
    // Get current target position (may have changed due to parallax/animations)
    targetPosition = getVisualOffset(targetElement);

    // If we're close enough to the target, we're done
    if (Math.abs(window.pageYOffset - targetPosition) < 1) {
      break;
    }

    // If we're stuck at the same position, increment attempts
    if (Math.abs(lastPosition - targetPosition) < 1) {
      attempts++;
    }

    lastPosition = targetPosition;

    // Perform the scroll step
    await scrollStep(targetPosition);

    // Small delay to allow for any dynamic content updates
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
