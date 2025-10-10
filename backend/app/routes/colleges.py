"""College routes."""

from http import HTTPStatus

from flask import Blueprint, jsonify, request

from ..services.college_service import CollegeService

colleges_bp = Blueprint("colleges", __name__)


@colleges_bp.get("")
def list_colleges():
    """GET /colleges - return paginated colleges with optional sorting and search."""
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
    if search_by not in ["all", "code", "name"]:
        search_by = "all"
    
    result = CollegeService.list_all(
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
        "colleges": result["data"],
        "pagination": result["pagination"]
    }), HTTPStatus.OK


@colleges_bp.post("")
def create_college():
    """POST /colleges - create a new college."""
    data = request.get_json() or {}
    result = CollegeService.create_from_request(data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.CREATED


@colleges_bp.put("/<int:college_id>")
def update_college(college_id: int):
    """PUT /colleges/{id} - update an existing college."""
    data = request.get_json() or {}
    result = CollegeService.update_from_request(college_id, data)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return jsonify(result["data"]), HTTPStatus.OK


@colleges_bp.delete("/<int:college_id>")
def delete_college(college_id: int):
    """DELETE /colleges/{id} - remove a college."""
    result = CollegeService.delete_by_id(college_id)

    if result["error"]:
        return jsonify({"message": result["error"]}), result["status"]

    return ("", HTTPStatus.NO_CONTENT)