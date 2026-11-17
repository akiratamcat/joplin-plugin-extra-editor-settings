import joplin from "api";
import { SettingItem, SettingItemType, SettingStorage } from "api/types";
import { HideMarkdownMode, PluginSettings, SyncIndicatorMode, TextDirection } from "./types";
import { _, _c } from "./localization";
import { isMobile } from "./utils/isMobile";
import isVersionGreater from "./utils/isVersionGreater";

export const registerSettings = async (applySettings: (settings: PluginSettings)=>void) => {
	const sectionName = 'codemirror6-extended-options';
	await joplin.settings.registerSection(sectionName, {
		label: _('Extra editor settings'),
		description: _('Additional settings for Joplin\'s beta and mobile Markdown editors.'),
		iconName: 'fas fa-edit',
	});
	const onMobile = await isMobile();
	const version = (await joplin.versionInfo()).version;
	// Only some of the 3.2 pre-releases support the renderMarkup command.
	// For now, assume any 3.2 release supports it, since renderMarkup was added in
	// different versions on different platforms.
	const supportsExtendedRender = isVersionGreater(version, '3.2.0');

	const defaultSettingOptions = {
		section: sectionName,
		public: true,
		type: SettingItemType.Bool,
		storage: SettingStorage.File,
	};

	const settingsSpec: Record<keyof PluginSettings, SettingItem> = {
		lineNumbers: {
			...defaultSettingOptions,
			value: true,
			label: _('Show line numbers'),
		},
		codeFolding: {
			...defaultSettingOptions,
			value: false,
			label: _('Enable code folding'),
		},
		enableAutocomplete: {
			...defaultSettingOptions,
			value: false,
			label: _('Enable autocomplete'),
		},
		highlightActiveLineGutter: {
			...defaultSettingOptions,
			value: true,
			label: _('Highlight the gutter for the active line'),
			description: _('Requires "show line numbers" to be enabled.'),
		},
		highlightActiveLine: {
			...defaultSettingOptions,
			value: false,
			label: _('Highlight active line'),
		},
		highlightSpaces: {
			...defaultSettingOptions,
			value: false,
			label: _('Highlight spaces'),
		},
		highlightTrailingSpaces: {
			...defaultSettingOptions,
			value: false,
			label: _('Highlight trailing spaces'),
		},
		highlightSelectionMatches: {
			...defaultSettingOptions,
			value: false,
			label: _('Highlight selection matches'),
		},
		bracketMatching: {
			...defaultSettingOptions,
			value: false,
			label: _('Highlight matching brackets'),
		},
		editorMaximumWidth: {
			...defaultSettingOptions,
			public: onMobile,

			value: 'none',

			options: {
				['none']: _c('editor maximum width', 'None'),
				['300px']: _('%s (small)', '300'),
				['400px']: '400',
				['500px']: '500',
				['600px']: '600',
				['800px']: '800',
				['1000px']: '1000',
				['1500px']: _('%s (large)', '1500'),
			},

			type: SettingItemType.String,
			isEnum: true,
			label: _('Editor maximum width'),
			description: _('Setting this to a positive number (e.g. 600) centers the editor and prevents it from having a width larger than this size. Set this to "none" for the editor to fill the screen.'),
		},
		gridPattern: {
			...defaultSettingOptions,
			value: false,
			label: _('Show background grid pattern'),
		},
		wordCount: {
			...defaultSettingOptions,
			value: false,
			label: _('Show word count'),
		},
		syncIndicator: {
			...defaultSettingOptions,
			type: SettingItemType.String,
			value: SyncIndicatorMode.NotShown,
			label: _('Show visual sync indicator'),
			description: _('Shows the sync status in the Markdown editor.'),
			isEnum: true,
			options: {
				[SyncIndicatorMode.NotShown]: _c('sync indicator', 'No'),
				[SyncIndicatorMode.Text]: _('With text'),
				[SyncIndicatorMode.Icon]: _('With an icon'),
			},
		},
		hideMarkdown: {
			...defaultSettingOptions,
			type: SettingItemType.String,

			value: HideMarkdownMode.None,
			label: _('Hide Markdown'),
			description: _('Hides/replaces certain Markdown characters when the cursor is on a different line.\n\nWhen set to "Some", only some Markup is rendered. When set to "More", somewhat more Markup is rendered, though may not be rendered correctly.'),
			isEnum: true,
			options: {
				[HideMarkdownMode.None]: _c('hide markdown', 'None'),
				[HideMarkdownMode.Some]: _('Some'),
				...(supportsExtendedRender ? {
					[HideMarkdownMode.More]: _('More (experimental)'),
				} : {}),
			},
		},
		showLinkTooltip: {
			...defaultSettingOptions,
			value: false,
			label: _('Show link tooltip'),
			description: _('Shows tooltips that allow opening links under the cursor'),
		},
		textDirection: {
			...defaultSettingOptions,
			type: SettingItemType.String,

			advanced: true,
			value: TextDirection.Auto,
			label: _('Text direction'),
			description: _('Overrides the default direction of text in the CodeMirror editor. For most users, this should be set to "auto".'),
			isEnum: true,
			options: {
				[TextDirection.Auto]: _('Auto'),
				[TextDirection.LeftToRight]: _('Left-to-right'),
				[TextDirection.RightToLeft]: _('Right-to-left'),
			},
		},
	};

	const readSettings = async () => {
		const result: Record<string, any> = {};
		for (const key in settingsSpec) {
			result[key] = (await joplin.settings.value(key)) ?? true;
		}
		return result as PluginSettings;
	};
	await joplin.settings.registerSettings(settingsSpec);
	await joplin.settings.onChange(async () => {
		applySettings(await readSettings());
	});

	const settings = await readSettings();
	applySettings(settings);
	return settings;
};