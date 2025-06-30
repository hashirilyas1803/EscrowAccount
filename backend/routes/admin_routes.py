from flask import Blueprint, request, jsonify, session

# Import service-layer functions to fetch and filter data for admin views
from backend.services.admin_services import (
    get_all_builders,
    get_all_projects,
    get_all_bookings,
    get_all_transactions,
    filter_projects_by_builder,
    filter_bookings_by_buyer_or_unit,
    filter_projects_by_name
)
from backend.services.builder_services import (
    get_project_details,
    get_project_units
)

# Blueprint grouping all admin-specific endpoints under '/admin'
admin_blueprint = Blueprint('admin', __name__)

@admin_blueprint.route('/builders', methods=['GET'])
def list_builders():
    """
    GET /admin/builders
    Return a list of all registered builders. Accessible only to admin users.
    """
    # Enforce that the requester is logged in as an admin
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    # Delegate to service to retrieve data
    return get_all_builders()

@admin_blueprint.route('/projects', methods=['GET'])
def list_all_projects():
    """
    GET /admin/projects
    Return all projects across all builders. Admin-only access.
    """
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403
    return get_all_projects()

@admin_blueprint.route('/bookings', methods=['GET'])
def list_all_bookings():
    """
    GET /admin/bookings
    Return all unit bookings platform-wide. Admin-only access.
    """
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403
    return get_all_bookings()

@admin_blueprint.route('/transactions', methods=['GET'])
def list_all_transactions():
    """
    GET /admin/transactions
    Return all payment transactions across all builders and bookings. Admin-only access.
    """
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403
    return get_all_transactions()

@admin_blueprint.route('/projects/filter', methods=['GET'])
def filter_projects():
    """
    GET /admin/projects/filter?builder_id=<id>
    Filter projects by builder ID. Requires admin privileges.
    """
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    # Read builder_id from query parameters
    builder_id = request.args.get('builder_id')
    return filter_projects_by_builder(builder_id)

@admin_blueprint.route('/bookings/search', methods=['GET'])
def filter_bookings():
    """
    GET /admin/bookings/search?q=<query>
    Search bookings by buyer name or unit number. Admin-only.
    """
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    # 'q' can be buyer name or unit number
    query = request.args.get('q')
    return filter_bookings_by_buyer_or_unit(query)

@admin_blueprint.route('/filter', methods=['GET'])
def general_filter():
    """
    GET /admin/filter?project_name=<>&buyer_name=<>&unit_id=<>
    General search endpoint for projects or bookings based on provided parameters.
    Prioritizes project_name, then buyer_name or unit_id.
    """
    # Ensure user is authenticated
    if 'user_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 401
    # Ensure user has admin role
    if session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Forbidden'}), 403

    project_name = request.args.get('project_name')
    buyer_name = request.args.get('buyer_name')
    unit_id = request.args.get('unit_id')

    # Delegate to appropriate filter based on parameters
    if project_name:
        return filter_projects_by_name(project_name)
    elif buyer_name or unit_id:
        return filter_bookings_by_buyer_or_unit(buyer_name or unit_id)

    # No filters provided: return empty list
    return jsonify([]), 200

@admin_blueprint.route('/projects/<int:project_id>', methods=['GET'])
def admin_view_project(project_id):
    """
    GET /admin/projects/<project_id>
    Retrieve detailed information for a specific project. Admin-only.
    """
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_project_details(project_id)

@admin_blueprint.route('/projects/<int:project_id>/units', methods=['GET'])
def admin_list_units(project_id):
    """
    GET /admin/projects/<project_id>/units
    List all units for a given project. Admin-only.
    """
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_project_units(project_id)