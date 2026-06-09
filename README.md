# Methow Valley Riverwalk

Website for the Methow Valley Riverwalk project — a community path along the river in Twisp / Winthrop, WA.

Plain HTML / CSS / JS, no build step. Smooth scroll via [Lenis](https://github.com/studio-freight/lenis) (CDN). Inter font from rsms.me.

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

## Deploy

Push to `main`; GitHub Pages serves it. The updates are loaded by `fetch`, so they only show on the published URL (not when opening `index.html` straight from disk).

> When editing `css/style.css`, `js/main.js`, or `data/updates.json`, bump the `?v=N` number on their links in `index.html` to bust the cache.
