"""
Comprehensive tests for XML validation service
"""
import pytest
from pathlib import Path
from lxml import etree  # type: ignore

from app.services.xml_validator import XMLValidator, XMLValidationError


# Test XML samples
VALID_XML = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <metadata>
        <title>Test Quiz</title>
        <author>Test Author</author>
    </metadata>
    <category id="cat1" name="Category 1">
        <question id="q1" type="input-text">
            <prompt>What is the capital of Germany?</prompt>
            <inputText>
                <answers requiredCorrect="1">
                    <answer correct="true">Berlin</answer>
                    <answer correct="true">berlin</answer>
                </answers>
                <points>1</points>
            </inputText>
        </question>
    </category>
</quiz>
"""

INVALID_XML_SYNTAX = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Test">
        <question id="q1" type="input-text"
            <prompt>Broken</prompt>
        </question>
    </category>
</quiz>
"""

INVALID_XML_MISSING_REQUIRED = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Test">
        <question id="q1" type="input-text">
            <!-- Missing prompt -->
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

INVALID_XML_WRONG_TYPE = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Test">
        <question id="q1" type="invalid-type">
            <prompt>Test?</prompt>
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

XML_NO_CATEGORIES = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <metadata>
        <title>Empty Quiz</title>
    </metadata>
</quiz>
"""

XML_EMPTY_CATEGORY = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Empty Category">
    </category>
</quiz>
"""

XML_DUPLICATE_QUESTION_IDS = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Test">
        <question id="q1" type="buzzer">
            <prompt>Question 1</prompt>
            <buzzer>
                <winnerPoints>3</winnerPoints>
                <otherPoints>1</otherPoints>
            </buzzer>
        </question>
        <question id="q1" type="buzzer">
            <prompt>Question 2 (duplicate ID)</prompt>
            <buzzer>
                <winnerPoints>3</winnerPoints>
                <otherPoints>1</otherPoints>
            </buzzer>
        </question>
    </category>
</quiz>
"""

XML_DUPLICATE_CATEGORY_IDS = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Category 1">
        <question id="q1" type="buzzer">
            <prompt>Question</prompt>
            <buzzer>
                <winnerPoints>3</winnerPoints>
                <otherPoints>1</otherPoints>
            </buzzer>
        </question>
    </category>
    <category id="cat1" name="Category 2 (duplicate ID)">
        <question id="q2" type="buzzer">
            <prompt>Question</prompt>
            <buzzer>
                <winnerPoints>3</winnerPoints>
                <otherPoints>1</otherPoints>
            </buzzer>
        </question>
    </category>
</quiz>
"""

XML_WITH_MEDIA = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Media Questions">
        <question id="q1" type="input-text">
            <prompt>What is shown?</prompt>
            <image>media/test1.jpg</image>
            <inputText>
                <answers requiredCorrect="1">
                    <answer correct="true">Answer</answer>
                </answers>
                <points>1</points>
            </inputText>
        </question>
        <question id="q2" type="hotspot">
            <prompt>Click on Germany</prompt>
            <hotspot>
                <imageUrl>media/map.png</imageUrl>
                <hotspots>
                    <hotspot id="hs1" x="100" y="200" radius="50"/>
                </hotspots>
                <points>1</points>
            </hotspot>
        </question>
        <question id="q3" type="image-question">
            <prompt>What is this?</prompt>
            <imageQuestion>
                <imageUrl>media/photo.jpg</imageUrl>
                <allowZoom>true</allowZoom>
            </imageQuestion>
        </question>
    </category>
