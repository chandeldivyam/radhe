import { ElementTransformer } from '@lexical/markdown';
import { LexicalNode, ElementNode, TextNode } from 'lexical';
import {
  $isImageNode,
  ImageNode,
  $createImageNode,
} from '../../nodes/ImageNode';
import {
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
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
  export: (node: LexicalNode, exportChildren: (node: ElementNode) => string) => {
    if (!$isSuggestionNode(node)) {
      return null;
    }
    const suggestionType = node.__suggestionType;
    const childrenMarkdown = $convertToMarkdownString(TRANSFORMERS, node); // Use the provided function to export children
	console.log('childrenMarkdown', childrenMarkdown);
    return `[[suggestion:${suggestionType}|${childrenMarkdown}]]`;
  },
  regExp: /\[\[suggestion:(add|delete)\|([\s\S]*?)\]\]/,
  replace: (parentNode, children, match) => {
    const [, suggestionType, content] = match;
    const suggestionNode = $createSuggestionNode(suggestionType as SuggestionType);
    $convertFromMarkdownString(content, TRANSFORMERS, suggestionNode);
    parentNode.append(suggestionNode);
  },
  type: 'element',
};

export const TRANSFORMERS = [
  IMAGE,
  SUGGESTION,
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];