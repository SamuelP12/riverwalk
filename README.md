# Winthrop Riverwalk

Website for the Winthrop Riverwalk project — a community path along the river in Winthrop, WA (Methow Valley).

Plain HTML / CSS / JS, no build step. Smooth scroll via [Lenis](https://github.com/studio-freight/lenis) (CDN). Inter font from rsms.me for body text; **Rye** (Google Fonts) as the Old-West display face for the wordmark and headings.

## Posting a weekly update

All weekly updates live in **`data/updates.json`**. Newest update goes **first** — the first entry automatically becomes the big "This Week" feature; the rest fill the "Updates" archive.

To post a new week, copy the top block and edit it:

```json
{
  "week": "Week 8",
  "date": "June 13, 2026",
  "title": "Short headline",
  "summary": "One or two sentences shown on the card.",
  "body": "Full text. Use \\n to separate paragraphs.",
  "image": "",
  "tags": ["Survey", "Community"]
}
```

- `image` — optional. A filename you've dropped into `images/` (e.g. `"week8.jpg"`) or a full URL. Leave it `""` for the blue gradient placeholder.
- `tags` — optional little labels.

## The YouTube video

In `index.html`, find `data-youtube="dQw4w9WgXcQ"` and swap in the real video ID (the part after `v=` in a YouTube URL).

## Email sign-up

The "Stay in the loop" form works out of the box with a friendly thank-you, but it doesn't store the address anywhere until you connect a service. To actually collect emails, sign up for a free form/newsletter service (e.g. [Formspree](https://formspree.io), [Buttondown](https://buttondown.email), or Mailchimp) and paste your form URL into the `data-endpoint="..."` attribute on `<form id="signupForm">` in `index.html`. The form will POST the email there; with it blank, it just shows the thank-you message.

## Deploy

Push to `main`; GitHub Pages serves it. The updates are loaded by `fetch`, so they only show on the published URL (not when opening `index.html` straight from disk).

> When editing `css/style.css`, `js/main.js`, or `data/updates.json`, bump the `?v=N` number on their links in `index.html` to bust the cache.
