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
export function doHeroAnimations() {
  const terminalLine1 = document.querySelector("#terminal-line1");
  if (!terminalLine1) {
    return;
  }

  // Check if we've shown the long animation in the last 24 hours
  const lastAnimationTime = localStorage.getItem('lastHeroAnimation');
  const now = new Date().getTime();
  // 3 minutes
  const target = 3 * 60 * 1000;
  const shouldShowLongAnimation = !lastAnimationTime || (now - parseInt(lastAnimationTime)) > target;

  // Set initial state for terminal animation
  gsap.set("#terminal-line1", { text: "", opacity: 1 });
  gsap.set("#terminal-line2", { text: "", opacity: 1 });
  gsap.set("#terminal-line3", { text: "", opacity: 1 });

  if (shouldShowLongAnimation) {
    // Long animation sequence
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

    // Store the time of this animation
    localStorage.setItem('lastHeroAnimation', now.toString());
  } else {
    // Short animation sequence
    const timeline = gsap.timeline({ delay: 0.2 });

    // Show all lines immediately with a slight stagger
    timeline
      .to("#terminal-line1", {
        duration: 0.3,
        text: "Built MVPs.",
        ease: "none",
      })
      .to(
        "#terminal-line2",
        {
          duration: 0.3,
          text: "Led teams.",
          ease: "none",
        },
        "-=0.1"
      )
      .to(
        "#terminal-line3",
        {
          duration: 0.3,
          text: "Survived funding drama.",
          ease: "none",
        },
        "-=0.1"
      )
      .call(startScrambledTextAnimation);
  }
}
