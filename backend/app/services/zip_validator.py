"""
ZIP file validation and extraction service
"""
import os
import zipfile
import tempfile
from pathlib import Path
from typing import Optional, List, Tuple, Dict
from lxml import etree  # type: ignore

from app.services.xml_validator import XMLValidator, XMLValidationError
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)


class ZIPValidationError(Exception):
    """Custom exception for ZIP validation errors."""
    
    def __init__(self, message: str, errors: Optional[List[str]] = None):
        super().__init__(message)
        self.errors = errors or []


class ZIPValidator:
    """Validator for question catalog ZIP files."""
    
    QUESTIONS_XML = "questions.xml"
    MEDIA_DIR = "media"
    ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'}
    
    def __init__(self, xml_validator: Optional[XMLValidator] = None):
        """
        Initialize ZIP validator.
        
        Args:
            xml_validator: XML validator instance. If None, creates new one.
        """
        self.xml_validator = xml_validator or XMLValidator()
    
    def validate_zip_file(self, zip_path: str) -> Tuple[bool, List[str]]:
        """
        Validate ZIP file structure and content.
        
        Args:
            zip_path: Path to ZIP file
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, error_messages)
        """
        errors = []
        
        # Check file exists
        if not os.path.exists(zip_path):
            return False, [f"File not found: {zip_path}"]
        
        # Check file size
        file_size = os.path.getsize(zip_path)
        if file_size > settings.max_upload_bytes:
            max_mb = settings.max_upload_size_mb
            actual_mb = file_size / (1024 * 1024)
            return False, [f"File too large: {actual_mb:.2f}MB (max: {max_mb}MB)"]
        
        # Check if valid ZIP
        if not zipfile.is_zipfile(zip_path):
            return False, ["File is not a valid ZIP archive"]
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                # Check for questions.xml
                if self.QUESTIONS_XML not in zf.namelist():
                    errors.append(f"Missing required file: {self.QUESTIONS_XML}")
                
                # Check for suspicious files
                suspicious = self._check_suspicious_files(zf)
                if suspicious:
                    errors.extend(suspicious)
                
                # Check for path traversal
                traversal_errors = self._check_path_traversal(zf)
                if traversal_errors:
                    errors.extend(traversal_errors)
                
                # Test ZIP integrity
                bad_file = zf.testzip()
                if bad_file:
                    errors.append(f"Corrupted file in ZIP: {bad_file}")
        
        except zipfile.BadZipFile as e:
            return False, [f"Invalid ZIP file: {str(e)}"]
        except Exception as e:
            return False, [f"Error reading ZIP file: {str(e)}"]
        
        return len(errors) == 0, errors
    
    def validate_and_extract(
        self,
        zip_path: str,
        extract_to: Optional[str] = None
    ) -> Tuple[bool, Dict, List[str]]:
        """
        Validate ZIP file and extract contents.
        
        Args:
            zip_path: Path to ZIP file
            extract_to: Directory to extract to. If None, uses temp directory.
            
        Returns:
            Tuple[bool, Dict, List[str]]: 
                (is_valid, extraction_info, error_messages)
                extraction_info contains: {
                    'xml_path': path to questions.xml,
                    'media_dir': path to media directory,
                    'temp_dir': temporary directory (if created)
                }
        """
        errors = []
        
        # Validate ZIP structure
        is_valid, zip_errors = self.validate_zip_file(zip_path)
        if not is_valid:
            return False, {}, zip_errors
        
        # Create extraction directory
        if extract_to is None:
            temp_dir = tempfile.mkdtemp(prefix="battlenet_quiz_")
            extract_to = temp_dir
            cleanup_temp = True
        else:
            temp_dir = None
            cleanup_temp = False
            os.makedirs(extract_to, exist_ok=True)
        
        try:
            # Extract ZIP
            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(extract_to)
            
            xml_path = os.path.join(extract_to, self.QUESTIONS_XML)
            media_dir = os.path.join(extract_to, self.MEDIA_DIR)
            
            # Validate XML
            xml_valid, xml_errors = self.xml_validator.validate_file(xml_path)
            if not xml_valid:
                errors.extend([f"XML validation: {err}" for err in xml_errors])
            
            # Parse XML and check media references
            if xml_valid:
                with open(xml_path, 'r', encoding='utf-8') as f:
                    xml_content = f.read()
                
                xml_tree = etree.fromstring(xml_content.encode('utf-8'))
                
                # Semantic validation
                semantic_valid, semantic_errors = self.xml_validator.validate_question_structure(xml_tree)
                if not semantic_valid:
                    errors.extend([f"Semantic validation: {err}" for err in semantic_errors])
                
                # Check media files exist
                media_refs = self.xml_validator.extract_media_references(xml_tree)
                if media_refs:
                    missing_files = self._check_media_files(extract_to, media_refs)
                    if missing_files:
                        errors.extend([f"Missing media file: {f}" for f in missing_files])
            
            extraction_info = {
                'xml_path': xml_path,
                'media_dir': media_dir if os.path.exists(media_dir) else None,
                'temp_dir': temp_dir,
                'cleanup': cleanup_temp
            }
            
            return len(errors) == 0, extraction_info, errors
        
        except Exception as e:
            if cleanup_temp and temp_dir and os.path.exists(temp_dir):
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
            
            return False, {}, [f"Extraction failed: {str(e)}"]
    
    def _check_suspicious_files(self, zf: zipfile.ZipFile) -> List[str]:
        """
        Check for suspicious files in ZIP.
        
        Args:
            zf: ZipFile object
            
        Returns:
            List[str]: List of errors for suspicious files
        """
        errors = []
        dangerous_extensions = {
            '.exe', '.dll', '.so', '.bat', '.sh', '.cmd', '.com',
            '.scr', '.vbs', '.js', '.jar', '.app', '.deb', '.rpm'
        }
        
        for filename in zf.namelist():
            # Skip directories
            if filename.endswith('/'):
                continue
            
            ext = Path(filename).suffix.lower()
            
            # Check for dangerous extensions
            if ext in dangerous_extensions:
                errors.append(f"Suspicious file type not allowed: {filename}")
            
            # Check media files have allowed extensions
            if filename.startswith(f"{self.MEDIA_DIR}/"):
                if ext and ext not in self.ALLOWED_EXTENSIONS:
                    errors.append(f"Media file type not allowed: {filename} (allowed: {', '.join(self.ALLOWED_EXTENSIONS)})")
        
        return errors
    
    def _check_path_traversal(self, zf: zipfile.ZipFile) -> List[str]:
        """
        Check for path traversal attempts in ZIP.
        
        Args:
            zf: ZipFile object
            
        Returns:
            List[str]: List of errors for path traversal attempts
        """
        errors = []
        
        for filename in zf.namelist():
            # Normalize path
            normalized = os.path.normpath(filename)
            
            # Check for parent directory references
            if normalized.startswith('..') or '/..' in filename or '\\..\\' in filename:
                errors.append(f"Path traversal detected: {filename}")
            
            # Check for absolute paths (Windows: C:\, /etc/..., Unix: /...)
            if os.path.isabs(filename) or (len(filename) > 1 and filename[1] == ':') or filename.startswith('/'):
                errors.append(f"Absolute path not allowed: {filename}")
        
        return errors
    
    def _check_media_files(
        self,
        extract_dir: str,
        media_refs: List[str]
    ) -> List[str]:
        """
        Check that all referenced media files exist.
        
        Args:
            extract_dir: Directory where ZIP was extracted
            media_refs: List of media file references from XML
            
        Returns:
            List[str]: List of missing files
        """
        missing = []
        
        for media_ref in media_refs:
            # Clean up path
            media_ref = media_ref.replace('\\', '/')
            full_path = os.path.join(extract_dir, media_ref)
            
            if not os.path.exists(full_path):
                missing.append(media_ref)
        
        return missing
    
    def get_zip_info(self, zip_path: str) -> Dict:
        """
        Get information about ZIP contents.
        
        Args:
            zip_path: Path to ZIP file
            
        Returns:
            Dict: ZIP information including file count, total size, etc.
        """
        if not zipfile.is_zipfile(zip_path):
            return {}
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                info = zf.infolist()
                
                total_size = sum(f.file_size for f in info)
                compressed_size = sum(f.compress_size for f in info)
                
                media_files = [
                    f.filename for f in info 
                    if f.filename.startswith(f"{self.MEDIA_DIR}/") and not f.is_dir()
                ]
                
                return {
                    'file_count': len(info),
                    'total_size': total_size,
                    'compressed_size': compressed_size,
                    'compression_ratio': compressed_size / total_size if total_size > 0 else 0,
                    'has_questions_xml': self.QUESTIONS_XML in zf.namelist(),
                    'media_file_count': len(media_files),
                    'media_files': media_files[:10]  # First 10 for preview
                }
        except Exception as e:
            logger.error(f"Failed to get ZIP info: {e}")
            return {}
