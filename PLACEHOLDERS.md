# Placeholders — everything to replace before production

Nothing in this list is a guess about your business. Each item is something the
PRD (§25 Open Decisions, §11.3 Required Launch Assets) left open, so the build
uses an obvious stand-in instead of inventing a fact.

**Do not deploy to a public domain until every ⛔ item is resolved.** PRD §17.4
forbids shipping draft legal copy or placeholder contact details to production.

---

## ⛔ 1. Contact details

### ✅ Done — phone and email are real

- **Phone:** `(321) 278-5973` — live in all `tel:`/`sms:` links, the visible
  footer text, and the LocalBusiness JSON-LD, across all nine pages.
- **Email:** `miraiglobal111@gmail.com` — live everywhere, including the privacy
  and terms contact sections.

### ⛔ Still placeholders

| Placeholder | Real value | Where it appears |
|---|---|---|
| `everafterbymirai.com` | your real domain | `index.html`/`es/`/`ht/` (canonical, hreflang, OG, JSON-LD), `robots.txt`, `sitemap.xml`, `privacy/`, `terms/` |
| `facebook.com/everafterbymirai` | real Facebook URL | landing pages (contact rail, footer, JSON-LD) |
| `instagram.com/everafterbymirai` | real Instagram URL | landing pages (contact rail, footer, JSON-LD) |
| `m.me/everafterbymirai` | real Messenger link | landing pages, contact rail |

Find every remaining one before you deploy:

```bash
grep -rn "everafterbymirai" --include="*.html" --include="*.txt" --include="*.xml" .
```

**Note on the email:** a Gmail address works fine and is completely normal for a
new business. If you later move to `hello@yourdomain.com`, it is one
find-and-replace across the same files — grep for `miraiglobal111`.

---

## ⚠️ 2. Preview banners — mostly removed

The red "PREVIEW BUILD" banner is **gone** from all six customer-facing pages
(the three landing pages and the three confirmation pages).

Two banners remain, on `privacy/index.html` and `terms/index.html`, reading
*"DRAFT — not legal advice."* **Leave them until an attorney has reviewed those
pages** (§3 above). They are the only thing on the site telling a visitor that
the published policy is not final. Once the pages are reviewed, delete both
banners and the `.placeholder-banner` rule at the end of
`assets/css/styles.css`.

```bash
grep -rn "placeholder-banner" --include="*.html" --include="*.css" .
```

**Removing the banners does not make the site launch-ready.** The phone number
is still `(555) 000-0000`, the domain is still a placeholder, and the
translations are still unreviewed. The site now *looks* finished, so work the
⛔ items above before pointing a real domain at it.

---

## ⛔ 3. Legal pages (PRD §18)

`privacy/index.html` and `terms/index.html` are **drafts written to match what
this site actually does** — they are not legal advice and have not been
reviewed. Before publishing:

- Have a Florida attorney review both against your real operations
- Set the "Last updated" dates
- Privacy: fill in your data-retention periods, and list only the analytics /
  advertising / CRM tools you have actually deployed — delete the rest
- Terms: add governing law, limitation of liability, IP, dispute resolution,
  and the legal entity name that contracts with clients (marked as TODO in the file)

---

## ⛔ 4. Imagery (PRD §11.3, §7.8)

**PRD §7.8 and §11.2 forbid presenting decorative or AI-generated imagery as
client work.** Nothing currently on the site claims to be a real wedding.

### Current state

- **Hero** — uses the EA brand monogram (`assets/images/ea-monogram.png`,
  900×900, from the owner). This is brand art, not a photograph, and its alt
  text describes it as the logo it is. It is styled with `object-fit: contain`
  and `mix-blend-mode: multiply` under `.hero__media--brand` so the artwork's
  soft edges blend into the ivory background instead of being cropped like a
  photo. **Still a placeholder** — replace with a real intimate-wedding
  photograph when one exists, and drop the `--brand` modifier at that point.
- **Gallery** — removed at the owner's request until real images exist. See §5
  below.

### Still needed

