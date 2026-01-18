# oleg pustovit — Personal Website

A fast, modern personal site powered by [Hugo](https://gohugo.io/), styled with [Tailwind CSS](https://tailwindcss.com/), and animated with [GSAP](https://greensock.com/gsap/). Built with performance, clarity, and a touch of unnecessary flair.

---

## 🔧 Features

### 🚀 **Modern Tech Stack**

- **Hugo** — Blazing-fast static site generator
- **Tailwind CSS** — Utility-first styling, clean and scalable
- **GSAP** — High-performance animation engine
- **Bun / Nix** — Because speed and reproducibility matter

### ✨ **Dynamic UI**

- Terminal-style typing animation
- Parallax scrolling + smooth scroll behavior
- Full dark mode support
- Animated tech stack visualization

### 📱 **Responsive by Default**

- Mobile-first layout approach
- Adaptive components across screen sizes
- Optimized build pipeline for performance-critical delivery

---

## ⚙️ Getting Started

### Prerequisites

#### Recommended (Nix)

- [Nix Package Manager](https://nixos.org/download.html)

#### Alternative

- [Hugo (extended)](https://gohugo.io/installation/)
- [Bun](https://bun.sh/)
- Git

---

### 🚀 Install & Run

#### Using Nix (Preferred)

```bash
git clone https://github.com/oleghq/website.git
cd website

nix develop
make up
```

#### Manual Setup

```bash
git clone https://github.com/oleghq/website.git
cd website

bun install
hugo server -D
```

Site runs locally at `http://localhost:1313` with hot reloading enabled.

---

## 📁 Project Structure

```
.
├── assets/         # JS, CSS, animations
├── content/        # Markdown content (posts, pages)
├── layouts/        # Hugo templates
│   ├── _default/   # Base templates
│   ├── partials/   # Reusable HTML components
│   └── shortcodes/ # Inline dynamic components
├── static/         # Public static files
└── themes/         # Hugo themes
```

---

## 🛠 Customization

### `hugo.toml`

Adjust global settings:

- Site metadata
- Navigation structure
- Social links
- Skills, services, and UI toggles

### Styling & Animations

- Extend Tailwind styles in `assets/css/`
- Modify or add custom GSAP scripts in `assets/js/`

---

## 🚢 Deployment

Site is auto-deployed via GitHub Pages on push to `main`. CI is configured for zero-click publishing.

---

## 🤝 Contributing

Feel like improving something? Fork away.

```bash
git checkout -b feature/my-feature
git commit -m "add my feature"
git push origin feature/my-feature
```

Then open a PR. Clear, concise, reviewed, merged.

---

## 📄 License

MIT — do what you want, just don't break the internet.

---

## 🧠 Acknowledgments

- [Hugo](https://gohugo.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [GSAP](https://greensock.com/gsap/)
- [Alpine.js](https://alpinejs.dev/)
- [Nix](https://nixos.org/) — seriously underrated
