import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertToMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '../MarkdownTransformers';
import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import axios from 'axios';

interface EditorContentSaverPluginProps {
	noteId?: string;
	debounceTime?: number;
}

export function EditorContentSaverPlugin({
	noteId,
	debounceTime = 5000,
}: EditorContentSaverPluginProps): JSX.Element | null {
	const [editor] = useLexicalComposerContext();
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedContentRef = useRef<string>('');

	// Save markdown content to the note with debouncing
	useEffect(() => {
		if (!noteId) return;

		// Listen for changes in the editor
		const removeUpdateListener = editor.registerUpdateListener(
			({ editorState }) => {
				// Clear any existing timer
				if (debounceTimerRef.current) {
					clearTimeout(debounceTimerRef.current);
				}

				// Set a new timer to save after the debounce period
				debounceTimerRef.current = setTimeout(async () => {
					try {
						// Convert the current editor state to markdown
						let markdown = '';
						editorState.read(() => {
							markdown = $convertToMarkdownString(TRANSFORMERS);
						});

						// Only save if content has changed and is not empty
						if (
							markdown.trim() &&
							markdown !== lastSavedContentRef.current
						) {
							// Send the markdown to the backend
							await axios.patch(`/api/notes/${noteId}`, {
								content: markdown,
							});

							console.log('Note content saved successfully');
							lastSavedContentRef.current = markdown;
						}
					} catch (error) {
						console.error('Error saving note content:', error);
					}
				}, debounceTime);
			}
		);

		// Clean up the listener and any pending timers when the component unmounts
		return () => {
			removeUpdateListener();
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [editor, noteId, debounceTime]);

	return null;
}
