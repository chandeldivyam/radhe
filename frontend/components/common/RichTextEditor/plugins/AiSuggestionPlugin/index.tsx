import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
	COMMAND_PRIORITY_EDITOR,
	createCommand,
	$getRoot,
	$getNodeByKey,
} from 'lexical';
import {
	$createAiSuggestionsNode,
	SuggestionType,
} from '../../nodes/AiSuggestionsNode';
import type { JSX } from 'react';

export const INSERT_AI_SUGGESTION_COMMAND = createCommand<{
	suggestionType: SuggestionType;
	markdown?: string;
	targetNodeKey?: string;
	modifiedMarkdown?: string;
}>('INSERT_AI_SUGGESTION');

export function AiSuggestionPlugin(): JSX.Element | null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterCommand = editor.registerCommand(
			INSERT_AI_SUGGESTION_COMMAND,
			({ suggestionType, markdown, targetNodeKey, modifiedMarkdown }) => {
				editor.update(() => {
					const suggestionNode = $createAiSuggestionsNode(
						suggestionType,
						markdown,
						targetNodeKey,
						modifiedMarkdown
					);

					if (targetNodeKey) {
						const targetNode = $getNodeByKey(targetNodeKey);
						if (targetNode) {
							targetNode.insertAfter(suggestionNode);
						}
					} else {
						// If no target node, insert it as first node of root
						const root = $getRoot();
						const firstChild = root.getFirstChild();
						if (firstChild) {
							firstChild.insertBefore(suggestionNode);
						} else {
							root.append(suggestionNode);
						}
					}
				});
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		);

		return () => unregisterCommand();
	}, [editor]);

	return null;
}
