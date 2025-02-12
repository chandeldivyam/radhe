import type { EditorThemeClasses } from 'lexical';

export const theme: EditorThemeClasses = {
  ltr: 'ltr',
  rtl: 'rtl',
  root: 'editor-root',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-code',
  },
  list: {
    checklist: 'editor-checklist',
    listitem: 'editor-list-item',
    listitemChecked: 'editor-list-item-checked',
    listitemUnchecked: 'editor-list-item-unchecked',
    nested: {
      listitem: 'editor-nested-list-item',
    },
    olDepth: [
      'editor-ol1',
      'editor-ol2',
      'editor-ol3',
      'editor-ol4',
      'editor-ol5',
    ],
    ul: 'editor-ul',
  },
  link: 'editor-link',
  editorPlaceholder: 'editor-placeholder',
  hr: 'editor-hr',
};
