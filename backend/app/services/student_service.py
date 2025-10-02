"""Service layer for student operations."""

from http import HTTPStatus
from typing import Dict, Optional
import re

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from .. import db
from ..models.student import Student
from ..models.program import Program
from ..models.college import College


class StudentService:
    """Service for managing student operations."""

    @staticmethod
    def list_all(
        sort_by: str = "",
        order: str = "asc",
        search: str = "",
        search_by: str = "all"
    ) -> Dict:
        """
        Retrieve all students with optional sorting and search filtering.

        Args:
            sort_by: Column to sort by
            order: Sort order ('asc' or 'desc')
            search: Search query string
            search_by: Column to search in

        Returns:
            Dict with 'data' (list of student dicts) or 'error' and 'status'
        """
        try:
            query = Student.query.outerjoin(Program).outerjoin(College)
            
            # Apply search filtering if search query is provided
            if search:
                search_lower = f"%{search.lower()}%"
                if search_by == "all":
                    query = query.filter(
                        or_(
                            Student.id.ilike(search_lower),
                            Student.first_name.ilike(search_lower),
                            Student.last_name.ilike(search_lower),
                            Program.name.ilike(search_lower),
                            Student.gender.ilike(search_lower)
                        )
                    )
                elif search_by == "id":
                    query = query.filter(Student.id.ilike(search_lower))
                elif search_by == "name":
                    query = query.filter(
                        or_(
                            Student.first_name.ilike(search_lower),
                            Student.last_name.ilike(search_lower)
                        )
                    )
                elif search_by == "program":
                    query = query.filter(Program.name.ilike(search_lower))
                elif search_by == "gender":
                    query = query.filter(Student.gender.ilike(search_lower))
            
            # Apply sorting
            if sort_by:
                if sort_by == "id":
                    if order == "desc":
                        query = query.order_by(Student.id.desc())
                    else:
                        query = query.order_by(Student.id.asc())
                elif sort_by == "first_name":
                    if order == "desc":
                        query = query.order_by(Student.first_name.desc())
                    else:
                        query = query.order_by(Student.first_name.asc())
                elif sort_by == "last_name":
                    if order == "desc":
                        query = query.order_by(Student.last_name.desc())
                    else:
                        query = query.order_by(Student.last_name.asc())
                elif sort_by == "program":
                    if order == "desc":
                        query = query.order_by(db.func.coalesce(Program.name, "").desc())
                    else:
                        query = query.order_by(db.func.coalesce(Program.name, "").asc())
                elif sort_by == "year_level":
                    if order == "desc":
                        query = query.order_by(Student.year_level.desc())
                    else:
                        query = query.order_by(Student.year_level.asc())
                elif sort_by == "gender":
                    if order == "desc":
                        query = query.order_by(Student.gender.desc())
                    else:
                        query = query.order_by(Student.gender.asc())
            
            students = query.all()
            return {
                "data": [student.to_dict() for student in students],
                "error": None,
                "status": HTTPStatus.OK,
            }
        except Exception as e:
            return {
                "data": None,
                "error": "Failed to retrieve students.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }

    @staticmethod
    def get_by_id(student_id: str) -> Optional[Student]:
        """
        Retrieve a student by ID.

        Args:
            student_id: The ID of the student

        Returns:
            Student object or None if not found
        """
        return Student.query.get(student_id)

    @staticmethod
    def create_from_request(data: Dict) -> Dict:
        """
        Create a new student from request data.

        Args:
            data: Request JSON data

        Returns:
            Dict with 'data', 'error', and 'status'
        """
        student_id = (data.get("id") or "").strip()
        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        program_id = data.get("program_id")
        year_level = data.get("year_level")
        gender = (data.get("gender") or "").strip()

        # Validate student ID format
        if not re.match(r'^\d{4}-\d{4}$', student_id):
            return {
                "data": None,
                "error": "Student ID must be in format NNNN-NNNN.",
                "status": HTTPStatus.BAD_REQUEST,
            }

        # Check if student ID already exists
        existing = Student.query.get(student_id)
        if existing:
            return {
                "data": None,
                "error": f"Student ID '{student_id}' already exists.",
                "status": HTTPStatus.CONFLICT,
            }

        # Validate program_id (required)
        if program_id is None or program_id == "":
            return {
                "data": None,
                "error": "Program must be selected.",
                "status": HTTPStatus.BAD_REQUEST,
            }
        try:
            program_id = int(program_id)
            program = Program.query.get(program_id)
            if not program:
                return {
                    "data": None,
                    "error": "Program not found.",
                    "status": HTTPStatus.NOT_FOUND,
                }
        except (ValueError, TypeError):
            return {
                "data": None,
                "error": "Invalid program ID.",
                "status": HTTPStatus.BAD_REQUEST,
            }

        # Validate year level
        try:
            year_level = int(year_level)
            if not 1 <= year_level <= 5:
                return {
                    "data": None,
                    "error": "Year level must be between 1 and 5.",
                    "status": HTTPStatus.BAD_REQUEST,
                }
        except (ValueError, TypeError):
            return {
                "data": None,
                "error": "Year level must be a valid integer.",
                "status": HTTPStatus.BAD_REQUEST,
            }

        # Validate gender
        if gender not in ["Male", "Female", "Other"]:
            return {
                "data": None,
                "error": "Gender must be Male, Female, or Other.",
                "status": HTTPStatus.BAD_REQUEST,
            }

        student = Student(
            id=student_id,
            first_name=first_name,
            last_name=last_name,
            program_id=program_id,
            year_level=year_level,
            gender=gender
        )

        try:
            db.session.add(student)
            db.session.commit()
            return {
                "data": student.to_dict(),
                "error": None,
                "status": HTTPStatus.CREATED,
            }
        except IntegrityError as e:
            db.session.rollback()
            return {
                "data": None,
                "error": "Failed to create student.",
                "status": HTTPStatus.CONFLICT,
            }

    @staticmethod
    def update_from_request(student_id: str, data: Dict) -> Dict:
        """
        Update an existing student from request data.

        Args:
            student_id: The ID of the student to update
            data: Request JSON data

        Returns:
            Dict with 'data', 'error', and 'status'
        """
        student = StudentService.get_by_id(student_id)
        if not student:
            return {
                "data": None,
                "error": "Student not found.",
                "status": HTTPStatus.NOT_FOUND,
            }

        # Handle ID change separately (since it's a primary key)
        new_student_id = (data.get("id") or "").strip() if data.get("id") else None
        first_name = data.get("first_name", "").strip() if data.get("first_name") else None
        last_name = data.get("last_name", "").strip() if data.get("last_name") else None
        program_id = data.get("program_id")
        year_level = data.get("year_level")
        gender = data.get("gender", "").strip() if data.get("gender") else None

        # If ID is being changed, validate the new ID
        if new_student_id and new_student_id != student_id:
            # Validate new student ID format
            if not re.match(r'^\d{4}-\d{4}$', new_student_id):
                return {
                    "data": None,
                    "error": "Student ID must be in format NNNN-NNNN.",
                    "status": HTTPStatus.BAD_REQUEST,
                }
            
            # Check if new ID already exists
            existing = Student.query.get(new_student_id)
            if existing:
                return {
                    "data": None,
                    "error": f"Student ID '{new_student_id}' already exists.",
                    "status": HTTPStatus.CONFLICT,
                }

        if first_name is not None:
            if not first_name:
                return {
                    "data": None,
                    "error": "First name cannot be empty.",
                    "status": HTTPStatus.BAD_REQUEST,
                }
            student.first_name = first_name

        if last_name is not None:
            if not last_name:
                return {
                    "data": None,
                    "error": "Last name cannot be empty.",
                    "status": HTTPStatus.BAD_REQUEST,
                }
            student.last_name = last_name

        if program_id is not None:
            if program_id == "":
                student.program_id = None
            else:
                try:
                    program_id = int(program_id)
                    program = Program.query.get(program_id)
                    if not program:
                        return {
                            "data": None,
                            "error": "Program not found.",
                            "status": HTTPStatus.NOT_FOUND,
                        }
                    student.program_id = program_id
                except (ValueError, TypeError):
                    return {
                        "data": None,
                        "error": "Invalid program ID.",
                        "status": HTTPStatus.BAD_REQUEST,
                    }

        if year_level is not None:
            try:
                year_level = int(year_level)
                if not 1 <= year_level <= 5:
                    return {
                        "data": None,
                        "error": "Year level must be between 1 and 5.",
                        "status": HTTPStatus.BAD_REQUEST,
                    }
                student.year_level = year_level
            except (ValueError, TypeError):
                return {
                    "data": None,
                    "error": "Year level must be a valid integer.",
                    "status": HTTPStatus.BAD_REQUEST,
                }

        if gender is not None:
            if gender not in ["Male", "Female", "Other"]:
                return {
                    "data": None,
                    "error": "Gender must be Male, Female, or Other.",
                    "status": HTTPStatus.BAD_REQUEST,
                }
            student.gender = gender

        try:
            # If ID is being changed, we need to handle it specially
            if new_student_id and new_student_id != student_id:
                # Update the primary key by deleting old and creating new
                db.session.delete(student)
                db.session.flush()
                
                new_student = Student(
                    id=new_student_id,
                    first_name=student.first_name,
                    last_name=student.last_name,
                    program_id=student.program_id,
                    year_level=student.year_level,
                    gender=student.gender
                )
                db.session.add(new_student)
                db.session.commit()
                return {
                    "data": new_student.to_dict(),
                    "error": None,
                    "status": HTTPStatus.OK,
                }
            else:
                db.session.commit()
                return {
                    "data": student.to_dict(),
                    "error": None,
                    "status": HTTPStatus.OK,
                }
        except IntegrityError:
            db.session.rollback()
            return {
                "data": None,
                "error": "Failed to update student.",
                "status": HTTPStatus.CONFLICT,
            }

    @staticmethod
    def delete_by_id(student_id: str) -> Dict:
        """
        Delete a student by ID.

        Args:
            student_id: The ID of the student to delete

        Returns:
            Dict with 'error' and 'status'
        """
        student = StudentService.get_by_id(student_id)
        if not student:
            return {
                "error": "Student not found.",
                "status": HTTPStatus.NOT_FOUND,
            }

        try:
            db.session.delete(student)
            db.session.commit()
            return {
                "error": None,
                "status": HTTPStatus.NO_CONTENT,
            }
        except Exception as e:
            db.session.rollback()
            return {
                "error": "Failed to delete student.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }

    @staticmethod
    def get_programs_by_college(college_id: int) -> Dict:
        """
        Get all programs for a specific college.

        Args:
            college_id: The ID of the college

        Returns:
            Dict with 'data' (list of programs) or 'error' and 'status'
        """
        try:
            programs = Program.query.filter_by(college_id=college_id).all()
            return {
                "data": [program.to_dict() for program in programs],
                "error": None,
                "status": HTTPStatus.OK,
            }
        except Exception as e:
            return {
                "data": None,
                "error": "Failed to retrieve programs.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }