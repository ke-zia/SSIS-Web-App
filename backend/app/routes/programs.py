"""Program routes."""

from http import HTTPStatus

from flask import Blueprint, jsonify, request

from ..services.program_service import ProgramService

programs_bp = Blueprint("programs", __name__)


@programs_bp.get("")
def list_programs():
    """GET /programs - return all programs with optional sorting and search."""
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
    if search_by not in ["all", "code", "name", "college"]:
        search_by = "all"
    
    result = ProgramService.list_all(
        sort_by=sort_by,
        order=order,
        search=search,
        search_by=search_by
    )
    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]
    return jsonify(result["data"]), HTTPStatus.OK


@programs_bp.post("")
def create_program():
    """POST /programs - create a new program."""
    data = request.get_json() or {}
    result = ProgramService.create_from_request(data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.CREATED


@programs_bp.put("/<int:program_id>")
def update_program(program_id: int):
    """PUT /programs/{id} - update an existing program."""
    data = request.get_json() or {}
    result = ProgramService.update_from_request(program_id, data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.OK


@programs_bp.delete("/<int:program_id>")
def delete_program(program_id: int):
    """DELETE /programs/{id} - remove a program."""
    result = ProgramService.delete_by_id(program_id)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return ("", HTTPStatus.NO_CONTENT)

