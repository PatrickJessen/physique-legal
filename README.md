# physique-legal

Public legal and support pages for **PHYSIQUE** (iOS app "Physique: AI Fitness Coach") by Jessen Thinkmatic, CVR 45634248, Denmark.
Served by GitHub Pages from the `main` branch root: https://patrickjessen.github.io/physique-legal/

| Page | English | Danish |
|---|---|---|
| Home | `index.html` | `da/index.html` |
| Privacy Policy | `privacy.html` | `da/privacy.html` |
| Terms of Service | `terms.html` | `da/terms.html` |
| Health Disclaimer | `health.html` | `da/health.html` |
| How PHYSIQUE uses AI | `ai.html` | `da/ai.html` |
| Help & Support | `support.html` | `da/support.html` |

These URLs are registered in App Store Connect (privacy policy URL, support URL, marketing URL) and linked from the app. **Never rename or move a page** – change its content instead.

## How it's built

Plain HTML + one stylesheet (`style.css`). No build step: what's in the repo is what's served. `.nojekyll` stops GitHub from running Jekyll.

`content/*.md` holds the public Markdown text of the four legal documents (the internal drafts with editorial notes removed). `tools/build.mjs` is the script that produced the HTML from the internal drafts; it's kept for reference and is optional.

## Updating a page

**Small text change:** edit the `.html` file directly (and the matching `content/*.md` so they stay in sync). Update both languages. Commit and push to `main` – GitHub Pages republishes within a minute or two.

**Resolving a "To be confirmed" item:** search for `class="tbc"` in the page and replace the whole `<span class="tbc">…</span>` with the confirmed text, in both `xx.html` and `da/xx.html`.

**Larger rewrite from the internal drafts** (`physique-staging/legal/*.md`):
```bash
cd tools && npm init -y && npm i marked@12.0.2
node build.mjs <path-to-physique-staging/legal> <path-to-physique/src/i18n/locales> ..
```
This rewrites all pages, `content/` and prints how many editorial notes were stripped. Review the diff before committing.

When a legal document changes materially, bump **Version** and **Effective date** at the top of it, and remove the "pending final review" notice from the page template once a lawyer has signed off.

## Style

Dark theme matching the app: background `#0B0D0F`, text `#F5F6F4`, accent `#B8F36A` (used sparingly), Inter from Google Fonts. Content column max 760 px.
