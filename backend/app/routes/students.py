"""Student routes."""

from http import HTTPStatus

from flask import Blueprint, jsonify, request

from ..services.student_service import StudentService

students_bp = Blueprint("students", __name__)


@students_bp.get("")
def list_students():
    """GET /students - return all students with optional sorting and search."""
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
        sort_by=sort_by,
        order=order,
        search=search,
        search_by=search_by
    )
    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]
    return jsonify(result["data"]), HTTPStatus.OK


@students_bp.post("")
def create_student():
    """POST /students - create a new student."""
    data = request.get_json() or {}
    result = StudentService.create_from_request(data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.CREATED


@students_bp.put("/<string:student_id>")
def update_student(student_id: str):
    """PUT /students/{id} - update an existing student."""
    data = request.get_json() or {}
    result = StudentService.update_from_request(student_id, data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.OK


@students_bp.delete("/<string:student_id>")
def delete_student(student_id: str):
    """DELETE /students/{id} - remove a student."""
    result = StudentService.delete_by_id(student_id)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return ("", HTTPStatus.NO_CONTENT)


@students_bp.get("/programs/<int:college_id>")
def get_programs_by_college(college_id: int):
    """GET /students/programs/{college_id} - get programs for a college."""
    result = StudentService.get_programs_by_college(college_id)
    
    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]
    return jsonify(result["data"]), HTTPStatus.OK