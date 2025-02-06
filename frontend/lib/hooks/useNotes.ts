import { useCallback, useState, useMemo } from 'react';
import { useNotesStore } from '@/lib/store/useNotesStore';
import { CreateNoteData, UpdateNoteData, Note } from '@/types/note';
import { useToast } from '@/lib/hooks/use-toast';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 20;

export function useNotes() {
  const store = useNotesStore();
  const { toast } = useToast();
  const router = useRouter();

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
      
      const data = await response.json();
      const [notes, total] = Array.isArray(data) ? data : [[], 0];
      
      // Always set root notes, even if empty
      if (page === 0) {
        actions.setRootNotes(notes);
      } else if (notes.length > 0) {
        actions.setRootNotes([...store.rootNotes, ...notes]);
      }
      
      // Update pagination state
      actions.setHasMoreRootNotes(total > (page + 1) * ITEMS_PER_PAGE);
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
    // Add a ref to track if the component is still mounted
    let isMounted = true;

    try {
      // If already loading or have the correct note, don't proceed
      if (store.isLoadingNote || (store.currentNote && store.currentNote.id === noteId)) {
        return;
      }

      store.setIsLoadingNote(true);
      store.setError(null);
      
      const response = await fetch(`/api/notes/${noteId}`);
      
      // Check if unmounted
      if (!isMounted) return;

      if (response.status === 401) {
        // Handle unauthorized at the hook level
        router.push('/login');
        return;
      }

      if (!response.ok) throw new Error('Failed to load note');
      
      const note = await response.json();
      
      // Check if unmounted again
      if (!isMounted) return;
      
      store.setCurrentNote(note);
    } catch (error) {
      if (!isMounted) return;
      
      const message = error instanceof Error ? error.message : 'Failed to load note';
      store.setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      if (isMounted) {
        store.setIsLoadingNote(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [store, toast, router]);

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

  const moveNote = useCallback(async (noteId: string, moveData: {
    newParentId: string | null;
    beforeId?: string;
    afterId?: string;
  }) => {
    try {
      const sourceNote = store.rootNotes.find(n => n.id === noteId) ||
      Object.values(store.childrenMap).flat().find(n => n.id === noteId);

      if (!sourceNote) {
        throw new Error('Source note not found');
      }
      store.moveNote({
        noteId,
        oldParentId: sourceNote.parent_id,
        ...moveData
      });
      const response = await fetch(`/api/notes/${noteId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_parent_id: moveData.newParentId,
          before_id: moveData.beforeId,
          after_id: moveData.afterId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to move note');
      
      const updatedNote = await response.json();
      
      toast({
        title: "Success",
        description: "Note moved successfully",
      });
      
      return updatedNote;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move note';
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
    currentNote: store.currentNote,
    isLoading: store.isLoadingNote,
    loadNote,
    updateNote,
    deleteNote,
    error: store.error,
    isLoadingRoot: store.isLoadingRoot,
    moveNote,
  };
} 