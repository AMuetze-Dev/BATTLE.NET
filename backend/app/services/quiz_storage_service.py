"""
Quiz Storage Service - ZIP-based quiz storage and management.

This service handles storing quizzes as ZIP files containing:
- quiz.json: Quiz metadata and questions
- images/: Directory containing all quiz images
"""
import os
import json
import shutil
import zipfile
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from uuid import uuid4
from datetime import datetime

from app.core.logging import get_logger
from app.core.exceptions import QuizStorageError

logger = get_logger(__name__)

# Default storage directory
QUIZ_STORAGE_DIR = Path(os.getenv("QUIZ_STORAGE_DIR", "data/quizzes"))


class QuizStorageService:
    """Service for ZIP-based quiz storage and management."""
    
    def __init__(self, storage_dir: Optional[Path] = None):
        """Initialize the quiz storage service.
        
        Args:
            storage_dir: Directory to store quiz ZIP files. Defaults to QUIZ_STORAGE_DIR.
        """
        self.storage_dir = storage_dir or QUIZ_STORAGE_DIR
        self._ensure_storage_dir()
    
    def _ensure_storage_dir(self) -> None:
        """Ensure the storage directory exists."""
        self.storage_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_quiz_path(self, quiz_id: str) -> Path:
        """Get the path to a quiz ZIP file."""
        return self.storage_dir / f"{quiz_id}.zip"
    
    def _sanitize_filename(self, name: str) -> str:
        """Sanitize a string for use as a filename."""
        # Remove or replace invalid characters
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            name = name.replace(char, '_')
        return name.strip()[:100]  # Limit length
    
    def list_quizzes(self) -> List[Dict[str, Any]]:
        """List all available quizzes.
        
        Returns:
            List of quiz metadata dictionaries.
        """
        quizzes = []
        
        for zip_path in self.storage_dir.glob("*.zip"):
            try:
                metadata = self.get_quiz_metadata(zip_path.stem)
                if metadata:
                    quizzes.append(metadata)
            except Exception as e:
                logger.warning(f"Failed to read quiz {zip_path.stem}: {e}")
                continue
        
        # Sort by updated_at descending
        quizzes.sort(key=lambda q: q.get('updated_at', ''), reverse=True)
        return quizzes
    
    def get_quiz_metadata(self, quiz_id: str) -> Optional[Dict[str, Any]]:
        """Get quiz metadata without loading full questions.
        
        Args:
            quiz_id: The quiz identifier.
            
        Returns:
            Quiz metadata or None if not found.
        """
        zip_path = self._get_quiz_path(quiz_id)
        
        if not zip_path.exists():
            return None
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                with zf.open('quiz.json') as f:
                    data = json.load(f)
                    
                    # Get image count
                    image_count = len([n for n in zf.namelist() if n.startswith('images/')])
                    
                    return {
                        'id': quiz_id,
                        'title': data.get('title', 'Untitled'),
                        'description': data.get('description', ''),
                        'question_count': len(data.get('questions', [])),
                        'image_count': image_count,
                        'created_at': data.get('created_at', ''),
                        'updated_at': data.get('updated_at', ''),
                    }
        except Exception as e:
            logger.error(f"Failed to read quiz metadata {quiz_id}: {e}")
            return None
    
    def get_quiz(self, quiz_id: str) -> Optional[Dict[str, Any]]:
        """Load a complete quiz including all data.
        
        Args:
            quiz_id: The quiz identifier.
            
        Returns:
            Complete quiz data or None if not found.
        """
        zip_path = self._get_quiz_path(quiz_id)
        
        if not zip_path.exists():
            return None
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                with zf.open('quiz.json') as f:
                    data = json.load(f)
                    data['id'] = quiz_id
                    return data
        except Exception as e:
            logger.error(f"Failed to load quiz {quiz_id}: {e}")
            return None
    
    def get_quiz_image(self, quiz_id: str, image_name: str) -> Optional[bytes]:
        """Get an image from a quiz ZIP file.
        
        Args:
            quiz_id: The quiz identifier.
            image_name: Name of the image file.
            
        Returns:
            Image bytes or None if not found.
        """
        zip_path = self._get_quiz_path(quiz_id)
        
        if not zip_path.exists():
            return None
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                image_path = f"images/{image_name}"
                if image_path in zf.namelist():
                    return zf.read(image_path)
        except Exception as e:
            logger.error(f"Failed to read image {image_name} from quiz {quiz_id}: {e}")
        
        return None
    
    def save_quiz(
        self,
        title: str,
        questions: List[Dict[str, Any]],
        description: str = "",
        quiz_id: Optional[str] = None,
        images: Optional[Dict[str, bytes]] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """Save a quiz as a ZIP file.
        
        Args:
            title: Quiz title.
            questions: List of question objects.
            description: Optional quiz description.
            quiz_id: Optional existing quiz ID for updates.
            images: Optional dict of image_name -> image_bytes.
            
        Returns:
            Tuple of (quiz_id, quiz_metadata).
        """
        # Generate ID if not provided
        if not quiz_id:
            # Create ID from sanitized title + short UUID
            safe_title = self._sanitize_filename(title)
            short_uuid = str(uuid4())[:8]
            quiz_id = f"{safe_title}_{short_uuid}"
        
        zip_path = self._get_quiz_path(quiz_id)
        now = datetime.utcnow().isoformat()
        
        logger.info(f"Saving quiz {quiz_id} (exists: {zip_path.exists()})")
        
        # Check if updating existing quiz and backup old file
        existing_data = None
        old_zip_path = None
        if zip_path.exists():
            try:
                existing_data = self.get_quiz(quiz_id)
                # Create backup before overwriting
                old_zip_path = zip_path.with_suffix('.zip.old')
                shutil.copy(zip_path, old_zip_path)
                logger.info(f"Backed up existing quiz to {old_zip_path}")
            except Exception as e:
                logger.error(f"Failed to backup existing quiz: {e}")
                raise QuizStorageError(f"Failed to backup existing quiz: {e}", quiz_id=quiz_id)
        
        quiz_data = {
            'title': title,
            'description': description,
            'questions': questions,
            'created_at': existing_data.get('created_at', now) if existing_data else now,
            'updated_at': now,
        }
        
        try:
            # Create new ZIP file
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                # Write quiz.json
                zf.writestr('quiz.json', json.dumps(quiz_data, ensure_ascii=False, indent=2))
                
                # Write images
                if images:
                    logger.info(f"Writing {len(images)} images to quiz")
                    for image_name, image_data in images.items():
                        zf.writestr(f"images/{image_name}", image_data)
                
                # Copy existing images if updating and no new images provided
                elif old_zip_path and old_zip_path.exists():
                    logger.info("Copying existing images from backup")
                    try:
                        with zipfile.ZipFile(old_zip_path, 'r') as old_zf:
                            image_files = [n for n in old_zf.namelist() if n.startswith('images/')]
                            logger.info(f"Found {len(image_files)} existing images")
                            for name in image_files:
                                zf.writestr(name, old_zf.read(name))
                    except Exception as e:
                        logger.warning(f"Could not copy existing images: {e}")
            
            # Cleanup backup on success
            if old_zip_path and old_zip_path.exists():
                old_zip_path.unlink()
                logger.info("Removed backup file")
                
        except Exception as e:
            logger.error(f"Failed to save quiz: {e}", exc_info=True)
            # Restore backup if save failed
            if old_zip_path and old_zip_path.exists():
                shutil.copy(old_zip_path, zip_path)
                old_zip_path.unlink()
                logger.info("Restored quiz from backup")
            raise QuizStorageError(f"Failed to save quiz: {e}", quiz_id=quiz_id)
        
        logger.info(f"Saved quiz {quiz_id}: {title}")
        
        metadata = self.get_quiz_metadata(quiz_id)
        # Return quiz_data as fallback metadata if get_quiz_metadata fails
        if metadata is None:
            metadata = {
                'id': quiz_id,
                'title': title,
                'description': description,
                'question_count': len(questions),
                'image_count': len(images) if images else 0,
                'created_at': quiz_data['created_at'],
                'updated_at': quiz_data['updated_at'],
            }
        return quiz_id, metadata
    
    def delete_quiz(self, quiz_id: str) -> bool:
        """Delete a quiz ZIP file.
        
        Args:
            quiz_id: The quiz identifier.
            
        Returns:
            True if deleted, False if not found.
        """
        zip_path = self._get_quiz_path(quiz_id)
        
        if not zip_path.exists():
            return False
        
        try:
            zip_path.unlink()
            logger.info(f"Deleted quiz {quiz_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete quiz {quiz_id}: {e}")
            return False
    
    def import_zip(self, zip_data: bytes, quiz_id: Optional[str] = None) -> Tuple[str, Dict[str, Any]]:
        """Import a quiz from a ZIP file.
        
        Args:
            zip_data: The ZIP file content as bytes.
            quiz_id: Optional ID to use (otherwise generated from title).
            
        Returns:
            Tuple of (quiz_id, quiz_metadata).
            
        Raises:
            ValueError: If ZIP is invalid or missing required files.
        """
        import io
        
        # Validate ZIP structure
        try:
            with zipfile.ZipFile(io.BytesIO(zip_data), 'r') as zf:
                if 'quiz.json' not in zf.namelist():
                    raise ValueError("Invalid quiz ZIP: missing quiz.json")
                
                with zf.open('quiz.json') as f:
                    data = json.load(f)
                
                if 'title' not in data or 'questions' not in data:
                    raise ValueError("Invalid quiz.json: missing title or questions")
                
                title = data['title']
                description = data.get('description', '')
                questions = data['questions']
                
                # Extract images
                images = {}
                for name in zf.namelist():
                    if name.startswith('images/') and len(name) > 7:
                        image_name = name[7:]  # Remove 'images/' prefix
                        images[image_name] = zf.read(name)
        
        except zipfile.BadZipFile:
            raise ValueError("Invalid ZIP file format")
        except json.JSONDecodeError:
            raise ValueError("Invalid quiz.json: not valid JSON")
        
        # Save the quiz
        return self.save_quiz(
            title=title,
            questions=questions,
            description=description,
            quiz_id=quiz_id,
            images=images
        )
    
    def export_zip(self, quiz_id: str) -> Optional[bytes]:
        """Export a quiz as a ZIP file.
        
        Args:
            quiz_id: The quiz identifier.
            
        Returns:
            ZIP file content as bytes, or None if not found.
        """
        zip_path = self._get_quiz_path(quiz_id)
        
        if not zip_path.exists():
            return None
        
        return zip_path.read_bytes()


# Singleton instance
quiz_storage = QuizStorageService()
