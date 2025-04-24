import "./anchor-scroll.js";
import { loadTechStack } from "./tech-stack.js";

// Text scramble effect
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = "!<>-_\\/[]{}—=+*^?#_abcdefghijklmnopqrstuvwxyz";
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => (this.resolve = resolve));
    this.queue = [];

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = "";
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];

      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="text-primary/70">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// document.querySelectorAll(".scrambled-text").forEach(wrapTextNodes);

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
      end: "top 20%", // when to reverse
      toggleActions: "play reverse restart reverse", // play on enter, reverse on leave
    },
    duration: full.length * 0.025, // ~50ms per char
    text: full, // type to this
    ease: "none",
  });
}

function startScrambledTextAnimation() {
  // First make the sidebar visible
  gsap.to(".scrambled-text", { opacity: 1, duration: 0.5 });

  // Get all scramble elements
  const elements = document.querySelectorAll(".text-scramble");
  const instances = Array.from(elements).map((el) => new TextScramble(el));

  // Animate all elements simultaneously
  instances.forEach((instance, index) => {
    const el = elements[index];
    const originalText = el.textContent;
    instance.setText(originalText);
  });
}

function doHeroAnimations() {
  const terminalLine1 = document.querySelector("#terminal-line1");
  if (!terminalLine1) {
    return;
  }
  // Set initial state for terminal animation
  gsap.set("#terminal-line1", { text: "", opacity: 1 });
  gsap.set("#terminal-line2", { text: "", opacity: 1 });
  gsap.set("#terminal-line3", { text: "", opacity: 1 });

  // Create a sequence with the typing animation
  const timeline = gsap.timeline({ delay: 0.5 });

  // First line with code-like symbols appearing before the actual text
  timeline
    .to("#terminal-line1", {
      duration: 0.1,
      text: "> _",
      ease: "none",
    })
    .to("#terminal-line1", {
      duration: 0.2,
      text: "> init.sequence()",
      ease: "none",
    })
    .to("#terminal-line1", {
      duration: 0.1,
      text: "> init.sequence() // success",
      ease: "none",
    })
    .to(
      "#terminal-line1",
      {
        duration: 0.5,
        text: "Built MVPs.",
        ease: "none",
      },
      "+=0.5"
    )

    // Second line
    .to(
      "#terminal-line2",
      {
        duration: 0.1,
        text: "> _",
        ease: "none",
      },
      "+=0.3"
    )
    .to("#terminal-line2", {
      duration: 0.2,
      text: "> team.lead()",
      ease: "none",
    })
    .to("#terminal-line2", {
      duration: 0.1,
      text: "> team.lead() // deployed",
      ease: "none",
    })
    .to(
      "#terminal-line2",
      {
        duration: 0.5,
        text: "Led teams.",
        ease: "none",
      },
      "+=0.5"
    )

    // Third line
    .to(
      "#terminal-line3",
      {
        duration: 0.1,
        text: "> _",
        ease: "none",
      },
      "+=0.3"
    )
    .to("#terminal-line3", {
      duration: 0.2,
      text: "> funding.crisis()",
      ease: "none",
    })
    .to("#terminal-line3", {
      duration: 0.1,
      text: "> funding.crisis() // resolved",
      ease: "none",
    })
    .to(
      "#terminal-line3",
      {
        duration: 0.7,
        text: "Survived funding drama.",
        ease: "none",
      },
      "+=0.5"
    )
    // After main animation completes, start the sidebar text animation
    .call(startScrambledTextAnimation);
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
  const numbers = document.querySelectorAll('.number-slide');
  
  numbers.forEach((number, index) => {
    // Set initial position (below the border)
    gsap.set(number, { y: '100%' });
    
    // Create ScrollTrigger for each number
    ScrollTrigger.create({
      trigger: number,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(number, {
          y: '0%',
          duration: 0.8,
          ease: 'power2.out',
          delay: index * 0.1 // Stagger the animations
        });
      },
      onLeaveBack: () => {
        gsap.to(number, {
          y: '100%',
          duration: 0.5,
          ease: 'power2.in'
        });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
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

      // Get the element's position accounting for transforms
      const getVisualOffset = (element) => {
        const rect = element.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        return rect.top + scrollTop;
      };

      for (let i = 0; i < 10; i++) {
        let targetPosition = getVisualOffset(targetElement);
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
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
