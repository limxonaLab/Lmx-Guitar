const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const origin = 'https://limxona.vercel.app';
const root = path.join(__dirname, '..');
const files = Object.fromEntries(['index', 'metronome', 'tuner'].map(name => [name, fs.readFileSync(path.join(root, name + '.html'), 'utf8')]));
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function translations(source, kind) {
  const patterns = {
    index: /var I18N = (\{[\s\S]*?\});\s*function detect\(/,
    metronome: /const MET_I18N=(\{[\s\S]*?\});\s*let MET_LANG=/,
    tuner: /var I18N = (\{[\s\S]*?\});\s*var LANG =/
  };
  const match = source.match(patterns[kind]);
  if (!match) throw new Error('Missing translations: ' + kind);
  return vm.runInNewContext('(' + match[1] + ')');
}
const dictionaries = Object.fromEntries(Object.entries(files).map(([kind, source]) => [kind, translations(source, kind)]));
function setMeta(html, attribute, name, value) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(<meta ${attribute}="${escapedName}" content=")[^"]*("\\s*\\/?>)`);
  return html.replace(regex, (_, start, end) => start + escapeHtml(value) + end);
}
function render(kind, lang) {
  const dict = dictionaries[kind][lang];
  const suffix = kind === 'index' ? '' : '/' + kind;
  const url = origin + '/' + lang + suffix;
  let html = files[kind].replace('<html lang="tr">', `<html lang="${lang}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(dict.docTitle)}</title>`);
  html = setMeta(html, 'name', 'description', dict.docDesc);
  html = html.replace(/(<link rel="canonical" href=")[^"]*("\s*\/?>)/, `$1${url}$2`);
  for (const [attribute, name, value] of [
    ['property', 'og:url', url], ['property', 'og:locale', lang === 'tr' ? 'tr_TR' : 'en_US'],
    ['property', 'og:title', dict.docTitle], ['property', 'og:description', dict.docDesc],
    ['name', 'twitter:url', url], ['name', 'twitter:title', dict.docTitle], ['name', 'twitter:description', dict.docDesc]
  ]) html = setMeta(html, attribute, name, value);
  if (kind === 'index') html = html.replace('href="/metronome"', `href="/${lang}/metronome"`)
                                   .replace('href="/tuner"', `href="/${lang}/tuner"`)
							   .replace('href="/chords"', `href="/${lang}/chords"`);
  html = html.replace(/(<[^>]*data-i18n="([^"]+)"[^>]*>)([^<]*)(<\/[^>]+>)/g,
    (all, opening, key, oldText, closing) => dict[key] == null ? all : opening + escapeHtml(dict[key]) + closing);
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
  const {lang, page} = req.query || {};
  if (!['tr', 'en'].includes(lang) || !['index', 'metronome', 'tuner', 'chords'].includes(page)) {
    res.statusCode = 404; res.end('Not found'); return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(render(page, lang));
};
