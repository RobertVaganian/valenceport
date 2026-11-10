import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { appUrl, appPath } from '../dist/paths.mjs';

test('navigation stays in the project path on GitHub Pages', () => {
  const base = 'https://robertvaganian.github.io/valenceport/';
  assert.equal(appUrl('', base), '/valenceport/');
  assert.equal(appUrl('case-study/', base), '/valenceport/case-study/');
  assert.equal(appUrl('#saved', base), '/valenceport/#saved');
  assert.equal(appUrl('/assets/mark.svg', base), '/valenceport/assets/mark.svg');
  assert.equal(appPath('/valenceport/case-study/', base), '/case-study');
  assert.equal(appPath('/valenceport/', base), '/');
  assert.equal(appPath('/valenceport-other/', base), '/valenceport-other');
});

test('the same app also supports root and differently named deployments', () => {
  for (const prefix of ['/', '/another-project/', '/nested/workspace/']) {
    const base = 'https://example.com' + prefix;
    assert.equal(appUrl('case-study/', base), prefix + 'case-study/');
    assert.equal(appPath(prefix + 'case-study/', base), '/case-study');
    assert.equal(appUrl('#history', base), prefix + '#history');
  }
});

test('both static entry points load their local files without a hard-coded base', () => {
  for (const entry of ['index.html', 'case-study/index.html']) {
    const file = new URL('../dist/' + entry, import.meta.url);
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /<base\b/i);
    for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|#)/.test(ref)) continue;
      assert.ok(!ref.startsWith('/'), entry + ': root-relative file ' + ref);
      assert.ok(existsSync(new URL(ref, file)), entry + ': missing ' + ref);
    }
  }
});

test('styles and map geography do not request the domain-root assets directory', () => {
  for (const name of ['identity.css', 'styles.css']) {
    assert.doesNotMatch(readFileSync(new URL('../dist/' + name, import.meta.url), 'utf8'), /url\(["']?\/assets\//);
  }
  const map = readFileSync(new URL('../dist/geography-base.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(map, /fetch\(["']\/assets\//);
  assert.match(map, /new URL\(['"]\.\/assets\/geography\.svg['"], import\.meta\.url\)/);
});
