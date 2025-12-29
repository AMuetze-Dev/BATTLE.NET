"""
Comprehensive tests for ZIP validation service
"""
import pytest
import zipfile
import os
from pathlib import Path

from app.services.zip_validator import ZIPValidator, ZIPValidationError
from app.services.xml_validator import XMLValidator


# Valid XML for testing
VALID_QUIZ_XML = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Test">
        <question id="q1" type="input-text">
            <prompt>What is the capital?</prompt>
            <inputText>
                <answers requiredCorrect="1">
                    <answer correct="true">Berlin</answer>
                </answers>
                <points>1</points>
            </inputText>
        </question>
    </category>
</quiz>
"""

QUIZ_WITH_IMAGES = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Images">
        <question id="q1" type="input-text">
            <prompt>What is shown?</prompt>
            <image>media/test.jpg</image>
            <inputText>
                <answers requiredCorrect="1">
                    <answer correct="true">Answer</answer>
                </answers>
                <points>1</points>
            </inputText>
        </question>
    </category>
</quiz>
"""


def create_test_zip(zip_path: Path, files: dict, corrupt: bool = False):
    """
    Helper to create test ZIP files.
    
    Args:
        zip_path: Path where ZIP should be created
        files: Dict of {filename: content}
        corrupt: If True, create corrupted ZIP
    """
    if corrupt:
        # Create invalid ZIP by writing garbage
        with open(zip_path, 'wb') as f:
            f.write(b'This is not a valid ZIP file')
    else:
        with zipfile.ZipFile(zip_path, 'w') as zf:
            for filename, content in files.items():
                if isinstance(content, str):
                    zf.writestr(filename, content)
                elif isinstance(content, bytes):
                    zf.writestr(filename, content)
                else:
                    # Empty file/directory
                    zf.writestr(filename, '')


@pytest.fixture
def zip_validator():
    """Create ZIP validator instance."""
    base_dir = Path(__file__).parent.parent.parent
    xsd_path = base_dir / "questions-schema" / "questions.xsd"
    xml_validator = XMLValidator(xsd_path=str(xsd_path))
    return ZIPValidator(xml_validator=xml_validator)


class TestZIPValidatorInitialization:
    """Test ZIPValidator initialization."""

    def test_init_default(self):
        """Test initialization with defaults."""
        validator = ZIPValidator()
        assert validator.xml_validator is not None

    def test_init_custom_xml_validator(self):
        """Test initialization with custom XML validator."""
        xml_val = XMLValidator()
        validator = ZIPValidator(xml_validator=xml_val)
        assert validator.xml_validator is xml_val


