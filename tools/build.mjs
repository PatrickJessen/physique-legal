// Cleans the PHYSIQUE legal drafts for public display and renders the static site.
// usage: node build.mjs <draftsDir> <appLocalesDir> <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const [draftsDir, localesDir, outDir] = process.argv.slice(2);
const removed = []; // {file, kind, text}

const TBC = { en: 'To be confirmed', da: 'Afventer bekræftelse' };
const tbc = (lang, label) => `<span class="tbc">${label ?? TBC[lang]}</span>`;

// Bracketed placeholders → public label (null = plain "To be confirmed").
const BRACKET = {
  en: [
    [/^legal (entity )?form/i, 'Legal form: to be confirmed'],
    [/street address/i, null], [/^address$/i, 'Address: to be confirmed'],
    [/^Email delivery provider/i, 'Email delivery provider for account emails: to be confirmed'],
    [/^Support\/helpdesk/i, 'Support email provider: to be confirmed'],
    [/^Either "We have not appointed/i, 'To be confirmed'],
    [/web deletion page/i, 'Web deletion page: to be confirmed'],
    [/verify (name\/contact|contact details)/i, 'Contact details: to be confirmed'],
  ],
  da: [
    [/^selskabsform/i, 'Selskabsform: afventer bekræftelse'],
    [/indsæt adresse/i, null], [/^adresse$/i, 'Adresse: afventer bekræftelse'],
    [/^Udbyder af e-mails/i, 'Udbyder af konto-e-mails: afventer bekræftelse'],
    [/^Udbyder af support/i, 'Udbyder af support-e-mail: afventer bekræftelse'],
    [/^Enten "Vi har ikke udpeget/i, 'Afventer bekræftelse'],
    [/sletning på web/i, 'Side til sletning på web: afventer bekræftelse'],
    [/kontrollér (navn\/kontakt|kontaktoplysninger)/i, 'Kontaktoplysninger: afventer bekræftelse'],
  ],
};

// Remove "⚠️ (balanced parenthetical)" and replace "⚠️ [bracket]" placeholders.
function stripMarked(src, open, close, file, onMatch) {
  let out = '', i = 0;
  const token = '⚠️';
  while (i < src.length) {
    const j = src.indexOf(token, i);
    if (j < 0) { out += src.slice(i); break; }
    out += src.slice(i, j);
    let k = j + token.length;
    while (src[k] === ' ') k++;
    if (src[k] === open) {
      let depth = 0, m = k;
      for (; m < src.length; m++) {
        if (src[m] === open) depth++;
        else if (src[m] === close && --depth === 0) break;
      }
      const inner = src.slice(k + 1, m);
      out = out.replace(/[ \t]+$/, '');
      out += onMatch(inner);
      i = m + 1;
    } else {
      out += token;
      i = j + token.length;
    }
  }
  return out;
}

function clean(md, lang, file) {
  let s = md.split('support@physique.app').join('support@jessenthinkmatic.dk');
  // HTML editorial comments
  s = s.replace(/<!--([\s\S]*?)-->\s*/g, (_, c) => { removed.push({ file, kind: 'comment', text: c.trim() }); return ''; });
  // Draft notice blockquotes
  s = s.replace(/^> ⚠️ \*\*(Draft notice|Udkastnote)[^\n]*\n\n?/gm, (m) => { removed.push({ file, kind: 'draft notice', text: m.replace(/^> /, '').trim() }); return ''; });
  // Status line: drop "(DRAFT – not yet in force)"
  s = s.replace(/ \((DRAFT – not yet in force|UDKAST – endnu ikke gældende)\) ⚠️/g, (m, t) => { removed.push({ file, kind: 'status', text: t }); return ''; });
  // Inline editorial sentences that are not parenthesised
  const sentences = [
    / ⚠️ (Decide which version prevails[^\n]*)/,
    / ⚠️ (Beslut, hvilken version[^\n]*)/,
    / ⚠️ (re-check at launch)/,
    / ⚠️ (– kontrollér igen ved lancering)/,
  ];
  for (const re of sentences) s = s.replace(re, (m, t) => { removed.push({ file, kind: 'note', text: t }); return ''; });
  // Keep factual follow-on sentences, just drop the flag
  s = s.replace(/⚠️ (No such program exists at launch\.|Der findes ingen sådan ordning ved lancering\.)/g, '$1');
  // Parenthetical notes
  s = stripMarked(s, '(', ')', file, (inner) => { removed.push({ file, kind: 'note', text: inner }); return ''; });
  // Bracket placeholders
  s = stripMarked(s, '[', ']', file, (inner) => {
    const hit = BRACKET[lang].find(([re]) => re.test(inner));
    removed.push({ file, kind: 'placeholder', text: `[${inner}]` });
    return ' ' + tbc(lang, hit && hit[1] ? hit[1] : undefined);
  });
  // Empty table cells that only held a flag
  s = s.replace(/\|\s*⚠️\s*\|/g, `| ${tbc(lang)} |`);
  // Any remaining bare flags
  const bare = (s.match(/⚠️/g) || []).length;
  if (bare) removed.push({ file, kind: 'bare flags', text: `${bare} bare ⚠️ markers removed` });
  s = s.replace(/[ \t]*⚠️[ \t]*/g, ' ');
  // tidy spacing
  s = s.replace(/ +([.,;:)])/g, '$1').replace(/[ \t]+\n/g, '\n').replace(/(\S) {2,}/g, '$1 ');
  s = s.replace(/\*\*Effective date:\*\* <span/g, '**Effective date:** <span').replace(/\n{3,}/g, '\n\n');
  return s;
}

const T = {
  en: {
    nav: { privacy: 'Privacy', terms: 'Terms', health: 'Health', ai: 'AI', support: 'Support' },
    other: 'Dansk', otherLang: 'da', review: 'This document is pending final review. Items marked “To be confirmed” will be completed before PHYSIQUE launches.',
    foot: 'PHYSIQUE is a fitness and nutrition tool, not a medical device.',
    title: { index: 'PHYSIQUE', privacy: 'Privacy Policy', terms: 'Terms of Service', health: 'Health Disclaimer', ai: 'How PHYSIQUE uses AI', support: 'Help & Support' },
  },
  da: {
    nav: { privacy: 'Privatliv', terms: 'Vilkår', health: 'Helbred', ai: 'AI', support: 'Support' },
    other: 'English', otherLang: 'en', review: 'Dokumentet afventer endelig gennemgang. Punkter markeret “Afventer bekræftelse” bliver udfyldt, før PHYSIQUE lanceres.',
    foot: 'PHYSIQUE er et trænings- og ernæringsværktøj, ikke medicinsk udstyr.',
    title: { index: 'PHYSIQUE', privacy: 'Privatlivspolitik', terms: 'Vilkår for brug', health: 'Helbredsforbehold', ai: 'Sådan bruger PHYSIQUE AI', support: 'Hjælp og support' },
  },
};

function page(lang, key, body, { legal = false } = {}) {
  const t = T[lang];
  const root = lang === 'en' ? '' : '../';
  const here = lang === 'en' ? '' : 'da/';
  const otherHref = lang === 'en' ? `da/${key}.html` : `../${key}.html`;
  const nav = Object.entries(t.nav).map(([k, v]) =>
    `<a href="${k}.html"${k === key ? ' aria-current="page"' : ''}>${v}</a>`).join('');
  const title = key === 'index' ? 'PHYSIQUE – AI Fitness Coach' : `${t.title[key]} – PHYSIQUE`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${lang === 'en' ? 'PHYSIQUE – training, nutrition and progress with an AI coach. Legal documents and support.' : 'PHYSIQUE – træning, kost og fremskridt med en AI-coach. Juridiske dokumenter og support.'}">
<link rel="alternate" hreflang="en" href="https://jessenthinkmatic.dk/physique/${key}.html">
<link rel="alternate" hreflang="da" href="https://jessenthinkmatic.dk/physique/da/${key}.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}../style.css">
</head>
<body>
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="index.html">PHYSIQUE</a>
    <a class="lang" href="${otherHref}" hreflang="${t.otherLang}" lang="${t.otherLang}">${t.other}</a>
  </div>
  <nav class="wrap nav">${nav}</nav>
</header>
<main class="wrap ${legal ? 'doc' : ''}">
${legal ? `<p class="notice">${t.review}</p>\n` : ''}${body}
</main>
<footer class="wrap foot">
  <p>${t.foot}</p>
  <p>© 2026 <a href="${root}../">Jessen Thinkmatic</a> · CVR 45634248 · <a href="mailto:support@jessenthinkmatic.dk">support@jessenthinkmatic.dk</a></p>
</footer>
</body>
</html>
`;
}

const docs = [['privacy', 'privacy-policy'], ['terms', 'terms-of-service'], ['health', 'health-disclaimer'], ['ai', 'ai-disclosure']];
fs.mkdirSync(path.join(outDir, 'da'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'content'), { recursive: true });

for (const lang of ['en', 'da']) {
  const dir = lang === 'en' ? outDir : path.join(outDir, 'da');
  for (const [key, base] of docs) {
    const file = `${base}.${lang}.md`;
    let md = clean(fs.readFileSync(path.join(draftsDir, file), 'utf8'), lang, file);
    // in-app consent checkbox → visual box
    md = md.replace(/^\[ \] (.*)$/m, '<p class="consent"><span class="box" aria-hidden="true"></span>$1</p>');
    fs.writeFileSync(path.join(outDir, 'content', file), md);
    let html = marked.parse(md, { gfm: true, breaks: true });
    html = html.replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, '</table></div>');
    fs.writeFileSync(path.join(dir, `${key}.html`), page(lang, key, html, { legal: true }));
  }
}

// ---- index ----
const index = {
  en: `<section class="hero">
<h1>PHYSIQUE</h1>
<p class="lead">Snap your meals, train with a plan, track your progress and get answers from an AI coach that knows your data.</p>
<p>PHYSIQUE brings food tracking, strength training, body progress and coaching together in one app for iPhone. Built in Denmark by Jessen Thinkmatic, with data hosted in the EU.</p>
</section>
<ul class="cards">
<li><a href="privacy.html"><strong>Privacy Policy</strong><span>What we collect, why, and your rights</span></a></li>
<li><a href="terms.html"><strong>Terms of Service</strong><span>Subscriptions, cancellation and your rights</span></a></li>
<li><a href="health.html"><strong>Health Disclaimer</strong><span>Estimates, not medical advice</span></a></li>
<li><a href="ai.html"><strong>How PHYSIQUE uses AI</strong><span>What the AI does and doesn't do</span></a></li>
<li><a href="support.html"><strong>Help &amp; Support</strong><span>FAQ and contact</span></a></li>
</ul>`,
  da: `<section class="hero">
<h1>PHYSIQUE</h1>
<p class="lead">Fotografér dine måltider, træn efter en plan, følg dine fremskridt, og få svar fra en AI-coach, der kender dine data.</p>
<p>PHYSIQUE samler madregistrering, styrketræning, kropsudvikling og coaching i én app til iPhone. Udviklet i Danmark af Jessen Thinkmatic, med data hostet i EU.</p>
</section>
<ul class="cards">
<li><a href="privacy.html"><strong>Privatlivspolitik</strong><span>Hvad vi indsamler, hvorfor, og dine rettigheder</span></a></li>
<li><a href="terms.html"><strong>Vilkår for brug</strong><span>Abonnement, opsigelse og dine rettigheder</span></a></li>
<li><a href="health.html"><strong>Helbredsforbehold</strong><span>Estimater, ikke lægefaglig rådgivning</span></a></li>
<li><a href="ai.html"><strong>Sådan bruger PHYSIQUE AI</strong><span>Hvad AI'en gør og ikke gør</span></a></li>
<li><a href="support.html"><strong>Hjælp og support</strong><span>Ofte stillede spørgsmål og kontakt</span></a></li>
</ul>`,
};

// ---- support (FAQ text taken from the app's own help screen) ----
const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const extra = {
  en: {
    pre: [
      ['How do I create an account or sign in?', 'You can sign up with Sign in with Apple, Google or your email address. Use the same method each time so you reach the same PHYSIQUE account.'],
      ['What does PHYSIQUE Pro cost?', 'PHYSIQUE Pro is an auto-renewing subscription, billed monthly or yearly through your App Store account. In Denmark it costs 89 DKK per month or 899 DKK per year; prices in other countries are shown in the app and the App Store before you buy. There is no free trial. The free plan stays usable without subscribing.'],
    ],
    cancelExtra: 'On iPhone you can also go to Settings → [your name] → Subscriptions → PHYSIQUE. Deleting the app or your account does not cancel a subscription.',
    contactTitle: 'Contact us', contactBody: 'Write to <a href="mailto:support@jessenthinkmatic.dk">support@jessenthinkmatic.dk</a> and we’ll get back to you, usually within two working days. Please include your app version and device if you’re reporting a problem.',
    refunds: 'Refunds', refundsBody: 'Payments are handled by Apple, so refunds for App Store purchases are requested from Apple at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>.',
    sub: 'Answers to common questions, or get in touch.',
  },
  da: {
    pre: [
      ['Hvordan opretter jeg en konto eller logger ind?', 'Du kan oprette dig med Log ind med Apple, Google eller din e-mailadresse. Brug samme metode hver gang, så du kommer ind på den samme PHYSIQUE-konto.'],
      ['Hvad koster PHYSIQUE Pro?', 'PHYSIQUE Pro er et abonnement, der fornyes automatisk og opkræves månedligt eller årligt via din App Store-konto. I Danmark koster det 89 kr. pr. måned eller 899 kr. pr. år; priser i andre lande vises i appen og i App Store, før du køber. Der er ingen gratis prøveperiode. Den gratis plan kan bruges uden abonnement.'],
    ],
    cancelExtra: 'På iPhone kan du også gå til Indstillinger → [dit navn] → Abonnementer → PHYSIQUE. Sletning af appen eller din konto opsiger ikke abonnementet.',
    contactTitle: 'Kontakt os', contactBody: 'Skriv til <a href="mailto:support@jessenthinkmatic.dk">support@jessenthinkmatic.dk</a>, så vender vi tilbage, som regel inden for to hverdage. Skriv gerne din appversion og enhed, hvis du melder en fejl.',
    refunds: 'Refusion', refundsBody: 'Betalingen håndteres af Apple, så refusion for køb i App Store søges hos Apple på <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>.',
    sub: 'Svar på almindelige spørgsmål – eller kontakt os.',
  },
};
const order = ['account0', 'pro1', 'cancel', 'restore', 'export', 'delete', 'photos', 'aiAccuracy', 'targets', 'offline', 'notifications', 'units'];

const out = { en: {}, da: {} };
for (const lang of ['en', 'da']) {
  const s = JSON.parse(fs.readFileSync(path.join(localesDir, lang, 'settings.json'), 'utf8')).support;
  const x = extra[lang];
  const qa = order.map((k) => {
    if (k === 'account0') return x.pre[0];
    if (k === 'pro1') return x.pre[1];
    const f = s.faq[k];
    return [f.q, k === 'cancel' ? `${f.a} ${x.cancelExtra}` : f.a];
  });
  const faq = qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n');
  out[lang].support = `<h1>${T[lang].title.support}</h1>
<p class="lead">${x.sub}</p>
<section class="contact"><h2>${x.contactTitle}</h2><p>${x.contactBody}</p></section>
<h2>${s.faqTitle}</h2>
<div class="faq">
${faq}
</div>
<h2>${x.refunds}</h2>
<p>${x.refundsBody}</p>`;
  out[lang].index = index[lang];
}
for (const lang of ['en', 'da']) {
  const dir = lang === 'en' ? outDir : path.join(outDir, 'da');
  for (const key of ['index', 'support']) fs.writeFileSync(path.join(dir, `${key}.html`), page(lang, key, out[lang][key]));
}
if (process.env.NOTES_OUT) fs.writeFileSync(process.env.NOTES_OUT, JSON.stringify(removed, null, 1));
console.log('removed items:', removed.length);
