"""Student schema for validation."""

import re


class StudentSchema:
    """Schema for student validation."""

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

        return True, None
