'use client';

import { Note } from '@/types/note';
import { useState, useCallback } from 'react';
import { useNotes } from '@/lib/hooks/useNotes';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from 'use-debounce';

interface NoteEditorProps {
  note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const { updateNote } = useNotes();

  const debouncedUpdate = useDebouncedCallback(async (updates: { title?: string; content?: string }) => {
    try {
      await updateNote(note.id, updates);
    } catch (error) {
      // Error is handled in the useNotes hook
    }
  }, 3000);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    debouncedUpdate({ title: newTitle });
  }, [debouncedUpdate]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    debouncedUpdate({ content: newContent });
  }, [debouncedUpdate]);

  return (
    <div className="p-4 space-y-4">
      <Input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="text-2xl font-bold border-none focus-visible:ring-0"
        placeholder="Untitled"
      />
      
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="min-h-[500px] resize-none border-none focus-visible:ring-0"
        placeholder="Start writing..."
      />
    </div>
  );
} 