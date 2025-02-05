import { create } from 'zustand';
import { MoveNoteAction, Note, NoteListItem } from '@/types/note';

interface NotesState {
  rootNotes: NoteListItem[];
  expandedNodes: Set<string>;
  childrenMap: Record<string, NoteListItem[]>;
  loadingStates: Record<string, boolean>;
  hasMoreRootNotes: boolean;
  currentPage: number;
  isLoadingMore: boolean;
  isLoadingRoot: boolean;
  error: string | null;
  selectedNoteId: string | null;
  loadedChildrenNodes: Set<string>;
  currentNote: Note | null;
  isLoadingNote: boolean;
  
  // Actions
  setRootNotes: (notes: NoteListItem[]) => void;
  addChildNotes: (parentId: string, notes: NoteListItem[]) => void;
  toggleExpanded: (nodeId: string) => void;
  setLoadingState: (nodeId: string, isLoading: boolean) => void;
  setHasMoreRootNotes: (hasMore: boolean) => void;
  setCurrentPage: (page: number) => void;
  setIsLoadingMore: (isLoading: boolean) => void;
  setIsLoadingRoot: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedNoteId: (noteId: string | null) => void;
  addNote: (note: NoteListItem, parentId: string | null) => void;
  updateNote: (noteId: string, updates: Partial<NoteListItem>) => void;
  deleteNote: (noteId: string, parentId: string | null) => void;
  forceReloadChildren: (parentId: string) => void;
  setCurrentNote: (note: Note | null) => void;
  setIsLoadingNote: (isLoading: boolean) => void;
  moveNote: (action: MoveNoteAction) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  rootNotes: [],
  expandedNodes: new Set(),
  childrenMap: {},
  loadingStates: {},
  hasMoreRootNotes: false,
  currentPage: 0,
  isLoadingMore: false,
  isLoadingRoot: false,
  error: null,
  selectedNoteId: null,
  loadedChildrenNodes: new Set(),
  currentNote: null,
  isLoadingNote: false,

  setRootNotes: (notes) => set({ rootNotes: notes }),
  
  addChildNotes: (parentId, notes) => 
    set((state) => ({
      childrenMap: {
        ...state.childrenMap,
        [parentId]: notes
      }
    })),

