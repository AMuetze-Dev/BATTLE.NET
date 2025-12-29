"""
XML validation service using XSD schema
"""
import os
from typing import Optional, List, Tuple
from lxml import etree  # type: ignore
from pathlib import Path

from app.core.logging import get_logger

logger = get_logger(__name__)


class XMLValidationError(Exception):
    """Custom exception for XML validation errors."""
    
    def __init__(self, message: str, errors: Optional[List[str]] = None):
        super().__init__(message)
        self.errors = errors or []


class XMLValidator:
    """Validator for question catalog XML files."""
    
    def __init__(self, xsd_path: Optional[str] = None):
        """
        Initialize XML validator.
        
        Args:
            xsd_path: Path to XSD schema file. If None, uses default path.
        """
        if xsd_path is None:
            # Default to questions-schema/questions.xsd
            base_dir = Path(__file__).parent.parent.parent.parent
            self.xsd_path = base_dir / "questions-schema" / "questions.xsd"
        else:
            self.xsd_path = Path(xsd_path)
        self._schema: Optional[etree.XMLSchema] = None
        
    def _load_schema(self) -> etree.XMLSchema:
        """
        Load XSD schema from file.
        
        Returns:
            etree.XMLSchema: Loaded schema
            
        Raises:
            XMLValidationError: If schema file not found or invalid
        """
        if self._schema is not None:
            return self._schema
        
        if not self.xsd_path.exists():
            raise XMLValidationError(
                f"XSD schema file not found: {self.xsd_path}"
            )
        
        try:
            with open(self.xsd_path, 'rb') as f:
                schema_doc = etree.parse(f)
                self._schema = etree.XMLSchema(schema_doc)
                logger.info(f"Loaded XSD schema from {self.xsd_path}")
                return self._schema
        except etree.XMLSchemaParseError as e:
            raise XMLValidationError(
                f"Invalid XSD schema: {str(e)}",
                [str(e)]
            )
        except Exception as e:
            raise XMLValidationError(
                f"Failed to load XSD schema: {str(e)}",
                [str(e)]
            )
    
    def validate_xml_string(self, xml_string: str) -> Tuple[bool, List[str]]:
        """
        Validate XML string against XSD schema.
        
        Args:
            xml_string: XML content as string
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, error_messages)
        """
        if not xml_string or not xml_string.strip():
            return False, ["XML content is empty"]
        
        try:
            # Parse XML
            xml_doc = etree.fromstring(xml_string.encode('utf-8'))
        except etree.XMLSyntaxError as e:
            return False, [f"XML syntax error: {str(e)}"]
        except Exception as e:
            return False, [f"Failed to parse XML: {str(e)}"]
        
        return self.validate_xml_tree(xml_doc)
    
    def validate_xml_tree(self, xml_tree: etree._Element) -> Tuple[bool, List[str]]:
        """
        Validate XML element tree against XSD schema.
        
        Args:
            xml_tree: XML element tree
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, error_messages)
        """
        try:
            schema = self._load_schema()
        except XMLValidationError as e:
            return False, e.errors
        
        # Validate against schema
        is_valid = schema.validate(xml_tree)
        
        if not is_valid:
            errors = [str(error) for error in schema.error_log]
            return False, errors
        
        return True, []
    
    def validate_file(self, file_path: str) -> Tuple[bool, List[str]]:
        """
        Validate XML file against XSD schema.
        
        Args:
            file_path: Path to XML file
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, error_messages)
        """
        if not os.path.exists(file_path):
            return False, [f"File not found: {file_path}"]
        
        try:
            with open(file_path, 'rb') as f:
                xml_doc = etree.parse(f)
                return self.validate_xml_tree(xml_doc.getroot())
        except etree.XMLSyntaxError as e:
            return False, [f"XML syntax error in {file_path}: {str(e)}"]
        except Exception as e:
            return False, [f"Failed to read file {file_path}: {str(e)}"]
    
    def parse_and_validate(self, xml_string: str) -> etree._Element:
        """
        Parse XML string and validate against schema.
        
        Args:
            xml_string: XML content as string
            
        Returns:
            etree._Element: Parsed and validated XML tree
            
        Raises:
            XMLValidationError: If validation fails
        """
        is_valid, errors = self.validate_xml_string(xml_string)
        
        if not is_valid:
            raise XMLValidationError(
                "XML validation failed",
                errors
            )
        
        return etree.fromstring(xml_string.encode('utf-8'))
    
    def extract_question_types(self, xml_tree: etree._Element) -> List[str]:
        """
        Extract all question types from XML.
        
        Args:
            xml_tree: XML element tree
            
        Returns:
            List[str]: List of unique question types
        """
        types = set()
        
        for question in xml_tree.xpath('//question'):
            q_type = question.get('type')
            if q_type:
                types.add(q_type)
        
        return sorted(list(types))
    
    def extract_media_references(self, xml_tree: etree._Element) -> List[str]:
        """
        Extract all media file references from XML.
        
        Args:
            xml_tree: XML element tree
            
        Returns:
            List[str]: List of media file paths
        """
        media_files = []
        
        # Image references
        for image_elem in xml_tree.xpath('//image'):
            if image_elem.text:
                media_files.append(image_elem.text.strip())
        
        for image_elem in xml_tree.xpath('//imageUrl'):
            if image_elem.text:
                media_files.append(image_elem.text.strip())
        
        # Hotspot images
        for hotspot in xml_tree.xpath('//hotspot/imageUrl'):
            if hotspot.text:
                media_files.append(hotspot.text.strip())
        
        # Image question images
        for img_question in xml_tree.xpath('//imageQuestion/imageUrl'):
            if img_question.text:
                media_files.append(img_question.text.strip())
        
        return list(set(media_files))  # Remove duplicates
    
    def validate_question_structure(self, xml_tree: etree._Element) -> Tuple[bool, List[str]]:
        """
        Validate semantic structure of questions beyond XSD.
        
        Args:
            xml_tree: XML element tree
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, error_messages)
        """
        errors = []
        
        # Check for at least one category
        categories = xml_tree.xpath('//category')
        if not categories:
            errors.append("No categories found in XML")
        
        # Check each category has at least one question
        for idx, category in enumerate(categories):
            cat_id = category.get('id', f'category_{idx}')
            questions = category.xpath('./question')
            if not questions:
                errors.append(f"Category '{cat_id}' has no questions")
        
        # Validate question IDs are unique
        question_ids = [q.get('id') for q in xml_tree.xpath('//question') if q.get('id')]
        if len(question_ids) != len(set(question_ids)):
            duplicates = [qid for qid in question_ids if question_ids.count(qid) > 1]
            errors.append(f"Duplicate question IDs found: {', '.join(set(duplicates))}")
        
        # Validate category IDs are unique
        category_ids = [c.get('id') for c in categories if c.get('id')]
        if len(category_ids) != len(set(category_ids)):
            duplicates = [cid for cid in category_ids if category_ids.count(cid) > 1]
            errors.append(f"Duplicate category IDs found: {', '.join(set(duplicates))}")
        
        return len(errors) == 0, errors
