"""College service using raw SQL"""
from http import HTTPStatus
from typing import Dict, Optional

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from .. import db
from ..utils.validators import validate_college_code_unique


class CollegeService:
    """Service for managing college operations using raw SQL."""

    @staticmethod
    def list_all(
        page: int = 1,
        per_page: int = 10,
        sort_by: str = "",
        order: str = "asc",
        search: str = "",
        search_by: str = "all"
    ) -> Dict:
        try:
            # Base where clause and params
            where_clauses = []
            params = {}

            if search:
                params["search"] = f"%{search}%"
                if search_by == "all":
                    where_clauses.append("(code ILIKE :search OR name ILIKE :search)")
                elif search_by == "code":
                    where_clauses.append("code ILIKE :search")
                elif search_by == "name":
                    where_clauses.append("name ILIKE :search")

            where_sql = ""
            if where_clauses:
                where_sql = "WHERE " + " AND ".join(where_clauses)

            # Count total
            count_sql = text(f"SELECT COUNT(*) AS total FROM colleges {where_sql}")
            total = db.session.execute(count_sql, params).scalar() or 0

            # Sorting
            order_clause = ""
            if sort_by in ("code", "name"):
                col = "code" if sort_by == "code" else "name"
                direction = "DESC" if order == "desc" else "ASC"
                order_clause = f"ORDER BY {col} {direction}"

            # Pagination
            offset = (page - 1) * per_page
            params.update({"limit": per_page, "offset": offset})

            data_sql = text(
                f"SELECT id, code, name FROM colleges {where_sql} {order_clause} LIMIT :limit OFFSET :offset"
            )
            rows = db.session.execute(data_sql, params).mappings().all()

            colleges = [{"id": r["id"], "code": r["code"], "name": r["name"]} for r in rows]

            total_pages = (total + per_page - 1) // per_page if per_page > 0 else 1
            has_next = page < total_pages
            has_prev = page > 1

            return {
                "data": colleges,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": total_pages,
                    "has_next": has_next,
                    "has_prev": has_prev,
                },
                "error": None,
                "status": HTTPStatus.OK,
            }
        except Exception:
            return {
                "data": None,
                "pagination": None,
                "error": "Failed to retrieve colleges.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }

    @staticmethod
    def get_by_id(college_id: int) -> Optional[Dict]:
        sql = text("SELECT id, code, name FROM colleges WHERE id = :id")
        row = db.session.execute(sql, {"id": college_id}).mappings().first()
        if not row:
            return None
        return {"id": row["id"], "code": row["code"], "name": row["name"]}

    @staticmethod
    def get_by_code(code: str) -> Optional[Dict]:
        sql = text("SELECT id, code, name FROM colleges WHERE code ILIKE :code LIMIT 1")
        row = db.session.execute(sql, {"code": code.strip()}).mappings().first()
        if not row:
            return None
        return {"id": row["id"], "code": row["code"], "name": row["name"]}

    @staticmethod
    def create_from_request(data: Dict) -> Dict:
        code = (data.get("code") or "").strip()
        name = (data.get("name") or "").strip()

        if not code or not name:
            return {
                "data": None,
                "error": "Both 'code' and 'name' are required.",
                "status": HTTPStatus.BAD_REQUEST,
            }

        is_valid, error_msg = validate_college_code_unique(code)
        if not is_valid:
            status = (
                HTTPStatus.CONFLICT
                if "already exists" in error_msg.lower()
                else HTTPStatus.BAD_REQUEST
            )
            return {"data": None, "error": error_msg, "status": status}

        try:
            insert_sql = text(
                "INSERT INTO colleges (code, name) VALUES (:code, :name) RETURNING id, code, name"
            )
            result = db.session.execute(insert_sql, {"code": code, "name": name})
            row = result.mappings().first()
            db.session.commit()
            return {"data": {"id": row["id"], "code": row["code"], "name": row["name"]}, "error": None, "status": HTTPStatus.CREATED}
        except IntegrityError:
            db.session.rollback()
            return {"data": None, "error": "A college with this code already exists.", "status": HTTPStatus.CONFLICT}
        except Exception:
            db.session.rollback()
            return {"data": None, "error": "Failed to create college.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}

    @staticmethod
    def update_from_request(college_id: int, data: Dict) -> Dict:
        existing = CollegeService.get_by_id(college_id)
        if not existing:
            return {"data": None, "error": "College not found.", "status": HTTPStatus.NOT_FOUND}

        code = data.get("code", None)
        name = data.get("name", None)

        # Normalize provided values
        if code is not None:
            code = code.strip()
            if not code:
                return {"data": None, "error": "College code cannot be empty.", "status": HTTPStatus.BAD_REQUEST}
            is_valid, error_msg = validate_college_code_unique(code, exclude_id=college_id)
            if not is_valid:
                status = HTTPStatus.CONFLICT if "already exists" in error_msg.lower() else HTTPStatus.BAD_REQUEST
                return {"data": None, "error": error_msg, "status": status}

        if name is not None:
            name = name.strip()
            if not name:
                return {"data": None, "error": "College name cannot be empty.", "status": HTTPStatus.BAD_REQUEST}

        # Build dynamic update
        set_clauses = []
        params = {"id": college_id}
        if code is not None:
            set_clauses.append("code = :code")
            params["code"] = code
        if name is not None:
            set_clauses.append("name = :name")
            params["name"] = name

        if not set_clauses:
            # Nothing to update
            return {"data": existing, "error": None, "status": HTTPStatus.OK}

        update_sql = text(f"UPDATE colleges SET {', '.join(set_clauses)} WHERE id = :id RETURNING id, code, name")
        try:
            result = db.session.execute(update_sql, params)
            row = result.mappings().first()
            if not row:
                db.session.rollback()
                return {"data": None, "error": "College not found.", "status": HTTPStatus.NOT_FOUND}
            db.session.commit()
            return {"data": {"id": row["id"], "code": row["code"], "name": row["name"]}, "error": None, "status": HTTPStatus.OK}
        except IntegrityError:
            db.session.rollback()
            return {"data": None, "error": "A college with this code already exists.", "status": HTTPStatus.CONFLICT}
        except Exception:
            db.session.rollback()
            return {"data": None, "error": "Failed to update college.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}

    @staticmethod
    def delete_by_id(college_id: int) -> Dict:
        existing = CollegeService.get_by_id(college_id)
        if not existing:
            return {"error": "College not found.", "status": HTTPStatus.NOT_FOUND}

        try:
            delete_sql = text("DELETE FROM colleges WHERE id = :id")
            db.session.execute(delete_sql, {"id": college_id})
            db.session.commit()
            return {"error": None, "status": HTTPStatus.NO_CONTENT}
        except Exception:
            db.session.rollback()
            return {"error": "Failed to delete college.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}