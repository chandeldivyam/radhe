import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getNodeByKey, $getRoot } from 'lexical';
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
        const grandParent = parent?.getParent();
        
        if (parent && grandParent) {
          // Convert markdown to nodes under a temporary parent
          const tempParagraph = $createParagraphNode();
          $convertFromMarkdownString(markdown, TRANSFORMERS, tempParagraph);
          
          // Get all converted children
          const newNodes = tempParagraph.getChildren();
          
          // Insert all new nodes after the parent
          newNodes.reverse().forEach((node) => {
            parent.insertAfter(node);  // Changed to insert after the parent directly
          });
          
          // Remove the original suggestion node and its parent paragraph
          parent.remove();
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