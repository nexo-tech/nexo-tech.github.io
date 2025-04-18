document.addEventListener("DOMContentLoaded", function () {
  // Register GSAP plugins
  gsap.registerPlugin(TextPlugin, ScrollTrigger);

  // Header scroll handling
  const header = document.querySelector("header");

  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY;
    const introductionTop = introductionSection.offsetTop;

    if (scrollPosition >= introductionTop - 100) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

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
        text: "Built MVPs. ",
        ease: "none",
      },
      "+=0.5"
    )

    // Second line (now part of first line)
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
    .call(startSidebarAnimation);

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

  function startSidebarAnimation() {
    // First make the sidebar visible
    gsap.to("#sidebar-text", { opacity: 1, duration: 0.5 });

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

  // Services section animations
  function initServicesAnimations() {
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

    // Animate tech stack items
    gsap.to(".tech-item", {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".tech-item",
        start: "top 90%",
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

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: "smooth",
      });
    });
  });

  // Load and render tech stack
  async function loadTechStack() {
    // Perlin Noise implementation
    class PerlinNoise {
      constructor() {
        this.p = new Array(512);
        this.permutation = [
          151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
          140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
          247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
          57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68,
          175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111,
          229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
          102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
          89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109,
          198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147,
          118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182,
          189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70,
          221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108,
          110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251,
          34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235,
          249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204,
          176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114,
          67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
        ];

        for (let i = 0; i < 256; i++) {
          this.p[i] = this.permutation[i];
          this.p[256 + i] = this.permutation[i];
        }
      }

      noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;
        const AA = this.p[A] + Z;
        const BA = this.p[B] + Z;
        const AB = this.p[A + 1] + Z;
        const BB = this.p[B + 1] + Z;

        return this.lerp(
          w,
          this.lerp(
            v,
            this.lerp(
              u,
              this.grad(this.p[AA], x, y, z),
              this.grad(this.p[BA], x - 1, y, z)
            ),
            this.lerp(
              u,
              this.grad(this.p[AB], x, y - 1, z),
              this.grad(this.p[BB], x - 1, y - 1, z)
            )
          ),
          this.lerp(
            v,
            this.lerp(
              u,
              this.grad(this.p[AA + 1], x, y, z - 1),
              this.grad(this.p[BA + 1], x - 1, y, z - 1)
            ),
            this.lerp(
              u,
              this.grad(this.p[AB + 1], x, y - 1, z - 1),
              this.grad(this.p[BB + 1], x - 1, y - 1, z - 1)
            )
          )
        );
      }

      fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
      }
      lerp(t, a, b) {
        return a + t * (b - a);
      }
      grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
      }
    }

    // Animation state
    let noise = new PerlinNoise();
    let time = 0;
    let animationFrameId;

    const mousePos = { x: 0, y: 0, isInsideRect: false };
    document.addEventListener("mousemove", (e) => {
      document.querySelectorAll("#tech-grid").forEach((item) => {
        // set mousePos X Y coordinates that are relative to the item from the global x,y coordinates
        // make sure scroll is taken into account
        const rect = item.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
        mousePos.isInsideRect =
          mousePos.x > 0 &&
          mousePos.x < rect.width &&
          mousePos.y > 0 &&
          mousePos.y < rect.height;
        mousePos.y += 100;
      });
    });
    function animateTechStack() {
      const items = document.querySelectorAll(".tech-item");

      items.forEach((item, index) => {
        // Different noise inputs for each item
        time += 1 * 0.0005;

        const x = (index % 24) - time / 2;
        const y = index / 24 + time;

        // Get noise value (-1 to 1)
        let noiseValue = noise.noise(x * 0.1, y * 0.1, 0);

        // Clamp and increase contrast
        noiseValue = Math.max(0, Math.min(0.7, noiseValue)); // Clamp between -1 and 1
        noiseValue = Math.pow(noiseValue * 4 + 0.1, 2); // Increase contrast by cubing the value

        // create proximity map to mousePos
        const proximity = Math.sqrt(
          (mousePos.x - item.offsetLeft) ** 2 +
            (mousePos.y - item.offsetTop) ** 2
        );

        // scale proximity to 0-1
        const proximityScale =
          1 - Math.max(0, Math.min(1, Math.pow(proximity / 120, 5)));

        // console.log(proximity, mousePos);

        // Clamp between 0 and 1
        let scale = Math.max(0, Math.min(1, noiseValue));

        // apply proximity to scale using max 1
        scale = mousePos.isInsideRect
          ? Math.max(scale * 0.5, proximityScale)
          : scale;

        // Apply scale transform
        item.style.transform = `translateY(10px) scale(${scale})`;
      });

      animationFrameId = requestAnimationFrame(animateTechStack);
    }

    animateTechStack();

    try {
      const response = await fetch("tech-stack.json");
      const data = await response.json();
      const techGrid = document.getElementById("tech-grid");

      // Combine all tech items
      const allTech = [
        ...data.primary.map((tech) => ({ tech, type: "primary" })),
        ...data.secondary.map((tech) => ({ tech, type: "secondary" })),
        ...data.tertiary.map((tech) => ({ tech, type: "tertiary" })),
      ];

      // Shuffle the array for a more organic look
      allTech.sort(() => Math.random() - 0.5);

      // Create and append tech items
      allTech.forEach(({ tech, type }) => {
        const div = document.createElement("div");
        div.className = `tech-item ${type}`;
        div.textContent = tech.toLowerCase();
        div.setAttribute("data-tech", tech.toLowerCase());
        techGrid.appendChild(div);
      });
    } catch (error) {
      console.error("Error loading tech stack:", error);
    }
  }

  // Dark mode transition and reveal animation
  const body = document.body;
  const introductionSection = document.querySelector("#introduction");
  const techStackSection = document.querySelector("#tech-stack");

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

  // Initialize animations after page load
  initServicesAnimations();
  initNavHighlight();
  loadTechStack();
});