class TestZIPBasicValidation:
    """Test basic ZIP validation."""

    def test_validate_nonexistent_file(self, zip_validator):
        """Test validating nonexistent file."""
        is_valid, errors = zip_validator.validate_zip_file("/nonexistent/file.zip")
        
        assert is_valid is False
        assert any("not found" in err.lower() for err in errors)

    def test_validate_valid_zip(self, zip_validator, tmp_path):
        """Test validating valid ZIP file."""
        zip_file = tmp_path / "valid.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "media/": ""
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_not_a_zip(self, zip_validator, tmp_path):
        """Test validating non-ZIP file."""
        not_zip = tmp_path / "notzip.txt"
        not_zip.write_text("This is just text")
        
        is_valid, errors = zip_validator.validate_zip_file(str(not_zip))
        
        assert is_valid is False
        assert any("not a valid zip" in err.lower() for err in errors)

    def test_validate_corrupted_zip(self, zip_validator, tmp_path):
        """Test validating corrupted ZIP file."""
        zip_file = tmp_path / "corrupt.zip"
        create_test_zip(zip_file, {}, corrupt=True)
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is False

    def test_validate_missing_questions_xml(self, zip_validator, tmp_path):
        """Test ZIP without questions.xml."""
        zip_file = tmp_path / "noxml.zip"
        create_test_zip(zip_file, {
            "other_file.txt": "content"
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is False
        assert any("questions.xml" in err.lower() for err in errors)


class TestZIPSecurityValidation:
    """Test security-related ZIP validation."""

    def test_validate_path_traversal_parent(self, zip_validator, tmp_path):
        """Test detection of path traversal with parent directory."""
        zip_file = tmp_path / "traversal.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "../evil.txt": "malicious"
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is False
        assert any("path traversal" in err.lower() for err in errors)

    def test_validate_path_traversal_absolute(self, zip_validator, tmp_path):
        """Test detection of absolute paths."""
        zip_file = tmp_path / "absolute.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "/etc/passwd": "malicious"
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is False
        assert any("absolute path" in err.lower() for err in errors)

    def test_validate_dangerous_extensions_exe(self, zip_validator, tmp_path):
        """Test detection of dangerous file extensions (.exe)."""
        zip_file = tmp_path / "dangerous.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "malware.exe": b"MZ\x90\x00"  # PE header
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is False
        assert any("suspicious" in err.lower() or "not allowed" in err.lower() for err in errors)

    def test_validate_dangerous_extensions_script(self, zip_validator, tmp_path):
        """Test detection of script files."""
        dangerous_files = ['script.bat', 'script.sh', 'script.vbs', 'script.js']
        
        for filename in dangerous_files:
            zip_file = tmp_path / f"danger_{filename}.zip"
            create_test_zip(zip_file, {
                "questions.xml": VALID_QUIZ_XML,
                filename: "malicious script"
            })
            
            is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
            
            assert is_valid is False, f"Should reject {filename}"

    def test_validate_invalid_media_extension(self, zip_validator, tmp_path):
        """Test detection of invalid media file extensions."""
        zip_file = tmp_path / "badmedia.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "media/file.txt": "not an image"
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is False
        assert any("not allowed" in err.lower() for err in errors)

    def test_validate_allowed_image_extensions(self, zip_validator, tmp_path):
        """Test that allowed image extensions pass validation."""
        allowed_exts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp']
        
        for ext in allowed_exts:
            zip_file = tmp_path / f"test{ext}.zip"
            create_test_zip(zip_file, {
                "questions.xml": VALID_QUIZ_XML,
                f"media/image{ext}": b"\x00\x00"  # Fake image data
            })
            
            is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
            
            assert is_valid is True, f"Should allow {ext}: {errors}"


class TestZIPSizeValidation:
    """Test ZIP file size validation."""

    def test_validate_file_too_large(self, zip_validator, tmp_path, monkeypatch):
        """Test rejection of files exceeding size limit."""
        # Temporarily set max size to 1KB for testing
        from app.core import config
        monkeypatch.setattr(config.settings, 'max_upload_size_mb', 0.001)
        
        zip_file = tmp_path / "toolarge.zip"
        # Create ZIP with large content
        large_content = "x" * 2000
        create_test_zip(zip_file, {
            "questions.xml": large_content
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is False
        assert any("too large" in err.lower() for err in errors)

    def test_validate_file_within_limit(self, zip_validator, tmp_path):
        """Test acceptance of files within size limit."""
        zip_file = tmp_path / "small.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML
        })
        
        file_size = os.path.getsize(zip_file)
        assert file_size < 50 * 1024 * 1024  # Less than 50MB
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is True


class TestZIPExtractionAndValidation:
    """Test ZIP extraction with validation."""

    def test_extract_valid_zip(self, zip_validator, tmp_path):
        """Test extracting valid ZIP."""
        zip_file = tmp_path / "valid.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "media/test.jpg": b"\xFF\xD8\xFF"  # JPEG header
        })
        
        is_valid, info, errors = zip_validator.validate_and_extract(str(zip_file))
        
        assert is_valid is True
        assert len(errors) == 0
        assert 'xml_path' in info
        assert os.path.exists(info['xml_path'])

    def test_extract_zip_with_xml_errors(self, zip_validator, tmp_path):
        """Test extracting ZIP with invalid XML."""
        invalid_xml = "<?xml version='1.0'?><invalid>"
        zip_file = tmp_path / "badxml.zip"
        create_test_zip(zip_file, {
            "questions.xml": invalid_xml
        })
        
        is_valid, info, errors = zip_validator.validate_and_extract(str(zip_file))
        
        assert is_valid is False
        assert len(errors) > 0
        assert any("xml" in err.lower() for err in errors)

    def test_extract_zip_missing_media_files(self, zip_validator, tmp_path):
        """Test extracting ZIP with missing media files."""
        zip_file = tmp_path / "missing_media.zip"
        create_test_zip(zip_file, {
            "questions.xml": QUIZ_WITH_IMAGES
            # media/test.jpg is missing!
        })
        
        is_valid, info, errors = zip_validator.validate_and_extract(str(zip_file))
        
        assert is_valid is False
        assert any("missing media" in err.lower() for err in errors)
        assert any("test.jpg" in err for err in errors)

    def test_extract_zip_with_all_media_files(self, zip_validator, tmp_path):
        """Test extracting ZIP with all required media files."""
        zip_file = tmp_path / "complete.zip"
        create_test_zip(zip_file, {
            "questions.xml": QUIZ_WITH_IMAGES,
            "media/test.jpg": b"\xFF\xD8\xFF"
        })
        
        is_valid, info, errors = zip_validator.validate_and_extract(str(zip_file))
        
        assert is_valid is True
        assert len(errors) == 0

    def test_extract_to_custom_directory(self, zip_validator, tmp_path):
        """Test extracting to custom directory."""
        zip_file = tmp_path / "custom.zip"
        extract_dir = tmp_path / "extracted"
        
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML
        })
        
        is_valid, info, errors = zip_validator.validate_and_extract(
            str(zip_file),
            extract_to=str(extract_dir)
        )
        
        assert is_valid is True
        assert os.path.exists(extract_dir)
        assert os.path.exists(info['xml_path'])

    def test_extract_temp_dir_cleanup(self, zip_validator, tmp_path):
        """Test that temp directory is created when extract_to is None."""
        zip_file = tmp_path / "temp.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML
        })
        
        is_valid, info, errors = zip_validator.validate_and_extract(str(zip_file))
        
        assert is_valid is True
        assert 'temp_dir' in info
        assert info['temp_dir'] is not None
        assert info['cleanup'] is True


