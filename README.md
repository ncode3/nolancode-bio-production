# Nolan S. Code — Speaker and Press Site

[![Azure Static Web Apps CI/CD](https://github.com/ncode3/nolancode-bio-production/actions/workflows/azure-static-web-apps-nolancode-bio.yml/badge.svg)](https://github.com/ncode3/nolancode-bio-production/actions/workflows/azure-static-web-apps-nolancode-bio.yml)

Production source for [nolancode.bio](https://nolancode.bio), Nolan S. Code’s speaker booking and media site.

## Purpose

The site positions Nolan as a physical AI speaker and presents speaking topics, press materials, engagement formats, rates, and booking information across:

- physical AI, robotics, and edge systems;
- AI infrastructure and energy;
- workforce and community ownership;
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
rider.html             Contracting details, shared after fit (noindex)
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

## Speaking highlight and source

The homepage plays a 2:42 excerpt (7:58–10:40) from RenderATL’s July 8, 2026 conversation. The privacy-enhanced YouTube player uses explicit start/end times. A readable transcript accompanies the excerpt. William Hill’s short quote is attributed to his public introduction at 2:29, not represented as a review of the August keynote.

MIT has confirmed professional filming for October 30. Its future recording cannot exist before the event. TAG and RenderATL raw keynote footage and additional organizer comments were requested October 10; the published site does not depend on those assets.

Phil Kasiecki’s public LinkedIn feedback on the August RenderATL keynote is featured beside the video and in the speaker one-sheet. He is credited as an attendee, not an organizer. The excerpt is linked to the supplied public post.