- **Hero photograph:** 1 desktop + 1 mobile crop, WebP/AVIF with a fallback
- **Gallery:** 12–20 images spanning ceremony, portraits, details, reactions,
  and team-at-work
- **OG card:** `assets/images/og-card.jpg`, 1200×630 — referenced in `index.html`
  but not yet created, so social shares currently have no preview image
- **Favicon:** `assets/icons/favicon.svg` is a simple placeholder monogram.
  Replace with the real mark (the supplied artwork would need flattening onto a
  solid background to read at 16px), and add `apple-touch-icon.png`
  (referenced but absent)
- **Video:** 1 brand reel + 2 short loops; muted autoplay only, captions where
  audio carries meaning

The supplied monogram PNG has soft, slightly fringed edges from its source
render. That is invisible against the ivory hero because of the multiply blend,
but it will show if you place this file on a white or dark background. For those
uses, get a clean vector (SVG) version of the mark.

Give every image real descriptive alt text as you add it.

---

## ⛔ 5. Gallery section — removed, needs restoring

The placeholder-tile gallery was **removed at the owner's request** until Ever
After by Mirai has its own photographs. The section sat between the languages
and service-area sections in `index.html`; a comment block marks the spot.

Nothing else was deleted — `.gallery`, `.gallery__item`, and
`.gallery__placeholder` styles remain in `assets/css/styles.css`, and `main.js`
still tracks `gallery_engage` for any `[data-gallery-asset]` element, so
restoring it is markup-only.

**Worth knowing:** the removed section carried a real selling point — *"Photo
and film, together. One team means your officiant and your photographer are
never working against each other."* That is now stated nowhere on the page,
and it matters more since every package includes photography. Consider bringing
it back as a text-only band before launch even if the images aren't ready.

---

## ⛔ 6. Testimonials (PRD §11.3, §12.4)

**Deliberately not built.** §12.4 forbids fabricated ratings, and a placeholder
testimonial is a fabricated testimonial. Once you have three real quotes with
written consent, approved attribution, and city/service context, add the section
just before the service-area section in `index.html`.

---

## ⚠️ 7. Business facts still marked TODO (PRD §25)

These are live in the copy as reasonable defaults from your PRD, and each is
marked with a `TODO §25` comment in the HTML. Confirm or correct each one:

| Where | Currently says | Confirm |
|---|---|---|
| FAQ → delivery | 72h previews / 14-day photos / 21-day films | Only publish if operationally sustainable (§25) |
| FAQ → rain | Generic backup-location and deadline language | Replace with your contract's exact weather terms |
| FAQ → religious | Religious, spiritual, blended, and secular | Confirm the real supported range with your officiant |
| Thank-you page | "within a few hours during published response hours" | Replace with your actual published hours (§25) |
| Retainer | Not stated as a percentage anywhere on the site | PKG-04 calls 50% provisional; add it only once policy is final |

### Owner decisions that supersede the PRD

Two directions from the owner change what the PRD specifies. The PRD document
itself has **not** been updated, so translators and future editors should work
from this list, not from §7.4:

**1. Every package includes photography; base package is $350.**
This is a photo/video business first, so a ceremony-only package was removed.
Simply "I Do" is now $350 (PRD says $299) and includes a wedding portrait
session with **2 edited portraits**. No session length is published — that is
intentional, so you keep operational flexibility.
*Supersedes PRD §7.4, §7.2, §16.1, and Appendix B.*

**2. No guest limits on any package.**
All "up to N guests" language is gone from the package cards, the pricing note,
the FAQ, and the terms page. The FAQ now answers that guest counts are uncapped
and that the real constraint is the location's own capacity and permit rules.
*Supersedes PRD §7.4 (guest limits per package) and PKG-05 (vendors excluded
from guest limits — now moot).*

The inquiry form still **asks** for an approximate guest count, relabeled
"Roughly how many guests?" with the hint "There's no limit — this just helps us
plan your coverage." It is kept because you need it to staff and quote a day,
and PRD §10.1 requires it. Say the word if you want the field dropped entirely.

