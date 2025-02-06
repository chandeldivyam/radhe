'use client';

import { useNotesStore } from '@/lib/store/useNotesStore';
import { useNotes } from '@/lib/hooks/useNotes';
import { TreeNode } from './tree-node';
import { useEffect, useCallback, useMemo, useRef } from 'react';
import { NoteListItem } from '@/types/note';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { DropIndicator } from './drop-indicator';
import { toast } from '@/lib/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown } from "lucide-react";

interface NoteTreeProps {
  width: number | string;
  height: number | string;
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

  const { loadRootNotes, loadChildren, moveNote } = useNotes();

  // Add a ref to track initial load
  const initialLoadRef = useRef(false);

  // Modified useEffect
  useEffect(() => {
    if (!initialLoadRef.current && !isLoadingRoot) {
      initialLoadRef.current = true;
      loadRootNotes(0);
    }
  }, [isLoadingRoot, loadRootNotes]);

  // Handle node expansion - memoized with proper dependencies
  const handleToggle = useCallback(async (noteId: string) => {
    toggleExpanded(noteId);
    if (!childrenMap[noteId] && !expandedNodes.has(noteId)) {
      await loadChildren(noteId);
    }
  }, [toggleExpanded, childrenMap, expandedNodes, loadChildren]);

  // Memoize the tree rendering function
  const renderNoteTree = useCallback((notes: NoteListItem[], level: number = 0) => {
    return notes.map((note, index) => {
      const isLast = index === notes.length - 1;
      return (
        <div key={note.id} className="relative">
          <DropIndicator id={note.id} level={level} />
          <TreeNode
            note={note}
            level={level}
            isSelected={selectedNoteId === note.id}
            onSelect={setSelectedNoteId}
            onToggle={handleToggle}
          />
          {expandedNodes.has(note.id) && childrenMap[note.id] && (
            <div className="ml-4">
              {renderNoteTree(childrenMap[note.id], level + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [selectedNoteId, setSelectedNoteId, handleToggle, expandedNodes, childrenMap]);

  // Memoize the rendered tree to prevent unnecessary re-renders
  const renderedTree = useMemo(() => {
    if (isLoadingRoot && rootNotes.length === 0) {
      return <div>Loading...</div>;
    }
    return (
      <>
        {renderNoteTree(rootNotes)}
        {hasMoreRootNotes && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => loadRootNotes(currentPage + 1)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  More
                </>
              )}
            </Button>
          </div>
        )}
      </>
    );
  }, [isLoadingRoot, rootNotes, renderNoteTree, hasMoreRootNotes, isLoadingMore, currentPage, loadRootNotes]);

  const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  // Extract the drop type and target note ID from the droppable ID.
  const dropType = (over.id as string).split('-').pop() as 'before' | 'inside';
  const overId = (over.id as string).slice(0, -(dropType.length) - 1);

  const sourceNote = rootNotes.find(n => n.id === active.id) ||
    Object.values(childrenMap).flat().find(n => n.id === active.id);
  const targetNote = rootNotes.find(n => n.id === overId) ||
    Object.values(childrenMap).flat().find(n => n.id === overId);

  if (!sourceNote || !targetNote) return;

  // Prevent moving a note into its own descendant.
  const isDescendant = (parentId: string | null, childId: string): boolean => {
    if (!parentId) return false;
    if (parentId === childId) return true;
    const children = childrenMap[parentId] || [];
    return children.some(child => isDescendant(child.id, childId));
  };

  if (isDescendant(active.id as string, overId)) {
    toast({
      title: 'Cannot move a parent into its own descendant',
      variant: 'destructive',
    });
    return;
  }

  try {
    if (dropType === 'inside') {
      // Auto-expand target if it is collapsed.
      if (!expandedNodes.has(overId)) {
        toggleExpanded(overId);
      }
      await moveNote(active.id as string, {
        newParentId: overId
      });
    } else {
      await moveNote(active.id as string, {
        newParentId: targetNote.parent_id,
        beforeId: overId
      });
    }
  } catch (error) {
    console.error('Failed to move note:', error);
  }
};

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <ScrollArea 
        style={{ width }} 
        className="h-[calc(100vh-8rem)]"
      >
        <div className="min-h-full">
          {renderedTree}
        </div>
      </ScrollArea>
    </DndContext>
  );
}
