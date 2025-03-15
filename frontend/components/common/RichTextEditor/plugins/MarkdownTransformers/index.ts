import { ElementTransformer } from '@lexical/markdown';
import { $isImageNode, ImageNode, $createImageNode } from '../../nodes/ImageNode';
import {
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown';
import { LexicalNode } from 'lexical';

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
    const [, altText, src] = match; // Destructure the regex capture groups
    const imageNode = $createImageNode({
      altText,
      src,
    });
    parentNode.replace(imageNode);
  },
  type: 'element',
};

export const TRANSFORMERS = [
  IMAGE,
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];