// src/components/RichTextEditor/plugins/EmojiPickerPlugin/index.tsx

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	LexicalTypeaheadMenuPlugin,
	MenuOption,
	useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
	$createTextNode,
	$getSelection,
	$isRangeSelection,
	TextNode,
} from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import EMOJI_LIST from '@/constants/emoji-list';
import './index.css';

class EmojiOption extends MenuOption {
	title: string;
	emoji: string;
	keywords: Array<string>;
	name: string;

	constructor(
		title: string,
		emoji: string,
		options: { keywords?: Array<string>; name: string }
	) {
		super(title);
		this.title = title;
		this.emoji = emoji;
		this.keywords = options.keywords || [];
		this.name = options.name;
	}
}

function EmojiMenuItem({
	index,
	isSelected,
	onClick,
	onMouseEnter,
	option,
}: {
	index: number;
	isSelected: boolean;
	onClick: () => void;
	onMouseEnter: () => void;
	option: EmojiOption;
}) {
	return (
		<li
			key={option.key}
			tabIndex={-1}
			className={`emoji-item ${isSelected ? 'selected' : ''}`}
			ref={option.setRefElement}
			role="option"
			aria-selected={isSelected}
			id={`typeahead-item-${index}`}
			onMouseEnter={onMouseEnter}
			onClick={onClick}
		>
			<span className="emoji">{option.emoji}</span>
			<span className="emoji-title">{option.title}</span>
		</li>
	);
}

export default function EmojiPickerPlugin() {
	const [editor] = useLexicalComposerContext();
	const [queryString, setQueryString] = useState<string | null>(null);

	const emojiOptions = useMemo(
		() =>
			EMOJI_LIST.map(
				({ emoji, aliases, tags }) =>
					new EmojiOption(aliases[0], emoji, {
						keywords: [...aliases, ...tags],
						name: aliases[0],
					})
			),
		[]
	);

	const checkForTriggerMatch = useBasicTypeaheadTriggerMatch(':', {
		minLength: 0,
	});

	const options = useMemo(() => {
		return emojiOptions
			.filter((option: EmojiOption) => {
				return queryString != null
					? new RegExp(queryString, 'gi').exec(option.title) ||
							option.keywords.some((keyword: string) =>
								new RegExp(queryString, 'gi').exec(keyword)
							)
					: true;
			})
			.slice(0, 10);
	}, [emojiOptions, queryString]);

	const onSelectOption = useCallback(
		(
			selectedOption: EmojiOption,
			nodeToRemove: TextNode | null,
			closeMenu: () => void
		) => {
			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || selectedOption == null) {
					return;
				}
				if (nodeToRemove) {
					nodeToRemove.remove();
				}
				selection.insertNodes([$createTextNode(selectedOption.emoji)]);
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
			) => {
				if (anchorElementRef.current == null || options.length === 0) {
					return null;
				}

				return anchorElementRef.current && options.length
					? ReactDOM.createPortal(
							<div className="emoji-picker-popover">
								<div className="emoji-picker-content">
									<ul className="emoji-list">
										{options.map(
											(option: EmojiOption, index) => (
												<EmojiMenuItem
													key={option.key}
													index={index}
													isSelected={
														selectedIndex === index
													}
													onClick={() => {
														setHighlightedIndex(
															index
														);
														selectOptionAndCleanUp(
															option
														);
													}}
													onMouseEnter={() => {
														setHighlightedIndex(
															index
														);
													}}
													option={option}
												/>
											)
										)}
									</ul>
								</div>
							</div>,
							anchorElementRef.current
						)
					: null;
			}}
		/>
	);
}
