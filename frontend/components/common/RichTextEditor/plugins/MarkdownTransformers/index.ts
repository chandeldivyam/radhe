import { ElementTransformer } from '@lexical/markdown';
import {
	$isImageNode,
	ImageNode,
	$createImageNode,
} from '../../nodes/ImageNode';
import {
	ELEMENT_TRANSFORMERS,
	TEXT_FORMAT_TRANSFORMERS,
	TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown';
import { LexicalNode } from 'lexical';
import {
	$createAiSuggestionsNode,
	$isAiSuggestionsNode,
	SuggestionType,
} from '../../nodes/AiSuggestionsNode';

export const IMAGE: ElementTransformer = {
	dependencies: [ImageNode],
	export: (node: LexicalNode) => {
		console.log('node', node);
		if (!$isImageNode(node)) {
			return null;
		}
		return `![${node.__altText}](${node.__src})`;
	},
	regExp: /!\[([^[]*)\]\(([^()]+)\)$/,
	replace: (parentNode, children, match) => {
		const [, altText, src] = match; // Destructure the regex capture groups
		const imageNode = $createImageNode({
			altText,
			src,
		});
		parentNode.replace(imageNode);
	},
	type: 'element',
};

export const AI_SUGGESTION: ElementTransformer = {
	dependencies: [],
	export: (node: LexicalNode) => {
		if (!$isAiSuggestionsNode(node)) {
			return null;
		}
		const suggestionType = node.__suggestionType;
		const markdown = node.__markdown;
		const targetNodeKey = node.__targetNodeKey;
		const modifiedMarkdown = node.__modifiedMarkdown;

		switch (suggestionType) {
			case 'add':
				return `[[suggestion:add|${markdown}]]`;
			case 'delete':
				return `[[suggestion:delete|targetNodeKey=${targetNodeKey}]]`;
			case 'modify':
				return `[[suggestion:modify|targetNodeKey=${targetNodeKey}|${modifiedMarkdown}]]`;
			default:
				return null;
		}
	},
	regExp: /\[\[suggestion:(add|delete|modify)\|([^|]*)(?:\|([^|]*))?\]\]$/,
	replace: (parentNode, children, match) => {
		const [, suggestionType, arg1, arg2] = match;
		let suggestionNode;

		switch (suggestionType as SuggestionType) {
			case 'add':
				suggestionNode = $createAiSuggestionsNode('add', arg1);
				break;
			case 'delete':
				const [, targetNodeKey] =
					arg1.match(/targetNodeKey=([^|]+)/) || [];
				suggestionNode = $createAiSuggestionsNode(
					'delete',
					undefined,
					targetNodeKey
				);
				break;
			case 'modify':
				const [, targetNodeKeyMatch] =
					arg1.match(/targetNodeKey=([^|]+)/) || [];
				suggestionNode = $createAiSuggestionsNode(
					'modify',
					undefined,
					targetNodeKeyMatch,
					arg2
				);
				break;
		}

		if (suggestionNode) {
			parentNode.replace(suggestionNode);
		}
	},
	type: 'element',
};

export const TRANSFORMERS = [
	IMAGE,
	AI_SUGGESTION,
	...ELEMENT_TRANSFORMERS,
	...TEXT_FORMAT_TRANSFORMERS,
	...TEXT_MATCH_TRANSFORMERS,
];
