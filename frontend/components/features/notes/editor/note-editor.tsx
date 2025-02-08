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
			{/* Status Bar */}
			<div className="absolute top-2 right-4 flex items-center gap-2 text-sm text-muted-foreground">
				{isSaving && (
					<div className="flex items-center gap-1">
						<Loader2 className="h-3 w-3 animate-spin" />
						<span>Syncing...</span>
					</div>
				)}
			</div>

			{/* Editor */}
			<div className="flex-1 p-4 space-y-4 pt-12">
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="text-2xl font-bold border-none focus-visible:ring-0"
					placeholder="Untitled"
				/>
				
				<div className="min-h-[calc(100vh-200px)]">
					<RichTextEditor noteId={note.id} username={user?.email} />
				</div>
			</div>
		</div>
	);
}
