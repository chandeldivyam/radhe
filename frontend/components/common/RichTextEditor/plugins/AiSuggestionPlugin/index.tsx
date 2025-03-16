import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { $createAiSuggestionsNode, SuggestionType } from '../../nodes/AiSuggestionsNode';
import type { JSX } from 'react';

export const INSERT_AI_SUGGESTION_COMMAND = createCommand<{
  suggestionType: SuggestionType;
  markdown?: string;
  targetNodeKey?: string;
  modifiedMarkdown?: string;
}>('INSERT_AI_SUGGESTION');

export function AiSuggestionPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      INSERT_AI_SUGGESTION_COMMAND,
      ({ suggestionType, markdown, targetNodeKey, modifiedMarkdown }) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const suggestionNode = $createAiSuggestionsNode(
              suggestionType,
              markdown,
              targetNodeKey,
              modifiedMarkdown
            );
            selection.insertNodes([suggestionNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => unregisterCommand();
  }, [editor]);

  return null;
}