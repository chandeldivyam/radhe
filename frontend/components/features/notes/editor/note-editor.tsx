'use client';

import { Note } from '@/types/note';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';

interface NoteEditorProps {
	note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
	const [title, setTitle] = useState(note.title);
	const [isSaving, setIsSaving] = useState(false);
	const { user } = useAuth();

	return (
		<div className="relative h-full flex flex-col">
			{/* Editor */}
			<div className="min-h-[calc(100vh-100px)]">
				<RichTextEditor noteId={note.id} username={user?.email} />
			</div>
		</div>
	);
}
