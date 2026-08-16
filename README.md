# Nolan S. Code — Speaker and Press Site

[![Azure Static Web Apps CI/CD](https://github.com/ncode3/nolancode-bio-production/actions/workflows/azure-static-web-apps-nolancode-bio.yml/badge.svg)](https://github.com/ncode3/nolancode-bio-production/actions/workflows/azure-static-web-apps-nolancode-bio.yml)

Production source for [nolancode.bio](https://nolancode.bio), Nolan S. Code’s speaker, media, and advisory site.

## Purpose

The site presents speaking topics, press materials, engagement formats, rates, and booking information across:

- AI infrastructure;
- robotics and edge AI;
- quantum literacy;
- workforce development;
- executive and institutional strategy.

## Architecture

The public site is deliberately simple:

- static HTML, CSS, and JavaScript;
- Azure Static Web Apps hosting;
- a same-origin serverless booking endpoint;
- infrastructure as code for the DNS cutover;
- no frontend framework or client-side secret handling.

## Repository Layout

```text
index.html             Main speaker site
speaker-kit.html       Printable speaker one-sheet
media-kit.html         Media summary
rider.html             Engagement requirements
rates.html             Speaking rates
api/submit-booking/    Server-side booking handler
styles/                Shared presentation styles
scripts/               Navigation and booking behavior
infra/cloudflare-dns/  DNS infrastructure as code
images/                Approved site and press assets
```

## Local Preview

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deployment

Pushes to `main` deploy through:

```text
.github/workflows/azure-static-web-apps-nolancode-bio.yml
```

The static site publishes from the repository root with no build step. Pull requests should verify navigation, booking behavior, mobile layout, printable pages, and external links before merge.

## Server-Side Configuration

Production credentials and destination addresses belong only in Azure application settings. Supported booking-delivery settings include:

- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- one provider credential: `ACS_EMAIL_CONNECTION_STRING`, `RESEND_API_KEY`, or `SENDGRID_API_KEY`
- `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` when Turnstile is enabled

Never place these values in HTML, frontend JavaScript, screenshots, logs, or committed environment files.

## Security Controls

- same-origin booking API;
- honeypot and server-side input validation;
- rate limiting and URL-spam checks;
- optional Cloudflare Turnstile;
- restrictive Content Security Policy;
- no third-party frontend JavaScript;
- no message-body logging.

Report security concerns privately through [SECURITY.md](SECURITY.md) when available.

## Live Site

- [nolancode.bio](https://nolancode.bio)
