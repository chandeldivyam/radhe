import { $getRoot, LexicalEditor } from 'lexical';
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
} from '@lexical/markdown';
import { TRANSFORMERS } from './plugins/MarkdownTransformers';

export function exportMarkdown(editor: LexicalEditor): string {
	let markdown = '';
	editor.update(() => {
		markdown = $convertToMarkdownString(TRANSFORMERS);
	});
	return markdown;
}

/**
 * Converts the entire editor content to markdown
 */
export function editorStateToMarkdown(editor: LexicalEditor): string {
	return editor.getEditorState().read(() => {
		const root = $getRoot();
		return $convertToMarkdownString(TRANSFORMERS, root);
	});
}

/**
 * Replaces the entire editor content with content from markdown
 */
export function markdownToEditorState(
	editor: LexicalEditor,
	markdown: string
): void {
	editor.update(() => {
		const root = $getRoot();
		root.clear();
		$convertFromMarkdownString(markdown, TRANSFORMERS, root);
	});
}

/**
 * Serializes editor state to JSON that can be stored or transmitted
 */
export function serializeEditorState(editor: LexicalEditor): string {
	return JSON.stringify(editor.getEditorState().toJSON());
}

/**
 * Deserializes JSON back to editor state
 */
export function deserializeEditorState(
	editor: LexicalEditor,
	serialized: string
): void {
	const editorState = editor.parseEditorState(serialized);
	editor.setEditorState(editorState);
}
