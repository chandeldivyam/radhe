import { $createHeadingNode } from '@lexical/rich-text';
import { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	LexicalEditor,
} from 'lexical';
import {
	Heading1,
	Heading2,
	Heading3,
	Type,
	List,
	ListOrdered,
	Minus,
	Image,
} from 'lucide-react';
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';
import { INSERT_SUGGESTION_COMMAND } from '../SuggestionPlugin';
import { IMPORT_MARKDOWN_COMMAND } from '../MarkdownToNote';

const MARKDOWN_TEMP_STRING = `[[suggestion:delete|This did break somehow]]

![Linked image](https://s3.radhe.space/radhe-bucket/00562982-274e-4b71-902d-084b30a36d91/b89dfe03-4a4a-460b-8d0e-b6b6787b0eab/70e15ab0-30d6-431b-a83a-7bcc6c3f8212)

I am not sure what happened

node1

node2

node3`;

export class SlashCommandOption extends MenuOption {
	title: string;
	keywords: string[];
	icon?: React.ComponentType<{ className?: string }>;
	description: string;
	category?: string;
	execute: (editor: LexicalEditor) => void;

	constructor(
		title: string,
		options: {
			keywords?: string[];
			icon?: React.ComponentType<{ className?: string }>;
			description: string;
			category?: string;
			execute: (editor: LexicalEditor) => void;
		}
	) {
		super(title);
		this.title = title;
		this.keywords = options.keywords || [];
		this.icon = options.icon;
		this.description = options.description;
		this.category = options.category;
		this.execute = options.execute.bind(this);
	}
}

export const defaultCommands = [
	new SlashCommandOption('Paragraph', {
		keywords: ['p', 'paragraph'],
		icon: Type,
		description: 'Paragraph',
		category: 'Basic',
		execute: (editor: LexicalEditor) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const paragraphNode = $createParagraphNode();
					selection.insertNodes([paragraphNode]);
				}
			});
		},
	}),
	new SlashCommandOption('Heading 1', {
		keywords: ['h1', 'heading', 'title'],
		icon: Heading1,
		description: 'Large heading',
		category: 'Basic',
		execute: (editor: LexicalEditor) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const headingNode = $createHeadingNode('h1');
					selection.insertNodes([headingNode]);
				}
			});
		},
	}),
	new SlashCommandOption('Heading 2', {
		keywords: ['h2', 'heading', 'title'],
		icon: Heading2,
		description: 'Medium heading',
		category: 'Basic',
		execute: (editor: LexicalEditor) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const headingNode = $createHeadingNode('h2');
					selection.insertNodes([headingNode]);
				}
			});
		},
	}),
	new SlashCommandOption('Heading 3', {
		keywords: ['h3', 'heading', 'title'],
		icon: Heading3,
		description: 'Small heading',
		category: 'Basic',
		execute: (editor: LexicalEditor) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const headingNode = $createHeadingNode('h3');
					selection.insertNodes([headingNode]);
				}
			});
		},
	}),
	new SlashCommandOption('Bulleted List', {
		keywords: ['ul', 'unordered list', 'bullet list', 'list'],
		icon: List,
		description: 'Create a bulleted list',
		category: 'Basic',
		execute: (editor: LexicalEditor) => {
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
		},
	}),
	new SlashCommandOption('Numbered List', {
		keywords: ['ol', 'ordered list', 'numbered list', 'list'],
		icon: ListOrdered,
		description: 'Create a numbered list',
		category: 'Basic',
		execute: (editor: LexicalEditor) => {
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
		},
	}),
	new SlashCommandOption('Divider', {
		keywords: ['hr', 'divider', 'horizontal rule', 'line'],
		icon: Minus,
		description: 'Insert a horizontal line',
		category: 'Basic',
		execute: (editor: LexicalEditor) => {
			editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
		},
	}),
	new SlashCommandOption('Image', {
		keywords: ['img', 'image', 'photo', 'picture', 'upload'],
		icon: Image,
		description: 'Upload an image',
		category: 'Media',
		execute: (editor: LexicalEditor) => {
			// Instead of creating a file input directly, dispatch the command without a file
			// This will trigger the placeholder UI to be shown
			editor.dispatchCommand(INSERT_IMAGE_COMMAND, {});
		},
	}),
	new SlashCommandOption('Suggestion', {
		keywords: ['suggestion', 'ai', 'suggestion'],
		icon: Type,
		description: 'Insert an AI-suggested suggestion',
		category: 'AI',
		execute: (editor: LexicalEditor) => {
			// editor.dispatchCommand(INSERT_SUGGESTION_COMMAND, {
			// 	suggestionType: 'add',
			// 	markdown: MARKDOWN_TEMP_STRING_2,
			// });
			editor.dispatchCommand(INSERT_SUGGESTION_COMMAND, {
				suggestionType: 'delete',
				targetNodeKey: '1',
			});
		},
	}),
	new SlashCommandOption('Import Markdown', {
		keywords: ['md', 'markdown', 'import'],
		icon: Type,
		description: 'Import content from markdown',
		category: 'Content',
		execute: (editor: LexicalEditor) => {
			editor.dispatchCommand(
				IMPORT_MARKDOWN_COMMAND,
				MARKDOWN_TEMP_STRING
			);
		},
	}),
];

export class CommandRegistry {
	private commands: Map<string, SlashCommandOption> = new Map();

	register(command: SlashCommandOption) {
		this.commands.set(command.key, command);
	}

	getCommands(): SlashCommandOption[] {
		return Array.from(this.commands.values());
	}

	// Add methods for searching, filtering, etc.
}
