import { ElementTransformer } from '@lexical/markdown';
import { LexicalNode } from 'lexical';
import {
	$isImageNode,
	ImageNode,
	$createImageNode,
} from '../../nodes/ImageNode';
import {
	ELEMENT_TRANSFORMERS,
	TEXT_FORMAT_TRANSFORMERS,
	TEXT_MATCH_TRANSFORMERS,
	MULTILINE_ELEMENT_TRANSFORMERS,
	$convertToMarkdownString,
	$convertFromMarkdownString,
} from '@lexical/markdown';
import {
	$isSuggestionNode,
	SuggestionNode,
	SuggestionType,
	$createSuggestionNode,
} from '../../nodes/SuggestionNode';

export const IMAGE: ElementTransformer = {
	dependencies: [ImageNode],
	export: (node: LexicalNode) => {
		if (!$isImageNode(node)) {
			return null;
		}
		return `![${node.__altText}](${node.__src})`;
	},
	regExp: /!\[([^[]*)\]\(([^()]+)\)$/,
	replace: (parentNode, children, match) => {
		const [, altText, src] = match;
		const imageNode = $createImageNode({
			altText,
			src,
		});
		parentNode.replace(imageNode);
	},
	type: 'element',
};

export const SUGGESTION: ElementTransformer = {
	dependencies: [SuggestionNode],
	export: (node: LexicalNode) => {
		if (!$isSuggestionNode(node)) {
			return null;
		}
		const suggestionType = node.__suggestionType;
		const childrenMarkdown = $convertToMarkdownString(TRANSFORMERS, node);
		// Replace newlines with a placeholder during export
		const singleLineContent = childrenMarkdown.replace(
			/\n/g,
			'__NEWLINE__'
		);
		return `[[suggestion:${suggestionType}|${singleLineContent}]]`;
	},
	regExp: /\[\[suggestion:(add|delete)\|([^|]*?)\]\]/, // Simplified: no newlines expected
	replace: (parentNode, children, match) => {
		console.log('Suggestion transformer matched:', match);
		const suggestionType = match[1];
		let content = match[2];
		// Replace the placeholder back with newlines before parsing
		content = content.replace(/__NEWLINE__/g, '\n');
		console.log('suggestionType', suggestionType);
		console.log('content', content);
		const suggestionNode = $createSuggestionNode(
			suggestionType as SuggestionType
		);
		$convertFromMarkdownString(content, TRANSFORMERS, suggestionNode);
		parentNode.replace(suggestionNode);
	},
	type: 'element',
};

export const TRANSFORMERS = [
	SUGGESTION,
	IMAGE,
	...ELEMENT_TRANSFORMERS,
	...MULTILINE_ELEMENT_TRANSFORMERS,
	...TEXT_FORMAT_TRANSFORMERS,
	...TEXT_MATCH_TRANSFORMERS,
];
