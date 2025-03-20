// In ./frontend/components/common/RichTextEditor/plugins/AiSuggestionPlugin/index.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
	COMMAND_PRIORITY_EDITOR,
	createCommand,
	$getRoot,
	$getNodeByKey,
} from 'lexical';
import {
	$createSuggestionNode,
	SuggestionType,
} from '../../nodes/SuggestionNode';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '../MarkdownTransformers';
import type { JSX } from 'react';

export const INSERT_SUGGESTION_COMMAND = createCommand<{
	suggestionType: SuggestionType;
	markdown?: string;
	targetNodeKey?: string;
}>('INSERT_SUGGESTION');

export function SuggestionPlugin(): JSX.Element | null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterCommand = editor.registerCommand(
			INSERT_SUGGESTION_COMMAND,
			({ suggestionType, markdown, targetNodeKey }) => {
				editor.update(() => {
					const suggestionNode =
						$createSuggestionNode(suggestionType);
					switch (suggestionType) {
						case 'add':
							// Convert markdown to nodes and append as children
							if (!markdown) {
								console.error(
									'No markdown provided for add suggestion'
								);
								return null;
							}
							$convertFromMarkdownString(
								markdown,
								TRANSFORMERS,
								suggestionNode
							);

							if (targetNodeKey) {
								const targetNode = $getNodeByKey(targetNodeKey);
								if (targetNode) {
									targetNode.insertAfter(suggestionNode);
								}
							} else {
								const root = $getRoot();
								const firstChild = root.getFirstChild();
								if (firstChild) {
									firstChild.insertBefore(suggestionNode);
								} else {
									root.append(suggestionNode);
								}
							}
							break;
						case 'delete':
							if (!targetNodeKey) {
								console.error(
									'No target node key provided for delete suggestion'
								);
								return;
							}
							const targetNode = $getNodeByKey(targetNodeKey);
							if (targetNode) {
								// We need to put the target node inside the suggestion node
								targetNode.insertAfter(suggestionNode);
								suggestionNode.append(targetNode);
								// Put the suggestion node after the target node
							}
							break;
					}
					// Convert markdown to nodes and append as children
				});
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		);

		return () => unregisterCommand();
	}, [editor]);

	return null;
}
