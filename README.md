# Ever After by Mirai — website

Static marketing and lead-conversion site built to the PRD (v1.0, Aug 2026).
No build step, no server process, no dependencies — the folder deploys to
Netlify as-is.

**Before deploying anywhere public, work through [PLACEHOLDERS.md](PLACEHOLDERS.md).**
Contact details, imagery, and legal copy are stand-ins.

## Structure

```
index.html            English landing page
es/index.html         Spanish landing page
ht/index.html         Haitian Creole landing page
thank-you/            English confirmation (noindex)
es/gracias/           Spanish confirmation (noindex)
ht/mesi/              Haitian Creole confirmation (noindex)
privacy/  terms/      Legal pages — DRAFT, need review (PRD §18)
404.html              Recovery page with language links
assets/css/styles.css All design tokens (PRD §12.2, §12.3) and components
assets/js/main.js     Form, validation, attribution, analytics events
assets/icons/         Favicon (placeholder monogram)
assets/images/        Brand monogram used in the hero
netlify.toml          Redirects, security headers, caching
robots.txt sitemap.xml
```

**The Spanish and Haitian Creole copy is a draft awaiting native-speaker
review** and must not go live until that happens — see PLACEHOLDERS.md §10.

All three locales post to the single `date-inquiry` Netlify form with identical
English field names; the hidden `locale` field tells you which language the
couple used. Keep it that way so every lead lands in one inbox.

## Preview locally

```bash
python3 -m http.server 8888
```

Then open `http://localhost:8888`. Form submissions will fail against this
server by design — that exercises the network-error path. Real submissions only
work on Netlify.

## Editing content

This is hand-written HTML with no templating, so **a price or copy change must
be repeated in each locale's `index.html`** once the translated routes exist.
Design tokens are the exception: colors, type, and spacing live only in
`:root` at the top of `assets/css/styles.css`.

## What is implemented

- Responsive 320px → large desktop; no horizontal scroll at 320px (FR-001)
- All four packages with prefilling CTAs into the inquiry form (FR-003, FR-004)
- Netlify Forms markup: unique form name, hidden `form-name`, honeypot (§17.2)
- Client-side validation with an error summary that links to each field, and
  which never clears valid input (§19)
- Visible failure state with call/text fallbacks — no silent form failure (§14)
- UTM capture persisted across navigation and language switches (§10.2)
- Full §15 event taxonomy pushed to `window.dataLayer`, with an allow-list that
  strips any parameter that isn't on it
- Canonical, reciprocal hreflang, Open Graph, LocalBusiness JSON-LD (§16)
- Keyboard navigation, visible focus, `prefers-reduced-motion`, semantic
  headings, 44px touch targets (§19)

## What is deliberately NOT implemented

- **Analytics and Meta Pixel** — §15 requires a configured consent approach
  first. The event layer is ready; no tracking script loads.
- **Testimonials** — §12.4 forbids fabricated ratings, and a placeholder
  testimonial is a fabricated one. Add the section when real quotes exist.
- **Real imagery** — every tile is a labeled placeholder, because §7.8 forbids
  decorative or generated imagery being read as client work.
