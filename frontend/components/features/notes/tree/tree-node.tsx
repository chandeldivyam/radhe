'use client';

import { NoteListItem } from '@/types/note';
import { useNotesStore } from '@/lib/store/useNotesStore';
import { ChevronRight, FileText, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { CreateNoteDialog } from '../dialogs/create-note-dialog';
import { useNotes } from '@/lib/hooks/useNotes';
import { NoteMenu } from './note-menu';
import { useRouter } from 'next/navigation';

interface TreeNodeProps {
  note: NoteListItem;
  level: number;
  isSelected: boolean;
  onSelect: (noteId: string) => void;
  onToggle: (noteId: string) => void;
}

export function TreeNode({ note, level, isSelected, onSelect, onToggle }: TreeNodeProps) {
  const router = useRouter();
  const loadingStates = useNotesStore((state) => state.loadingStates);
  const expandedNodes = useNotesStore((state) => state.expandedNodes);
  const loadedChildrenNodes = useNotesStore((state) => state.loadedChildrenNodes);
  const isLoading = loadingStates[note.id];
  const isExpanded = expandedNodes.has(note.id);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { loadChildren, deleteNote } = useNotes();

  // Load children when expanded and not loaded yet
  useEffect(() => {
    if (isExpanded && !loadedChildrenNodes.has(note.id) && note.children_count > 0) {
      loadChildren(note.id);
    }
  }, [isExpanded, note.id, note.children_count, loadedChildrenNodes, loadChildren]);

  const handleClick = (e: React.MouseEvent) => {
    onSelect(note.id);
    router.push(`/notes/${note.id}`);
  };

  return (
    <>
      <div
        style={{ paddingLeft: `${level * 12}px` }}
        className={cn(
          'flex items-center gap-1 px-2 py-1 hover:bg-accent/50 rounded-sm cursor-pointer group',
          isSelected && 'bg-accent'
        )}
        onClick={handleClick}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(note.id);
          }}
          disabled={note.children_count === 0}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            note.children_count > 0 && (
              <ChevronRight
                className={cn(
                  'h-3 w-3 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            )
          )}
        </Button>

        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm truncate min-w-0 flex-1">{note.title}</span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <NoteMenu
            noteId={note.id}
            noteTitle={note.title}
            onDelete={async () => {
              await deleteNote(note.id, note.parent_id);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={(e) => {
              e.stopPropagation();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <CreateNoteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        parentId={note.id}
      />
    </>
  );
} 