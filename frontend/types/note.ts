export interface Note {
  id: string;
  title: string;
  content: string;
  parent_id: string | null;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  path: string;
  depth: number;
  children_count: number;
  position: number;
}

export interface NoteListItem {
  id: string;
  title: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  path: string;
  depth: number;
  children_count: number;
  position: number;
  parent_id: string | null;
}

export interface CreateNoteData {
  title: string;
  content: string;
  parent_id?: string | null;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export interface MoveNoteAction {
  noteId: string;
  oldParentId: string | null;
  newParentId: string | null;
  beforeId?: string;
  afterId?: string;
}