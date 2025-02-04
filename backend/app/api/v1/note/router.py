from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from app.db.base import get_db
from app.schemas.note import (
    NoteCreate, 
    NoteUpdate, 
    NoteResponse, 
    NoteMoveRequest,
    NoteListResponse
)
from app.api.utils.deps import get_current_user
from app.api.v1.note.service import NoteService
import logging


router = APIRouter(prefix="/notes")
logger = logging.getLogger(__name__)

@router.post("/", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        return await NoteService.create_note(db, note_data, current_user.id, current_user.organization_id)
    except Exception as e:
        logger.error(f"Error creating note: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while creating the note")

@router.get("/root", response_model=Tuple[List[NoteResponse], int])
async def list_root_notes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get paginated root level notes with their immediate children"""
    try:
        return await NoteService.list_root_notes(
            db, 
            current_user.organization_id,
            skip,
            limit
        )
    except Exception as e:
        logger.error(f"Error listing root notes: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An error occurred while listing root notes"
        )

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        return await NoteService.get_note(db, note_id, current_user.organization_id)
    except Exception as e:
        logger.error(f"Error getting note: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while getting the note")


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        return await NoteService.update_note(db, note_id, note_data, current_user.id, current_user.organization_id)
    except Exception as e:
        logger.error(f"Error updating note: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while updating the note")

@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        return await NoteService.delete_note(db, note_id, current_user.organization_id)
    except Exception as e:
        logger.error(f"Error deleting note: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while deleting the note")

@router.get("/{note_id}/children", response_model=List[NoteListResponse])
async def get_children(
    note_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get immediate children of a specific note"""
    try:
        return await NoteService.get_children(
            db, 
            note_id, 
            current_user.organization_id
        )
    except Exception as e:
        logger.error(f"Error getting note children: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An error occurred while getting note children"
        )

@router.patch("/{note_id}/move", response_model=NoteResponse)
async def move_note(
    note_id: str,
    move_data: NoteMoveRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Move a note to a new parent or to root level"""
    try:
        note = await NoteService.move_note(
            db, 
            note_id, 
            move_data,
            current_user.organization_id
        )
        if not note:
            raise HTTPException(
                status_code=404,
                detail="Note not found or invalid move operation"
            )
        return note
    except Exception as e:
        logger.error(f"Error moving note: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while moving the note"
        )