import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $getRoot, $createParagraphNode } from 'lexical';
import { useState } from 'react';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '../../plugins/MarkdownTransformers';
import { AiSuggestionsNode } from './index';
import type { JSX } from 'react';

interface AiSuggestionComponentProps {
  markdown: string;
  nodeKey: string;
}

export function AiSuggestionComponent({
  markdown,
  nodeKey,
}: AiSuggestionComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isHovering, setIsHovering] = useState(false);

  const handleAccept = () => {
    editor.update(() => {
      const suggestionNode = $getNodeByKey(nodeKey);
      if (suggestionNode && suggestionNode instanceof AiSuggestionsNode) {
        const parent = suggestionNode.getParent();
        // We are chosing to utilize grandparent node because the suggestion node is a child of a paragraph node. We dont want the new nodes to be children of the paragraph node.
        const grandParent = parent?.getParent();
        let index = suggestionNode.getIndexWithinParent();
        if (parent) {
          index = parent.getIndexWithinParent();
        }
        if (parent) {
          const root = $getRoot();
          suggestionNode.remove();
          const originalNodes = root.getChildren();
          
          root.clear();

          $convertFromMarkdownString(markdown, TRANSFORMERS);
          console.log('Root:', root.getChildren());
          const convertedNodes = root.getChildren()
          root.clear();
          originalNodes.forEach((node) => root.append(node));
          // convertedNodes.forEach((node) => root.append(node));
          
          if (convertedNodes.length > 0) {
            grandParent ? grandParent.splice(index, 0, convertedNodes) : parent.splice(index, 0, convertedNodes);
          } else {
            grandParent ? grandParent.splice(index, 0, [$createParagraphNode()]) : parent.splice(index, 0, [$createParagraphNode()]);
          }
        }
      }
    });
  };

  const handleReject = () => {
    editor.update(() => {
      const suggestionNode = $getNodeByKey(nodeKey);
      if (suggestionNode) {
        suggestionNode.remove();
      }
    });
  };

  return (
    <div
      className="ai-suggestion-container"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span>{markdown}</span>
      {isHovering && (
        <div className="ai-suggestion-controls">
          <button className="ai-suggestion-button" onClick={handleAccept}>
            ✓ Accept
          </button>
          <button className="ai-suggestion-button" onClick={handleReject}>
            ✗ Reject
          </button>
        </div>
      )}
    </div>
  );
}