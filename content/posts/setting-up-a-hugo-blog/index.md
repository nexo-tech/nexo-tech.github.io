---
date: 2025-04-06T04:14:54-08:00
draft: false
params:
  author: Oleg Pustovit
title: Deploying a Hugo Blog to GitHub Pages with Actions
weight: 10
tags:
  - hugo
  - github-pages
  - deployment
  - blogging
---

![Image title](frame.png)

After years of building software and writing technical documentation, I decided to create a blog to share my experience and help others on similar journeys. This article walks through how I set up my technical blog, aimed at those new to blogging or Hugo.

## Choosing the platform 

For me, it's important to have as minimal a solution as possible. While building my own Markdown-to-HTML publishing script is an idea for the future, my immediate priority was to get the blog online quickly.

Nowadays, I don't think there's a difficulty in creating a personal website. There is a wide variety of options that aid in this endeavor. I'll start with listing alternatives that come to my mind: 

- **CMS** (e.g. Wordpress, WordPress, Content Hub, Joomla, etc.): While platforms like WordPress are powerful, they felt excessive for a static content blog. I wanted something lightweight and flexible without being bound to a dynamic CMS stack.

- **Jekyll**: This software looks to be perfect and widely used by other developers to host blogs, but due to my lack of experience with Ruby, I chose not to use this.

- **Hugo**. Hugo is written in Go and uses the familiar syntax of Go templates (if you happen to code a lot in Go), while rendering pages in Markdown (similarly to Jekyll). 

- **11ty**, **Astro**, **Hexo**, and other Node.js-based alternatives. It's a matter of preference, but personally, I decided to minimize the usage of Node.js tooling. While there are many powerful tools, the Node.js ecosystem is notorious for rapidly changing, that often led me to not being able to run the old projects that naturally had many old dependencies.

## Setting up Hugo

I chose Hugo as my blogging platform. Having produced a substantial amount of documentation on my past software-related projects, I feel very confident using Markdown and a terminal-based text editor for my writing.

### Using a GitHub repository

Previously, I had already created a GitHub Pages website with placeholder files and connected a domain to it, so to populate files in an existing repo, you need to enter the following command:

```sh
hugo new site . --force
```

This will populate the current repository directory with files that are necessary to run the Hugo website. After that, it was necessary to set up the theme and other parameters in the `hugo.toml` file, and the site can run. After everything is set, it's possible to run the server by typing the command: `hugo server` 

### Running server in development mode

At this point, the website is available from `localhost`. Since I develop on a remote cloud VM, accessing the local Hugo server via `localhost` wasn't possible. It was necessary to safely expose the localhost instance to the outside world - for such needs, a reverse proxy is used. 

While load balancers and reverse proxies like Nginx are quite common and popular, I chose **Caddy** to serve my dev website because it sets up SSL certificates (via Let’s Encrypt) with no effort. Configuring **Caddy** is done with `Caddyfile`, where for the domain of interest you write a `reverse_proxy` statement with the necessary port:

```caddy
test-blog-domain.com {
	reverse_proxy localhost:1313
}
```

After starting caddy with the configuration above, the development website will be available from `https://test-blog-domain.com` (given that an `A` DNS record for `test-blog-domain.com` is filled with a public IP address of the VM).

### Adding a theme

Hugo has a number of free themes that are publicly available on GitHub. What is necessary to do to install one is to clone a repository with a theme and then update the `theme` parameter in `hugo.toml`. I chose a theme called [`cactus`](https://github.com/monkeyWzr/hugo-theme-cactus). After installation, I've got a build error complaining that Google Analytics async template is not found:

```sh
Error: error building site: render: failed to render pages: render of "/" failed: "/home/user/projects/nexo-tech.github.io/themes/cactus/layouts/_default/baseof.html:3:3": execute of template failed: template: index.html:3:3: executing "index.html" at <partial "head.html" .>: error calling partial: execute of template failed: html/template:partials/head.html:47:16: no such template "_internal/google_analytics_async.html"
make: *** [Makefile:2: up] Error
```

A fix for such an issue could be found on [`github`](https://github.com/monkeyWzr/hugo-theme-cactus/pull/152/commits/eb4a01644555170808da009285cd805719d34f4c). The Hugo community is active, and many issues — including this Google Analytics error — have existing patches or discussions on GitHub. 

After fixing other deprecation warnings, the site started working: 

![A front page of my blog is shown](frame2.png)

## Deploying a website to CDN: GitHub Pages

![Deployment diagram](d2.svg)

There are numerous ways to deploy a static website, and in most cases, it's required to have a hosting or server. Usually, those are not free or have a restricted plan; nevertheless, there are exceptions to this, like GitHub Pages. It's possible to serve a static content from a particular branch of a GitHub repository or use pre-built GitHub actions that are based on creating build artifacts and deploying them in a custom way. Knowing that, personal GitHub accounts are very limited on storage artifact space, and it's tedious to manage that storage space, I opted for the simpler solution where static website assets will be updated in a pre-defined git branch (`gh-pages`). Luckily, there are **actions** specifically for Hugo exactly for this purpose:

- [`actions-hugo`](https://github.com/peaceiris/actions-hugo) by **Shohei Ueda**. A simple way to set up Hugo in a GitHub actions environment
- [`actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages) Also by Shohei Ueda, this action pushes static assets to the specified branch.

Here's the code of a GitHub Actions workflow that will deploy Hugo to gh-pages. Note that if there's a need for a custom domain, a CNAME file needs to be copied to the `public` directory before running the `gh-pages` action. Furthermore, workflow permissions of your repository must be set to "Read and write" (could be found in **Settings > Actions > General**).

```yaml
name: Build and Deploy Hugo
on:
  push:
    branches:
      - main  
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v3
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
          extended: true
      - name: Build site
        run: hugo --minify
      - name: Add CNAME file
        run: cp CNAME public/CNAME
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: gh-pages
```

Once the deployment passes, the site should be uploaded to GitHub CDN. Be sure to set up GitHub Pages to the branch that contains built artifacts in case the website doesn't work. 

With Hugo set up and deployed, I can now focus on what matters — sharing technical insights from my experience. I hope this guide helps others looking to build a simple and reliable blog for their work.

## Related resources

- [Repository for this website](https://github.com/nexo-tech/nexo-tech.github.io)
- [Hugo quick start](https://gohugo.io/getting-started/quick-start/#publish-the-site)
- [Configuring DNS settings for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#dns-records-for-your-custom-domain)
- [Cactus theme for Hugo](https://themes.gohugo.io/themes/hugo-theme-cactus/)
- [Google Analytics setup in Hugo](https://gohugo.io/templates/embedded/#google-analytics)
- [Caddy reverse proxy quick-start](https://caddyserver.com/docs/quick-starts/reverse-proxy)

