"""Validation utilities."""

import re
from typing import Optional

from .. import db
from ..models.college import College
from ..models.program import Program
from ..models.student import Student


def validate_college_code_unique(code: str, exclude_id: Optional[int] = None) -> tuple[bool, str]:
    """
    Validate that a college code is unique.

    Args:
        code: The college code to validate
        exclude_id: Optional ID to exclude from the check (for updates)

    Returns:
        Tuple of (is_valid, error_message)
    """
    code = code.strip().upper()
    if not code:
        return False, "College code cannot be empty."

    query = College.query.filter(College.code.ilike(code))
    if exclude_id:
        query = query.filter(College.id != exclude_id)

    existing = query.first()
    if existing:
        return False, f"College code '{code}' already exists."

    return True, ""


def validate_program_code_unique(code: str, exclude_id: Optional[int] = None) -> tuple[bool, str]:
    """
    Validate that a program code is unique.

    Args:
        code: The program code to validate
        exclude_id: Optional ID to exclude from the check (for updates)

    Returns:
        Tuple of (is_valid, error_message)
    """
    code = code.strip().upper()
    if not code:
        return False, "Program code cannot be empty."

    query = Program.query.filter(Program.code.ilike(code))
    if exclude_id:
        query = query.filter(Program.id != exclude_id)

    existing = query.first()
    if existing:
        return False, f"Program code '{code}' already exists."

    return True, ""


def validate_student_id_unique(student_id: str, exclude_id: Optional[str] = None) -> tuple[bool, str]:
    """
    Validate that a student ID is unique and in correct format.

    Args:
        student_id: The student ID to validate (format: NNNN-NNNN)
        exclude_id: Optional ID to exclude from the check (for updates)

    Returns:
        Tuple of (is_valid, error_message)
    """
    student_id = student_id.strip()
    if not student_id:
        return False, "Student ID cannot be empty."

    # Validate format NNNN-NNNN
    if not re.match(r'^\d{4}-\d{4}$', student_id):
        return False, "Student ID must be in format NNNN-NNNN."

    query = Student.query.filter(Student.id == student_id)
    if exclude_id:
        query = query.filter(Student.id != exclude_id)

    existing = query.first()
    if existing:
        return False, f"Student ID '{student_id}' already exists."

    return True, ""
