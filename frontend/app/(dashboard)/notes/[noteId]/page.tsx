'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteEditor } from '@/components/features/notes/editor/note-editor';
import { Loader2 } from 'lucide-react';

export default function NotePage() {
	const { noteId } = useParams();
	const router = useRouter();
	const { loadNote, currentNote, isLoading, error } = useNotes();

	useEffect(() => {
		if (!noteId || typeof noteId !== 'string') {
			router.push('/notes');
			return;
		}

		const controller = new AbortController();
		let mounted = true;

		const loadCurrentNote = async () => {
			try {
				if (!currentNote || currentNote.id !== noteId) {
					await loadNote(noteId);
				}
			} catch (error) {
				if (mounted) {
					console.error('Failed to load note:', error);
				}
			}
		};

		loadCurrentNote();

		return () => {
			mounted = false;
			controller.abort();
		};
	}, [noteId, router]);

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center space-y-4">
					<Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
					<p className="text-muted-foreground">Loading note...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-destructive font-medium">
						Failed to load note
					</p>
					<p className="text-sm text-muted-foreground">{error}</p>
				</div>
			</div>
		);
	}

	if (!currentNote) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center space-y-4">
					<p className="font-medium">Note not found</p>
					<p className="text-sm text-muted-foreground">
						The note you&apos;re looking for doesn&apos;t exist or
						has been deleted.
					</p>
				</div>
			</div>
		);
	}

	return <NoteEditor note={currentNote} />;
}
