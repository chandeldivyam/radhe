import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { $getRoot, ElementNode, LexicalNode } from 'lexical';
import { $isSuggestionNode } from '../../nodes/SuggestionNode';
import { SuggestionButtons } from './SuggestionButtons';

// Recursively find all suggestion nodes in the editor
function getAllSuggestionNodes(node: LexicalNode): LexicalNode[] {
  if ($isSuggestionNode(node)) {
    return [node];
  }
  if (node instanceof ElementNode) {
    return node.getChildren().flatMap(getAllSuggestionNodes);
  }
  return [];
}

export function SuggestionUIPlugin() {
  const [editor] = useLexicalComposerContext();
  const [suggestionNodeKeys, setSuggestionNodeKeys] = useState<string[]>([]);

  useEffect(() => {
    const updateSuggestionNodes = () => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const suggestionNodes = getAllSuggestionNodes(root);
        const keys = suggestionNodes.map((node) => node.getKey());
        setSuggestionNodeKeys(keys);
      });
    };

    // Initial update
    updateSuggestionNodes();

    // Listen for editor updates
    const unregister = editor.registerUpdateListener(() => {
      updateSuggestionNodes();
    });

    // Cleanup listener on unmount
    return () => unregister();
  }, [editor]);

  return (
    <>
      {suggestionNodeKeys.map((key) => (
        <SuggestionButtons key={key} nodeKey={key} />
      ))}
    </>
  );
}