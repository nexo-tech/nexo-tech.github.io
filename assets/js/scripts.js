import "./anchor-scroll.js";
import { loadTechStack } from "./tech-stack.js";
import { smoothScrollTo } from "./scroll-utils.js";
import { addDotBg } from "./dot-matrix-animation.js";
import { doHeroAnimations } from "./hero-animations.js";

// Scramble text
function wrapTextNodes(el) {
  const frag = document.createDocumentFragment();
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const span = document.createElement("span");
      span.className = "text-scramble";
      span.textContent = node.textContent;
      frag.appendChild(span);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const span = document.createElement("span");
      span.className = "font-bold";
      span.textContent = node.textContent;
      frag.appendChild(span);
    }
  });
  el.innerHTML = "";
  el.appendChild(frag);
}

function setupTypewriter(el) {
  const full = el.textContent.trim(); // grab full text
  el.textContent = ""; // clear it
  gsap.to(el, {
    scrollTrigger: {
      trigger: el,
      start: "top 80%", // fire when it scrolls into view
      end: "top 0%", // when to reverse
      toggleActions: "play reverse restart reverse", // play on enter, reverse on leave
    },
    duration: full.length * 0.025, // ~50ms per char
    text: full, // type to this
    ease: "none",
  });
}

function moreScrollTriggers() {
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    // Content parallax effect (slower)
    gsap.to("#collaborate", {
      scrollTrigger: {
        trigger: "#collaborate",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
      y: "-400px",
      ease: "none",
    });

    {
      const el = document.querySelector(".typewriter-big");
      const full = el.textContent.trim(); // grab full text
      el.textContent = ""; // clear it
      gsap.to(el, {
        scrollTrigger: {
          trigger: document.getElementById("collaborate-wrapper"),
          start: "top 40%", // fire when it scrolls into view
          toggleActions: "play reverse restart reverse", // play on enter, reverse on leave
        },
        duration: full.length * 0.025, // ~50ms per char
        text: full, // type to this
        ease: "none",
      });
    }

    // Create a GSAP ScrollTrigger for the header color change
    ScrollTrigger.create({
      trigger: document.getElementById("collaborate-wrapper"), //".bg-blue-600",
      start: "top 200px", // When the top of the blue section reaches 10% from the top
      end: "bottom 10%", // When the bottom of the blue section reaches 10% from the top
      onEnter: () => {
        const header = document.getElementById("header-wrapper");
        header.classList.add("in-blue-section");
      },
      onLeave: () => {
        const header = document.getElementById("header-wrapper");
        header.classList.remove("in-blue-section");
      },
      onEnterBack: () => {
        const header = document.getElementById("header-wrapper");
        header.classList.add("in-blue-section");
      },
      onLeaveBack: () => {
        const header = document.getElementById("header-wrapper");
        header.classList.remove("in-blue-section");
      },
    });

    const nameParts = document.querySelectorAll(".name-slide");

    gsap.fromTo(
      nameParts,
      {
        x: "120%",
        opacity: 0,
      },
      {
        scrollTrigger: {
          trigger: ".name-slide-container",
          start: "top 80%",
          end: "top 40%",
          scrub: 1,
          toggleActions: "play none none reverse",
        },
        x: "0%",
        opacity: 1,
        stagger: 0.1,
        ease: "power2.out",
      }
    );

    gsap.fromTo(
      ".intro-parallax-text",
      { y: "-20%" },
      {
        scrollTrigger: {
          trigger: ".intro-parallax-text",
          start: "top 40%",
          end: "bottom 80%",
          scrub: 1,
        },
        y: "0%", // Moves slower than scroll
        ease: "none",
      }
    );
  }
}

function runFooterAnimations() {
  const hero = document.getElementById("hero");
  const afterFooter = document.getElementById("after-footer");
  afterFooter.style.height = (hero ? 250 : 50) + "px";

  // Only run if GSAP and ScrollTrigger are loaded
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    // Parallax effect for the footer
    gsap.to(".footer-reveal", {
      scrollTrigger: {
        trigger: ".footer-reveal",
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
      },
      y: hero ? -250 : -50,
      ease: "none",
    });

    // Slide in the brand and social icons from right to left
    gsap.fromTo(
      ".brand-reveal .flex",
      {
        x: hero ? undefined : "150px", // Start position (off-screen to the right)
        opacity: 0,
      },
      {
        scrollTrigger: {
          trigger: ".brand-container",
          start: "top 90%",
          end: "bottom bottom",
          toggleActions: "play none none none",
          scrub: 0.6,
        },
        x: hero ? undefined : "0px", // End position (centered)
        opacity: 1,
        duration: 1,
        ease: "power2.out",
      }
    );
  }

  // Update Kyiv time
  function updateKyivTime() {
    const options = {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    };
    const now = new Date();
    const kyivTime = now.toLocaleTimeString("en-US", options);
    document.querySelector(".kyiv-time").textContent = ` ${kyivTime}`;
  }

  // Update time immediately and then every minute
  updateKyivTime();
  setInterval(updateKyivTime, 60000);

  const copyButtons = document.querySelectorAll(".code-copy button");

  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const copyContainer = this.closest(".code-copy");
      const textArea = copyContainer.querySelector("textarea");
      const notification = copyContainer.querySelector(".code-copied");

      // Copy text to clipboard
      navigator.clipboard
        .writeText(textArea.value)
        .then(() => {
          // Show notification
          notification.style.opacity = "1";

          // Hide notification after 1.5 seconds
          setTimeout(() => {
            notification.style.opacity = "0";
          }, 1500);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    });
  });

  // Back to top functionality
  const backToTopButton = document.querySelector(".back-to-top");
  if (backToTopButton) {
    backToTopButton.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
}

