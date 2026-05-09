# Nolan Speaker Site

[![Azure Static Web Apps CI/CD](https://github.com/ncode3/nolancode-bio-production/actions/workflows/azure-static-web-apps-nolancode-bio.yml/badge.svg)](https://github.com/ncode3/nolancode-bio-production/actions/workflows/azure-static-web-apps-nolancode-bio.yml)

Static speaker and press-kit website for `nolancode.bio`.

## Purpose

This site positions Nolan as a paid speaker, founder, educator, and infrastructure strategist across:

- AI infrastructure
- robotics and edge AI
- quantum literacy
- workforce development
- executive and institutional strategy

## Framework

This app is plain static HTML.

- No Vite
- No React
- No Next.js
- No Node build step
- Publish root is the repository root

## Azure Static Web Apps Deployment

This site is configured for Azure Static Web Apps with GitHub as source control.

- Azure resource name: `swa-nolancode-bio-prod`
- Azure resource group: `rg-nolancode-bio-prod`
- Production branch: `main`
- Workflow: `.github/workflows/azure-static-web-apps-nolancode-bio.yml`
- Build command: none
- App location: `/`
- Output directory: repository root
- Build mode: `skip_app_build: true`
- Azure default hostname: `https://zealous-flower-0552bf80f.7.azurestaticapps.net`

## Security Posture

This site is intentionally static and low-risk.

- No server-side runtime
- No client-side secrets
- No third-party JavaScript
- No analytics scripts
- No form backend storing visitor data
- Booking form uses a local `mailto:` handoff so submission data is not posted to a public API
- Content Security Policy is set with a restrictive meta policy
- No client-side secrets
- No analytics scripts
- No CDN JavaScript

## Structure

- `index.html` - Main speaker homepage
- `speaker-kit.html` - Printable one-sheet
- `media-kit.html` - Media summary
- `rider.html` - Speaker rider
- `rates.html` - Speaking rates
- `styles/site.css` - Shared styles
- `scripts/site.js` - Mobile navigation and booking form handoff
- `images/` - Headshots and legacy site imagery

## Local Preview

Run a local static server from the repo root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## DNS Migration Notes

The current live domain is still on the legacy host until Azure cutover is complete.

- Current apex DNS resolves to `169.61.58.226` and `169.61.58.194`
- Current nameservers are Name.com:
  - `ns1cny.name.com`
  - `ns2dqx.name.com`
  - `ns3qty.name.com`
  - `ns4hmp.name.com`
- Mail records must be preserved:
  - MX for Titan
  - SPF
  - DKIM
  - DMARC
  - autodiscover
  - any verification TXT records

## Local Preview

Run a local static server from the repo root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes

- The downloadable press-kit links open printable HTML pages until final PDF assets are produced.
- If you later add a real form backend, do not expose API keys or SMTP credentials client-side.
