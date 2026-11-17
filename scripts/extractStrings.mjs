// Extracts translatable strings from the source code and updates the gettext catalogs.
//
// - Finds calls to _('...') and _c('context', '...') in src/**/*.ts
// - Writes locales/template.pot
// - Merges the template into every locales/*.po (like msgmerge): keeps existing
//   translations, adds new entries, and drops entries no longer used in the source.
//
// Usage: node scripts/extractStrings.mjs [--check]
//   --check: Don't write anything. Exit with an error if the template is out of date.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { po } from 'gettext-parser';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(rootDir, 'src');
const localesDir = path.join(rootDir, 'locales');
const templatePath = path.join(localesDir, 'template.pot');
const checkOnly = process.argv.includes('--check');

const stringLiteral = String.raw`'(?:[^'\\\r\n]|\\.)*'`;
const callRegexes = [
	{ regex: new RegExp(String.raw`\b_\(\s*(${stringLiteral})`, 'g'), hasContext: false },
	{ regex: new RegExp(String.raw`\b_c\(\s*(${stringLiteral})\s*,\s*(${stringLiteral})`, 'g'), hasContext: true },
];

// Decodes a single-quoted JS string literal (only used on this project's own source code).
const decodeLiteral = (literal) => {
	const body = literal.slice(1, -1);
	return body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_match, escape) => {
		switch (escape[0]) {
			case 'n': return '\n';
			case 't': return '\t';
			case 'r': return '\r';
			case 'u': return String.fromCodePoint(parseInt(escape.replace(/[u{}]/g, ''), 16));
			case 'x': return String.fromCharCode(parseInt(escape.slice(1), 16));
			default: return escape;
		}
	});
};

const listSourceFiles = (dir) => {
	const result = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			result.push(...listSourceFiles(fullPath));
		} else if (
			/\.tsx?$/.test(entry.name)
			&& !/\.test\.tsx?$/.test(entry.name)
			// Only contains usage examples in comments.
			&& fullPath !== path.join(srcDir, 'localization.ts')
		) {
			result.push(fullPath);
		}
	}
	return result.sort();
};

const extractMessages = () => {
	// Map of "context\u0004msgid" => { msgctxt, msgid, references }
	const messages = new Map();
	for (const file of listSourceFiles(srcDir)) {
		const source = fs.readFileSync(file, 'utf8');
		const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
		for (const { regex, hasContext } of callRegexes) {
			for (const match of source.matchAll(regex)) {
				const msgctxt = hasContext ? decodeLiteral(match[1]) : '';
				const msgid = decodeLiteral(hasContext ? match[2] : match[1]);
				const line = source.slice(0, match.index).split('\n').length;
				const key = `${msgctxt}\u0004${msgid}`;
				if (!messages.has(key)) {
					messages.set(key, { msgctxt, msgid, references: [] });
				}
				messages.get(key).references.push(`${relativePath}:${line}`);
			}
		}
	}
	return messages;
};

const buildTranslations = (messages, existing) => {
	const translations = { '': { '': existing?.['']?.[''] ?? { msgid: '', msgstr: [''] } } };
	const sorted = [...messages.values()].sort((a, b) => {
		return a.references[0].localeCompare(b.references[0], 'en', { numeric: true });
	});
	for (const { msgctxt, msgid, references } of sorted) {
		const previous = existing?.[msgctxt]?.[msgid];
		const entry = {
			msgid,
			msgstr: previous?.msgstr ?? [''],
			comments: {
				...(previous?.comments?.translator ? { translator: previous.comments.translator } : {}),
				reference: references.join('\n'),
				...(msgid.includes('%s') ? { flag: 'javascript-format' } : {}),
			},
		};
		if (msgctxt) entry.msgctxt = msgctxt;
		translations[msgctxt] ??= {};
		translations[msgctxt][msgid] = entry;
	}
	return translations;
};

const compilePo = (data) => po.compile(data, { foldLength: 0, sort: false }).toString('utf8') + '\n';

const messages = extractMessages();

const templateHeaders = {
	'Project-Id-Version': 'joplin-plugin-extra-editor-settings-i18n',
	'Content-Type': 'text/plain; charset=UTF-8',
	'Content-Transfer-Encoding': '8bit',
	'MIME-Version': '1.0',
};
const template = compilePo({
	charset: 'utf-8',
	headers: templateHeaders,
	translations: buildTranslations(messages, null),
});

if (checkOnly) {
	const current = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf8') : '';
	if (current.replace(/\r\n/g, '\n') !== template) {
		console.error('locales/template.pot is out of date. Run "npm run extractStrings".');
		process.exit(1);
	}
} else {
	fs.mkdirSync(localesDir, { recursive: true });
	fs.writeFileSync(templatePath, template);
	console.log(`Wrote ${path.relative(rootDir, templatePath)} (${messages.size} messages)`);
}

// Merge into each .po file and report untranslated entries.
let hasMissing = false;
for (const file of fs.readdirSync(localesDir).filter(f => f.endsWith('.po')).sort()) {
	const poPath = path.join(localesDir, file);
	const parsed = po.parse(fs.readFileSync(poPath));
	const translations = buildTranslations(messages, parsed.translations);
	let missing = 0;
	for (const context of Object.values(translations)) {
		for (const [msgid, entry] of Object.entries(context)) {
			if (msgid && !entry.msgstr[0]) missing++;
		}
	}
	hasMissing ||= missing > 0;
	console.log(`${file}: ${messages.size - missing}/${messages.size} translated`);
	if (!checkOnly) {
		fs.writeFileSync(poPath, compilePo({ charset: 'utf-8', headers: parsed.headers, translations }));
	}
}

if (checkOnly && hasMissing) {
	console.error('Some translations are missing.');
	process.exit(1);
}
