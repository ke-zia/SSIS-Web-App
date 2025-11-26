from http import HTTPStatus
from typing import Dict, Optional
import re

from sqlalchemy import text, inspect
from sqlalchemy.exc import IntegrityError

from .. import db


class StudentService:

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
                    where_clauses.append(
                        "(s.id ILIKE :search OR s.first_name ILIKE :search OR s.last_name ILIKE :search "
                        "OR p.code ILIKE :search OR s.gender ILIKE :search OR CAST(s.year_level AS TEXT) ILIKE :search)"
                    )
                elif search_by == "id":
                    where_clauses.append("s.id ILIKE :search")
                elif search_by == "first_name":
                    where_clauses.append("s.first_name ILIKE :search")
                elif search_by == "last_name":
                    where_clauses.append("s.last_name ILIKE :search")
                elif search_by == "program":
                    where_clauses.append("p.code ILIKE :search")
                elif search_by == "year_level":
                    where_clauses.append("CAST(s.year_level AS TEXT) ILIKE :search")
                elif search_by == "gender":
                    where_clauses.append("s.gender ILIKE :search")

            where_sql = ""
            if where_clauses:
                where_sql = "WHERE " + " AND ".join(where_clauses)

            count_sql = text(
                f"SELECT COUNT(*) AS total FROM students s "
                f"LEFT JOIN programs p ON s.program_id = p.id "
                f"LEFT JOIN colleges c ON p.college_id = c.id "
                f"{where_sql}"
            )
            total = db.session.execute(count_sql, params).scalar() or 0

            order_clause = ""
            if sort_by:
                mapping = {
                    "id": "s.id",
                    "first_name": "s.first_name",
                    "last_name": "s.last_name",
                    "program": "COALESCE(p.code, '')",
                    "year_level": "s.year_level",
                    "gender": "s.gender",
                }
                col = mapping.get(sort_by)
                if col:
                    direction = "DESC" if order == "desc" else "ASC"
                    order_clause = f"ORDER BY {col} {direction}"

            offset = (page - 1) * per_page
            params.update({"limit": per_page, "offset": offset})

            data_sql = text(
                f"""
                SELECT s.id, s.first_name, s.last_name, s.program_id, s.year_level, s.gender, s.photo,
                       p.code AS program_code, p.name AS program_name
                FROM students s
                LEFT JOIN programs p ON s.program_id = p.id
                LEFT JOIN colleges c ON p.college_id = c.id
                {where_sql}
                {order_clause}
                LIMIT :limit OFFSET :offset
                """
            )

            rows = db.session.execute(data_sql, params).mappings().all()
            students = []
            for r in rows:
                students.append({
                    "id": r["id"],
                    "first_name": r["first_name"],
                    "last_name": r["last_name"],
                    "program_id": r["program_id"],
                    "program_name": r["program_name"] if r["program_name"] is not None else "Not Applicable",
                    "program_code": r["program_code"] if r["program_code"] is not None else "Not Applicable",
                    "year_level": r["year_level"],
                    "gender": r["gender"],
                    "photo": r["photo"],
                })

            total_pages = (total + per_page - 1) // per_page if per_page > 0 else 1
            has_next = page < total_pages
            has_prev = page > 1

            return {
                "data": students,
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
                "error": "Failed to retrieve students.",
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
            }

    @staticmethod
    def get_by_id(student_id: str) -> Optional[Dict]:
        sql = text(
            "SELECT s.id, s.first_name, s.last_name, s.program_id, s.year_level, s.gender, s.photo, "
            "p.code AS program_code, p.name AS program_name "
            "FROM students s "
            "LEFT JOIN programs p ON s.program_id = p.id "
            "WHERE s.id = :id"
        )
        row = db.session.execute(sql, {"id": student_id}).mappings().first()
        if not row:
            return None
        return {
            "id": row["id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "program_id": row["program_id"],
            "program_name": row["program_name"] if row["program_name"] else "Not Applicable",
            "program_code": row["program_code"] if row["program_code"] else "Not Applicable",
            "year_level": row["year_level"],
            "gender": row["gender"],
            "photo": row["photo"],
        }

    @staticmethod
    def create_from_request(data: Dict) -> Dict:
        student_id = (data.get("id") or "").strip()
        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        program_id = data.get("program_id")
        year_level = data.get("year_level")
        gender = (data.get("gender") or "").strip()
        photo = (data.get("photo") or None)

        if not re.match(r'^\d{4}-\d{4}$', student_id):
            return {"data": None, "error": "Student ID must be in format NNNN-NNNN.", "status": HTTPStatus.BAD_REQUEST}

        existing = db.session.execute(text("SELECT id FROM students WHERE id = :id"), {"id": student_id}).scalar()
        if existing:
            return {"data": None, "error": f"Student ID '{student_id}' already exists.", "status": HTTPStatus.CONFLICT}

        if program_id is None or program_id == "":
            return {"data": None, "error": "Program must be selected.", "status": HTTPStatus.BAD_REQUEST}
        try:
            program_id = int(program_id)
            found = db.session.execute(text("SELECT id FROM programs WHERE id = :id"), {"id": program_id}).scalar()
            if not found:
                return {"data": None, "error": "Program not found.", "status": HTTPStatus.NOT_FOUND}
        except (ValueError, TypeError):
            return {"data": None, "error": "Invalid program ID.", "status": HTTPStatus.BAD_REQUEST}

        try:
            year_level = int(year_level)
            if not 1 <= year_level <= 5:
                return {"data": None, "error": "Year level must be between 1 and 5.", "status": HTTPStatus.BAD_REQUEST}
        except (ValueError, TypeError):
            return {"data": None, "error": "Year level must be a valid integer.", "status": HTTPStatus.BAD_REQUEST}

        if gender not in ["Male", "Female", "Other"]:
            return {"data": None, "error": "Gender must be Male, Female, or Other.", "status": HTTPStatus.BAD_REQUEST}

        try:
            insert_sql = text(
                "INSERT INTO students (id, first_name, last_name, program_id, year_level, gender, photo) "
                "VALUES (:id, :first_name, :last_name, :program_id, :year_level, :gender, :photo) "
                "RETURNING id, first_name, last_name, program_id, year_level, gender, photo"
            )
            result = db.session.execute(insert_sql, {
                "id": student_id,
                "first_name": first_name,
                "last_name": last_name,
                "program_id": program_id,
                "year_level": year_level,
                "gender": gender,
                "photo": photo
            })
            row = result.mappings().first()
            db.session.commit()
            return {"data": {
                "id": row["id"],
                "first_name": row["first_name"],
                "last_name": row["last_name"],
                "program_id": row["program_id"],
                "program_name": "Not Applicable",
                "program_code": "Not Applicable",
                "year_level": row["year_level"],
                "gender": row["gender"],
                "photo": row["photo"],
            }, "error": None, "status": HTTPStatus.CREATED}
        except IntegrityError:
            db.session.rollback()
            return {"data": None, "error": "Failed to create student.", "status": HTTPStatus.CONFLICT}
        except Exception:
            db.session.rollback()
            return {"data": None, "error": "Failed to create student.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}

    @staticmethod
    def update_from_request(student_id: str, data: Dict) -> Dict:
        current = StudentService.get_by_id(student_id)
        if not current:
            return {"data": None, "error": "Student not found.", "status": HTTPStatus.NOT_FOUND}

        new_student_id = (data.get("id") or "").strip() if data.get("id") else None
        first_name = data.get("first_name", None)
        last_name = data.get("last_name", None)
        program_id = data.get("program_id", None)
        year_level = data.get("year_level", None)
        gender = data.get("gender", None)
        photo_in_payload = "photo" in data
        photo = data.get("photo") if photo_in_payload else None

        if new_student_id and new_student_id != student_id:
            if not re.match(r'^\d{4}-\d{4}$', new_student_id):
                return {"data": None, "error": "Student ID must be in format NNNN-NNNN.", "status": HTTPStatus.BAD_REQUEST}
            exists = db.session.execute(text("SELECT id FROM students WHERE id = :id"), {"id": new_student_id}).scalar()
            if exists:
                return {"data": None, "error": f"Student ID '{new_student_id}' already exists.", "status": HTTPStatus.CONFLICT}

        params = {}
        set_clauses = []

        if first_name is not None:
            first_name = first_name.strip()
            if not first_name:
                return {"data": None, "error": "First name cannot be empty.", "status": HTTPStatus.BAD_REQUEST}
            set_clauses.append("first_name = :first_name")
            params["first_name"] = first_name

        if last_name is not None:
            last_name = last_name.strip()
            if not last_name:
                return {"data": None, "error": "Last name cannot be empty.", "status": HTTPStatus.BAD_REQUEST}
            set_clauses.append("last_name = :last_name")
            params["last_name"] = last_name

        if program_id is not None:
            if program_id == "":
                set_clauses.append("program_id = NULL")
            else:
                try:
                    pid = int(program_id)
                    found = db.session.execute(text("SELECT id FROM programs WHERE id = :id"), {"id": pid}).scalar()
                    if not found:
                        return {"data": None, "error": "Program not found.", "status": HTTPStatus.NOT_FOUND}
                    set_clauses.append("program_id = :program_id")
                    params["program_id"] = pid
                except (ValueError, TypeError):
                    return {"data": None, "error": "Invalid program ID.", "status": HTTPStatus.BAD_REQUEST}

        if year_level is not None:
            try:
                yl = int(year_level)
                if not 1 <= yl <= 5:
                    return {"data": None, "error": "Year level must be between 1 and 5.", "status": HTTPStatus.BAD_REQUEST}
                set_clauses.append("year_level = :year_level")
                params["year_level"] = yl
            except (ValueError, TypeError):
                return {"data": None, "error": "Year level must be a valid integer.", "status": HTTPStatus.BAD_REQUEST}

        if gender is not None:
            gender = gender.strip()
            if gender not in ["Male", "Female", "Other"]:
                return {"data": None, "error": "Gender must be Male, Female, or Other.", "status": HTTPStatus.BAD_REQUEST}
            set_clauses.append("gender = :gender")
            params["gender"] = gender

        if photo_in_payload:
            if photo in ("", None):
                set_clauses.append("photo = NULL")
            else:
                set_clauses.append("photo = :photo")
                params["photo"] = photo

        try:
            if new_student_id and new_student_id != student_id:
                db.session.begin_nested()
                
                existing_row = db.session.execute(text("SELECT id, first_name, last_name, program_id, year_level, gender, photo FROM students WHERE id = :id"), {"id": student_id}).mappings().first()
                if not existing_row:
                    db.session.rollback()
                    return {"data": None, "error": "Student not found.", "status": HTTPStatus.NOT_FOUND}

                final_first_name = params.get("first_name", existing_row["first_name"])
                final_last_name = params.get("last_name", existing_row["last_name"])
                final_program_id = params.get("program_id", existing_row["program_id"])
                final_year_level = params.get("year_level", existing_row["year_level"])
                final_gender = params.get("gender", existing_row["gender"])
                final_photo = params.get("photo", existing_row["photo"]) if photo_in_payload else existing_row["photo"]

                insert_sql = text(
                    "INSERT INTO students (id, first_name, last_name, program_id, year_level, gender, photo) "
                    "VALUES (:id, :first_name, :last_name, :program_id, :year_level, :gender, :photo)"
                )
                db.session.execute(insert_sql, {
                    "id": new_student_id,
                    "first_name": final_first_name,
                    "last_name": final_last_name,
                    "program_id": final_program_id,
                    "year_level": final_year_level,
                    "gender": final_gender,
                    "photo": final_photo
                })

                inspector = inspect(db.engine)
                all_tables = inspector.get_table_names()
                for table in all_tables:
                    if table == "students":
                        continue
                    fks = inspector.get_foreign_keys(table)
                    for fk in fks:
                        referred_table = fk.get("referred_table") or fk.get("referred_table_name") or fk.get("referred_table")
                        if referred_table == "students":
                            constrained_cols = fk.get("constrained_columns") or fk.get("constrained_column") or fk.get("constrained_columns", [])
                            for col in constrained_cols:
                                update_fk_sql = text(f"UPDATE {table} SET {col} = :new_id WHERE {col} = :old_id")
                                db.session.execute(update_fk_sql, {"new_id": new_student_id, "old_id": student_id})

                db.session.execute(text("DELETE FROM students WHERE id = :id"), {"id": student_id})
                
                db.session.commit()
                
                new_student = StudentService.get_by_id(new_student_id)
                if new_student:
                    return {"data": new_student, "error": None, "status": HTTPStatus.OK}
                return {"data": None, "error": "Failed to change student ID.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}
            else:
                if not set_clauses:
                    return {"data": StudentService.get_by_id(student_id), "error": None, "status": HTTPStatus.OK}

                params["id"] = student_id
                update_sql = text(f"UPDATE students SET {', '.join(set_clauses)} WHERE id = :id")
                db.session.execute(update_sql, params)
                db.session.commit()
                return {"data": StudentService.get_by_id(student_id), "error": None, "status": HTTPStatus.OK}
        except IntegrityError:
            db.session.rollback()
            return {"data": None, "error": "Failed to update student.", "status": HTTPStatus.CONFLICT}
        except Exception as e:
            db.session.rollback()
            return {"data": None, "error": f"Failed to update student: {e}", "status": HTTPStatus.INTERNAL_SERVER_ERROR}

    @staticmethod
    def delete_by_id(student_id: str) -> Dict:
        existing = db.session.execute(text("SELECT id, photo FROM students WHERE id = :id"), {"id": student_id}).mappings().first()
        if not existing:
            return {"error": "Student not found.", "status": HTTPStatus.NOT_FOUND}

        try:
            db.session.execute(text("DELETE FROM students WHERE id = :id"), {"id": student_id})
            db.session.commit()
            return {"error": None, "status": HTTPStatus.NO_CONTENT}
        except Exception:
            db.session.rollback()
            return {"error": "Failed to delete student.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}

    @staticmethod
    def get_programs_by_college(college_id: int) -> Dict:
        try:
            rows = db.session.execute(text("SELECT id, college_id, code, name FROM programs WHERE college_id = :college_id"), {"college_id": college_id}).mappings().all()
            programs = [{"id": r["id"], "college_id": r["college_id"], "code": r["code"], "name": r["name"]} for r in rows]
            return {"data": programs, "error": None, "status": HTTPStatus.OK}
        except Exception:
            return {"data": None, "error": "Failed to retrieve programs.", "status": HTTPStatus.INTERNAL_SERVER_ERROR}