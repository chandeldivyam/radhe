import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$insertNodes,
	createCommand,
	LexicalCommand,
	COMMAND_PRIORITY_EDITOR,
	$getSelection,
	$isRangeSelection,
	$createParagraphNode,
	$getNodeByKey,
} from 'lexical';
import { useCallback, useEffect } from 'react';
import { $createImageNode, $isImageNode } from '../../nodes/ImageNode';
import { useAuth } from '@/lib/auth/authContext';
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
	const { user } = useAuth();

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

	const uploadFile = useCallback(
		(file: File, nodeKey: string) => {
			if (!user?.id || !user?.organization_id) {
				console.error('User not authenticated');
				return;
			}

			const formData = new FormData();
			formData.append('file', file);
			formData.append('userId', user.id);
			formData.append('organizationId', user.organization_id);

			const xhr = new XMLHttpRequest();

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					const percentComplete = Math.round(
						(event.loaded / event.total) * 100
					);
					editor.update(() => {
						const node = $getNodeByKey(nodeKey);
						if ($isImageNode(node)) {
							node.setUploadProgress(percentComplete);
						}
					});
				}
			};

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						const response = JSON.parse(xhr.responseText);
						const imageUrl = response.public_url;
						editor.update(() => {
							const node = $getNodeByKey(nodeKey);
							if ($isImageNode(node)) {
								node.setLoading(false);
								node.setSrc(imageUrl);
							}
						});
					} catch (e) {
						console.error('Error parsing JSON response:', e);
						editor.update(() => {
							const node = $getNodeByKey(nodeKey);
							if ($isImageNode(node)) {
								node.setLoading(false);
							}
						});
					}
				} else {
					console.error('Upload failed with status', xhr.status);
					editor.update(() => {
						const node = $getNodeByKey(nodeKey);
						if ($isImageNode(node)) {
							node.setLoading(false);
						}
					});
				}
			};

			xhr.onerror = () => {
				console.error('Network error');
				editor.update(() => {
					const node = $getNodeByKey(nodeKey);
					if ($isImageNode(node)) {
						node.setLoading(false);
					}
				});
			};

			xhr.open('POST', '/api/file/upload');
			xhr.send(formData);
		},
		[editor, user]
	);

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
					const imageNode = $createImageNode({
						src: '',
						altText: payload.altText || payload.file.name,
						isLoading: true,
						uploadProgress: 0,
					});

					let nodeKey: string | undefined;
					editor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							const anchorNode = selection.anchor.getNode();
							const blockNode =
								anchorNode.getTopLevelElementOrThrow();
							blockNode.insertAfter(imageNode);
							const newParagraph = $createParagraphNode();
							imageNode.insertAfter(newParagraph);
							newParagraph.select();
						} else {
							$insertNodes([imageNode]);
						}
						nodeKey = imageNode.getKey();
						console.log('nodeKey after insert', nodeKey);
						if (nodeKey && payload.file) {
							// Schedule the upload to happen after the update is committed
							queueMicrotask(() =>
								uploadFile(payload.file!, nodeKey!)
							);
						}
					});
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
