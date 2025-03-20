import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '../MarkdownTransformers';
import { useEffect } from 'react';
import { createCommand, LexicalCommand } from 'lexical';
import type { JSX } from 'react';
// Create a command to import markdown content
export const IMPORT_MARKDOWN_COMMAND: LexicalCommand<string> = createCommand(
	'IMPORT_MARKDOWN_COMMAND'
);

export function MarkdownToNotePlugin(): JSX.Element | null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		// Register command listener for importing markdown
		return editor.registerCommand<string>(
			IMPORT_MARKDOWN_COMMAND,
			(markdownString) => {
				editor.update(() => {
					// Convert markdown to editor nodes
					$convertFromMarkdownString(markdownString, TRANSFORMERS);
				});
				return true;
			},
			0 // Priority
		);
	}, [editor]);

	return null;
}
