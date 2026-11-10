const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const origin = 'https://limxona.vercel.app';
const root = path.join(__dirname, '..');
const pages = ['index', 'metronome', 'tuner', 'chords', 'practice'];

const files = {};
for (const name of pages) {
  try {
    files[name] = fs.readFileSync(path.join(root, name + '.html'), 'utf8');
  } catch (err) {
    console.error(`${name}.html okunamadi:`, err.message);
    files[name] = '';
  }
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function translations(source, kind) {
  if (!source) return { tr: {}, en: {} };
  const patterns = {
    index: /var I18N = (\{[\s\S]*?\});\s*function detect\(/,
    metronome: /const MET_I18N=(\{[\s\S]*?\});\s*let MET_LANG=/,
    tuner: /var I18N = (\{[\s\S]*?\});\s*var LANG =/,
    chords: /var TX=(\{[\s\S]*?\});\s*(?:Object\.assign|function t\()/,
    practice: /const\s+TEXT\s*=\s*(\{[\s\S]*?\});\s*let\s+lang\s*=/
  };
  const match = source.match(patterns[kind]);
  if (!match) {
    console.error('Missing translations: ' + kind);
    return { tr: {}, en: {} };
  }
  try {
    const dict = vm.runInNewContext('(' + match[1] + ')', {}, { timeout: 1000 });
    // Practice adds frame-button labels after declaring its main dictionary.
    if (kind === 'practice') {
      for (const extra of source.matchAll(/Object\.assign\(TEXT\.(tr|en),\s*(\{[\s\S]*?\})\s*\);/g)) {
        Object.assign(dict[extra[1]], vm.runInNewContext('(' + extra[2] + ')', {}, { timeout: 1000 }));
      }
    }
    return dict;
  } catch (err) {
    console.error('Invalid translations: ' + kind, err.message);
    return { tr: {}, en: {} };
  }
}

const dictionaries = Object.fromEntries(pages.map(kind => [kind, translations(files[kind], kind)]));
const practiceSEO = {
  tr: {
    docTitle: 'LmX Practice — YouTube Ders Çalışma ve A–B Döngü',
    docDesc: 'YouTube ders ve örnek parçalarını A–B döngüsüyle çalış. Büyük oynatma çubuğu, hassas ileri geri sarma ve süreli tekrar.'
  },
  en: {
    docTitle: 'LmX Practice — YouTube Practice & A–B Loop',
    docDesc: 'Practice YouTube lessons and songs with A–B loops. Use the large seek bar, fine seeking, playback speed, and infinite or timed repetition.'
  }
};

// Accept different attribute orders and add missing SEO tags.
function setMeta(html, attribute, name, value) {
  if (!value) return html;
  const tag = `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(value)}">`;
  let found = false;
  html = html.replace(/<meta\b[^>]*>/gi, current => {
    const match = current.match(new RegExp(`\\b${attribute}\\s*=\\s*(["'])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'i'));
    if (!match) return current;
    found = true;
    return tag;
  });
  return found ? html : html.replace(/<\/head>/i, tag + '\n</head>');
}

function setCanonical(html, url) {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
  const regex = /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi;
  return regex.test(html) ? html.replace(regex, tag) : html.replace(/<\/head>/i, tag + '\n</head>');
}

function render(kind, lang) {
  const dict = { ...(dictionaries[kind][lang] || {}), ...(kind === 'practice' ? practiceSEO[lang] : {}) };
  const suffix = kind === 'index' ? '' : '/' + kind;
  const url = origin + '/' + lang + suffix;
  const docTitle = dict.docTitle || dict.title;
  const docDesc = dict.docDesc || dict.desc;
  let html = files[kind].replace(/(<html\b[^>]*\blang\s*=\s*)["'][^"']*["']/i, `$1"${lang}"`);
  if (docTitle) html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(docTitle)}</title>`);
  html = setMeta(html, 'name', 'description', docDesc);
  html = setCanonical(html, url);
  for (const [attribute, name, value] of [
    ['property', 'og:url', url], ['property', 'og:locale', lang === 'tr' ? 'tr_TR' : 'en_US'],
    ['property', 'og:title', docTitle], ['property', 'og:description', docDesc],
    ['name', 'twitter:url', url], ['name', 'twitter:title', docTitle], ['name', 'twitter:description', docDesc]
  ]) html = setMeta(html, attribute, name, value);

  if (kind === 'practice') {
    html = html.replace(/<link\b(?=[^>]*\bhreflang\s*=)[^>]*>/gi, '');
    const alternates = [['tr', 'tr'], ['en', 'en'], ['x-default', 'tr']].map(([label, code]) =>
      `<link rel="alternate" hreflang="${label}" href="${origin}/${code}/practice">`).join('\n');
    html = html.replace(/<\/head>/i, alternates + '\n</head>');
    html = setMeta(html, 'property', 'og:type', 'website');
    html = setMeta(html, 'name', 'twitter:card', 'summary');
  }

  if (kind === 'index') {
    html = html.replace(/href="\/(metronome|tuner|chords|practice)\/?"/g, (_, page) => `href="/${lang}/${page}"`);
  }
  html = html.replace(/(<[^>]*data-(?:i18n|i)="([^"]+)"[^>]*>)([^<]*)(<\/[^>]+>)/g,
    (all, opening, key, oldText, closing) => dict[key] == null ? all : opening + escapeHtml(dict[key]) + closing);

  // Translate accessible labels and placeholders in the initial HTML too.
  html = html.replace(/<[a-z][^>]*>/gi, tag => {
    for (const [marker, target] of [
      ['data-aria', 'aria-label'], ['data-i18n-aria', 'aria-label'],
      ['data-i18n-title', 'title'], ['data-i18n-placeholder', 'placeholder']
    ]) {
      const key = tag.match(new RegExp(`\\b${marker}="([^"]+)"`))?.[1];
      if (key == null || dict[key] == null) continue;
      const attr = `${target}="${escapeHtml(dict[key])}"`;
      const existing = new RegExp(`\\s${target}="[^"]*"`);
      tag = existing.test(tag) ? tag.replace(existing, ' ' + attr) : tag.replace(/\s*\/?>$/, end => ' ' + attr + end);
    }
    return tag;
  });

  if (kind === 'metronome' && lang === 'en') {
    html = html.replace(/(<details data-i18n-html="([^"]+)"[^>]*>)[\s\S]*?(<\/details>)/g,
      (all, opening, key, closing) => dict[key] == null ? all : opening + dict[key] + closing);
    html = html.replace(/(<span data-i18n-html="([^"]+)"[^>]*>)[\s\S]*?(<\/span>)/g,
      (all, opening, key, closing) => dict[key] == null ? all : opening + dict[key] + closing);
  }
  html = html.replace(/(<button[^>]*data-lang="([^"]+)"[^>]*aria-pressed=")[^"]*(")/g,
    (_, opening, buttonLang, closing) => opening + (buttonLang === lang ? 'true' : 'false') + closing);
  return html;
}

module.exports = function handler(req, res) {
  const { lang, page } = req.query || {};
  if (!['tr', 'en'].includes(lang) || !pages.includes(page)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!files[page]) {
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 500;
    res.end(`<h1>500 - ${escapeHtml(page)}.html bulunamadi</h1>`);
    return;
  }
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(render(page, lang));
};
