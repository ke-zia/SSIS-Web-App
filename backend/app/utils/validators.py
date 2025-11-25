"""Validation utilities using raw SQL (no ORM queries)."""

from typing import Optional, Tuple

from sqlalchemy import text

from .. import db


def validate_college_code_unique(code: str, exclude_id: Optional[int] = None) -> Tuple[bool, str]:
    code_norm = (code or "").strip().upper()
    if not code_norm:
        return False, "College code cannot be empty."

    params = {"code": code_norm}
    sql = "SELECT id FROM colleges WHERE UPPER(code) = :code"
    if exclude_id:
        sql += " AND id != :exclude_id"
        params["exclude_id"] = exclude_id

    row = db.session.execute(text(sql), params).mappings().first()
    if row:
        return False, f"College code '{code_norm}' already exists."

    return True, ""


def validate_program_code_unique(code: str, exclude_id: Optional[int] = None) -> Tuple[bool, str]:
    code_norm = (code or "").strip().upper()
    if not code_norm:
        return False, "Program code cannot be empty."

    params = {"code": code_norm}
    sql = "SELECT id FROM programs WHERE UPPER(code) = :code"
    if exclude_id:
        sql += " AND id != :exclude_id"
        params["exclude_id"] = exclude_id

    row = db.session.execute(text(sql), params).mappings().first()
    if row:
        return False, f"Program code '{code_norm}' already exists."

    return True, ""