  toggleExpanded: (nodeId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      const isCurrentlyExpanded = newExpanded.has(nodeId);
      
      if (isCurrentlyExpanded) {
        newExpanded.delete(nodeId);
        return { expandedNodes: newExpanded };
      } else {
        newExpanded.add(nodeId);
        // When expanding, mark that we need to load children if not already loaded
        const hasLoadedChildren = state.loadedChildrenNodes.has(nodeId);
        return {
          expandedNodes: newExpanded,
          loadedChildrenNodes: hasLoadedChildren 
            ? state.loadedChildrenNodes 
            : new Set([...state.loadedChildrenNodes, nodeId])
        };
      }
    }),

  setLoadingState: (nodeId, isLoading) =>
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [nodeId]: isLoading
      }
    })),

  setHasMoreRootNotes: (hasMore) => set({ hasMoreRootNotes: hasMore }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setIsLoadingMore: (isLoading) => set({ isLoadingMore: isLoading }),

  addNote: (note, parentId) =>
    set((state) => {
      if (!parentId) {
        return { rootNotes: [...state.rootNotes, note] };
      }

      // Update parent's children_count in both root notes and childrenMap
      const updateParentChildrenCount = (notes: NoteListItem[]) =>
        notes.map((n) =>
          n.id === parentId
            ? { ...n, children_count: (n.children_count || 0) + 1 }
            : n
        );

      const updatedRootNotes = updateParentChildrenCount(state.rootNotes);
      const updatedChildrenMap = { ...state.childrenMap };

      // Update children counts in all existing nodes
      Object.keys(state.childrenMap).forEach(key => {
        updatedChildrenMap[key] = updateParentChildrenCount(state.childrenMap[key]);
      });

      // If the parent is already expanded and loaded, add the new note to its children
      if (state.expandedNodes.has(parentId) && state.loadedChildrenNodes.has(parentId)) {
        const parentChildren = state.childrenMap[parentId] || [];
        updatedChildrenMap[parentId] = [...parentChildren, note];
      }

      return {
        rootNotes: updatedRootNotes,
        childrenMap: updatedChildrenMap,
      };
    }),

  updateNote: (noteId, updates) =>
    set((state) => {
      const updateNoteInList = (notes: NoteListItem[]) =>
        notes.map((note) =>
          note.id === noteId ? { ...note, ...updates } : note
        );

      return {
        rootNotes: updateNoteInList(state.rootNotes),
        childrenMap: Object.entries(state.childrenMap).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: updateNoteInList(value)
          }),
          {}
        )
      };
    }),

  deleteNote: (noteId, parentId) =>
    set((state) => {
      if (!parentId) {
        return {
          rootNotes: state.rootNotes.filter((note) => note.id !== noteId)
        };
      }
      return {
        childrenMap: {
          ...state.childrenMap,
          [parentId]: state.childrenMap[parentId]?.filter(
            (note) => note.id !== noteId
          ) || []
        }
      };
    }),

  setIsLoadingRoot: (isLoading) => set({ isLoadingRoot: isLoading }),
  setError: (error) => set({ error }),
  setSelectedNoteId: (noteId) => set({ selectedNoteId: noteId }),

  // Add a new action to force reload children
  forceReloadChildren: (parentId: string) =>
    set((state) => {
      const newLoadedChildrenNodes = new Set(state.loadedChildrenNodes);
      newLoadedChildrenNodes.delete(parentId);
      
      // Create new childrenMap without the specified parent's children
      const newChildrenMap = { ...state.childrenMap };
      delete newChildrenMap[parentId];
      
      return {
        loadedChildrenNodes: newLoadedChildrenNodes,
        childrenMap: newChildrenMap
      };
    }),

  setCurrentNote: (note) => set({ currentNote: note }),
  setIsLoadingNote: (isLoading) => set({ isLoadingNote: isLoading }),
  moveNote: (params: MoveNoteAction) => 
    set((state) => {
      const { noteId, oldParentId, newParentId, beforeId, afterId } = params;
      
      // Helper to find note in a list
      const findNoteInList = (notes: NoteListItem[], id: string) => 
        notes.findIndex(note => note.id === id);
      
      // Helper to remove note from its current location
      const removeNoteFromParent = (parentId: string | null) => {
        if (!parentId) {
          return state.rootNotes.filter(note => note.id !== noteId);
        }
        return state.childrenMap[parentId]?.filter(note => note.id !== noteId) || [];
      };
      
      // Get the note being moved
      const getNote = () => {
        if (!oldParentId) {
          return state.rootNotes.find(note => note.id === noteId);
        }
        return state.childrenMap[oldParentId]?.find(note => note.id === noteId);
      };

      const updateChildrenCount = (
        parentId: string | null, 
        increment: boolean
      ) => {
        const updateCount = (notes: NoteListItem[]) =>
          notes.map((note) =>
            note.id === parentId
              ? { ...note, children_count: note.children_count + (increment ? 1 : -1) }
              : note
          );
        
        return {
          rootNotes: parentId ? updateCount(state.rootNotes) : state.rootNotes,
          childrenMap: Object.entries(state.childrenMap).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: updateCount(value)
            }),
            {}
          )
        };
      };

      const movedNote = getNote();
      if (!movedNote) return state;
      
      // TODO: Implement the actual move logic
      // 1. Remove note from old parent
      // Step 1: Remove note from old parent and update children count
      let newState = { ...state };
      if (!oldParentId) {
        newState.rootNotes = removeNoteFromParent(null);
      } else {
        newState.childrenMap = {
          ...newState.childrenMap,
          [oldParentId]: removeNoteFromParent(oldParentId)
        };
      }

      if (oldParentId) {
        const oldParentUpdate = updateChildrenCount(oldParentId, false);
        newState.rootNotes = oldParentUpdate.rootNotes;
        newState.childrenMap = oldParentUpdate.childrenMap;
      }
      // Step 2: Calculate new position
      const targetNotes = !newParentId 
      ? newState.rootNotes 
      : newState.childrenMap[newParentId] || [];

      const newPosition = calculateNewPosition(targetNotes, beforeId, afterId);

      // Step 3: Insert note in new location with updated properties
      const updatedNote = {
        ...movedNote,
        parent_id: newParentId,
        position: newPosition
      };
      
      if (!newParentId) {
        newState.rootNotes = insertNoteAtPosition(newState.rootNotes, updatedNote, newPosition);
      } else {
        // If new parent doesn't exist in childrenMap, initialize it
        if (!newState.childrenMap[newParentId]) {
          newState.childrenMap[newParentId] = [];
        }
        
        newState.childrenMap = {
          ...newState.childrenMap,
          [newParentId]: insertNoteAtPosition(
            newState.childrenMap[newParentId],
            updatedNote,
            newPosition
          )
        };
      }

      // Update new parent's children count
      if (newParentId) {
        const newParentUpdate = updateChildrenCount(newParentId, true);
        newState.rootNotes = newParentUpdate.rootNotes;
          newState.childrenMap = newParentUpdate.childrenMap;
      }

      if (oldParentId !== newParentId) {
        // If moving to a new parent that's not loaded, mark it for loading
        if (newParentId && 
            newState.expandedNodes.has(newParentId) && 
            !newState.loadedChildrenNodes.has(newParentId)) {
          newState.loadedChildrenNodes = new Set([
            ...newState.loadedChildrenNodes,
            newParentId
          ]);
        }
  
        // If the note has children and was expanded, maintain its expanded state
        if (movedNote.children_count > 0 && newState.expandedNodes.has(noteId)) {
          // Keep the expanded state but mark children for reloading
          newState.loadedChildrenNodes = new Set(
            Array.from(newState.loadedChildrenNodes).filter(id => id !== noteId)
          );
          // Remove children from childrenMap as they need to be reloaded
          if (newState.childrenMap[noteId]) {
            const { [noteId]: _, ...restChildrenMap } = newState.childrenMap;
            newState.childrenMap = restChildrenMap;
          }
        }
      }

      return newState;
    }),
})); 