class TestZIPInfo:
    """Test ZIP information extraction."""

    def test_get_zip_info_valid(self, zip_validator, tmp_path):
        """Test getting info from valid ZIP."""
        zip_file = tmp_path / "info.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "media/img1.jpg": b"\x00" * 100,
            "media/img2.png": b"\x00" * 200,
        })
        
        info = zip_validator.get_zip_info(str(zip_file))
        
        assert info['file_count'] == 3
        assert info['has_questions_xml'] is True
        assert info['media_file_count'] == 2
        assert 'total_size' in info
        assert 'compressed_size' in info

    def test_get_zip_info_invalid(self, zip_validator, tmp_path):
        """Test getting info from invalid ZIP."""
        not_zip = tmp_path / "notzip.txt"
        not_zip.write_text("not a zip")
        
        info = zip_validator.get_zip_info(str(not_zip))
        
        assert info == {}

    def test_get_zip_info_empty(self, zip_validator, tmp_path):
        """Test getting info from empty ZIP."""
        zip_file = tmp_path / "empty.zip"
        create_test_zip(zip_file, {})
        
        info = zip_validator.get_zip_info(str(zip_file))
        
        assert info['file_count'] == 0
        assert info['has_questions_xml'] is False
        assert info['media_file_count'] == 0


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_validate_zip_with_empty_directories(self, zip_validator, tmp_path):
        """Test ZIP with empty directories."""
        zip_file = tmp_path / "emptydirs.zip"
        with zipfile.ZipFile(zip_file, 'w') as zf:
            zf.writestr("questions.xml", VALID_QUIZ_XML)
            zf.writestr("media/", "")  # Empty directory
            zf.writestr("empty/", "")
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is True

    def test_validate_zip_with_nested_directories(self, zip_validator, tmp_path):
        """Test ZIP with nested directory structure."""
        zip_file = tmp_path / "nested.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "media/subfolder/deep/image.jpg": b"\xFF\xD8\xFF"
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is True

    def test_validate_zip_with_unicode_filenames(self, zip_validator, tmp_path):
        """Test ZIP with Unicode filenames."""
        zip_file = tmp_path / "unicode.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "media/图片.jpg": b"\xFF\xD8\xFF",
            "media/Bild_Ö_Ä_Ü.png": b"\x89PNG"
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is True

    def test_validate_many_files(self, zip_validator, tmp_path):
        """Test ZIP with many files."""
        zip_file = tmp_path / "many.zip"
        files: dict[str, str | bytes] = {"questions.xml": VALID_QUIZ_XML}
        
        # Add 100 media files
        for i in range(100):
            files[f"media/img{i}.jpg"] = b"\xFF\xD8\xFF"
        
        create_test_zip(zip_file, files)
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        assert is_valid is True

    def test_validate_zip_bomb_detection(self, zip_validator, tmp_path):
        """Test detection of potential ZIP bombs."""
        # Create a ZIP with high compression ratio
        zip_file = tmp_path / "bomb.zip"
        # Highly compressible data
        huge_content = "0" * 1000000  # 1MB of zeros compresses very well
        
        with zipfile.ZipFile(zip_file, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("questions.xml", VALID_QUIZ_XML)
            zf.writestr("huge.txt", huge_content)
        
        info = zip_validator.get_zip_info(str(zip_file))
        
        # Check compression ratio
        assert 'compression_ratio' in info
        assert info['compression_ratio'] < 0.1  # Very high compression

    def test_validate_case_sensitive_filenames(self, zip_validator, tmp_path):
        """Test handling of case-sensitive filenames."""
        zip_file = tmp_path / "case.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            "media/Image.JPG": b"\xFF\xD8\xFF",
            "media/image.jpg": b"\xFF\xD8\xFF"  # Different case
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        # Should be valid - different files
        assert is_valid is True

    def test_validate_hidden_files(self, zip_validator, tmp_path):
        """Test ZIP with hidden files (starting with dot)."""
        zip_file = tmp_path / "hidden.zip"
        create_test_zip(zip_file, {
            "questions.xml": VALID_QUIZ_XML,
            ".hidden": "hidden content",
            ".DS_Store": "mac metadata"
        })
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        # Should be valid - just ignore hidden files
        assert is_valid is True

    def test_validate_symbolic_links(self, zip_validator, tmp_path):
        """Test ZIP containing symbolic links."""
        # Note: This test may behave differently on different OS
        zip_file = tmp_path / "symlink.zip"
        
        # Create a ZIP manually with a symlink entry
        with zipfile.ZipFile(zip_file, 'w') as zf:
            zf.writestr("questions.xml", VALID_QUIZ_XML)
            # ZipInfo with external_attr for symlink
            info = zipfile.ZipInfo("symlink")
            info.external_attr = 0o120777 << 16  # Symlink
            zf.writestr(info, "target")
        
        is_valid, errors = zip_validator.validate_zip_file(str(zip_file))
        
        # Should still validate the structure
        assert isinstance(is_valid, bool)
