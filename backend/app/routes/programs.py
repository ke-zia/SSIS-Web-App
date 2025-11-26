"""Program routes."""

from http import HTTPStatus

from flask import Blueprint, jsonify, request

from ..services.program_service import ProgramService

programs_bp = Blueprint("programs", __name__)


@programs_bp.get("")
def list_programs():
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
    
    if search_by not in ["all", "code", "name", "college"]:
        search_by = "all"
    
    result = ProgramService.list_all(
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
        "programs": result["data"],
        "pagination": result["pagination"]
    }), HTTPStatus.OK


@programs_bp.post("")
def create_program():
    data = request.get_json() or {}
    result = ProgramService.create_from_request(data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.CREATED


@programs_bp.put("/<int:program_id>")
def update_program(program_id: int):
    data = request.get_json() or {}
    result = ProgramService.update_from_request(program_id, data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.OK


@programs_bp.delete("/<int:program_id>")
def delete_program(program_id: int):
    result = ProgramService.delete_by_id(program_id)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return ("", HTTPStatus.NO_CONTENT)