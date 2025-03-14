'use client';

import { useEffect, useRef } from 'react';
import { SlashCommandOption } from './commands';

interface SlashCommandMenuProps {
	options: SlashCommandOption[];
	selectedIndex: number;
	onSelect: (option: SlashCommandOption) => void;
	onMouseEnter: (index: number) => void;
}

export function SlashCommandMenuItem({
	option,
	isSelected,
	onClick,
	onMouseEnter,
}: {
	option: SlashCommandOption;
	isSelected: boolean;
	onClick: () => void;
	onMouseEnter: () => void;
}) {
	const itemRef = useRef<HTMLLIElement>(null);

	useEffect(() => {
		if (isSelected && itemRef.current) {
			itemRef.current.scrollIntoView({
				block: 'nearest',
				inline: 'nearest',
				behavior: 'smooth',
			});
		}
	}, [isSelected]);

	return (
		<li
			ref={itemRef}
			className={`command-item ${isSelected ? 'selected' : ''}`}
			role="option"
			aria-selected={isSelected}
			onClick={onClick}
			onMouseEnter={onMouseEnter}
		>
			{option.icon && (
				<div className="command-icon">
					<option.icon className="h-4 w-4" />
				</div>
			)}
			<div className="command-details">
				<span className="command-title">{option.title}</span>
				<span className="command-description">{option.description}</span>
			</div>
		</li>
	);
}

export function SlashCommandMenu({
	options,
	selectedIndex,
	onSelect,
	onMouseEnter,
}: SlashCommandMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	// Ensure the menu doesn't grow too large and stays within viewport
	useEffect(() => {
		if (menuRef.current) {
			const menuElement = menuRef.current;
			const viewportHeight = window.innerHeight;
			const menuRect = menuElement.getBoundingClientRect();
			
			if (menuRect.bottom > viewportHeight) {
				const maxHeight = viewportHeight - menuRect.top - 20; // 20px padding from bottom
				menuElement.style.maxHeight = `${maxHeight}px`;
			}
		}
	}, []);

	return (
		<div className="slash-command-popover" ref={menuRef}>
			<div className="slash-command-content">
				<ul className="command-list">
					{options.map((option, index) => (
						<SlashCommandMenuItem
							key={option.key}
							option={option}
							isSelected={selectedIndex === index}
							onClick={() => onSelect(option)}
							onMouseEnter={() => onMouseEnter(index)}
						/>
					))}
				</ul>
			</div>
		</div>
	);
}