</quiz>
"""

XML_ALL_QUESTION_TYPES = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="All Types">
        <question id="q1" type="input-text">
            <prompt>Text input?</prompt>
            <inputText>
                <answers requiredCorrect="1">
                    <answer correct="true">Answer</answer>
                </answers>
                <points>1</points>
            </inputText>
        </question>
        <question id="q2" type="input-number">
            <prompt>Number input?</prompt>
            <inputNumber>
                <correctValue>42</correctValue>
                <tolerance>0</tolerance>
                <points>1</points>
            </inputNumber>
        </question>
        <question id="q3" type="slider">
            <prompt>Slider estimate?</prompt>
            <slider autoEvaluate="false">
                <min>0</min>
                <max>100</max>
                <step>1</step>
                <correctValue>50</correctValue>
                <points>2</points>
            </slider>
        </question>
        <question id="q4" type="multiple-choice">
            <prompt>Multiple choice?</prompt>
            <multipleChoice>
                <options>
                    <option id="opt1" correct="true">Option 1</option>
                    <option id="opt2" correct="false">Option 2</option>
                </options>
            </multipleChoice>
        </question>
        <question id="q5" type="buzzer">
            <prompt>Buzzer?</prompt>
            <buzzer>
                <winnerPoints>3</winnerPoints>
                <otherPoints>1</otherPoints>
            </buzzer>
        </question>
        <question id="q6" type="image-question">
            <prompt>Image?</prompt>
            <imageQuestion>
                <imageUrl>media/img.jpg</imageUrl>
                <allowZoom>true</allowZoom>
            </imageQuestion>
        </question>
        <question id="q7" type="hotspot">
            <prompt>Hotspot?</prompt>
            <hotspot>
                <imageUrl>media/map.png</imageUrl>
                <hotspots>
                    <hotspot id="hs1" x="100" y="100" radius="20"/>
                </hotspots>
                <points>1</points>
            </hotspot>
        </question>
        <question id="q8" type="sorting">
            <prompt>Sort these?</prompt>
            <sorting>
                <items>
                    <item id="item1" correctOrder="1">First</item>
                    <item id="item2" correctOrder="2">Second</item>
                </items>
            </sorting>
        </question>
    </category>
</quiz>
"""


@pytest.fixture
def validator(tmp_path):
    """Create XML validator with test XSD."""
    # Use actual XSD from project
    base_dir = Path(__file__).parent.parent.parent
    xsd_path = base_dir / "questions-schema" / "questions.xsd"
    return XMLValidator(xsd_path=str(xsd_path))


class TestXMLValidatorInitialization:
    """Test XMLValidator initialization."""

    def test_init_with_default_path(self):
        """Test initialization with default XSD path."""
        validator = XMLValidator()
        assert validator.xsd_path is not None

    def test_init_with_custom_path(self, tmp_path):
        """Test initialization with custom XSD path."""
        custom_path = tmp_path / "custom.xsd"
        validator = XMLValidator(xsd_path=str(custom_path))
        assert validator.xsd_path == custom_path

    def test_load_nonexistent_schema(self, tmp_path):
        """Test loading nonexistent schema file."""
        validator = XMLValidator(xsd_path=str(tmp_path / "missing.xsd"))
        
        with pytest.raises(XMLValidationError) as exc_info:
            validator._load_schema()
        
        assert "not found" in str(exc_info.value)


class TestXMLValidationBasic:
    """Test basic XML validation."""

    def test_validate_valid_xml(self, validator):
        """Test validating valid XML."""
        is_valid, errors = validator.validate_xml_string(VALID_XML)
        
        if not is_valid:
            print(f"\\nValidation errors: {errors}")
        
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_empty_string(self, validator):
        """Test validating empty string."""
        is_valid, errors = validator.validate_xml_string("")
        
        assert is_valid is False
        assert "empty" in errors[0].lower()

    def test_validate_whitespace_only(self, validator):
        """Test validating whitespace only."""
        is_valid, errors = validator.validate_xml_string("   \n  \t  ")
        
        assert is_valid is False
        assert "empty" in errors[0].lower()

    def test_validate_invalid_syntax(self, validator):
        """Test validating XML with syntax errors."""
        is_valid, errors = validator.validate_xml_string(INVALID_XML_SYNTAX)
        
        assert is_valid is False
        assert len(errors) > 0
        assert any("syntax" in err.lower() for err in errors)

    def test_validate_not_xml(self, validator):
        """Test validating non-XML content."""
        is_valid, errors = validator.validate_xml_string("This is just text, not XML")
        
        assert is_valid is False
        assert len(errors) > 0

    def test_validate_malformed_xml(self, validator):
        """Test validating malformed XML."""
        malformed = "<quiz><category><question></quiz>"
        is_valid, errors = validator.validate_xml_string(malformed)
        
        assert is_valid is False

    def test_validate_xml_with_special_characters(self, validator):
        """Test XML with special characters."""
        xml = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Special &amp; Characters">
        <question id="q1" type="buzzer">
            <prompt>Question with &lt;tags&gt; and &quot;quotes&quot;</prompt>
            <buzzer>
                <winnerPoints>3</winnerPoints>
                <otherPoints>1</otherPoints>
            </buzzer>
        </question>
    </category>
