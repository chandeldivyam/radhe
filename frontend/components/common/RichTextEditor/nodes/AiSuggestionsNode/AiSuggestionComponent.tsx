import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getNodeByKey, $getRoot, ElementNode, LexicalNode } from 'lexical';
import { useState } from 'react';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
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

  const getTargetNodeMarkdown = (): string | null => {
    if (!targetNodeKey) return null;
    return editor.getEditorState().read(() => {
      const node = $getNodeByKey(targetNodeKey);
      if (!node) {
        console.warn('Target node not found for key:', targetNodeKey);
        return null;
      }
      if (!(node instanceof ElementNode)) {
        console.warn('Target node is not an ElementNode:', node);
        return null;
      }
      console.log('Node Type:', node.getType(), 'Content:', node.getTextContent());
      console.log('Children:', node.getChildren().map(child => ({
        type: child.getType(),
        content: child.getTextContent(),
      })));
      try {
        const targetMarkdown = $convertToMarkdownString(TRANSFORMERS, node as ElementNode);
        console.log('Generated Markdown:', targetMarkdown);
        return targetMarkdown;
      } catch (error) {
        console.error('Markdown conversion failed:', error);
        return null;
      }
    });
  };

  const renderSuggestionContent = () => {
    switch (suggestionType) {
      case 'add':
        return <span>{markdown}</span>;
      case 'delete':
        return <span>Delete this content?</span>;
      case 'modify': {
        const originalMarkdown = getTargetNodeMarkdown() || '';
        return (
          <span>
            <span>Original:</span>
            <span>{originalMarkdown}</span>
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
      if (!suggestionNode || !(suggestionNode instanceof AiSuggestionsNode)) return;
      const parent = suggestionNode.getParent();
      const grandParent = parent?.getParent();

      switch (suggestionType) {
        case 'add':
          if (parent && grandParent && markdown) {
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
              $convertFromMarkdownString(modifiedMarkdown, TRANSFORMERS, tempParagraph);
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