"""
Quiz catalog API endpoints - ZIP-based storage.

Provides endpoints for:
- Listing all quizzes
- Creating/updating quizzes
- Loading quiz details
- Importing/exporting quiz ZIPs
- Serving quiz images
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from io import BytesIO

from app.core.database import get_db
from app.services.quiz_storage_service import quiz_storage
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


# ============================================================================
# Schemas
# ============================================================================

class QuizMetadataResponse(BaseModel):
    """Quiz metadata response."""
    id: str
    title: str
    description: str = ""
    question_count: int = 0
    image_count: int = 0
    created_at: str = ""
    updated_at: str = ""


class QuizFullResponse(BaseModel):
    """Full quiz response with questions."""
    id: str
    title: str
    description: str = ""
    questions: list = []
    created_at: str = ""
    updated_at: str = ""


class QuizSaveRequest(BaseModel):
    """Request to save a quiz."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    questions: list = []
    quiz_id: Optional[str] = None  # For updates


class QuizSaveResponse(BaseModel):
    """Response after saving a quiz."""
    id: str
    title: str
    message: str


# ============================================================================
# Endpoints
# ============================================================================

@router.get("", response_model=List[QuizMetadataResponse])
async def list_quizzes():
    """
    List all available quizzes.
    
    Returns:
        List of quiz metadata.
    """
    quizzes = quiz_storage.list_quizzes()
    return [QuizMetadataResponse(**q) for q in quizzes]


@router.get("/{quiz_id:path}", response_model=QuizFullResponse)
async def get_quiz(quiz_id: str):
    """
    Get a complete quiz by ID.
    
    Args:
        quiz_id: The quiz identifier.
        
    Returns:
        Full quiz with all questions.
        
    Raises:
        HTTPException: If quiz not found.
    """
    # Handle image requests separately
    if '/images/' in quiz_id:
        raise HTTPException(status_code=400, detail="Use /quizzes/{quiz_id}/images/{image_name} endpoint")
    
    quiz = quiz_storage.get_quiz(quiz_id)
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return QuizFullResponse(**quiz)


@router.post("", response_model=QuizSaveResponse)
async def save_quiz(request: QuizSaveRequest):
    """
    Create or update a quiz.
    
    If quiz_id is provided and exists, updates the existing quiz.
    Otherwise creates a new quiz.
    
    Args:
        request: Quiz data to save.
        
    Returns:
        Save result with quiz ID.
    """
    try:
        quiz_id, metadata = quiz_storage.save_quiz(
            title=request.title,
            questions=request.questions,
            description=request.description,
            quiz_id=request.quiz_id
        )
        
        action = "updated" if request.quiz_id else "created"
        return QuizSaveResponse(
            id=quiz_id,
            title=request.title,
            message=f"Quiz successfully {action}"
        )
    except Exception as e:
        logger.error(f"Failed to save quiz: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save quiz: {str(e)}")


@router.put("/{quiz_id:path}", response_model=QuizSaveResponse)
async def update_quiz(quiz_id: str, request: QuizSaveRequest):
    """
    Update an existing quiz.
    
    Args:
        quiz_id: The quiz identifier.
        request: Updated quiz data.
        
    Returns:
        Update result.
        
    Raises:
        HTTPException: If quiz not found.
    """
    # Check if quiz exists
    existing = quiz_storage.get_quiz_metadata(quiz_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    try:
        _, metadata = quiz_storage.save_quiz(
            title=request.title,
            questions=request.questions,
            description=request.description,
            quiz_id=quiz_id
        )
        
        return QuizSaveResponse(
            id=quiz_id,
            title=request.title,
            message="Quiz successfully updated"
        )
    except Exception as e:
        logger.error(f"Failed to update quiz {quiz_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update quiz: {str(e)}")


@router.delete("/{quiz_id:path}")
async def delete_quiz(quiz_id: str):
    """
    Delete a quiz.
    
    Args:
        quiz_id: The quiz identifier.
        
    Returns:
        Deletion confirmation.
        
    Raises:
        HTTPException: If quiz not found.
    """
    success = quiz_storage.delete_quiz(quiz_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return {"message": "Quiz deleted successfully", "id": quiz_id}


@router.get("/{quiz_id}/images/{image_name}")
async def get_quiz_image(quiz_id: str, image_name: str):
    """
    Get an image from a quiz.
    
    Args:
        quiz_id: The quiz identifier.
        image_name: Name of the image file.
        
    Returns:
        Image file.
        
    Raises:
        HTTPException: If image not found.
    """
    image_data = quiz_storage.get_quiz_image(quiz_id, image_name)
    
    if not image_data:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Determine content type from extension
    ext = image_name.lower().split('.')[-1] if '.' in image_name else 'png'
    content_types = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
    }
    content_type = content_types.get(ext, 'application/octet-stream')
    
    return Response(content=image_data, media_type=content_type)


@router.get("/{quiz_id}/export")
async def export_quiz(quiz_id: str):
    """
    Export a quiz as a ZIP file.
    
    Args:
        quiz_id: The quiz identifier.
        
    Returns:
        ZIP file download.
        
    Raises:
        HTTPException: If quiz not found.
    """
    zip_data = quiz_storage.export_zip(quiz_id)
    
    if not zip_data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Get quiz title for filename
    metadata = quiz_storage.get_quiz_metadata(quiz_id)
    filename = f"{metadata['title']}.zip" if metadata else f"{quiz_id}.zip"
    
    return StreamingResponse(
        BytesIO(zip_data),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.post("/import")
async def import_quiz(file: UploadFile = File(...)):
    """
    Import a quiz from a ZIP file.
    
    Args:
        file: ZIP file containing quiz.json and images.
        
    Returns:
        Import result with quiz ID.
        
    Raises:
        HTTPException: If import fails.
    """
    if not file.filename or not file.filename.lower().endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a ZIP file")
    
    try:
        content = await file.read()
        quiz_id, metadata = quiz_storage.import_zip(content)
        
        return QuizSaveResponse(
            id=quiz_id,
            title=metadata['title'],
            message="Quiz imported successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to import quiz: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to import quiz: {str(e)}")