</quiz>
"""
        is_valid, errors = validator.validate_xml_string(xml)
        
        assert is_valid is True


class TestXMLValidationSchema:
    """Test XML validation against XSD schema."""

    def test_validate_missing_required_element(self, validator):
        """Test validation with missing required element."""
        is_valid, errors = validator.validate_xml_string(INVALID_XML_MISSING_REQUIRED)
        
        assert is_valid is False
        assert len(errors) > 0

    def test_validate_invalid_question_type(self, validator):
        """Test validation with invalid question type."""
        is_valid, errors = validator.validate_xml_string(INVALID_XML_WRONG_TYPE)
        
        assert is_valid is False
        assert len(errors) > 0

    def test_validate_all_question_types(self, validator):
        """Test validation with all 8 question types."""
        is_valid, errors = validator.validate_xml_string(XML_ALL_QUESTION_TYPES)
        
        assert is_valid is True
        assert len(errors) == 0


class TestXMLFileValidation:
    """Test XML file validation."""

    def test_validate_nonexistent_file(self, validator):
        """Test validating nonexistent file."""
        is_valid, errors = validator.validate_file("/nonexistent/file.xml")
        
        assert is_valid is False
        assert any("not found" in err.lower() for err in errors)

    def test_validate_file_with_valid_xml(self, validator, tmp_path):
        """Test validating file with valid XML."""
        xml_file = tmp_path / "valid.xml"
        xml_file.write_text(VALID_XML, encoding='utf-8')
        
        is_valid, errors = validator.validate_file(str(xml_file))
        
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_file_with_invalid_xml(self, validator, tmp_path):
        """Test validating file with invalid XML."""
        xml_file = tmp_path / "invalid.xml"
        xml_file.write_text(INVALID_XML_SYNTAX, encoding='utf-8')
        
        is_valid, errors = validator.validate_file(str(xml_file))
        
        assert is_valid is False


class TestParseAndValidate:
    """Test parse_and_validate method."""

    def test_parse_valid_xml(self, validator):
        """Test parsing valid XML."""
        tree = validator.parse_and_validate(VALID_XML)
        
        assert tree is not None
        assert tree.tag == "quiz"

    def test_parse_invalid_xml_raises_exception(self, validator):
        """Test parsing invalid XML raises exception."""
        with pytest.raises(XMLValidationError) as exc_info:
            validator.parse_and_validate(INVALID_XML_SYNTAX)
        
        assert len(exc_info.value.errors) > 0


class TestExtractQuestionTypes:
    """Test extracting question types."""

    def test_extract_question_types(self, validator):
        """Test extracting question types from XML."""
        tree = etree.fromstring(XML_ALL_QUESTION_TYPES.encode('utf-8'))
        types = validator.extract_question_types(tree)
        
        expected_types = [
            'buzzer', 'hotspot', 'image-question', 'input-number',
            'input-text', 'multiple-choice', 'slider', 'sorting'
        ]
        
        assert sorted(types) == expected_types

    def test_extract_question_types_single_type(self, validator):
        """Test extracting when only one question type exists."""
        tree = etree.fromstring(VALID_XML.encode('utf-8'))
        types = validator.extract_question_types(tree)
        
        assert types == ['input-text']

    def test_extract_question_types_empty(self, validator):
        """Test extracting from XML with no questions."""
        tree = etree.fromstring(XML_NO_CATEGORIES.encode('utf-8'))
        types = validator.extract_question_types(tree)
        
        assert len(types) == 0


class TestExtractMediaReferences:
    """Test extracting media references."""

    def test_extract_media_references(self, validator):
        """Test extracting media file references."""
        tree = etree.fromstring(XML_WITH_MEDIA.encode('utf-8'))
        media = validator.extract_media_references(tree)
        
        assert len(media) == 3
        assert 'media/test1.jpg' in media
        assert 'media/map.png' in media
        assert 'media/photo.jpg' in media

    def test_extract_media_no_duplicates(self, validator):
        """Test that duplicate media references are removed."""
        xml = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Test">
        <question id="q1" type="input-text">
            <prompt>Q1</prompt>
            <image>media/same.jpg</image>
            <inputText>
                <answers requiredCorrect="1">
                    <answer correct="true">A</answer>
                </answers>
                <points>1</points>
            </inputText>
        </question>
        <question id="q2" type="input-text">
            <prompt>Q2</prompt>
            <image>media/same.jpg</image>
            <inputText>
                <answers requiredCorrect="1">
                    <answer correct="true">A</answer>
                </answers>
                <points>1</points>
            </inputText>
        </question>
    </category>
</quiz>
"""
        tree = etree.fromstring(xml.encode('utf-8'))
        media = validator.extract_media_references(tree)
        
        assert len(media) == 1
        assert media[0] == 'media/same.jpg'

    def test_extract_media_no_references(self, validator):
        """Test extracting when no media references exist."""
        tree = etree.fromstring(VALID_XML.encode('utf-8'))
        media = validator.extract_media_references(tree)
        
        assert len(media) == 0


