import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getNodeByKey } from 'lexical';
import { useState } from 'react';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '../../plugins/MarkdownTransformers';
import { AiSuggestionsNode, SuggestionType } from './index';
import type { JSX } from 'react';

interface AiSuggestionComponentProps {
	suggestionType: SuggestionType;
	markdown?: string;
	targetNodeKey?: string;
	modifiedMarkdown?: string;
	nodeKey: string;
}

export function AiSuggestionComponent({
	suggestionType,
	markdown,
	targetNodeKey,
	modifiedMarkdown,
	nodeKey,
}: AiSuggestionComponentProps): JSX.Element {
	const [editor] = useLexicalComposerContext();
	const [isHovering, setIsHovering] = useState(false);

	const renderSuggestionContent = () => {
		switch (suggestionType) {
			case 'add':
				return <span>{markdown}</span>;
			case 'delete':
				return <span>Delete this content?</span>;
			case 'modify': {
				return (
					<span>
						<span>Modified:</span>
						<span>{modifiedMarkdown}</span>
					</span>
				);
			}
			default:
				return null;
		}
	};

	const handleAccept = () => {
		editor.update(() => {
			const suggestionNode = $getNodeByKey(nodeKey);
			if (
				!suggestionNode ||
				!(suggestionNode instanceof AiSuggestionsNode)
			)
				return;

			switch (suggestionType) {
				case 'add':
					if (markdown) {
						// Convert markdown to nodes under a temporary parent
						const tempParagraph = $createParagraphNode();
						$convertFromMarkdownString(
							markdown,
							TRANSFORMERS,
							tempParagraph
						);

						// Get all converted children
						const newNodes = tempParagraph.getChildren();

						// Insert all new nodes after the parent
						newNodes.reverse().forEach((node) => {
							suggestionNode.insertAfter(node); // Changed to insert after the parent directly
						});

						// Remove the original suggestion node and its parent paragraph
						suggestionNode.remove();
					}
					break;
				case 'delete':
					if (targetNodeKey) {
						const targetNode = $getNodeByKey(targetNodeKey);
						if (targetNode) {
							// We previously removed it, but when we do undo, these is something breaking in lexical yjs `Uncaught Error: splice: could not find collab element node`
							const emptyParagraph = $createParagraphNode();
							targetNode.replace(emptyParagraph);
						}
					}
					suggestionNode.remove();
					break;
				case 'modify':
					if (targetNodeKey && modifiedMarkdown) {
						const targetNode = $getNodeByKey(targetNodeKey);
						if (targetNode) {
							const tempParagraph = $createParagraphNode();
							$convertFromMarkdownString(
								modifiedMarkdown,
								TRANSFORMERS,
								tempParagraph
							);
							const newNodes = tempParagraph.getChildren();
							newNodes.reverse().forEach((node) => {
								targetNode.insertAfter(node);
							});
							targetNode.remove();
						}
					}
					suggestionNode.remove();
					break;
			}
		});
	};

	const handleReject = () => {
		editor.update(() => {
			const suggestionNode = $getNodeByKey(nodeKey);
			suggestionNode?.remove();
		});
	};

	return (
		<div
			className="ai-suggestion-container"
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			{renderSuggestionContent()}
			{isHovering && (
				<div className="ai-suggestion-controls">
					<button
						className="ai-suggestion-button"
						onClick={handleAccept}
					>
						✓ Accept
					</button>
					<button
						className="ai-suggestion-button"
						onClick={handleReject}
					>
						✗ Reject
					</button>
				</div>
			)}
		</div>
	);
}
