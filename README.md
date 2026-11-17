# Extended Markdown editor settings

> [!IMPORTANT]
> **Unofficial i18n test build.** This fork ([akiratamcat/joplin-plugin-extra-editor-settings](https://github.com/akiratamcat/joplin-plugin-extra-editor-settings)) is a personal test version that localizes the plugin UI with gettext PO files and follows Joplin's language setting. It uses a different plugin ID (`io.github.akiratamcat.codemirror6-settings-i18n`) from the original. Disable the original plugin while testing this build. The original plugin is by Henry Heino: [personalizedrefrigerator/joplin-plugin-extra-editor-settings](https://github.com/personalizedrefrigerator/joplin-plugin-extra-editor-settings).
>
> **非公式の UI 翻訳テスト版です。** この fork は、gettext の PO ファイルでプラグインの UI を翻訳し、Joplin の言語設定に合わせて表示言語を切り替える個人的なテスト版です。プラグイン ID がオリジナルと異なるため、テストの際はオリジナル版を無効にしてください。原作者は Henry Heino 氏です。

## Translations (i18n test build)

Translations are stored as gettext catalogs in [`locales/`](./locales/) (`template.pot` and `<locale>.po`). The UI language follows Joplin's language setting (*Tools > Options > General > Language*), falling back to English.

Supported: Japanese (`ja_JP`), Chinese Simplified (`zh_CN`), Chinese Traditional (`zh_TW`), Korean (`ko_KR`), German (`de_DE`), French (`fr_FR`), Spanish (`es_ES`), Italian (`it_IT`), Portuguese (Brazil) (`pt_BR`), Russian (`ru_RU`), Croatian (`hr_HR`).

Except for the existing Croatian translation (by Milo Ivir), the translations are machine-assisted (AI-generated) and have not been reviewed by native speakers.

- `npm run extractStrings`: Extracts `_('...')` / `_c('context', '...')` strings from `src/` into `locales/template.pot` and merges them into every `.po` file.
- `npm run checkStrings`: Fails if `template.pot` is out of date or any translation is missing.
- `npm run compileLocales`: Compiles the `.po` files into `src/locales/generated.json` (runs automatically before `npm run dist` and `npm test`).

To add a language, copy `locales/template.pot` to `locales/<locale>.po` (e.g. `nl_NL.po`), fill in the `msgstr` values, and rebuild.

This plugin adds several additional Markdown editor settings. Many of these settings are built in to Joplin's [CodeMirror](https://codemirror.net/) editor.

**In Joplin Desktop < 3.1.x**: To use this plugin, first enable the beta editor in settings (Options > General > Opt in to the editor beta).

## Available settings

![Screenshot of Joplin Desktop's settings screen for the Extended Markdown editor settings plugin](./images/screenshot-settings.png)

- **Show line numbers**: Shows line numbers to the left of the editor.
- **Enable code folding**: Adds expand/collapse buttons to the editor gutter.
- **Enable autocomplete**: Shows a completion dialog in certain code blocks.
- **Highlight the gutter for the active line**: If a gutter is shown (e.g. for line numbers), the gutter for the current line is shown in a different color.
- **Highlight spaces**: Makes spaces and tabs visible.
- **Highlight trailing spaces**: Highlights space characters at the end of lines.
- **Highlight selection matches**: If text is selected, other visible instances of the same text are highlighted.
- **Show background grid pattern**: Shows a grid pattern behind the editor's content.
- **Show word count**: Adds a panel that shows the number of words in the open note. This number is calculated differently from Joplin's built-in word counter.
- **Show visual sync indicator**: Shows an icon or text panel that indicates Joplin's current sync status.
- **Hide Markdown**: Hides or replaces formatting markup. For example, clickable checkboxes added to the start of items in checklist markup.
- **Text direction** (advanced): Allows setting the editor's text direction to right-to-left or left-to-right for all lines, regardless of system language settings.

### More information: The "Hide Markdown" setting

The "Hide Markdown" setting hides or replaces Markdown on lines that don't contain the cursor.

In particular, setting "Hide Markdown" to "Some", makes the following changes:
- **Checkbox markup:** Replaced with checkboxes:   
  ![screenshot: Checkboxes are shown to the left of checklist items](https://github.com/user-attachments/assets/a1e31328-e50c-4434-991d-57e2baa88248)
- **Links:** In links in `[title](url)` format, URLs and brackets are hidden:  
  ![screenshot: Link URLs are hidden when the cursor is on a different line](https://github.com/user-attachments/assets/e7394fed-db23-4d25-a7c2-3570ab39f486)  
  At present, clicking links does not follow them, but clicking their optional tooltip does (Options → Plugins → Extra Markdown editor settings → enable "Show link tooltip"), making following markdown links possible in markdown editor mode on mobile.
- **Headings:** `#`s are hidden:  
   ![screenshot: A Markdown heading labeled "Test" with a "#" character, headings level 1-4 shown without.](https://github.com/user-attachments/assets/d2841a34-aa32-45dd-9611-40a37bb8cc95)  
   Above, the cusror is on the same line as the `# Test` heading. As a result, its leading `#` markup is visible.
- **Bold/italic/code markup:** Formatting characters (e.g. `**`) are hidden:  
  ![screenshot: "Bold, italic, and code" repeated twice. First, with formatting characters, second without.](https://github.com/user-attachments/assets/821b6bcc-3338-43cc-a1a0-f927b50c399c)
- **Blockquotes:** `>`s are hidden:  
  ![screenshot: Blockquote containing "This is a blockquote!" is shown twice. The first time with the leading ">", the second time without.](https://github.com/user-attachments/assets/d15c10f9-2d8c-4f27-8c87-b6801bf528c2)
- **HTML comment lines:** `<!-- comment -->` are hidden:  
  ![screenshot: html comment on a single line](./images/screenshot_comment_single_line.png)
- **HTML comment blocks** are hidden:  
  ![screenshot: html comment over multiple lines](./images/screenshot_comment_multi_line.png)