class TestSemanticValidation:
    """Test semantic validation of XML structure."""

    def test_validate_no_categories(self, validator):
        """Test validation fails with no categories."""
        tree = etree.fromstring(XML_NO_CATEGORIES.encode('utf-8'))
        is_valid, errors = validator.validate_question_structure(tree)
        
        assert is_valid is False
        assert any("no categories" in err.lower() for err in errors)

    def test_validate_empty_category(self, validator):
        """Test validation fails with empty category."""
        tree = etree.fromstring(XML_EMPTY_CATEGORY.encode('utf-8'))
        is_valid, errors = validator.validate_question_structure(tree)
        
        assert is_valid is False
        assert any("no questions" in err.lower() for err in errors)

    def test_validate_duplicate_question_ids(self, validator):
        """Test validation fails with duplicate question IDs."""
        tree = etree.fromstring(XML_DUPLICATE_QUESTION_IDS.encode('utf-8'))
        is_valid, errors = validator.validate_question_structure(tree)
        
        assert is_valid is False
        assert any("duplicate question" in err.lower() for err in errors)

    def test_validate_duplicate_category_ids(self, validator):
        """Test validation fails with duplicate category IDs."""
        tree = etree.fromstring(XML_DUPLICATE_CATEGORY_IDS.encode('utf-8'))
        is_valid, errors = validator.validate_question_structure(tree)
        
        assert is_valid is False
        assert any("duplicate category" in err.lower() for err in errors)

    def test_validate_valid_structure(self, validator):
        """Test validation passes with valid structure."""
        tree = etree.fromstring(VALID_XML.encode('utf-8'))
        is_valid, errors = validator.validate_question_structure(tree)
        
        assert is_valid is True
        assert len(errors) == 0


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_validate_unicode_content(self, validator):
        """Test validation with Unicode characters."""
        xml = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Ümläüte ünd Spëciål Chåracters">
        <question id="q1" type="buzzer">
            <prompt>Was ist die Hauptstadt von Österreich? 你好世界</prompt>
            <buzzer>
                <winnerPoints>3</winnerPoints>
                <otherPoints>1</otherPoints>
            </buzzer>
        </question>
    </category>
</quiz>
"""
        is_valid, errors = validator.validate_xml_string(xml)
        
        assert is_valid is True

    def test_validate_very_long_prompt(self, validator):
        """Test validation with very long prompt text."""
        long_prompt = "x" * 10000
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Long">
        <question id="q1" type="buzzer">
            <prompt>{long_prompt}</prompt>
            <buzzer>
                <winnerPoints>3</winnerPoints>
                <otherPoints>1</otherPoints>
            </buzzer>
        </question>
    </category>
</quiz>
"""
        is_valid, errors = validator.validate_xml_string(xml)
        
        assert is_valid is True

    def test_validate_many_categories(self, validator):
        """Test validation with many categories."""
        categories = []
        for i in range(100):
            categories.append(f"""
        <category id="cat{i}" name="Category {i}">
            <question id="q{i}" type="buzzer">
                <prompt>Question {i}</prompt>
                <buzzer>
                    <winnerPoints>3</winnerPoints>
                    <otherPoints>1</otherPoints>
                </buzzer>
            </question>
        </category>
            """)
        
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    {''.join(categories)}
</quiz>
"""
        is_valid, errors = validator.validate_xml_string(xml)
        
        assert is_valid is True

    def test_validate_many_questions_per_category(self, validator):
        """Test validation with many questions in one category."""
        questions = []
        for i in range(50):
            questions.append(f"""
            <question id="q{i}" type="buzzer">
                <prompt>Question {i}</prompt>
                <buzzer>
                    <winnerPoints>3</winnerPoints>
                    <otherPoints>1</otherPoints>
                </buzzer>
            </question>
            """)
        
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <category id="cat1" name="Many Questions">
        {''.join(questions)}
    </category>
</quiz>
"""
        is_valid, errors = validator.validate_xml_string(xml)
        
        assert is_valid is True
