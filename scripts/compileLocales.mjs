// Compiles locales/*.po into src/locales/generated.json, which is bundled into the plugin.
//
// Output format: { "<locale>": { "<msgid>" | "<msgctxt>\u0004<msgid>": "<translation>" } }
// Untranslated and fuzzy entries are skipped (the English source string is used instead).
//
// Usage: node scripts/compileLocales.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { po } from 'gettext-parser';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localesDir = path.join(rootDir, 'locales');
const outputPath = path.join(rootDir, 'src', 'locales', 'generated.json');

const catalogs = {};
for (const file of fs.readdirSync(localesDir).filter(f => f.endsWith('.po')).sort()) {
	const locale = path.basename(file, '.po');
	const parsed = po.parse(fs.readFileSync(path.join(localesDir, file)));
	const catalog = {};
	for (const [msgctxt, entries] of Object.entries(parsed.translations)) {
		for (const [msgid, entry] of Object.entries(entries)) {
			if (!msgid) continue; // header
			const translation = entry.msgstr?.[0];
			const isFuzzy = (entry.comments?.flag ?? '').split(',').map(f => f.trim()).includes('fuzzy');
			if (!translation || isFuzzy) continue;
			catalog[msgctxt ? `${msgctxt}\u0004${msgid}` : msgid] = translation;
		}
	}
	catalogs[locale] = catalog;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(catalogs, null, '\t')}\n`);
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${Object.keys(catalogs).join(', ')})`);
