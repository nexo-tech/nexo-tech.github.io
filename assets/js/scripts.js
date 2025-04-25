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
  const introductionName = document.querySelector("#introduction-name");
  if (introductionName) {
    addDotBg(introductionName, {
      animationSpeed: 1,
      dotSize: 1.5,
      colors: [
        [255, 255, 255],
        // [255, 92, 246],
      ],
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
