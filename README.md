# Avnish — Personal Portfolio

A responsive static portfolio built with HTML, CSS, and vanilla JavaScript. The website needs no application server or package installation. Contact submissions use FormSubmit after owner email activation.

## Run locally

With Node.js installed, run `node serve.mjs` and open http://127.0.0.1:4173.

Run `node --check script.js` and `node build.mjs` before publishing. The build validates local links, anchor targets, and assets and copies only public website files into `dist/`.

## Hosting

- GitHub Pages: publish `main` from `/ (root)` in repository Settings → Pages. Public address: https://synergicvans.github.io/Portfolio_Project/. Once enabled, pushes to that branch trigger updates.
- Sites: the project is recorded in `.openai/hosting.json`; static output is `dist/`. Sites versions are published separately from GitHub pushes.
- Render alternative: create a Static Site from this repository, use build command `node build.mjs`, and publish directory `dist`. No web service or keep-alive process is needed.

Static hosting avoids application-server idle shutdown. Hosting remains subject to provider availability, account status, limits, and future terms; no service guarantees permanent free hosting.

## Content maintenance

Edit `index.html` for biography, experience, certifications, social links, and contact details; `style.css` and `enhancements.css` for presentation; and `script.js` for interactions. Edit `projects.json` for project cards and run `node build.mjs` to regenerate their static HTML. Commit the regenerated `index.html` for GitHub Pages.

All contact destinations use **avnish1234pandeys@gmail.com**. The current download is `images/Avnish_2026_resume.pdf`, copied unchanged from the supplied résumé. The three legacy PDF paths contain the same current document so old public links continue working without exposing outdated contact information. Historical Git commits are not rewritten.

The September 2026 refresh includes all 16 nonempty public repositories found in the account. Empty and private repositories are excluded. Descriptions were checked against repository files, and employment, education, and the two linked Claude credentials come from the supplied 2026 résumé. Existing cloud/web courses are retained as additional learning.

## Contact form

The form submits to `https://formsubmit.co/avnish1234pandeys@gmail.com`, using the AJAX endpoint when JavaScript is available. The owner explicitly approved FormSubmit and the setup request. **The owner must click “Activate Form” in the email sent to avnish1234pandeys@gmail.com before relying on delivery.** Accepted messages are emailed to that inbox; the visitor's email supports replying directly. Check spam folders as well.

The page validates required fields and includes a honeypot, pending state, duplicate-submit prevention, a 15-second timeout, activation/error handling, and a direct email fallback. It only clears entered content after the provider accepts a submission. A native form action remains available without JavaScript. Provider acceptance is not proof that an email reached the inbox. No SMTP passwords or API secrets are stored in this public repository.

## Accessibility and resilience

Semantic landmarks, skip navigation, visible focus, labelled inputs, keyboard-operated tabs, mobile navigation with Escape support, and direct contact links. The CSS typewriter animation plays once, preserves a stable accessible heading, and respects reduced-motion preferences. All project cards share the same image, hover, focus, and link treatment. Without JavaScript, navigation, background panels, and the native contact form remain available. Fonts fall back to system sans-serif if Google Fonts is unavailable.

Project, demo, and credential URLs returned HTTP 200 during the refresh. LinkedIn returned its automated-access block (999); the profile URL is retained exactly from the résumé. External availability can change.

Image sources and generation details are recorded in `images/projects/SOURCES.md` and `generation-prompts.json` beside the generated assets.
