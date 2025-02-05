from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, Tuple
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteMoveRequest, NoteListResponse, NoteDetailResponse
import uuid
from sqlalchemy import update, func, and_, or_

class NoteService:
    POSITION_GAP = 1000  # Gap between positions
    MIN_GAP = 100  # Minimum gap before rebalancing
    MAX_POSITION = 2147483647  # Max value for INTEGER in PostgreSQL
    
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
        
        # Calculate position for the new note (always append to end)
        position = await NoteService.calculate_position(
            db,
            parent_id=note_data.parent_id,
            organization_id=organization_id
        )
        
        db_note = Note(
            id=note_id,
            title=note_data.title,
            content=note_data.content,
            parent_id=note_data.parent_id,
            organization_id=organization_id,
            created_by=user_id,
            path=path,
            depth=depth,
            children_count=0,
            position=position  # Set the calculated position
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
    ) -> Optional[NoteDetailResponse]:
        note = (
            db.query(Note)
            .filter(
                Note.id == note_id,
                Note.organization_id == organization_id
            )
            .first()
        )
        
        if not note:
            return None
        
        note_response = NoteDetailResponse.model_validate(note)
        
        return note_response

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
        total = db.query(func.count(Note.id)).filter(
            Note.organization_id == organization_id,
            Note.parent_id.is_(None)
        ).scalar()
        
        root_notes = (
            db.query(Note)
            .filter(
                Note.organization_id == organization_id,
                Note.parent_id.is_(None)
            )
            .order_by(Note.position.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        response_notes = [NoteResponse.model_validate(note) for note in root_notes]
        
        return response_notes, total

    @staticmethod
    async def get_children(
        db: Session,
        note_id: str,
        organization_id: str,
    ) -> List[NoteListResponse]:
        """Get immediate children of a specific note without content"""
        children = (
            db.query(Note.id, Note.title, Note.organization_id, 
                    Note.created_by, Note.created_at, Note.updated_at,
                    Note.path, Note.depth, Note.children_count, 
                    Note.position, Note.parent_id)
            .filter(
                Note.parent_id == note_id,
                Note.organization_id == organization_id
            )
            .order_by(Note.position.asc())
            .all()
        )
        
        return [NoteListResponse.model_validate(child) for child in children]

    @staticmethod
    async def move_note(
        db: Session,
        note_id: str,
        move_data: NoteMoveRequest,
        organization_id: str
    ) -> Optional[NoteResponse]:
        """Move a note to a new parent or reposition"""
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.organization_id == organization_id
        ).first()
        
        if not note:
            return None
            
        # Calculate new position
        new_position = await NoteService.calculate_position(
            db,
            move_data.new_parent_id,
            move_data.before_id,
            move_data.after_id,
            organization_id
        )
        
        # Update note
        note.position = new_position
        note.parent_id = move_data.new_parent_id
        
        # Only recalculate paths if parent changed
        if note.parent_id != move_data.new_parent_id:
            await NoteService._update_note_path(db, note, move_data.new_parent_id)
        
        db.commit()
        db.refresh(note)
        
        return NoteResponse.model_validate(note)

    @staticmethod
    async def calculate_position(
        db: Session,
        parent_id: Optional[str],
        before_id: Optional[str] = None,
        after_id: Optional[str] = None,
        organization_id: str = None
    ) -> int:
        """Calculate new position for a note"""
        if before_id is None and after_id is None:
            # If no reference points, put at the end
            last_note = (
                db.query(Note)
                .filter(
                    Note.parent_id == parent_id,
                    Note.organization_id == organization_id
                )
                .order_by(Note.position.desc())
                .first()
            )
            return (last_note.position + NoteService.POSITION_GAP) if last_note else NoteService.POSITION_GAP
            
        if before_id is None:
            # Put before the first item
            after_note = db.query(Note).filter(Note.id == after_id).first()
            new_position = after_note.position // 2
            
            # Check if we need to rebalance
            if new_position < NoteService.MIN_GAP:
                await NoteService._rebalance_positions(db, parent_id, organization_id)
                # Recalculate after rebalancing
                return await NoteService.calculate_position(db, parent_id, before_id, after_id, organization_id)
            return new_position
            
        if after_id is None:
            # Put after the last item
            before_note = db.query(Note).filter(Note.id == before_id).first()
            new_position = before_note.position + NoteService.POSITION_GAP
            
            # Check if we're approaching max integer
            if new_position > NoteService.MAX_POSITION - NoteService.MIN_GAP:
                await NoteService._rebalance_positions(db, parent_id, organization_id)
                # Recalculate after rebalancing
                return await NoteService.calculate_position(db, parent_id, before_id, after_id, organization_id)
            return new_position
            
        # Position between two notes
        before_note = db.query(Note).filter(Note.id == before_id).first()
        after_note = db.query(Note).filter(Note.id == after_id).first()
        gap = before_note.position - after_note.position
        
        # If gap is too small, rebalance
        if abs(gap) < NoteService.MIN_GAP:
            await NoteService._rebalance_positions(db, parent_id, organization_id)
            # Recalculate after rebalancing
            return await NoteService.calculate_position(db, parent_id, before_id, after_id, organization_id)
            
        return (before_note.position + after_note.position) // 2

    @staticmethod
    async def _rebalance_positions(
        db: Session,
        parent_id: Optional[str],
        organization_id: str
    ) -> None:
        """Rebalance positions of all siblings"""
        # Get all siblings in current order
        siblings = (
            db.query(Note)
            .filter(
                Note.parent_id == parent_id,
                Note.organization_id == organization_id
            )
            .order_by(Note.position)
            .all()
        )
        
        # Reassign positions with large gaps
        for i, note in enumerate(siblings):
            note.position = (i + 1) * NoteService.POSITION_GAP
        
        db.commit()

    @staticmethod
    async def patch_note(
        db: Session,
        note_id: str,
        note_data: dict,
        user_id: str,
        organization_id: str
    ) -> Optional[NoteResponse]:
        """
        Partially update a note with only the fields that are provided
        """
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.organization_id == organization_id
        ).first()
        
        if not note:
            return None
        
        # Define allowed fields for patching
        allowed_fields = {
            'title', 'content', 'position', 'parent_id'
        }
        
        # Update only provided fields that are allowed
        for field, value in note_data.items():
            if field in allowed_fields:
                if field == 'parent_id' and value != note.parent_id:
                    # Handle parent change
                    await NoteService._update_note_path(db, note, value)
                elif field == 'position':
                    # Validate and set position
                    note.position = min(
                        max(value, 0), 
                        NoteService.MAX_POSITION
                    )
                else:
                    setattr(note, field, value)
        
        db.commit()
        db.refresh(note)
        
        return NoteResponse.model_validate(note)
