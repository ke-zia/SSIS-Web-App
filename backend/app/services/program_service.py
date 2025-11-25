"""Program service using raw SQL"""
from http import HTTPStatus
from typing import Dict, Optional

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from .. import db
from ..utils.validators import validate_program_code_unique


class ProgramService:
    """Service for managing program operations using raw SQL."""

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
            where_clauses = []
            params = {}

            if search:
                params["search"] = f"%{search}%"
                if search_by == "all":
                    where_clauses.append("(p.code ILIKE :search OR p.name ILIKE :search OR c.code ILIKE :search)")
                elif search_by == "code":
                    where_clauses.append("p.code ILIKE :search")
                elif search_by == "name":
                    where_clauses.append("p.name ILIKE :search")
                elif search_by == "college":
                    where_clauses.append("(c.code ILIKE :search)")

            where_sql = ""
            if where_clauses:
                where_sql = "WHERE " + " AND ".join(where_clauses)

            count_sql = text(f"SELECT COUNT(*) AS total FROM programs p LEFT JOIN colleges c ON p.college_id = c.id {where_sql}")
            total = db.session.execute(count_sql, params).scalar() or 0

            order_clause = ""
            if sort_by in ("code", "name", "college"):
                if sort_by == "code":
                    col = "p.code"
                elif sort_by == "name":
                    col = "p.name"
                else:  # college -> sort by college code to match previous behavior
                    col = "COALESCE(c.code, '')"
                direction = "DESC" if order == "desc" else "ASC"
                order_clause = f"ORDER BY {col} {direction}"

            offset = (page - 1) * per_page
            params.update({"limit": per_page, "offset": offset})

            data_sql = text(
                f"""
                SELECT p.id, p.college_id, p.code, p.name,
                       c.name AS college_name, c.code AS college_code
                FROM programs p
                LEFT JOIN colleges c ON p.college_id = c.id
                {where_sql}
                {order_clause}
                LIMIT :limit OFFSET :offset
                """
            )

            rows = db.session.execute(data_sql, params).mappings().all()
            programs = []
            for r in rows:
                programs.append({
                    "id": r["id"],
                    "college_id": r["college_id"],
                    "college_name": r["college_name"] if r["college_name"] is not None else "Not Applicable",
                    "code": r["code"],
                    "name": r["name"],
                })

            total_pages = (total + per_page - 1) // per_page if per_page > 0 else 1
            has_next = page < total_pages
            has_prev = page > 1

            return {
                "data": programs,
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
                "error": "Failed to retrieve programs.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }

    @staticmethod
    def get_by_id(program_id: int) -> Optional[Dict]:
        sql = text("SELECT id, college_id, code, name FROM programs WHERE id = :id")
        row = db.session.execute(sql, {"id": program_id}).mappings().first()
        if not row:
            return None
        return {"id": row["id"], "college_id": row["college_id"], "code": row["code"], "name": row["name"]}

    @staticmethod
    def get_by_code(code: str) -> Optional[Dict]:
        sql = text("SELECT id, college_id, code, name FROM programs WHERE code ILIKE :code LIMIT 1")
        row = db.session.execute(sql, {"code": code.strip()}).mappings().first()
        if not row:
            return None
        return {"id": row["id"], "college_id": row["college_id"], "code": row["code"], "name": row["name"]}

    @staticmethod
    def create_from_request(data: Dict) -> Dict:
        college_id = data.get("college_id")
        code = (data.get("code") or "").strip()
        name = (data.get("name") or "").strip()

        try:
            if college_id is None or college_id == "":
                return {"data": None, "error": "College selection is required.", "status": HTTPStatus.BAD_REQUEST}
            college_id = int(college_id)
        except (ValueError, TypeError):
            return {"data": None, "error": "College selection is required.", "status": HTTPStatus.BAD_REQUEST}

        if not code or not name:
            return {"data": None, "error": "Both 'code' and 'name' are required.", "status": HTTPStatus.BAD_REQUEST}

        # Validate college exists
        found = db.session.execute(text("SELECT id FROM colleges WHERE id = :id"), {"id": college_id}).scalar()
        if not found:
            return {"data": None, "error": "College not found.", "status": HTTPStatus.NOT_FOUND}

        is_valid, error_msg = validate_program_code_unique(code)
        if not is_valid:
            status = HTTPStatus.CONFLICT if "already exists" in error_msg.lower() else HTTPStatus.BAD_REQUEST
            return {"data": None, "error": error_msg, "status": status}

        try:
            insert_sql = text(
                "INSERT INTO programs (college_id, code, name) VALUES (:college_id, :code, :name) RETURNING id, college_id, code, name"
            )
            result = db.session.execute(insert_sql, {"college_id": college_id, "code": code, "name": name})
            row = result.mappings().first()
            db.session.commit()
            return {"data": {"id": row["id"], "college_id": row["college_id"], "code": row["code"], "name": row["name"]}, "error": None, "status": HTTPStatus.CREATED}
        except IntegrityError:
            db.session.rollback()
            return {"data": None, "error": "A program with this code already exists.", "status": HTTPStatus.CONFLICT}
        except Exception:
            db.session.rollback()
            return {"data": None, "error": "Failed to create program.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}

    @staticmethod
    def update_from_request(program_id: int, data: Dict) -> Dict:
        existing = ProgramService.get_by_id(program_id)
        if not existing:
            return {"data": None, "error": "Program not found.", "status": HTTPStatus.NOT_FOUND}

        college_id = data.get("college_id")
        code = data.get("code", None)
        name = data.get("name", None)

        params = {"id": program_id}
        set_clauses = []

        if college_id is not None:
            # allow clearing by sending empty string
            if college_id == "":
                set_clauses.append("college_id = NULL")
            else:
                try:
                    college_id = int(college_id)
                except (ValueError, TypeError):
                    return {"data": None, "error": "College not found.", "status": HTTPStatus.NOT_FOUND}
                found = db.session.execute(text("SELECT id FROM colleges WHERE id = :id"), {"id": college_id}).scalar()
                if not found:
                    return {"data": None, "error": "College not found.", "status": HTTPStatus.NOT_FOUND}
                set_clauses.append("college_id = :college_id")
                params["college_id"] = college_id

        if code is not None:
            code = code.strip()
            if not code:
                return {"data": None, "error": "Program code cannot be empty.", "status": HTTPStatus.BAD_REQUEST}
            is_valid, error_msg = validate_program_code_unique(code, exclude_id=program_id)
            if not is_valid:
                status = HTTPStatus.CONFLICT if "already exists" in error_msg.lower() else HTTPStatus.BAD_REQUEST
                return {"data": None, "error": error_msg, "status": status}
            set_clauses.append("code = :code")
            params["code"] = code

        if name is not None:
            name = name.strip()
            if not name:
                return {"data": None, "error": "Program name cannot be empty.", "status": HTTPStatus.BAD_REQUEST}
            set_clauses.append("name = :name")
            params["name"] = name

        if not set_clauses:
            return {"data": existing, "error": None, "status": HTTPStatus.OK}

        update_sql = text(f"UPDATE programs SET {', '.join(set_clauses)} WHERE id = :id RETURNING id, college_id, code, name")
        try:
            result = db.session.execute(update_sql, params)
            row = result.mappings().first()
            if not row:
                db.session.rollback()
                return {"data": None, "error": "Program not found.", "status": HTTPStatus.NOT_FOUND}
            db.session.commit()
            return {"data": {"id": row["id"], "college_id": row["college_id"], "code": row["code"], "name": row["name"]}, "error": None, "status": HTTPStatus.OK}
        except IntegrityError:
            db.session.rollback()
            return {"data": None, "error": "A program with this code already exists.", "status": HTTPStatus.CONFLICT}
        except Exception:
            db.session.rollback()
            return {"data": None, "error": "Failed to update program.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}

    @staticmethod
    def delete_by_id(program_id: int) -> Dict:
        existing = ProgramService.get_by_id(program_id)
        if not existing:
            return {"error": "Program not found.", "status": HTTPStatus.NOT_FOUND}

        try:
            db.session.execute(text("DELETE FROM programs WHERE id = :id"), {"id": program_id})
            db.session.commit()
            return {"error": None, "status": HTTPStatus.NO_CONTENT}
        except Exception:
            db.session.rollback()
            return {"error": "Failed to delete program.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}