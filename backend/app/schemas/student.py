"""Student schema for validation."""

import re
import os
from typing import Tuple, Optional

ALLOWED_PHOTO_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "avif"}
MAX_PHOTO_PATH_LENGTH = 255


class StudentSchema:
    """Schema for student validation."""

    @staticmethod
    def _validate_photo_value(photo: Optional[object], allow_empty_string_for_removal: bool = False) -> Tuple[bool, Optional[str]]:
        """
        Validate the 'photo' field value.

        Args:
            photo: The photo value from payload (can be None, empty string, or a string path).
            allow_empty_string_for_removal: When True, an empty string is accepted (used for update to indicate removal).

        Returns:
            Tuple[is_valid, error_message_or_None]
        """
        if photo is None:
            return True, None

        # Accept empty string only when allowed (used to request removal)
        if isinstance(photo, str) and photo == "":
            return (True, None) if allow_empty_string_for_removal else (False, "Invalid photo value.")

        if not isinstance(photo, str):
            return False, "Invalid photo value."

        if len(photo) > MAX_PHOTO_PATH_LENGTH:
            return False, f"Photo path must be at most {MAX_PHOTO_PATH_LENGTH} characters."

        # Basic extension check: helpful to catch obvious non-image strings.
        _, ext = os.path.splitext(photo)
        if ext:
            ext = ext.lstrip(".").lower()
            if ext and ext not in ALLOWED_PHOTO_EXTENSIONS:
                return False, "Photo must be an image file (jpg, png, gif, webp, avif)."
        # If no extension, we still allow it (some storage keys may not include extension), so do not reject.
        return True, None

    @staticmethod
    def validate_create(data: dict) -> tuple[bool, str | None]:
        """
        Validate student creation data.

        Args:
            data: Dictionary containing student data

        Returns:
            Tuple of (is_valid, error_message)
        """
        student_id = data.get("id", "").strip()
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        program_id = data.get("program_id")
        year_level = data.get("year_level")
        gender = data.get("gender", "").strip()
        photo = data.get("photo", None)

        # Validate student ID format (NNNN-NNNN)
        if not student_id:
            return False, "Student ID is required."
        if not re.match(r'^\d{4}-\d{4}$', student_id):
            return False, "Student ID must be in format NNNN-NNNN."
        
        if not first_name:
            return False, "First name is required."
        if not last_name:
            return False, "Last name is required."
        
        # Program ID is required
        if program_id is None or program_id == "":
            return False, "Program must be selected."
        try:
            program_id = int(program_id)
        except (ValueError, TypeError):
            return False, "Program ID must be a valid integer."
        
        if year_level is None:
            return False, "Year level is required."
        try:
            year_level = int(year_level)
            if not 1 <= year_level <= 5:
                return False, "Year level must be between 1 and 5."
        except (ValueError, TypeError):
            return False, "Year level must be a valid integer."
        
        if not gender:
            return False, "Gender is required."
        if gender not in ["Male", "Female", "Other"]:
            return False, "Gender must be Male, Female, or Other."
        
        # Photo is optional on create; if provided, do lightweight validation
        ok, err = StudentSchema._validate_photo_value(photo, allow_empty_string_for_removal=False)
        if not ok:
            return False, err

        return True, None

    @staticmethod
    def validate_update(data: dict) -> tuple[bool, str | None]:
        """
        Validate student update data.

        Differences from create:
        - fields may be omitted (partial update)
        - photo may be empty string to request removal

        Returns:
            Tuple of (is_valid, error_message)
        """
        # ID if provided must follow format
        if "id" in data and data.get("id") not in (None, ""):
            student_id = (data.get("id") or "").strip()
            if not re.match(r'^\d{4}-\d{4}$', student_id):
                return False, "Student ID must be in format NNNN-NNNN."

        if "first_name" in data:
            if (data.get("first_name") or "").strip() == "":
                return False, "First name cannot be empty."

        if "last_name" in data:
            if (data.get("last_name") or "").strip() == "":
                return False, "Last name cannot be empty."

        if "program_id" in data:
            if data.get("program_id") == "":
                # allow clearing program (null)
                pass
            else:
                try:
                    int(data.get("program_id"))
                except (ValueError, TypeError):
                    return False, "Program ID must be a valid integer."

        if "year_level" in data:
            if data.get("year_level") in (None, ""):
                return False, "Year level is required."
            try:
                year_level = int(data.get("year_level"))
                if not 1 <= year_level <= 5:
                    return False, "Year level must be between 1 and 5."
            except (ValueError, TypeError):
                return False, "Year level must be a valid integer."

        if "gender" in data:
            if not data.get("gender"):
                return False, "Gender is required."
            if data.get("gender") not in ["Male", "Female", "Other"]:
                return False, "Gender must be Male, Female, or Other."

        if "photo" in data:
            # For updates, allow empty string to indicate removal
            ok, err = StudentSchema._validate_photo_value(data.get("photo"), allow_empty_string_for_removal=True)
            if not ok:
                return False, err

        return True, None
