'use client';

import { Note } from '@/types/note';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { useAuth } from '@/lib/auth/authContext';

interface NoteEditorProps {
	note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
	const { user } = useAuth();

	return (
		<div className="relative h-full flex flex-col">
			{/* Editor */}
			<div className="min-h-[calc(100vh-100px)]">
				<RichTextEditor noteId={note.id} username={user?.email} markdown={note.suggestion_content || undefined}/>
			</div>
		</div>
	);
}