const calculateNewPosition = (
  notes: NoteListItem[],
  beforeId?: string,
  afterId?: string
): number => {
  if (!notes.length) return 1000;  // First note
  
  if (beforeId) {
    const beforeNote = notes.find(n => n.id === beforeId);
    const beforePosition = beforeNote?.position ?? 0;
    const prevNote = notes.find(n => n.position < beforePosition);
    return prevNote 
      ? (beforePosition + prevNote.position) / 2 
      : beforePosition - 1000;
  }
  
  if (afterId) {
    const afterNote = notes.find(n => n.id === afterId);
    const afterPosition = afterNote?.position ?? 0;
    const nextNote = notes.find(n => n.position > afterPosition);
    return nextNote 
      ? (afterPosition + nextNote.position) / 2 
      : afterPosition + 1000;
  }
  
  // If no before/after, place at the end
  const lastNote = [...notes].sort((a, b) => b.position - a.position)[0];
  return lastNote ? lastNote.position + 1000 : 1000;
}; 

const insertNoteAtPosition = (
  notes: NoteListItem[],
  note: NoteListItem,
  position: number
): NoteListItem[] => {
  const updatedNotes = [...notes];
  const insertIndex = updatedNotes.findIndex(n => n.position > position);
  
  if (insertIndex === -1) {
    // If no note has a higher position, append to the end
    updatedNotes.push({ ...note, position });
  } else {
    // Insert at the correct position
    updatedNotes.splice(insertIndex, 0, { ...note, position });
  }
  
  return updatedNotes;
}; 