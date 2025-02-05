import { create } from 'zustand';
import { Note, NoteListItem } from '@/types/note';

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
}

export const useNotesStore = create<NotesState>((set) => ({
  rootNotes: [],
  expandedNodes: new Set(),
  childrenMap: {},
  loadingStates: {},
  hasMoreRootNotes: true,
  currentPage: 0,
  isLoadingMore: false,
  isLoadingRoot: false,
  error: null,
  selectedNoteId: null,
  loadedChildrenNodes: new Set(),

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
    })
})); 