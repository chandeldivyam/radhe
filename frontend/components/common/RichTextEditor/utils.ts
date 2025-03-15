import { $convertToMarkdownString } from '@lexical/markdown';
import { LexicalEditor } from 'lexical';
import { TRANSFORMERS } from './plugins/MarkdownTransformers';

export function exportMarkdown(editor: LexicalEditor): string {
	let markdown = '';
	editor.update(() => {
		markdown = $convertToMarkdownString(TRANSFORMERS);
	});
	return markdown;
}
