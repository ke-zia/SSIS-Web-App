from http import HTTPStatus
from typing import Dict, Optional

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from .. import db
from ..models.program import Program
from ..models.college import College
from ..utils.validators import validate_program_code_unique


class ProgramService:
    """Service for managing program operations."""

    @staticmethod
    def list_all(
        sort_by: str = "",
        order: str = "asc",
        search: str = "",
        search_by: str = "all"
    ) -> Dict:
        """
        Retrieve all programs with optional sorting and search filtering.

        Args:
            sort_by: Column to sort by ('code' or 'name'). Empty string means no sorting.
            order: Sort order ('asc' or 'desc'). Defaults to 'asc'. Only used when sort_by is provided.
            search: Search query string. Empty string means no filtering.
            search_by: Column to search in ('all', 'code', 'name', or 'college'). Defaults to 'all'.

        Returns:
            Dict with 'data' (list of program dicts) or 'error' and 'status'
        """
        try:
            from sqlalchemy import or_
            
            query = Program.query.outerjoin(College)  # Outer join to handle null college_id
            
            # Apply search filtering if search query is provided
            if search:
                search_lower = f"%{search.lower()}%"
                if search_by == "all":
                    # Search in code, name, and college name AND college code
                    query = query.filter(
                        or_(
                            Program.code.ilike(search_lower),
                            Program.name.ilike(search_lower),
                            College.name.ilike(search_lower),
                            College.code.ilike(search_lower)  # ADDED: Search by college code too
                        )
                    )
                elif search_by == "code":
                    # Search only in program code
                    query = query.filter(Program.code.ilike(search_lower))
                elif search_by == "name":
                    # Search only in program name
                    query = query.filter(Program.name.ilike(search_lower))
                elif search_by == "college":
                    # Search in both college name AND college code
                    query = query.filter(
                        or_(
                            College.name.ilike(search_lower),
                            College.code.ilike(search_lower)  
                        )
                    )
            
            # Apply sorting ONLY if sort_by is provided and valid
            if sort_by:
                if sort_by == "code":
                    if order == "desc":
                        query = query.order_by(Program.code.desc())
                    else:
                        query = query.order_by(Program.code.asc())
                elif sort_by == "name":
                    if order == "desc":
                        query = query.order_by(Program.name.desc())
                    else:
                        query = query.order_by(Program.name.asc())
                elif sort_by == "college":
                    # Sort by college name using outer join
                    if order == "desc":
                        # NULL values will sort last when descending
                        query = query.order_by(db.func.coalesce(College.name, "").desc())
                    else:
                        # NULL values will sort first when ascending
                        query = query.order_by(db.func.coalesce(College.name, "").asc())
            
            programs = query.all()
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

    @staticmethod
    def get_by_id(program_id: int) -> Optional[Program]:
        """
        Retrieve a program by ID.

        Args:
            program_id: The ID of the program

        Returns:
            Program object or None if not found
        """
        return Program.query.get(program_id)

    @staticmethod
    def get_by_code(code: str) -> Optional[Program]:
        """
        Retrieve a program by code (case-insensitive).

        Args:
            code: The program code

        Returns:
            Program object or None if not found
        """
        return Program.query.filter(Program.code.ilike(code.strip())).first()

    @staticmethod
    def create_from_request(data: Dict) -> Dict:
        """
        Create a new program from request data.

        Args:
            data: Request JSON data containing 'college_id', 'code', and 'name'

        Returns:
            Dict with 'data' (program dict), 'error', and 'status'
        """
        college_id = data.get("college_id")
        code = (data.get("code") or "").strip()
        name = (data.get("name") or "").strip()

        # Validate college_id - must be a valid integer
        try:
            if college_id is None or college_id == "":
                return {
                    "data": None,
                    "error": "College selection is required.",
                    "status": HTTPStatus.BAD_REQUEST,
                }
            college_id = int(college_id)
        except (ValueError, TypeError):
            return {
                "data": None,
                "error": "College selection is required.",
                "status": HTTPStatus.BAD_REQUEST,
            }
        
        if not code or not name:
            return {
                "data": None,
                "error": "Both 'code' and 'name' are required.",
                "status": HTTPStatus.BAD_REQUEST,
            }

        # Validate that college exists
        college = College.query.get(college_id)
        if not college:
            return {
                "data": None,
                "error": "College not found.",
                "status": HTTPStatus.NOT_FOUND,
            }

        # Validate unique code
        is_valid, error_msg = validate_program_code_unique(code)
        if not is_valid:
            status = (
                HTTPStatus.CONFLICT
                if "already exists" in error_msg.lower()
                else HTTPStatus.BAD_REQUEST
            )
            return {
                "data": None,
                "error": error_msg,
                "status": status,
            }

        program = Program(college_id=college_id, code=code, name=name)

        try:
            db.session.add(program)
            db.session.commit()
            return {
                "data": program.to_dict(),
                "error": None,
                "status": HTTPStatus.CREATED,
            }
        except IntegrityError:
            db.session.rollback()
            return {
                "data": None,
                "error": "A program with this code already exists.",
                "status": HTTPStatus.CONFLICT,
            }

    @staticmethod
    def update_from_request(program_id: int, data: Dict) -> Dict:
        """
        Update an existing program from request data.

        Args:
            program_id: The ID of the program to update
            data: Request JSON data containing 'college_id', 'code', and/or 'name'

        Returns:
            Dict with 'data' (program dict), 'error', and 'status'
        """
        program = ProgramService.get_by_id(program_id)
        if not program:
            return {
                "data": None,
                "error": "Program not found.",
                "status": HTTPStatus.NOT_FOUND,
            }

        college_id = data.get("college_id")
        code = data.get("code", "").strip() if data.get("code") else None
        name = data.get("name", "").strip() if data.get("name") else None

        # Update college_id if provided
        if college_id is not None:
            college = College.query.get(college_id)
            if not college:
                return {
                    "data": None,
                    "error": "College not found.",
                    "status": HTTPStatus.NOT_FOUND,
                }
            program.college_id = college_id

        if code is not None:
            if not code:
                return {
                    "data": None,
                    "error": "Program code cannot be empty.",
                    "status": HTTPStatus.BAD_REQUEST,
                }

            # Validate unique code (excluding current program)
            is_valid, error_msg = validate_program_code_unique(code, exclude_id=program_id)
            if not is_valid:
                status = (
                    HTTPStatus.CONFLICT
                    if "already exists" in error_msg.lower()
                    else HTTPStatus.BAD_REQUEST
                )
                return {
                    "data": None,
                    "error": error_msg,
                    "status": status,
                }

            program.code = code

        if name is not None:
            if not name:
                return {
                    "data": None,
                    "error": "Program name cannot be empty.",
                    "status": HTTPStatus.BAD_REQUEST,
                }
            program.name = name

        try:
            db.session.commit()
            return {
                "data": program.to_dict(),
                "error": None,
                "status": HTTPStatus.OK,
            }
        except IntegrityError:
            db.session.rollback()
            return {
                "data": None,
                "error": "A program with this code already exists.",
                "status": HTTPStatus.CONFLICT,
            }

    @staticmethod
    def delete_by_id(program_id: int) -> Dict:
        """
        Delete a program by ID.

        Args:
            program_id: The ID of the program to delete

        Returns:
            Dict with 'error' and 'status'
        """
        program = ProgramService.get_by_id(program_id)
        if not program:
            return {
                "error": "Program not found.",
                "status": HTTPStatus.NOT_FOUND,
            }

        try:
            db.session.delete(program)
            db.session.commit()
            return {
                "error": None,
                "status": HTTPStatus.NO_CONTENT,
            }
        except Exception as e:
            db.session.rollback()
            return {
                "error": "Failed to delete program.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }