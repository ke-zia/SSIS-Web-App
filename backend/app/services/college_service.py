"""Service layer for college operations."""

from http import HTTPStatus
from typing import Dict, Optional

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from .. import db
from ..models.college import College
from ..utils.validators import validate_college_code_unique


class CollegeService:
    """Service for managing college operations."""

    @staticmethod
    def list_all(
        sort_by: str = "",
        order: str = "asc",
        search: str = "",
        search_by: str = "all"
    ) -> Dict:
        """
        Retrieve all colleges with optional sorting and search filtering.

        Args:
            sort_by: Column to sort by ('code' or 'name'). Empty string means no sorting.
            order: Sort order ('asc' or 'desc'). Defaults to 'asc'. Only used when sort_by is provided.
            search: Search query string. Empty string means no filtering.
            search_by: Column to search in ('all', 'code', or 'name'). Defaults to 'all'.

        Returns:
            Dict with 'data' (list of college dicts) or 'error' and 'status'
        """
        try:
            query = College.query
            
            # Apply search filtering if search query is provided
            if search:
                search_lower = f"%{search.lower()}%"
                if search_by == "all":
                    # Search in both code and name
                    query = query.filter(
                        or_(
                            College.code.ilike(search_lower),
                            College.name.ilike(search_lower)
                        )
                    )
                elif search_by == "code":
                    # Search only in code
                    query = query.filter(College.code.ilike(search_lower))
                elif search_by == "name":
                    # Search only in name
                    query = query.filter(College.name.ilike(search_lower))
            
            # Apply sorting ONLY if sort_by is provided and valid
            if sort_by:
                if sort_by == "code":
                    if order == "desc":
                        query = query.order_by(College.code.desc())
                    else:
                        query = query.order_by(College.code.asc())
                elif sort_by == "name":
                    if order == "desc":
                        query = query.order_by(College.name.desc())
                    else:
                        query = query.order_by(College.name.asc())
                # If sort_by is provided but invalid, return unsorted
                # (no ORDER BY clause - database default order)
            
            # If sort_by is empty string, also return unsorted
            # (no ORDER BY clause - database default order)
            
            colleges = query.all()
            return {
                "data": [college.to_dict() for college in colleges],
                "error": None,
                "status": HTTPStatus.OK,
            }
        except Exception as e:
            return {
                "data": None,
                "error": "Failed to retrieve colleges.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }

    @staticmethod
    def get_by_id(college_id: int) -> Optional[College]:
        """
        Retrieve a college by ID.

        Args:
            college_id: The ID of the college

        Returns:
            College object or None if not found
        """
        return College.query.get(college_id)

    @staticmethod
    def get_by_code(code: str) -> Optional[College]:
        """
        Retrieve a college by code (case-insensitive).

        Args:
            code: The college code

        Returns:
            College object or None if not found
        """
        return College.query.filter(College.code.ilike(code.strip())).first()

    @staticmethod
    def create_from_request(data: Dict) -> Dict:
        """
        Create a new college from request data.

        Args:
            data: Request JSON data containing 'code' and 'name'

        Returns:
            Dict with 'data' (college dict), 'error', and 'status'
        """
        code = (data.get("code") or "").strip()
        name = (data.get("name") or "").strip()

        if not code or not name:
            return {
                "data": None,
                "error": "Both 'code' and 'name' are required.",
                "status": HTTPStatus.BAD_REQUEST,
            }

        # Validate unique code
        is_valid, error_msg = validate_college_code_unique(code)
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

        college = College(code=code, name=name)

        try:
            db.session.add(college)
            db.session.commit()
            return {
                "data": college.to_dict(),
                "error": None,
                "status": HTTPStatus.CREATED,
            }
        except IntegrityError:
            db.session.rollback()
            return {
                "data": None,
                "error": "A college with this code already exists.",
                "status": HTTPStatus.CONFLICT,
            }

    @staticmethod
    def update_from_request(college_id: int, data: Dict) -> Dict:
        """
        Update an existing college from request data.

        Args:
            college_id: The ID of the college to update
            data: Request JSON data containing 'code' and/or 'name'

        Returns:
            Dict with 'data' (college dict), 'error', and 'status'
        """
        college = CollegeService.get_by_id(college_id)
        if not college:
            return {
                "data": None,
                "error": "College not found.",
                "status": HTTPStatus.NOT_FOUND,
            }

        code = data.get("code", "").strip() if data.get("code") else None
        name = data.get("name", "").strip() if data.get("name") else None

        if code is not None:
            if not code:
                return {
                    "data": None,
                    "error": "College code cannot be empty.",
                    "status": HTTPStatus.BAD_REQUEST,
                }

            # Validate unique code (excluding current college)
            is_valid, error_msg = validate_college_code_unique(code, exclude_id=college_id)
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

            college.code = code

        if name is not None:
            if not name:
                return {
                    "data": None,
                    "error": "College name cannot be empty.",
                    "status": HTTPStatus.BAD_REQUEST,
                }
            college.name = name

        try:
            db.session.commit()
            return {
                "data": college.to_dict(),
                "error": None,
                "status": HTTPStatus.OK,
            }
        except IntegrityError:
            db.session.rollback()
            return {
                "data": None,
                "error": "A college with this code already exists.",
                "status": HTTPStatus.CONFLICT,
            }

    @staticmethod
    def delete_by_id(college_id: int) -> Dict:
        """
        Delete a college by ID.

        Args:
            college_id: The ID of the college to delete

        Returns:
            Dict with 'error' and 'status'
        """
        college = CollegeService.get_by_id(college_id)
        if not college:
            return {
                "error": "College not found.",
                "status": HTTPStatus.NOT_FOUND,
            }

        try:
            db.session.delete(college)
            db.session.commit()
            return {
                "error": None,
                "status": HTTPStatus.NO_CONTENT,
            }
        except Exception as e:
            db.session.rollback()
            return {
                "error": "Failed to delete college.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }

