'use client';

import { useNotesStore } from '@/lib/store/useNotesStore';
import { useNotes } from '@/lib/hooks/useNotes';
import { TreeNode } from './tree-node';
import { useEffect, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { NoteListItem } from '@/types/note';

interface NoteTreeProps {
  width: number;
  height: number;
}

export function NoteTree({ width, height }: NoteTreeProps) {
  const {
    rootNotes,
    childrenMap,
    expandedNodes,
    selectedNoteId,
    setSelectedNoteId,
    toggleExpanded,
    isLoadingRoot,
    hasMoreRootNotes,
    currentPage,
    isLoadingMore
  } = useNotesStore();

  const { loadRootNotes, loadChildren } = useNotes();

  // Load initial root notes - with proper dependency array
  useEffect(() => {
    if (!isLoadingRoot && rootNotes.length === 0) {
      loadRootNotes(0);
    }
  }, [isLoadingRoot, rootNotes.length, loadRootNotes]);

  // Handle node expansion - memoized with proper dependencies
  const handleToggle = useCallback(async (noteId: string) => {
    toggleExpanded(noteId);
    if (!childrenMap[noteId] && !expandedNodes.has(noteId)) {
      await loadChildren(noteId);
    }
  }, [toggleExpanded, childrenMap, expandedNodes, loadChildren]);

  // Memoize the intersection observer callback
  const handleIntersection = useCallback((inView: boolean) => {
    if (inView && hasMoreRootNotes && !isLoadingMore && !isLoadingRoot) {
      loadRootNotes(currentPage + 1);
    }
  }, [hasMoreRootNotes, isLoadingMore, isLoadingRoot, currentPage, loadRootNotes]);

  // Infinite scrolling for root notes
  const { ref: loadMoreRef } = useInView({
    onChange: handleIntersection,
  });

  // Memoize the tree rendering function
  const renderNoteTree = useCallback((notes: NoteListItem[], level: number = 0) => {
    return notes.map((note, index) => {
      const isLast = index === notes.length - 1;
      return (
        <div key={note.id}>
          <TreeNode
            note={note}
            level={level}
            isSelected={selectedNoteId === note.id}
            onSelect={setSelectedNoteId}
            onToggle={handleToggle}
          />
          {expandedNodes.has(note.id) && childrenMap[note.id] && (
            <div>
              {renderNoteTree(childrenMap[note.id], level + 1)}
            </div>
          )}
          {isLast && level === 0 && hasMoreRootNotes && (
            <div ref={loadMoreRef} className="h-4" />
          )}
        </div>
      );
    });
  }, [
    selectedNoteId,
    setSelectedNoteId,
    handleToggle,
    expandedNodes,
    childrenMap,
    hasMoreRootNotes,
    loadMoreRef
  ]);

  // Memoize the rendered tree to prevent unnecessary re-renders
  const renderedTree = useMemo(() => {
    if (isLoadingRoot && rootNotes.length === 0) {
      return <div>Loading...</div>;
    }
    return renderNoteTree(rootNotes);
  }, [isLoadingRoot, rootNotes, renderNoteTree]);

  return (
    <div style={{ width, height }} className="overflow-auto">
      {renderedTree}
    </div>
  );
}
