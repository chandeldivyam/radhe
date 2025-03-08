import { EditorState } from 'lexical';
import { Provider } from '@lexical/yjs';

export interface EditorConfig {
	namespace: string;
	editable?: boolean;
	placeholder?: string;
	onError?: (error: Error) => void;
}

export interface RichTextEditorProps {
	noteId: string;
	initialContent?: string;
	onChange?: (editorState: EditorState) => void;
	onSave?: () => void;
	readOnly?: boolean;
}

export interface CollaborationConfig {
	id: string;
	provider: Provider;
	shouldBootstrap: boolean;
	username?: string;
}
