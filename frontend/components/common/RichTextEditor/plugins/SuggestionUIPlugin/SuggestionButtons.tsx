import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { SuggestionNode } from '../../nodes/SuggestionNode';
import { $getNodeByKey } from 'lexical';

interface SuggestionButtonsProps {
  nodeKey: string;
}

export function SuggestionButtons({ nodeKey }: SuggestionButtonsProps) {
  const [editor] = useLexicalComposerContext();
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);

  // Get the DOM element for the suggestion node
  useEffect(() => {
    const element = editor.getElementByKey(nodeKey);
    setReferenceElement(element);
    console.log('checking')
  }, [editor, nodeKey]);

  // Configure floating UI positioning
  const { refs, floatingStyles } = useFloating({
    elements: {
      reference: referenceElement,
    },
    middleware: [offset(10), flip(), shift()],
    placement: 'top-end', // Position buttons above and to the right of the node
  });

  const handleAccept = () => {
    editor.update(() => {
      const suggestionNode = $getNodeByKey(nodeKey);
      if (!suggestionNode || !(suggestionNode instanceof SuggestionNode)) return;

      // Get the root node
      const root = $getRoot();
      // Get the children of the suggestion node (the suggested content)
      const children = suggestionNode.getChildren();
      
      // Add the children after the suggestion node
      children.reverse().forEach((node) => {
        suggestionNode.insertAfter(node);
      })

      suggestionNode.remove();
    });
  };

  const handleReject = () => {
    editor.update(() => {
      const suggestionNode = $getNodeByKey(nodeKey);
      if (!suggestionNode || !(suggestionNode instanceof SuggestionNode)) return;
      suggestionNode.remove();
    });
  };

  // Don't render if there's no associated DOM element
  if (!referenceElement) return null;

  return (
    <div ref={refs.setFloating} style={{ ...floatingStyles, pointerEvents: 'auto' }}>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleReject}>Reject</button>
    </div>
  );
}