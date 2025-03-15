import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { $createAiSuggestionsNode } from '../../nodes/AiSuggestionsNode';
import type { JSX } from 'react';

export const INSERT_AI_SUGGESTION_COMMAND = createCommand<string>('INSERT_AI_SUGGESTION');

export function AiSuggestionPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      INSERT_AI_SUGGESTION_COMMAND,
      (markdown: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const suggestionNode = $createAiSuggestionsNode(markdown);
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