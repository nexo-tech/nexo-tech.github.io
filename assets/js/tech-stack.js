// Load and render tech stack

// Perlin Noise implementation
class PerlinNoise {
  constructor() {
    this.p = new Array(512);
    this.permutation = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
      140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
      120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177,
      33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165,
      71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
      133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25,
      63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
      135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
      226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
      59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248,
      152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22,
      39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218,
      246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
      81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
      184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
      222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
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

export async function loadTechStack() {
  const techGrid = document.getElementById("tech-grid");
  const techHoverText = document.getElementById("tech-hover-text");
  if (!techGrid) {
    return;
  }
  // Animation state
  let noise = new PerlinNoise();
  let time = 0;
  let animationFrameId = null;
  let hoverTimeout = null;
  let currentHoveredItem = null;

  const mousePos = { x: 0, y: 0, isInsideRect: false };
  document.addEventListener("mousemove", (e) => {
    document.querySelectorAll("#tech-grid").forEach((item) => {
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
      if (!mousePos.isInsideRect) {
        time += 1 * 0.0005;
      }

      const x = (index % 24) - time / 2;
      const y = index / 24 + time;

      let noiseValue = noise.noise(x * 0.1, y * 0.1, 0);
      noiseValue = Math.max(0, Math.min(0.7, noiseValue));
      noiseValue = Math.pow(noiseValue * 4 + 0.1, 2);

      const proximity = Math.sqrt(
        (mousePos.x - item.offsetLeft) ** 2 + (mousePos.y - item.offsetTop) ** 2
      );

      const proximityScale =
        1 - Math.max(0, Math.min(1, Math.pow(proximity / 120, 5)));

      let scale = 1 - Math.max(0, Math.min(1, noiseValue));
      scale = mousePos.isInsideRect
        ? Math.max(scale * 0.5, proximityScale)
        : scale;

      item.style.transform = `translateY(10px) scale(${scale})`;
    });

    animationFrameId = requestAnimationFrame(animateTechStack);
  }

  // Create ScrollTrigger for tech stack animation
  ScrollTrigger.create({
    trigger: "#tech-grid",
    start: "top bottom",
    end: "bottom top",
    onEnter: () => {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animateTechStack);
      }
    },
    onLeave: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },
    onEnterBack: () => {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animateTechStack);
      }
    },
    onLeaveBack: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },
  });

  try {
    const data = JSON.parse(document.getElementById("skills-data").textContent);
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
      
      // Add hover events with debouncing
      div.addEventListener("mouseenter", () => {
        if (currentHoveredItem === div) return;
        currentHoveredItem = div;
        
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          gsap.to(techHoverText, {
            duration: 0.3,
            opacity: 1,
            text: `> ${tech.toLowerCase()}`,
            ease: "power2.out"
          });
        }, 50);
      });
      
      div.addEventListener("mouseleave", () => {
        if (currentHoveredItem !== div) return;
        currentHoveredItem = null;
        
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          gsap.to(techHoverText, {
            duration: 0.3,
            opacity: 0,
            text: "",
            ease: "power2.out"
          });
        }, 50);
      });
      
      techGrid.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading tech stack:", error);
  }

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
