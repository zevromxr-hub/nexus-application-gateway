/* Regression guard: every entry page must keep iPhone Home Screen app metadata.
 * Intentionally read-only: no browser storage, authentication or network calls.
 */
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages=[
  'index.html','citadel-entry.html','living-azeroth.html',
  'sovereign-ascension.html','character-intelligence.html',
  'progression-intelligence.html','azeroth-assistant.html',
  'addon-nexus.html','developer.html','getting-started.html',
  'player-handbook.html','player-test-checklist.html',
  'privacy.html','release-notes.html'
];
const manifest=JSON.parse(readFileSync(join(root, 'site.webmanifest'), 'utf8'));
assert.equal(manifest.id, './', 'Do not change the existing installed app identity');
assert.equal(manifest.start_url, './', 'Keep launching the existing companion entrance');
assert.equal(manifest.scope, './', 'All companion subpages must remain in app scope');
assert.equal(manifest.display, 'standalone', 'iPhone should not default to a Safari tab');
assert.equal(new URL(manifest.scope, 'https://zevarchives.com/azeroth-companion/site.webmanifest').pathname, '/azeroth-companion/');
for(const icon of manifest.icons || [])assert.ok(existsSync(join(root,icon.src)), 'Missing app icon: '+icon.src);
for(const page of pages){
  const html=readFileSync(join(root,page),'utf8');
  const head=html.split(/<\/head>/i)[0];
  const label=page+': ';
  assert.match(head, /<link\b[^>]*\brel=["']manifest["'][^>]*\bhref=["']\.\/site\.webmanifest(?:\?[^"']*)?["'][^>]*>/i, label+'missing app manifest');
  assert.match(head, /<link\b[^>]*\brel=["']apple-touch-icon["'][^>]*>/i, label+'missing touch icon');
  assert.match(head, /<meta\b[^>]*\bname=["']apple-mobile-web-app-capable["'][^>]*\bcontent=["']yes["']/i, label+'missing standalone meta');
  assert.match(head, /<meta\b[^>]*\bname=["']apple-mobile-web-app-status-bar-style["']/i, label+'missing status bar style');
  assert.match(head, /<meta\b[^>]*\bname=["']apple-mobile-web-app-title["'][^>]*\bcontent=["']AZEROTH["']/i, label+'missing Home Screen name');
}
console.log('iOS standalone shell valid on '+pages.length+' Companion entry pages; manifest identity and scope preserved.');
