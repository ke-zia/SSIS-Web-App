from typing import Optional, Dict

from sqlalchemy import text

from .. import db


class AuthService:

    @staticmethod
    def get_by_email(email: str) -> Optional[Dict]:
        try:
            sql = text(
                "SELECT id, email, password_hash "
                "FROM users "
                "WHERE email = :email "
                "LIMIT 1"
            )
            row = db.session.execute(sql, {"email": email.strip()}).mappings().first()
            if not row:
                return None
            return {
                "id": row["id"],
                "email": row["email"],
                "password_hash": row["password_hash"],
            }
        except Exception:
            return None

    @staticmethod
    def get_by_id(user_id) -> Optional[Dict]:
        try:
            sql = text(
                "SELECT id, email, password_hash "
                "FROM users "
                "WHERE id = :id "
                "LIMIT 1"
            )
            row = db.session.execute(sql, {"id": user_id}).mappings().first()
            if not row:
                return None
            return {
                "id": row["id"],
                "email": row["email"],
                "password_hash": row["password_hash"],
            }
        except Exception:
            return None