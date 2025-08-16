# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal website/blog built with Hugo, styled with Tailwind CSS v4, and animated with GSAP. The site is deployed to GitHub Pages and showcases technical writings, services, and portfolio work.

## Tech Stack

- **Static Site Generator**: Hugo (extended version 0.145.0+)
- **CSS Framework**: Tailwind CSS v4 (via @tailwindcss/cli)
- **JavaScript Runtime**: Bun
- **Animations**: GSAP with ScrollTrigger and TextPlugin
- **Package Manager**: Bun (with Nix support)
- **Deployment**: GitHub Pages (automated via GitHub Actions)

## Development Commands

### Local Development
```bash
# Using Makefile (preferred)
make up                    # Start Hugo dev server with drafts

# Using Nix environment
nix develop               # Enters dev shell with Hugo and Bun
make up

# Manual commands
bun install              # Install dependencies
hugo server -D           # Start dev server with drafts
hugo server --buildDrafts # Alternative dev server command

# Remote development (for cloud environments)
make remote              # Binds to 0.0.0.0 for external access
```

### Build Commands
```bash
hugo --minify            # Production build with minification
hugo                     # Standard build
```

### Dependency Management
```bash
bun install              # Install/update JavaScript dependencies
```

## Architecture

### Content Structure
- **content/posts/**: Blog posts in Markdown with front matter
- **content/hypertweet/**: Static HTML pages for special projects
- **content/privacy-policy.md**: Site legal pages

### Templating System
- **layouts/_default/**: Base templates (baseof, single, list)
- **layouts/partials/**: Reusable components (header, footer, forms)
- **layouts/index.html**: Homepage template
- **layouts/posts/single.html**: Blog post template

### Asset Pipeline
- **assets/js/**: JavaScript modules using ES6 imports
  - Main entry point: `index.js` loads GSAP and initializes scripts
  - Component scripts: hero-animations, tech-stack, scroll-utils
- **assets/css/**: Tailwind CSS source files
  - Uses Tailwind v4 with CLI compilation
- **assets/scss/**: Additional SCSS styles

### Static Assets
- **static/images/**: Favicons and web manifest icons
- **static/lib/**: Vendor libraries (Font Awesome, Inter font)

## Configuration

### Main Config (hugo.toml)
- Site metadata and SEO settings
- Navigation structure in `params.header`
- Social links in `params.social`
- Services and timeline in `params.services` and `params.aboutMe`
- Google Analytics configured via `services.googleAnalytics`

### Deployment
- **Branch Strategy**: Push to `dev` branch triggers deployment
- **GitHub Actions**: `.github/workflows/static.yml` handles build and deploy
- **Cloudflare Pages**: Deploys to Cloudflare Pages using API token
- **Required Secrets**:
  - `CLOUDFLARE_API_TOKEN`: Cloudflare API token for deployment
  - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID
  - `CLOUDFLARE_PROJECT_NAME`: Cloudflare Pages project name
- **Custom Domain**: Configured in Cloudflare Pages dashboard

## Important Notes

### When Modifying JavaScript
- All JS files use ES6 modules with explicit imports
- GSAP is loaded as minified vendor files in assets/js/gsap/
- Main bundle entry point is assets/js/index.js

### When Adding Content
- Blog posts go in content/posts/ as Markdown files
- Use Hugo front matter for metadata
- Images for posts should be co-located in the same directory

### Styling Approach
- Tailwind CSS v4 is used (newer syntax)
- Custom styles in assets/css/ and assets/scss/
- Dark mode is supported throughout the site

### Build Considerations
- Hugo extended version required for SCSS processing
- Bun is used for JavaScript dependency management
- Site uses hugo_stats.json for Tailwind CSS purging