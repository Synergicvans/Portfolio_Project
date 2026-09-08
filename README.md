# Avnish — Personal Portfolio

A responsive, accessible static portfolio built with HTML, CSS, and vanilla JavaScript. No application server, database, paid dependency, or package installation is required.

## Run locally

With Node.js installed, run `node serve.mjs` and open http://127.0.0.1:4173.

Run `node --check script.js` and `node build.mjs` before publishing. The build validates local links, anchor targets, and assets and copies only public website files into `dist/`.

## Hosting

- GitHub Pages: publish `main` from `/ (root)` in repository Settings → Pages. Public address: https://synergicvans.github.io/Portfolio_Project/. Once enabled, pushes to that branch trigger updates.
- Sites: the project is recorded in `.openai/hosting.json`; static output is `dist/`. Sites versions are published separately from GitHub pushes.
- Render alternative: create a Static Site from this repository, use build command `node build.mjs`, and publish directory `dist`. No web service or keep-alive process is needed.

Static hosting avoids application-server idle shutdown. Hosting remains subject to provider availability, account status, limits, and future terms; no service guarantees permanent free hosting.

## Content maintenance

Edit `index.html` for biography, projects, social links, and contact details; `style.css` for presentation; and `script.js` for interactions. Replace `images/Avnish_Resume_2025.pdf` or update both résumé links when a newer version is ready. Existing personal details and projects were preserved; no current employment or graduation claims were inferred.

## Contact form

The existing Google Apps Script endpoint is retained. Its cross-origin response is opaque, so the page cannot verify receipt and does not claim successful delivery or erase the visitor's message. Pending, timeout, and failure states include a direct email alternative. Confirm the Apps Script deployment and spreadsheet access in the owning Google account before relying on form delivery. No test messages were submitted during the redesign.

## Accessibility and resilience

Semantic landmarks, skip navigation, visible focus, labelled inputs, keyboard-operated tabs, mobile navigation with Escape support, reduced-motion handling, and direct contact links. Without JavaScript, navigation and all background panels remain available; the dependent form is hidden. Fonts fall back to system sans-serif if Google Fonts is unavailable.
