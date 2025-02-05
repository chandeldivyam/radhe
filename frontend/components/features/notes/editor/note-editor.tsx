'use client';

import { Note } from '@/types/note';
import { useState, useCallback, useEffect } from 'react';
import { useNotes } from '@/lib/hooks/useNotes';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2 } from 'lucide-react';
import { toast } from '@/lib/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface NoteEditorProps {
  note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { updateNote } = useNotes();

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const debouncedUpdate = useDebouncedCallback(async (updates: { title?: string; content?: string }) => {
    try {
      setIsSaving(true);
      await updateNote(note.id, updates);
      setHasUnsavedChanges(false);
      // Silent success - no need to notify for routine saves
    } catch (error) {
      toast({
        title: "Failed to save changes",
        description: "Your changes will be retried automatically.",
        variant: "destructive",
      });
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
    debouncedUpdate({ title: newTitle });
  }, [debouncedUpdate]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    debouncedUpdate({ content: newContent });
  }, [debouncedUpdate]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Status Bar */}
      <div className="absolute top-2 right-4 flex items-center gap-2 text-sm text-muted-foreground">
        {isSaving && (
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {hasUnsavedChanges && !isSaving && (
          <span>Unsaved changes</span>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 space-y-4 pt-12">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-2xl font-bold border-none focus-visible:ring-0"
          placeholder="Untitled"
        />
        
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="min-h-[calc(100vh-200px)] resize-none border-none focus-visible:ring-0"
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
} 