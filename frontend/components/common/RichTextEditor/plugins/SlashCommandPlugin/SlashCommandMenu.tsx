'use client';

import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { useCallback, useState, useMemo } from 'react';
import { SlashCommandOption } from './commands';

interface SlashCommandMenuProps {
	position: { x: number; y: number };
	query: string;
	menuProps: {
		selectedIndex: number;
		selectOptionAndCleanUp: (option: SlashCommandOption) => void;
		setHighlightedIndex: (index: number) => void;
		options: SlashCommandOption[];
	};
}

export function SlashCommandMenu({
	position,
	query,
	menuProps,
}: SlashCommandMenuProps) {
	const [search, setSearch] = useState(query);
	const { selectOptionAndCleanUp, setHighlightedIndex, options } = menuProps;

	const inputRef = useCallback((node: HTMLInputElement) => {
		if (node !== null) {
			node.focus();
		}
	}, []);

	const filteredOptions = useMemo(() => {
		return options.filter(
			(option) =>
				option.title.toLowerCase().includes(search.toLowerCase()) ||
				option.keywords.some((keyword) =>
					keyword.toLowerCase().includes(search.toLowerCase())
				) ||
				option.description.toLowerCase().includes(search.toLowerCase())
		);
	}, [options, search]);

	const onSelect = useCallback(
		(command: SlashCommandOption) => {
			setHighlightedIndex(options.indexOf(command));
			selectOptionAndCleanUp(command);
		},
		[selectOptionAndCleanUp, setHighlightedIndex, options]
	);

	const style = {
		position: 'fixed' as const,
		left: `${position.x}px`,
		top: `${position.y}px`,
		zIndex: 100,
	};

	return (
		<div className="slash-command-menu" style={style}>
			<Command className="border rounded-lg shadow-md">
				<CommandInput
					ref={inputRef}
					placeholder="Type a command or search..."
					value={search}
					onValueChange={setSearch}
				/>
				<CommandList>
					{filteredOptions.length > 0 ? (
						<CommandGroup heading="Basic">
							{filteredOptions.map((command) => (
								<CommandItem
									key={command.key}
									onSelect={() => onSelect(command)}
									className="flex items-center gap-2"
								>
									{command.icon && (
										<div className="flex h-5 w-5 items-center justify-center">
											<command.icon className="h-4 w-4" />
										</div>
									)}
									<div className="flex flex-col">
										<span>{command.title}</span>
										<span className="text-xs text-muted-foreground">
											{command.description}
										</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					) : (
						<div className="py-6 text-center text-sm text-muted-foreground">
							No commands found.
						</div>
					)}
				</CommandList>
			</Command>
		</div>
	);
}
