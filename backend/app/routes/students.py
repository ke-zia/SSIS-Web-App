"""Student routes."""

from http import HTTPStatus

from flask import Blueprint, jsonify, request, current_app

from ..services.student_service import StudentService
from ..utils.supabase_storage import delete_object, upload_object, get_public_url
import uuid
import re

students_bp = Blueprint("students", __name__)


@students_bp.get("")
def list_students():
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
    except ValueError:
        page = 1
        per_page = 10

    page = max(1, page)
    per_page = max(1, min(per_page, 100))

    sort_by = request.args.get("sort_by", "").strip()
    order = request.args.get("order", "asc").strip().lower()

    search = request.args.get("search", "").strip()
    search_by = request.args.get("search_by", "all").strip().lower()

    if order not in ["asc", "desc"]:
        order = "asc"

    if search_by not in ["all", "id", "first_name", "last_name", "program", "year_level", "gender"]:
        search_by = "all"

    result = StudentService.list_all(
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        order=order,
        search=search,
        search_by=search_by
    )

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify({
        "students": result["data"],
        "pagination": result["pagination"]
    }), HTTPStatus.OK


@students_bp.post("")
def create_student():
    data = request.get_json() or {}
    result = StudentService.create_from_request(data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.CREATED


@students_bp.put("/<string:student_id>")
def update_student(student_id: str):
    data = request.get_json() or {}

    existing_student = StudentService.get_by_id(student_id)
    if not existing_student:
        return jsonify({"message": "Student not found."}), HTTPStatus.NOT_FOUND

    old_photo = None
    if isinstance(existing_student, dict):
        old_photo = existing_student.get("photo")
    else:
        old_photo = getattr(existing_student, "photo", None)

    new_photo_in_payload = "photo" in data
    new_photo = data.get("photo") if new_photo_in_payload else None

    result = StudentService.update_from_request(student_id, data)
    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    try:
        if new_photo_in_payload and old_photo:
            should_delete_old = False
            if new_photo in ("", None):
                should_delete_old = True
            elif isinstance(new_photo, str) and new_photo != old_photo:
                should_delete_old = True

            if should_delete_old:
                try:
                    delete_object(old_photo)
                except Exception as e:
                    current_app.logger.warning(f"Failed to delete old student photo '{old_photo}': {e}")
    except Exception:
        current_app.logger.exception("Error while handling student photo cleanup after update.")

    return jsonify(result["data"]), HTTPStatus.OK


@students_bp.delete("/<string:student_id>")
def delete_student(student_id: str):
    student = StudentService.get_by_id(student_id)
    if not student:
        return jsonify({"message": "Student not found."}), HTTPStatus.NOT_FOUND

    photo_path = None
    if isinstance(student, dict):
        photo_path = student.get("photo")
    else:
        photo_path = getattr(student, "photo", None)

    result = StudentService.delete_by_id(student_id)
    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    if photo_path:
        try:
            delete_object(photo_path)
        except Exception as e:
            current_app.logger.warning(f"Failed to delete student photo '{photo_path}' after student removal: {e}")

    return ("", HTTPStatus.NO_CONTENT)


@students_bp.post("/upload-photo")
def upload_student_photo():
    if "photo" not in request.files:
        return jsonify({"message": "No file provided."}), HTTPStatus.BAD_REQUEST

    file = request.files["photo"]

    if not file or file.filename == "":
        return jsonify({"message": "No file provided."}), HTTPStatus.BAD_REQUEST

    data = file.read()
    MAX_BYTES = 5 * 1024 * 1024
    if len(data) > MAX_BYTES:
        return jsonify({"message": "File size exceeds 5 MB limit."}), HTTPStatus.BAD_REQUEST

    raw_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    ext = re.sub(r"[^a-zA-Z0-9]", "", raw_ext).lower() or "jpg"

    uid = uuid.uuid4().hex
    dest_path = f"student_photos/{uid}.{ext}"

    try:
        upload_object(data, dest_path, content_type=file.mimetype)
    except Exception as e:
        current_app.logger.exception("Failed to upload student photo via server-side helper")
        return jsonify({"message": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

    public_url = get_public_url(dest_path)
    return jsonify({"path": dest_path, "publicUrl": public_url}), HTTPStatus.OK


@students_bp.get("/programs/<int:college_id>")
def get_programs_by_college(college_id: int):
    result = StudentService.get_programs_by_college(college_id)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]
    return jsonify(result["data"]), HTTPStatus.OK