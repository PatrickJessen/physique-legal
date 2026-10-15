# jessenthinkmatic.dk

Company website for **Jessen Thinkmatic** (CVR 45634248, Denmark). It also hosts the public legal and support pages for **PHYSIQUE** (iOS app "Physique: AI Fitness Coach").

Repo: `PatrickJessen/physique-legal`. GitHub Pages serves it from the `main` branch root on the custom domain **https://jessenthinkmatic.dk** (see `CNAME`). DNS is managed at Simply.com.

> Note: a separate Danish portfolio site already exists in `PatrickJessen/jessenthinkmatic.dk` (Pages, no custom domain). Only one repo can hold the domain. If the portfolio should be the company root instead, move `physique/` (plus `style.css` as `physique/style.css`) into that repo, move `CNAME` there and remove it here.

| Page | English | Danish |
|---|---|---|
| Company home | `index.html` | – |
| PHYSIQUE home | `physique/index.html` | `physique/da/index.html` |
| Privacy Policy | `physique/privacy.html` | `physique/da/privacy.html` |
| Terms of Service | `physique/terms.html` | `physique/da/terms.html` |
| Health Disclaimer | `physique/health.html` | `physique/da/health.html` |
| How PHYSIQUE uses AI | `physique/ai.html` | `physique/da/ai.html` |
| Help & Support | `physique/support.html` | `physique/da/support.html` |

These URLs are registered in App Store Connect (privacy policy, support and marketing URLs) and linked from the app. **Never rename or move a page** – change its content instead.

Contact address used everywhere: `support@jessenthinkmatic.dk`.

## How it's built

The site is plain HTML with one stylesheet (`style.css`, shared by all pages). There's no build step: what's in the repo is exactly what's served. `.nojekyll` stops GitHub from running Jekyll.

`content/*.md` holds the public Markdown text of the four PHYSIQUE legal documents, i.e. the internal drafts with editorial notes removed. `tools/build.mjs` is the script that generated `physique/` from the internal drafts. It's kept for reference and is optional.

## Updating a page

**Small text change:** edit the `.html` file directly. Also update the matching `content/*.md` so the two stay in sync, and change both languages. Commit and push to `main`; GitHub Pages republishes within a minute or two.

**Resolving a "To be confirmed" item:** search for `class="tbc"` and replace the whole `<span class="tbc">…</span>` with the confirmed text, in both `physique/x.html` and `physique/da/x.html`.

**Larger rewrite from the internal drafts** (`physique-staging/legal/*.md`):
```bash
cd tools && npm init -y && npm i marked@12.0.2
node build.mjs <path-to-physique-staging/legal> <path-to-physique/src/i18n/locales> ../physique
mv ../physique/content/* ../content/ && rmdir ../physique/content
```
Review the diff before committing.

When a legal document changes materially, bump **Version** and **Effective date** at the top of it. Once a lawyer has signed off, remove the "pending final review" notice from the page template.

## Custom domain / DNS (Simply.com)

These records point `jessenthinkmatic.dk` at GitHub Pages. Leave the MX records (`mx.simply.com`) untouched so mail keeps working.

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA (optional) | @ | 2606:50c0:8000::153 |
| AAAA (optional) | @ | 2606:50c0:8001::153 |
| AAAA (optional) | @ | 2606:50c0:8002::153 |
| AAAA (optional) | @ | 2606:50c0:8003::153 |
| CNAME | www | patrickjessen.github.io |

Remove any existing A/AAAA records for `@` and any record for `www` that point to Simply's placeholder site. Once DNS resolves and GitHub has issued the certificate, turn on **Enforce HTTPS** under Settings → Pages.

## Style

The dark theme matches the app: background `#0B0D0F`, text `#F5F6F4`, accent `#B8F36A` (used sparingly), Inter from Google Fonts. The content column is at most 760 px wide.
