import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$insertNodes,
	createCommand,
	LexicalCommand,
	COMMAND_PRIORITY_EDITOR,
	$getSelection,
	$isRangeSelection,
	$createParagraphNode,
} from 'lexical';
import { useCallback, useEffect } from 'react';
import { $createImageNode } from '../../nodes/ImageNode';
import type { JSX } from 'react';

import './index.css';

// Command for inserting images
export type InsertImagePayload = {
	file?: File;
	src?: string;
	altText?: string;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
	createCommand('INSERT_IMAGE_COMMAND');

export function ImagePlugin(): JSX.Element {
	const [editor] = useLexicalComposerContext();

	// This function inserts an empty image node
	const insertEmptyImageNode = useCallback(() => {
		editor.update(() => {
			const imageNode = $createImageNode({
				altText: '',
				src: '',
			});

			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				// Get the current block-level node at the selection
				const anchorNode = selection.anchor.getNode();
				const blockNode = anchorNode.getTopLevelElementOrThrow();

				// Insert the image node after the current block
				blockNode.insertAfter(imageNode);

				// Create a new paragraph and insert it after the image
				const newParagraph = $createParagraphNode();
				imageNode.insertAfter(newParagraph);

				// Move the cursor to the new paragraph
				newParagraph.select();
			} else {
				// Fallback if no valid selection
				$insertNodes([imageNode]);
			}
		});
	}, [editor]);

	// Register the command
	useEffect(() => {
		return editor.registerCommand(
			INSERT_IMAGE_COMMAND,
			(payload: InsertImagePayload) => {
				// If we have a src directly, create a node with it
				if (payload.src) {
					editor.update(() => {
						const imageNode = $createImageNode({
							altText: payload.altText || '',
							src: payload.src || '',
						});

						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							const anchorNode = selection.anchor.getNode();
							const blockNode =
								anchorNode.getTopLevelElementOrThrow();

							// Insert the image node after the current block
							blockNode.insertAfter(imageNode);

							// Create a new paragraph and insert it after the image
							const newParagraph = $createParagraphNode();
							imageNode.insertAfter(newParagraph);

							// Move the cursor to the new paragraph
							newParagraph.select();
						} else {
							$insertNodes([imageNode]);
						}
					});
					return true;
				}

				// If we have a file, we'll let the ImageComponent handle it
				// Just insert an empty node if this is called from elsewhere
				if (payload.file) {
					console.warn(
						'File uploads should be handled by the ImageComponent'
					);
					insertEmptyImageNode();
					return true;
				}

				// Default case: insert an empty placeholder
				insertEmptyImageNode();
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		);
	}, [editor, insertEmptyImageNode]);

	return <></>;
}
