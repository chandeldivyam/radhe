import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	LexicalTypeaheadMenuPlugin,
	useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode } from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { SlashCommandOption, defaultCommands } from './commands';
import { SlashCommandMenu } from './SlashCommandMenu';
import './styles.css';

export function SlashCommandPlugin() {
	const [editor] = useLexicalComposerContext();
	const [queryString, setQueryString] = useState<string | null>(null);

	const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
		minLength: 0,
	});

	const options = useMemo(() => {
		return defaultCommands.filter((option: SlashCommandOption) => {
			if (!queryString) return true;
			const search = queryString.toLowerCase();
			return (
				option.title.toLowerCase().includes(search) ||
				option.keywords.some((keyword) => keyword.toLowerCase().includes(search)) ||
				option.description.toLowerCase().includes(search)
			);
		});
	}, [queryString]);

	const onSelectOption = useCallback(
		(
			selectedOption: SlashCommandOption,
			nodeToRemove: TextNode | null,
			closeMenu: () => void
		) => {
			editor.update(() => {
				if (nodeToRemove) {
					nodeToRemove.remove();
				}
				selectedOption.execute(editor);
				closeMenu();
			});
		},
		[editor]
	);

	return (
		<LexicalTypeaheadMenuPlugin
			onQueryChange={setQueryString}
			onSelectOption={onSelectOption}
			triggerFn={checkForTriggerMatch}
			options={options}
			menuRenderFn={(
				anchorElementRef,
				{ selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
			) =>
				anchorElementRef.current && options.length
					? ReactDOM.createPortal(
							<SlashCommandMenu
								options={options}
								selectedIndex={selectedIndex ?? 0}
								onSelect={(option) => selectOptionAndCleanUp(option)}
								onMouseEnter={setHighlightedIndex}
							/>,
							anchorElementRef.current
						)
					: null
			}
		/>
	);
}
