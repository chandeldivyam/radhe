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
				[parentId]: notes,
			},
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
						: new Set([...state.loadedChildrenNodes, nodeId]),
				};
			}
		}),

	setLoadingState: (nodeId, isLoading) =>
		set((state) => ({
			loadingStates: {
				...state.loadingStates,
				[nodeId]: isLoading,
			},
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
			Object.keys(state.childrenMap).forEach((key) => {
				updatedChildrenMap[key] = updateParentChildrenCount(
					state.childrenMap[key]
				);
			});

			// If the parent is already expanded and loaded, add the new note to its children
			if (
				state.expandedNodes.has(parentId) &&
				state.loadedChildrenNodes.has(parentId)
			) {
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
						[key]: updateNoteInList(value),
					}),
					{}
				),
			};
		}),

	deleteNote: (noteId, parentId) =>
		set((state) => {
			if (!parentId) {
				return {
					rootNotes: state.rootNotes.filter(
						(note) => note.id !== noteId
					),
				};
			}
			return {
				childrenMap: {
					...state.childrenMap,
					[parentId]:
						state.childrenMap[parentId]?.filter(
							(note) => note.id !== noteId
						) || [],
				},
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
				childrenMap: newChildrenMap,
			};
		}),

	setCurrentNote: (note) => set({ currentNote: note }),
	setIsLoadingNote: (isLoading) => set({ isLoadingNote: isLoading }),
	moveNote: (params: MoveNoteAction) =>
		set((state) => {
			const { noteId, oldParentId, newParentId, beforeId, afterId } =
				params;

			// Helper to find and remove note from its current location
			const findAndRemoveNote = (
				parentId: string | null
			): [NoteListItem | undefined, NotesState] => {
				let movedNote: NoteListItem | undefined;
				let newState = { ...state };

				if (!parentId) {
					// Remove from root
					movedNote = newState.rootNotes.find(
						(note) => note.id === noteId
					);
					newState.rootNotes = newState.rootNotes.filter(
						(note) => note.id !== noteId
					);
				} else {
					// Remove from parent's children
					const parentChildren = newState.childrenMap[parentId] || [];
					movedNote = parentChildren.find(
						(note) => note.id === noteId
					);
					if (movedNote) {
						// Only update childrenMap if we found the note
						newState.childrenMap = {
							...newState.childrenMap,
							[parentId]: parentChildren.filter(
								(note) => note.id !== noteId
							),
						};

						// Update old parent's children count
						newState = updateNodeInAllLists(
							newState,
							parentId,
							(node) => ({
								...node,
								children_count: Math.max(
									0,
									(node.children_count || 0) - 1
								),
							})
						);
					}
				}

				return [movedNote, newState];
			};

			// Helper to update a node in all lists (root and children)
			const updateNodeInAllLists = (
				state: NotesState,
				nodeId: string,
				updateFn: (node: NoteListItem) => NoteListItem
			): NotesState => {
				const newState = { ...state };

				// Update in root notes
				newState.rootNotes = newState.rootNotes.map((note) =>
					note.id === nodeId ? updateFn(note) : note
				);

				// Update in all children lists
				newState.childrenMap = Object.entries(
					newState.childrenMap
				).reduce(
					(acc, [key, notes]) => ({
						...acc,
						[key]: notes.map((note) =>
							note.id === nodeId ? updateFn(note) : note
						),
					}),
					{}
				);

				return newState;
			};

			// Step 1: Find and remove note from its current location
			const [movedNote, stateAfterRemoval] =
				findAndRemoveNote(oldParentId);
			if (!movedNote) return state;

			// Step 2: Calculate new position
			const targetNotes = !newParentId
				? stateAfterRemoval.rootNotes
				: stateAfterRemoval.childrenMap[newParentId] || [];

			const newPosition = calculateNewPosition(
				targetNotes,
				beforeId,
				afterId
			);

			// Step 3: Create updated note with new parent and position
			const updatedNote = {
				...movedNote,
				parent_id: newParentId,
				position: newPosition,
			};

			// Step 4: Insert note in new location
			let newState = stateAfterRemoval;

			if (!newParentId) {
				// Moving to root level
				newState.rootNotes = insertNoteAtPosition(
					newState.rootNotes,
					updatedNote,
					newPosition
				);

				// Ensure the note is removed from its old parent's children if it exists
				if (oldParentId && newState.childrenMap[oldParentId]) {
					newState.childrenMap = {
						...newState.childrenMap,
						[oldParentId]: newState.childrenMap[oldParentId].filter(
							(note) => note.id !== noteId
						),
					};
				}
			} else {
				// Moving to a new parent
				const parentChildren = newState.childrenMap[newParentId] || [];
				newState.childrenMap = {
					...newState.childrenMap,
					[newParentId]: insertNoteAtPosition(
						parentChildren,
						updatedNote,
						newPosition
					),
				};

				// Update new parent's children count
				newState = updateNodeInAllLists(
					newState,
					newParentId,
					(node) => ({
						...node,
						children_count: (node.children_count || 0) + 1,
					})
				);
			}

			// Step 5: Handle expanded states and children reloading
			if (oldParentId !== newParentId) {
				// If the moved note has children and was expanded
				if (
					movedNote.children_count > 0 &&
					newState.expandedNodes.has(noteId)
				) {
					// Keep expanded state but mark for reloading
					newState.loadedChildrenNodes = new Set(
						Array.from(newState.loadedChildrenNodes).filter(
							(id) => id !== noteId
						)
					);
					// Remove children from map as they need to be reloaded
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { [noteId]: removed, ...restChildrenMap } =
						newState.childrenMap;
					newState.childrenMap = restChildrenMap;
				}

				// If moving to root, ensure the note is properly removed from old parent
				if (!newParentId && oldParentId) {
					// Double-check removal from old parent's children
					if (newState.childrenMap[oldParentId]) {
						newState.childrenMap[oldParentId] =
							newState.childrenMap[oldParentId].filter(
								(note) => note.id !== noteId
							);
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
	// Sort notes by position for correct calculations
	const sortedNotes = [...notes].sort((a, b) => a.position - b.position);

	if (!sortedNotes.length) return 1000; // First note

	if (beforeId) {
		const beforeIndex = sortedNotes.findIndex((n) => n.id === beforeId);
		if (beforeIndex === -1) return 1000;

		const beforeNote = sortedNotes[beforeIndex];
		const prevNote = beforeIndex > 0 ? sortedNotes[beforeIndex - 1] : null;

		return prevNote
			? (beforeNote.position + prevNote.position) / 2
			: beforeNote.position - 1000;
	}

	if (afterId) {
		const afterIndex = sortedNotes.findIndex((n) => n.id === afterId);
		if (afterIndex === -1) return 1000;

		const afterNote = sortedNotes[afterIndex];
		const nextNote =
			afterIndex < sortedNotes.length - 1
				? sortedNotes[afterIndex + 1]
				: null;

		return nextNote
			? (afterNote.position + nextNote.position) / 2
			: afterNote.position + 1000;
	}

	// If no before/after, place at the end
	return sortedNotes[sortedNotes.length - 1].position + 1000;
};

const insertNoteAtPosition = (
	notes: NoteListItem[],
	note: NoteListItem,
	position: number
): NoteListItem[] => {
	const updatedNotes = [...notes];
	const insertIndex = updatedNotes.findIndex((n) => n.position > position);

	if (insertIndex === -1) {
		// If no note has a higher position, append to the end
		updatedNotes.push({ ...note, position });
	} else {
		// Insert at the correct position
		updatedNotes.splice(insertIndex, 0, { ...note, position });
	}

	return updatedNotes;
};
