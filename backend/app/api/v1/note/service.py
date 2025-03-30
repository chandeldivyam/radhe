from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from app.models.note import Note
from app.models.agent_task import AgentTask, agent_task_modified_notes, agent_task_reference_notes
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteMoveRequest, NoteListResponse, NoteDetailResponse, NoteWSResponse, NoteSuggest
import uuid
from sqlalchemy import func
import base64
import logging
import sqlalchemy

logger = logging.getLogger(__name__)

class NoteService:
    POSITION_GAP = 1000  # Gap between positions
    MIN_GAP = 100  # Minimum gap before rebalancing
    MAX_POSITION = 2147483647  # Max value for INTEGER in PostgreSQL
    
    @staticmethod
    async def create_note(
        db: Session,
        note_data: NoteCreate | NoteSuggest,
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
            suggestion_content=note_data.suggestion_content if isinstance(note_data, NoteSuggest) else None,
            parent_id=note_data.parent_id,
            organization_id=organization_id,
            created_by=user_id,
            path=path,
            depth=depth,
            children_count=0,
            position=position  # Set the calculated position
        )
        
        db.add(db_note)
        
        if isinstance(note_data, NoteSuggest) and note_data.agent_task_id:
            agent_task = db.query(AgentTask).filter(
                AgentTask.id == note_data.agent_task_id,
                AgentTask.organization_id == organization_id
            ).first()
            if agent_task:
                if agent_task.modified_notes and isinstance(agent_task.modified_notes, list) and db_note not in agent_task.modified_notes:
                    agent_task.modified_notes.append(db_note)
                else:
                    agent_task.modified_notes = [db_note]
            else:
                logger.warning(f"Agent task {note_data.agent_task_id} not found or doesn't belong to organization {organization_id}")

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
        if isinstance(note_data, NoteSuggest) and note_data.suggestion_content is not None:
            note.suggestion_content = note_data.suggestion_content
        
        db.commit()
        db.refresh(note)
        
        return NoteResponse.model_validate(note)

    @staticmethod
    async def delete_note(
        db: Session,
        note_id: str,
        organization_id: str
    ) -> bool:
        # First get the note to be deleted to get its parent_id
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.organization_id == organization_id
        ).first()
        
        if not note:
            return False
        
        # Store parent_id before deletion
        parent_id = note.parent_id
        
        # Find all notes that have a path starting with this note's ID
        notes_to_delete = db.query(Note).filter(
            Note.organization_id == organization_id,
            Note.path.like(f"%{note_id}%")
        ).all()
        
        if not notes_to_delete:
            return False

        note_ids_to_delete = [n.id for n in notes_to_delete]
        db.execute(
            sqlalchemy.delete(agent_task_modified_notes).where(
                agent_task_modified_notes.c.note_id.in_(note_ids_to_delete)
            )
        )
    
        # Remove references from agent_task_reference_notes
        db.execute(
            sqlalchemy.delete(agent_task_reference_notes).where(
                agent_task_reference_notes.c.note_id.in_(note_ids_to_delete)
            )
        )   
        
        # Delete all the notes
        for note in notes_to_delete:
            db.delete(note)
        
        # If there was a parent, update its children_count
        if parent_id:
            parent = db.query(Note).filter(Note.id == parent_id).first()
            if parent:
                # Count remaining children
                remaining_children = db.query(func.count(Note.id)).filter(
                    Note.parent_id == parent_id,
                    Note.organization_id == organization_id,
                    Note.id != note_id  # Exclude the note being deleted
                ).scalar()
                
                parent.children_count = remaining_children
        
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
            
        # Prevent moving a note to its own descendant
        if move_data.new_parent_id:
            potential_parent = db.query(Note).filter(Note.id == move_data.new_parent_id).first()
            if potential_parent and potential_parent.path.startswith(f"{note.path}."):
                raise ValueError("Cannot move a note to its own descendant")
        
        # Update old parent's children count
        if note.parent_id:
            old_parent = db.query(Note).filter(Note.id == note.parent_id).first()
            if old_parent:
                old_parent.children_count -= 1
        
        # Update new parent's children count
        if move_data.new_parent_id:
            new_parent = db.query(Note).filter(Note.id == move_data.new_parent_id).first()
            if new_parent:
                new_parent.children_count += 1
        
        # Calculate new position
        new_position = await NoteService.calculate_position(
            db,
            parent_id=move_data.new_parent_id,
            before_id=move_data.before_id,
            after_id=move_data.after_id,
            organization_id=organization_id
        )
        
        # Update note
        note.position = new_position
        old_parent_id = note.parent_id
        note.parent_id = move_data.new_parent_id
        
        # Only recalculate paths if parent changed
        if old_parent_id != move_data.new_parent_id:
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
            
        if after_id is None:
            # Put before the specified note
            before_note = db.query(Note).filter(Note.id == before_id).first()
            if not before_note:
                raise ValueError("Reference note not found")
            
            # Find the note immediately before our reference note
            prev_note = (
                db.query(Note)
                .filter(
                    Note.parent_id == parent_id,
                    Note.organization_id == organization_id,
                    Note.position < before_note.position
                )
                .order_by(Note.position.desc())
                .first()
            )
            
            if not prev_note:
                return before_note.position // 2
            
            new_position = (prev_note.position + before_note.position) // 2
            
            if abs(before_note.position - prev_note.position) < NoteService.MIN_GAP:
                await NoteService._rebalance_positions(db, parent_id, organization_id)
                return await NoteService.calculate_position(db, parent_id, before_id, after_id, organization_id)
            
            return new_position
            
        if before_id is None:
            # Put after the specified note
            after_note = db.query(Note).filter(Note.id == after_id).first()
            if not after_note:
                raise ValueError("Reference note not found")
            
            # Find the note immediately after our reference note
            next_note = (
                db.query(Note)
                .filter(
                    Note.parent_id == parent_id,
                    Note.organization_id == organization_id,
                    Note.position > after_note.position
                )
                .order_by(Note.position.asc())
                .first()
            )
            
            if not next_note:
                return after_note.position + NoteService.POSITION_GAP
            
            new_position = (after_note.position + next_note.position) // 2
            
            if abs(next_note.position - after_note.position) < NoteService.MIN_GAP:
                await NoteService._rebalance_positions(db, parent_id, organization_id)
                return await NoteService.calculate_position(db, parent_id, before_id, after_id, organization_id)
            
            return new_position
        
        # Position between two specific notes
        before_note = db.query(Note).filter(Note.id == before_id).first()
        after_note = db.query(Note).filter(Note.id == after_id).first()
        
        if not before_note or not after_note:
            raise ValueError("Reference notes not found")
        
        new_position = (before_note.position + after_note.position) // 2
        
        if abs(before_note.position - after_note.position) < NoteService.MIN_GAP:
            await NoteService._rebalance_positions(db, parent_id, organization_id)
            return await NoteService.calculate_position(db, parent_id, before_id, after_id, organization_id)
        
        return new_position

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
    async def _update_note_path(
        db: Session,
        note: Note,
        new_parent_id: Optional[str]
    ) -> None:
        """Update the path and depth of a note and all its descendants"""
        if new_parent_id:
            parent = db.query(Note).filter(Note.id == new_parent_id).first()
            if parent:
                new_path = f"{parent.path}.{note.id}"
                new_depth = parent.depth + 1
            else:
                new_path = note.id
                new_depth = 0
        else:
            new_path = note.id
            new_depth = 0
        
        # Calculate path difference to update descendants
        old_path_prefix = f"{note.path}."
        new_path_prefix = f"{new_path}."
        depth_difference = new_depth - note.depth
        
        # Update descendants' paths and depths
        descendants = (
            db.query(Note)
            .filter(Note.path.like(f"{old_path_prefix}%"))
            .all()
        )
        
        for descendant in descendants:
            descendant.path = new_path_prefix + descendant.path[len(old_path_prefix):]
            descendant.depth = descendant.depth + depth_difference
        
        # Update the note itself
        note.path = new_path
        note.depth = new_depth

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

    @staticmethod
    async def get_note_ws_content(
        db: Session,
        note_id: str,
    ) -> Optional[NoteWSResponse]:
        """Get note's WebSocket collaboration content"""
        note = db.query(Note).filter(Note.id == note_id).first()
        
        if not note:
            return None
            
        if not note.binary_content:
            return NoteWSResponse(binary_content=None)
            
        try:
            # Return the binary content directly as a list of integers
            binary_data = base64.b64decode(note.binary_content)
            return NoteWSResponse(binary_content=list(binary_data))
        except Exception as e:
            logger.error(f"Error decoding binary content: {str(e)}")
            return NoteWSResponse(binary_content=None)

    @staticmethod
    async def update_note_ws_content(
        db: Session,
        note_id: str,
        update_data: List[int],
    ) -> None:
        """Update note's WebSocket collaboration content"""
        try:
            # Convert the update array to bytes and store as base64
            binary_data = bytes(update_data)
            base64_content = base64.b64encode(binary_data).decode('utf-8')
            
            stmt = (
                sqlalchemy.update(Note)
                .where(Note.id == note_id)
                .values(
                    binary_content=base64_content,
                    updated_at=func.now(),
                    suggestion_content=None
                )
            )
            
            db.execute(stmt)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating binary content: {str(e)}")
            raise
