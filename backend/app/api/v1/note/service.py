from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, Tuple
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteMoveRequest
import uuid
from sqlalchemy import update, func, and_, or_

class NoteService:
    @staticmethod
    async def create_note(
        db: Session,
        note_data: NoteCreate,
        user_id: str,
        organization_id: str
    ) -> NoteResponse:
        note_id = str(uuid.uuid4())
        path = note_id
        depth = 0
        
        if note_data.parent_id:
            parent = db.query(Note).filter(Note.id == note_data.parent_id).first()
            if parent:
                path = f"{parent.path}.{note_id}"
                depth = parent.depth + 1
                # Increment parent's children count
                parent.children_count += 1
        
        db_note = Note(
            id=note_id,
            title=note_data.title,
            content=note_data.content,
            parent_id=note_data.parent_id,
            organization_id=organization_id,
            created_by=user_id,
            path=path,
            depth=depth,
            children_count=0
        )
        
        db.add(db_note)
        db.commit()
        db.refresh(db_note)
        
        return NoteResponse.model_validate(db_note)

    @staticmethod
    async def get_note(
        db: Session,
        note_id: str,
        organization_id: str
    ) -> Optional[NoteResponse]:
        note = (
            db.query(Note)
            .filter(
                Note.id == note_id,
                Note.organization_id == organization_id
            )
            .options(
                selectinload(Note.children).load_only(
                    Note.id,
                    Note.children_count
                )
            )
            .first()
        )
        
        if not note:
            return None
        
        note_response = NoteResponse.model_validate(note)
        note_response.has_children = note.children_count > 0
        
        return note_response

    @staticmethod
    async def list_notes(
        db: Session,
        organization_id: str,
        parent_id: Optional[str] = None
    ) -> List[NoteResponse]:
        query = db.query(Note).filter(
            Note.organization_id == organization_id
        )
        
        if parent_id:
            query = query.filter(Note.parent_id == parent_id)
        else:
            # Get root level notes (no parent)
            query = query.filter(Note.parent_id.is_(None))
            
        notes = query.order_by(Note.created_at.desc()).all()
        return [NoteResponse.model_validate(note) for note in notes]

    @staticmethod
    async def update_note(
        db: Session,
        note_id: str,
        note_data: NoteUpdate,
        user_id: str,
        organization_id: str
    ) -> Optional[NoteResponse]:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.organization_id == organization_id
        ).first()
        
        if not note:
            return None
            
        # Update fields if provided
        if note_data.title is not None:
            note.title = note_data.title
        if note_data.content is not None:
            note.content = note_data.content
        
        db.commit()
        db.refresh(note)
        
        return NoteResponse.model_validate(note)

    @staticmethod
    async def delete_note(
        db: Session,
        note_id: str,
        organization_id: str
    ) -> bool:
        # Find all notes that have a path starting with this note's ID
        notes_to_delete = db.query(Note).filter(
            Note.organization_id == organization_id,
            Note.path.like(f"%{note_id}%")
        ).all()
        
        if not notes_to_delete:
            return False
            
        for note in notes_to_delete:
            db.delete(note)
            
        db.commit()
        return True

    @staticmethod
    async def list_root_notes(
        db: Session,
        organization_id: str,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[NoteResponse], int]:
        total = db.query(Note).filter(
            Note.organization_id == organization_id,
            Note.parent_id.is_(None)
        ).count()
        
        root_notes = (
            db.query(Note)
            .filter(
                Note.organization_id == organization_id,
                Note.parent_id.is_(None)
            )
            .order_by(Note.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        response_notes = []
        for note in root_notes:
            note_response = NoteResponse.model_validate(note)
            note_response.has_children = note.children_count > 0
            response_notes.append(note_response)
        
        return response_notes, total

    @staticmethod
    async def get_children(
        db: Session,
        note_id: str,
        organization_id: str,
        depth: int = 1
    ) -> List[NoteResponse]:
        """Get children of a specific note up to specified depth"""
        if depth < 1:
            return []
            
        # Get immediate children
        children = db.query(Note).filter(
            Note.parent_id == note_id,
            Note.organization_id == organization_id
        ).all()
        
        response_children = []
        for child in children:
            child_response = NoteResponse.model_validate(child)
            
            # If depth > 1, recursively get next level of children
            if depth > 1:
                child_response.children = await NoteService.get_children(
                    db, 
                    child.id, 
                    organization_id, 
                    depth - 1
                )
            response_children.append(child_response)
            
        return response_children

    @staticmethod
    async def move_note(
        db: Session,
        note_id: str,
        move_data: NoteMoveRequest,
        organization_id: str
    ) -> Optional[NoteResponse]:
        """Move a note to a new parent or to root level"""
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.organization_id == organization_id
        ).first()
        
        if not note:
            return None
            
        # Prevent circular references
        if move_data.new_parent_id:
            parent = db.query(Note).filter(
                Note.id == move_data.new_parent_id,
                Note.organization_id == organization_id
            ).first()
            
            if not parent or parent.path.startswith(f"{note.path}."):
                return None
                
        old_path = note.path
        
        # Calculate new path
        if move_data.new_parent_id:
            parent = db.query(Note).filter(Note.id == move_data.new_parent_id).first()
            new_path = f"{parent.path}.{note.id}"
            new_depth = parent.depth + 1
        else:
            new_path = note.id
            new_depth = 0
            
        # Update all descendants
        descendants = db.query(Note).filter(
            Note.path.like(f"{old_path}.%")
        ).all()
        
        for descendant in descendants:
            descendant.path = descendant.path.replace(old_path, new_path, 1)
            descendant.depth = descendant.depth - note.depth + new_depth
            
        # Update the note itself
        note.parent_id = move_data.new_parent_id
        note.path = new_path
        note.depth = new_depth
        
        db.commit()
        db.refresh(note)
        
        return NoteResponse.model_validate(note)
