import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode } from 'lexical';
import { useCallback, useState } from 'react';
import { SlashCommandOption, defaultCommands } from './commands';
import { SlashCommandMenu } from './SlashCommandMenu';
import { type JSX } from 'react';

export function SlashCommandPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Use Lexical's built-in typeahead trigger matching
  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const calculatePosition = useCallback((_element: HTMLElement) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const element = _element; // Keep the parameter but mark it as intentionally unused
    const domSelection = window.getSelection();
    if (!domSelection?.rangeCount) return null;

    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Account for scroll position
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    return {
      x: rect.left + scrollX,
      y: rect.bottom + scrollY + 10 // Add a small offset from the cursor
    };
  }, []);

  const onQueryChange = useCallback((query: string | null) => {
    setQueryString(query?.replace('/', '') ?? ''); // Remove the slash from the query
    if (query !== null) {
      const selection = window.getSelection();
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0);
        const element = range.startContainer.parentElement;
        if (element) {
          const position = calculatePosition(element);
          setMenuPosition(position);
        }
      }
    } else {
      setMenuPosition(null); // Hide menu when query is null
    }
  }, [calculatePosition]);

  const onSelectOption = useCallback(
    (
      selectedOption: SlashCommandOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string
    ) => {
      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove();
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _matchingString = matchingString;
        selectedOption.execute(editor);
        closeMenu();
      });
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<SlashCommandOption>
      onQueryChange={onQueryChange}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={defaultCommands}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) =>
        anchorElementRef.current && menuPosition && (
          <SlashCommandMenu
            position={menuPosition}
            query={queryString || ''}
            menuProps={{
              selectedIndex: selectedIndex ?? 0,
              selectOptionAndCleanUp,
              setHighlightedIndex,
              options: defaultCommands,
            }}
          />
        )
      }
    />
  );
}
