import { $createHeadingNode } from '@lexical/rich-text';
import { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createParagraphNode, $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import { Heading1, Heading2, Heading3, Type, List, ListOrdered, Minus } from 'lucide-react';
import { 
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND
} from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';

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
