"""Student routes."""

from http import HTTPStatus

from flask import Blueprint, jsonify, request, current_app

from ..services.student_service import StudentService
from ..utils.supabase_storage import delete_object, upload_object, get_public_url  # server-side helpers
import uuid
import re

students_bp = Blueprint("students", __name__)


@students_bp.get("")
def list_students():
    """GET /students - return paginated students with optional sorting and search."""
    # Get pagination parameters from query string
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
    except ValueError:
        page = 1
        per_page = 10

    # Ensure page and per_page are valid
    page = max(1, page)
    per_page = max(1, min(per_page, 100))  # Limit per_page to 100

    # Get sorting parameters from query string
    sort_by = request.args.get("sort_by", "").strip()
    order = request.args.get("order", "asc").strip().lower()

    # Get search parameters from query string
    search = request.args.get("search", "").strip()
    search_by = request.args.get("search_by", "all").strip().lower()

    # Validate order parameter
    if order not in ["asc", "desc"]:
        order = "asc"

    # Validate search_by parameter
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
    """POST /students - create a new student.

    Frontend should upload the photo to Supabase storage first and include the
    returned storage path (string) in data['photo'] (optional). The backend
    will store the path in the DB. The backend does not accept file uploads
    in this endpoint.
    """
    data = request.get_json() or {}
    result = StudentService.create_from_request(data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.CREATED


@students_bp.put("/<string:student_id>")
def update_student(student_id: str):
    """PUT /students/{id} - update an existing student.

    Behavior:
      - If payload includes "photo":
          * If payload['photo'] == "" or None -> user requested removal of photo.
          * If payload['photo'] != old_photo -> replacement requested.
      - After a successful DB update, this route will attempt to delete the old
        photo from Supabase storage (best-effort). Failures deleting the object
        are logged but do not fail the request (DB has already been updated).
    """
    data = request.get_json() or {}

    # Load existing student to know previous photo path
    existing_student = StudentService.get_by_id(student_id)
    if not existing_student:
        return jsonify({"message": "Student not found."}), HTTPStatus.NOT_FOUND

    old_photo = getattr(existing_student, "photo", None)
    new_photo_in_payload = "photo" in data
    new_photo = data.get("photo") if new_photo_in_payload else None

    # Perform the DB update
    result = StudentService.update_from_request(student_id, data)
    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    # If update succeeded and payload contained a photo change, delete old file (best-effort)
    try:
        if new_photo_in_payload and old_photo:
            should_delete_old = False
            # removal requested
            if new_photo in ("", None):
                should_delete_old = True
            # replacement requested
            elif isinstance(new_photo, str) and new_photo != old_photo:
                should_delete_old = True

            if should_delete_old:
                try:
                    delete_object(old_photo)
                except Exception as e:
                    # Log a warning but do not fail the API response
                    current_app.logger.warning(f"Failed to delete old student photo '{old_photo}': {e}")
    except Exception:
        # Defensive: log unexpected errors in cleanup logic
        current_app.logger.exception("Error while handling student photo cleanup after update.")

    return jsonify(result["data"]), HTTPStatus.OK


@students_bp.delete("/<string:student_id>")
def delete_student(student_id: str):
    """DELETE /students/{id} - remove a student.

    This will delete the DB row and, if the student had a photo, attempt to
    delete the object from Supabase storage (best-effort).
    """
    # Fetch student first to retrieve photo path
    student = StudentService.get_by_id(student_id)
    if not student:
        return jsonify({"message": "Student not found."}), HTTPStatus.NOT_FOUND

    photo_path = getattr(student, "photo", None)

    result = StudentService.delete_by_id(student_id)
    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    # Best-effort delete of the photo from storage
    if photo_path:
        try:
            delete_object(photo_path)
        except Exception as e:
            current_app.logger.warning(f"Failed to delete student photo '{photo_path}' after student removal: {e}")

    return ("", HTTPStatus.NO_CONTENT)


@students_bp.post("/upload-photo")
def upload_student_photo():
    """
    POST /students/upload-photo
    Accepts multipart/form-data with field 'photo'. Uploads bytes to Supabase Storage
    using the SERVICE_ROLE_KEY on the server and returns JSON: { path, publicUrl }.

    This keeps the service role key on the server (safe) and avoids client-side RLS issues.
    """
    if "photo" not in request.files:
        return jsonify({"message": "No file provided."}), HTTPStatus.BAD_REQUEST

    file = request.files["photo"]

    if not file or file.filename == "":
        return jsonify({"message": "No file provided."}), HTTPStatus.BAD_REQUEST

    # Read bytes and enforce limits (5 MB)
    data = file.read()
    MAX_BYTES = 5 * 1024 * 1024
    if len(data) > MAX_BYTES:
        return jsonify({"message": "File size exceeds 5 MB limit."}), HTTPStatus.BAD_REQUEST

    # Sanitize extension
    raw_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    ext = re.sub(r"[^a-zA-Z0-9]", "", raw_ext).lower() or "jpg"

    # Generate unique filename inside folder (no leading slash)
    uid = uuid.uuid4().hex
    dest_path = f"student_photos/{uid}.{ext}"

    try:
        # Upload using server-side helper (will raise on error)
        upload_object(data, dest_path, content_type=file.mimetype)
    except Exception as e:
        current_app.logger.exception("Failed to upload student photo via server-side helper")
        return jsonify({"message": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

    public_url = get_public_url(dest_path)
    return jsonify({"path": dest_path, "publicUrl": public_url}), HTTPStatus.OK


@students_bp.get("/programs/<int:college_id>")
def get_programs_by_college(college_id: int):
    """GET /students/programs/{college_id} - get programs for a college."""
    result = StudentService.get_programs_by_college(college_id)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]
    return jsonify(result["data"]), HTTPStatus.OK