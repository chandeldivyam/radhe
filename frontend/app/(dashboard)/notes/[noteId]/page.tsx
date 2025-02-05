'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteEditor } from '@/components/features/notes/editor/note-editor';

export default function NotePage() {
  const { noteId } = useParams();
  const { loadNote, currentNote, isLoading, error } = useNotes();

  useEffect(() => {
    if (noteId && typeof noteId === 'string') {
      loadNote(noteId);
    }
  }, [noteId, loadNote]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive">{error}</div>;
  }

  if (!currentNote) {
    return <div className="p-4">Note not found</div>;
  }

  return <NoteEditor note={currentNote} />;
}
