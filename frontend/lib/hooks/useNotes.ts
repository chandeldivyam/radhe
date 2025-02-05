import { useCallback, useState, useMemo } from 'react';
import { useNotesStore } from '@/lib/store/useNotesStore';
import { CreateNoteData, UpdateNoteData, Note } from '@/types/note';
import { useToast } from '@/lib/hooks/use-toast';

const ITEMS_PER_PAGE = 20;

export function useNotes() {
  const store = useNotesStore();
  const { toast } = useToast();

  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize store instance and its actions
  const memoizedStore = useMemo(() => ({
    store,
    actions: {
      setIsLoadingRoot: store.setIsLoadingRoot,
      setIsLoadingMore: store.setIsLoadingMore,
      setError: store.setError,
      setRootNotes: store.setRootNotes,
      setHasMoreRootNotes: store.setHasMoreRootNotes,
      setCurrentPage: store.setCurrentPage,
    }
  }), [store]);

  const loadRootNotes = useCallback(async (page = 0) => {
    const { store, actions } = memoizedStore;
    try {
      if (store.isLoadingRoot || store.isLoadingMore) {
        return;
      }
      
      if (page === 0) {
        actions.setIsLoadingRoot(true);
      } else {
        actions.setIsLoadingMore(true);
      }
      actions.setError(null);
      
      const skip = page * ITEMS_PER_PAGE;
      const response = await fetch(`/api/notes/root?skip=${skip}&limit=${ITEMS_PER_PAGE}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to load notes');
      }
      
      const [notes, total] = await response.json();
      
      if (page === 0) {
        actions.setRootNotes(notes);
      } else {
        actions.setRootNotes([...store.rootNotes, ...notes]);
      }
      
      actions.setHasMoreRootNotes(store.rootNotes.length < total);
      actions.setCurrentPage(page);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notes';
      actions.setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      if (page === 0) {
        actions.setIsLoadingRoot(false);
      } else {
        actions.setIsLoadingMore(false);
      }
    }
  }, [memoizedStore, toast]);

  const loadChildren = useCallback(async (parentId: string) => {
    if (store.childrenMap[parentId]) return;
    
    try {
      store.setLoadingState(parentId, true);
      const response = await fetch(`/api/notes/${parentId}/children`);
      
      if (!response.ok) throw new Error('Failed to load children');
      
      const children = await response.json();
      store.addChildNotes(parentId, children);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load note children",
        variant: "destructive"
      });
    } finally {
      store.setLoadingState(parentId, false);
    }
  }, [store, toast]);

  const createNote = useCallback(async (data: CreateNoteData) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create note');
      
      const newNote = await response.json();
      
      // Add the note to the store
      store.addNote(newNote, data.parent_id || null);
      
      // If parent exists and is expanded, manually load its children
      if (data.parent_id && store.expandedNodes.has(data.parent_id)) {
        await loadChildren(data.parent_id);
      }
      
      toast({
        title: "Success",
        description: "Note created successfully",
      });
      
      return newNote;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
      throw error;
    }
  }, [store, loadChildren, toast]);

  const loadNote = useCallback(async (noteId: string) => {
    try {
      setIsLoading(true);
      store.setError(null);
      
      const response = await fetch(`/api/notes/${noteId}`);
      if (!response.ok) throw new Error('Failed to load note');
      
      const note = await response.json();
      setCurrentNote(note);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load note';
      store.setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [store, toast]);

  const updateNote = useCallback(async (noteId: string, updates: UpdateNoteData) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update note');
      
      const updatedNote = await response.json();
      setCurrentNote(updatedNote);
      store.updateNote(noteId, updates);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update note';
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  }, [store, toast]);

  const deleteNote = useCallback(async (noteId: string, parentId: string | null) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete note');
      
      store.deleteNote(noteId, parentId);
      
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete note';
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  }, [store, toast]);

  return {
    loadRootNotes,
    loadChildren,
    createNote,
    currentNote,
    isLoading,
    loadNote,
    updateNote,
    deleteNote,
    error: store.error,
    isLoadingRoot: store.isLoadingRoot,
  };
} 