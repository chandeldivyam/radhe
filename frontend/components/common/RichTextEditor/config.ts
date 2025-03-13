import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ParagraphNode, TextNode } from 'lexical';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { theme } from './theme';
import { ImageNode } from './nodes/ImageNode';

export const editorConfig: InitialConfigType = {
	namespace: 'notes',
	editorState: null,
	theme: theme,
	nodes: [
		HeadingNode,
		QuoteNode,
		ListItemNode,
		ListNode,
		LinkNode,
		AutoLinkNode,
		ParagraphNode,
		TextNode,
		HorizontalRuleNode,
		CodeNode,
		CodeHighlightNode,
		ImageNode,
	],
	onError: (error: Error) => {
		console.error(error);
	},
};