---

## ⚠️ 8. Analytics and Meta (PRD §15)

**No analytics or Meta Pixel script is loaded.** §15 requires the consent
approach to be configured first, so the site instead pushes the full §15 event
taxonomy to `window.dataLayer`. Every event and its allowed parameters are
implemented in `assets/js/main.js`.

To go live with measurement:

1. Decide your consent model and build the consent UI
2. Add your tag manager or analytics snippet
3. Map these `dataLayer` events: `page_view`, `package_view`, `package_select`,
   `lead_form_start`, `lead_form_error`, `lead_submit_success`, `contact_click`,
   `language_switch`, `faq_open`, `gallery_engage`
4. **Add the new script domains to the CSP in `netlify.toml`** — it is currently
   locked to `'self'` plus Google Fonts, and will silently block the pixel otherwise
5. Re-test a production form submission afterward (§17.2)

`main.js` strips any parameter not on the §15 allow-list before pushing, so
personal data cannot leak into analytics even by mistake.

---

## ⚠️ 9. Netlify setup (PRD §17.2)

- [ ] Enable form detection in project settings **before** the production deploy
- [ ] Confirm the `date-inquiry` form appears in the Netlify dashboard
- [ ] Configure the verified-submission email notification (§10.3: package, date,
      city, language, phone, and campaign source near the top)
- [ ] Set up the couple's confirmation email in their communication language
- [ ] Turn on spam filtering (the honeypot is already in the markup)
- [ ] **Submit a real test lead on the production URL** — §17.2 is explicit that
      a passing preview deploy is not sufficient
- [ ] Pick one canonical host (apex or www) in Netlify Domain settings

---

## ⛔ 10. Spanish and Haitian Creole — BUILT, PENDING NATIVE REVIEW

Both locales are complete: `/es/`, `/es/gracias/`, `/ht/`, `/ht/mesi/`.

**The translations are drafts and must not go live as they are.** PRD §9.2
requires native-speaker review of all public Spanish and Haitian Creole copy
before launch, and §4.2 puts unreviewed machine-quality translation explicitly
out of scope. This is a blocker, not a nicety — for the Creole page especially,
since it is a core differentiator and a bad translation reads worse than no page.

### Give your reviewers this

For each locale, have a native speaker check and record **reviewer name, review
date, and content version** (§9.2):

- Every heading, package description, FAQ answer, and form label
- The validation messages in the `data-msg-*` attributes on the `<form>` tag —
  easy to miss because they never appear until a field fails
- The consent sentence above the submit button (legal meaning must survive)
- The confirmation page copy at `/es/gracias/` and `/ht/mesi/`
- That headings and buttons don't clip when translated text runs longer (§20.3)

### Deliberate translation decisions to confirm with reviewers

- **Brand and package names are untranslated** — "Ever After by Mirai", "Simply
  'I Do'", "The Sweetheart", "Ever After Signature", "The Intimate Story" — per
  §9.2. Confirm this reads as intentional branding rather than as an oversight.
- **The language switcher uses endonyms on every page** — always "English",
  "Español", "Kreyòl Ayisyen", never translated — per §7.1.
- **Form `name` attributes stay English** (`full_names`, `guest_count`, …) and
  all three locales post to the single `date-inquiry` Netlify form. Every lead
  lands in one inbox with the same field names; the hidden `locale` field
  (`en-US` / `es-US` / `ht`) tells you which language the couple used. Do not
  rename these per locale — it would split your leads across three forms.
- **"Elopement"** is kept as a loanword in both locales, since it is the term
  used in the US market. Confirm your audience actually uses it.

### Known gap

`/privacy/` and `/terms/` exist only in English, and the Spanish and Creole
pages link to those English pages — including from the consent checkbox. The PRD
information architecture (§5) defines them as single, unlocalized routes, so
this matches spec, but it means a Creole-speaking couple consents via an English
document. §18 calls for professionally reviewed translated copies where offered.
Decide before launch whether to localize them.