// Services section animations
function initServicesAnimations() {
  const el = document.querySelector(".services-header h2");
  if (!el) {
    return;
  }
  // Animate section header
  gsap.to(".services-header h2", {
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".services-header",
      start: "top 80%",
    },
  });

  // Animate tagline
  gsap.to(".services-tagline p", {
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".services-tagline",
      start: "top 80%",
    },
  });

  // Animate service cards
  gsap.to(".service-card", {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".service-card",
      start: "top 85%",
    },
  });
}

// Navigation highlight
function initNavHighlight() {
  const sections = document.querySelectorAll("section");
  const navItems = document.querySelectorAll(".nav-item");

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (pageYOffset >= sectionTop - 300) {
        current = section.getAttribute("id");
      }
    });

    navItems.forEach((item) => {
      item.classList.remove("active");
      if (item.getAttribute("href").includes(current)) {
        item.classList.add("active");
      }
    });
  });
}

// Animate About Me section numbers
function animateAboutMeNumbers() {
  const numbers = document.querySelectorAll(".number-slide");
  const values = document.querySelectorAll(".values-section");
  numbers.forEach((number, index) => {
    // Set initial position (below the border)
    gsap.set(number, { y: "110%" });

    // Create ScrollTrigger for each number
    ScrollTrigger.create({
      trigger: values,
      start: "top 80%",
      onEnter: () => {
        gsap.to(number, {
          y: "0%",
          duration: 1.2,
          ease: "power2.out",
          delay: index * 0.1, // Stagger the animations
        });
      },
      onLeaveBack: () => {
        gsap.to(number, {
          y: "110%",
          duration: 0.5,
          ease: "power2.in",
        });
      },
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  runFooterAnimations();
  moreScrollTriggers();

  const introductionName = document.querySelector("#introduction-name");
  if (introductionName) {
    addDotBg(introductionName, {
      animationSpeed: 1,
      dotSize: 1.5,
      colors: [[255, 255, 255]],
      opacities: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
    });
  }

  document.querySelectorAll(".typewriter").forEach(setupTypewriter);
  document.querySelectorAll(".scrambled-text").forEach(wrapTextNodes);
  // Register GSAP plugins
  gsap.registerPlugin(TextPlugin, ScrollTrigger);

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", async function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (!targetElement) {
        return;
      }

      await smoothScrollTo(targetElement);
    });
  });

  // Dark mode transition and reveal animation
  const body = document.body;
  const introductionSection = document.querySelector("#introduction");

  // Header scroll handling
  const header = document.querySelector("header");
  if (header && introductionSection) {
    window.addEventListener("scroll", () => {
      const scrollPosition = window.scrollY;
      const introductionTop = introductionSection.offsetTop;

      if (scrollPosition >= introductionTop - 100) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }

  if (introductionSection) {
    // Create a ScrollTrigger for the introduction section
    gsap.to(body, {
      scrollTrigger: {
        trigger: introductionSection,
        start: "top 60%",
        end: "top 20%",
        onEnter: () => {
          body.classList.add("dark-mode");
          // Animate the introduction content
          gsap.to(".introduction-reveal", {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            stagger: 0.2,
          });
        },
        onLeaveBack: () => {
          body.classList.remove("dark-mode");
          gsap.to(".introduction-reveal", {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: "power3.in",
          });
        },
      },
    });
  }

  const sep = document.querySelector(".service-separator");
  if (sep) {
    // Animate service separators
    gsap.utils.toArray(".service-separator").forEach((separator, index) => {
      const line = separator.querySelector(".separator-line");
      gsap.fromTo(
        line,
        { width: "0%" },
        {
          width: "100%",
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: separator,
            start: "top 80%",
            end: "top 20%",
            scrub: 1,
          },
        }
      );
    });
  }

  // hero section need to have body with orange mode
  const heroSection = document.querySelector("#hero");
  if (heroSection) {
    gsap.to(body, {
      scrollTrigger: {
        trigger: heroSection,
        start: "top 100%",
        end: "top 20%",
        onEnter: () => {
          body.classList.add("orange-mode");
        },
        onLeaveBack: () => {
          body.classList.remove("orange-mode");
        },
      },
    });
  }

  const techStackSection = document.querySelector("#tech-stack");
  if (techStackSection) {
    gsap.to(body, {
      scrollTrigger: {
        trigger: techStackSection,
        start: "top 60%",
        end: "top 20%",
        onEnter: () => {
          body.classList.remove("dark-mode");
          // Animate the introduction content
          gsap.to(".tech-stack-reveal", {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            stagger: 0.2,
          });
        },
        onLeaveBack: () => {
          body.classList.add("dark-mode");
          gsap.to(".tech-stack-reveal", {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: "power3.in",
          });
        },
      },
    });
  }

  const aboutMeReveal = document.querySelector(".about-me-reveal");
  if (aboutMeReveal) {
    // Animate about me section
    gsap.from(".about-me-reveal", {
      opacity: 0,
      y: 50,
      duration: 1,
      scrollTrigger: {
        trigger: ".about-me-reveal",
        start: "top 80%",
        end: "top 20%",
        scrub: 1,
      },
    });
  }

  doHeroAnimations();
  // Initialize animations after page load
  initServicesAnimations();
  initNavHighlight();
  loadTechStack();
  animateAboutMeNumbers();
});
