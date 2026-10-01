import type { Monaco } from '@monaco-editor/react';

export type EditorTheme = 'github-dark-pro' | 'dracula-cyber' | 'one-dark-pro' | 'nord-frost' | 'vs-dark';

export function defineMonacoThemes(monaco: Monaco) {
  // 1. One Dark Pro (Atom Classic - Most Popular Dev Theme)
  monaco.editor.defineTheme('one-dark-pro', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // XML Tokens
      { token: 'tag.xml', foreground: 'e06c75', fontStyle: 'bold' },
      { token: 'tag.name.xml', foreground: 'e06c75' },
      { token: 'tag.id.xml', foreground: 'e06c75' },
      { token: 'tag', foreground: 'e06c75' },
      { token: 'attribute.name.xml', foreground: 'd19a66' },
      { token: 'attribute.name', foreground: 'd19a66' },
      { token: 'attribute.value.xml', foreground: '98c379' },
      { token: 'attribute.value', foreground: '98c379' },
      { token: 'string.xml', foreground: '98c379' },
      { token: 'string', foreground: '98c379' },
      { token: 'delimiter.xml', foreground: 'abb2bf' },
      { token: 'delimiter', foreground: 'abb2bf' },
      { token: 'cdata.xml', foreground: '56b6c2' },
      { token: 'comment.xml', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'metatag.xml', foreground: 'e06c75' },
      { token: 'metatag', foreground: 'e06c75' },
      { token: 'metatag.content.xml', foreground: 'd19a66' },
      // JSON & General Tokens
      { token: 'string.key.json', foreground: 'e06c75' },
      { token: 'string.value.json', foreground: '98c379' },
      { token: 'number.json', foreground: 'd19a66' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'keyword.json', foreground: 'c678dd' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'delimiter.bracket.json', foreground: 'abb2bf' },
      { token: 'delimiter.array.json', foreground: 'abb2bf' },
      { token: 'delimiter.comma.json', foreground: 'abb2bf' },
      { token: 'delimiter.colon.json', foreground: 'abb2bf' },
      { token: '', foreground: 'abb2bf' }, // inner text / default
    ],
    colors: {
      'editor.background': '#21252b',
      'editor.foreground': '#abb2bf',
      'editorLineNumber.foreground': '#4b5263',
      'editorLineNumber.activeForeground': '#c8ccd4',
      'editor.selectionBackground': '#3e4451',
      'editor.lineHighlightBackground': '#282c34',
      'editorCursor.foreground': '#528bff',
      'editorWhitespace.foreground': '#3b4048',
      'editorIndentGuide.background': '#3b4048',
      'editorIndentGuide.activeBackground': '#5c6370',
    }
  });

  // Alias onedark-pro to one-dark-pro in case either is queried
  monaco.editor.defineTheme('onedark-pro', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'tag.xml', foreground: 'e06c75', fontStyle: 'bold' },
      { token: 'tag.name.xml', foreground: 'e06c75' },
      { token: 'tag.id.xml', foreground: 'e06c75' },
      { token: 'tag', foreground: 'e06c75' },
      { token: 'attribute.name.xml', foreground: 'd19a66' },
      { token: 'attribute.name', foreground: 'd19a66' },
      { token: 'attribute.value.xml', foreground: '98c379' },
      { token: 'attribute.value', foreground: '98c379' },
      { token: 'string.xml', foreground: '98c379' },
      { token: 'string', foreground: '98c379' },
      { token: 'delimiter.xml', foreground: 'abb2bf' },
      { token: 'delimiter', foreground: 'abb2bf' },
      { token: 'cdata.xml', foreground: '56b6c2' },
      { token: 'comment.xml', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'metatag.xml', foreground: 'e06c75' },
      { token: 'metatag', foreground: 'e06c75' },
      { token: 'metatag.content.xml', foreground: 'd19a66' },
      { token: 'string.key.json', foreground: 'e06c75' },
      { token: 'string.value.json', foreground: '98c379' },
      { token: 'number.json', foreground: 'd19a66' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'keyword.json', foreground: 'c678dd' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: '', foreground: 'abb2bf' },
    ],
    colors: {
      'editor.background': '#21252b',
      'editor.foreground': '#abb2bf',
      'editorLineNumber.foreground': '#4b5263',
      'editorLineNumber.activeForeground': '#c8ccd4',
      'editor.selectionBackground': '#3e4451',
      'editor.lineHighlightBackground': '#282c34',
    }
  });

  // 2. GitHub Dark Pro (High Readability)
  monaco.editor.defineTheme('github-dark-pro', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'tag.xml', foreground: '79c0ff', fontStyle: 'bold' },
      { token: 'tag.name.xml', foreground: '79c0ff' },
      { token: 'tag', foreground: '79c0ff' },
      { token: 'attribute.name.xml', foreground: 'd2a8ff' },
      { token: 'attribute.name', foreground: 'd2a8ff' },
      { token: 'attribute.value.xml', foreground: 'a5d6ff' },
      { token: 'attribute.value', foreground: 'a5d6ff' },
      { token: 'string.xml', foreground: 'a5d6ff' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'string.key.json', foreground: '79c0ff' },
      { token: 'string.value.json', foreground: 'a5d6ff' },
      { token: 'number.json', foreground: '79c0ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'keyword.json', foreground: 'ff7b72' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'cdata.xml', foreground: 'e3b341' },
      { token: 'comment.xml', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'delimiter.xml', foreground: '8b949e' },
      { token: 'delimiter', foreground: '8b949e' },
      { token: '', foreground: 'f0f6fc' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#f0f6fc',
      'editorLineNumber.foreground': '#484f58',
      'editorLineNumber.activeForeground': '#e6edf3',
      'editor.selectionBackground': '#264f78',
      'editor.lineHighlightBackground': '#161b22',
    }
  });

  // 3. Dracula Cyber (High Contrast & Vibrant)
  monaco.editor.defineTheme('dracula-cyber', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'tag.xml', foreground: 'ff79c6', fontStyle: 'bold' },
      { token: 'tag.name.xml', foreground: 'ff79c6' },
      { token: 'tag', foreground: 'ff79c6' },
      { token: 'attribute.name.xml', foreground: '8be9fd' },
      { token: 'attribute.name', foreground: '8be9fd' },
      { token: 'attribute.value.xml', foreground: 'f1fa8c' },
      { token: 'attribute.value', foreground: 'f1fa8c' },
      { token: 'string.xml', foreground: 'f1fa8c' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'string.key.json', foreground: '8be9fd' },
      { token: 'string.value.json', foreground: 'f1fa8c' },
      { token: 'number.json', foreground: 'bd93f9' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'keyword.json', foreground: 'ff79c6' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'cdata.xml', foreground: 'ffb86c' },
      { token: 'comment.xml', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'delimiter.xml', foreground: '6272a4' },
      { token: 'delimiter', foreground: '6272a4' },
      { token: '', foreground: 'f8f8f2' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#6272a4',
      'editorLineNumber.activeForeground': '#f8f8f2',
      'editor.selectionBackground': '#44475a',
      'editor.lineHighlightBackground': '#21222c',
    }
  });

  // 4. Nord Frost (Arctic Cool)
  monaco.editor.defineTheme('nord-frost', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'tag.xml', foreground: '88c0d0', fontStyle: 'bold' },
      { token: 'tag.name.xml', foreground: '88c0d0' },
      { token: 'tag', foreground: '88c0d0' },
      { token: 'attribute.name.xml', foreground: '81a1c1' },
      { token: 'attribute.name', foreground: '81a1c1' },
      { token: 'attribute.value.xml', foreground: 'a3be8c' },
      { token: 'attribute.value', foreground: 'a3be8c' },
      { token: 'string.xml', foreground: 'a3be8c' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'string.key.json', foreground: '88c0d0' },
      { token: 'string.value.json', foreground: 'a3be8c' },
      { token: 'number.json', foreground: 'b48ead' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'keyword.json', foreground: '81a1c1' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'cdata.xml', foreground: 'd08770' },
      { token: 'comment.xml', foreground: '4c566a', fontStyle: 'italic' },
      { token: 'comment', foreground: '4c566a', fontStyle: 'italic' },
      { token: 'delimiter.xml', foreground: '4c566a' },
      { token: 'delimiter', foreground: '4c566a' },
      { token: '', foreground: 'eceff4' },
    ],
    colors: {
      'editor.background': '#242933',
      'editor.foreground': '#eceff4',
      'editorLineNumber.foreground': '#4c566a',
      'editorLineNumber.activeForeground': '#d8dee9',
      'editor.selectionBackground': '#434c5e',
      'editor.lineHighlightBackground': '#2e3440',
    }
  });
}
