from flask import Blueprint, request, jsonify, session
from datetime import datetime

# Import builder-specific service functions for project, unit, transaction, and dashboard operations
from backend.services.builder_services import (
    create_project,
    create_unit,
    get_builder_projects,
    get_project_units,
    get_dashboard_metrics,
    match_transaction,
    get_builder_transactions,
    get_builder_bookings,
    get_project_details
)

# Blueprint grouping builder-facing endpoints under '/builder'
builder_blueprint = Blueprint('builder', __name__)

@builder_blueprint.route('/projects', methods=['POST'])
def create_new_project():
    """
    POST /builder/projects
    Create a new apartment project for the currently authenticated builder.
    Expects JSON with 'name', 'location', and 'num_units'.
    """
    # Ensure the user is logged in as a builder
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json  # Parsed JSON body
    builder_id = session['user_id']

    # Delegate creation logic to the service layer
    return create_project(
        builder_id,
        data.get('name'),
        data.get('location'),
        data.get('num_units')
    )

@builder_blueprint.route('/projects', methods=['GET'])
def list_builder_projects():
    """
    GET /builder/projects
    List all projects owned by the current builder.
    """
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    # Fetch projects from service
    return get_builder_projects(session['user_id'])

@builder_blueprint.route('/projects/<int:project_id>/units', methods=['POST'])
def create_new_unit(project_id):
    """
    POST /builder/projects/<project_id>/units
    Add a new unit to a specific project.
    Expects JSON with 'unit_id', 'floor', 'area', and 'price'.
    """
    # Auth check: only the owning builder can add units
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json
    # Delegate unit creation to service layer
    return create_unit(
        project_id,
        data.get('unit_id'),
        data.get('floor'),
        data.get('area'),
        data.get('price')
    )

@builder_blueprint.route('/projects/<int:project_id>/units', methods=['GET'])
def list_units_for_project(project_id):
    """
    GET /builder/projects/<project_id>/units
    Retrieve all units for the given project.
    """
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_project_units(project_id)

@builder_blueprint.route('/dashboard', methods=['GET'])
def builder_dashboard():
    """
    GET /builder/dashboard
    Fetch dashboard metrics: total units, bookings, booking amounts, and unmatched transactions.
    """
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    # Metrics aggregated in service layer
    return get_dashboard_metrics(session['user_id'])

@builder_blueprint.route('/transactions/match', methods=['POST'])
def match_builder_transaction():
    """
    POST /builder/transactions/match
    Match an unmatched payment transaction to an existing booking.
    Expects JSON with 'transaction_id' and 'booking_id'.
    """
    # Authentication & role enforcement
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json
    transaction_id = data.get('transaction_id')
    booking_id = data.get('booking_id')

    # Perform matching logic via service
    return match_transaction(transaction_id, booking_id)

@builder_blueprint.route('/transactions', methods=['GET'])
def list_builder_transactions():
    """
    GET /builder/transactions
    List all payment transactions (matched and unmatched) for the builder.
    """
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_builder_transactions(session['user_id'])

@builder_blueprint.route('/bookings', methods=['GET'])
def list_builder_bookings():
    """
    GET /builder/bookings
    List all unit bookings made under the builder's projects.
    """
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403
    return get_builder_bookings(session['user_id'])

@builder_blueprint.route('/projects/<int:project_id>', methods=['GET'])
def get_single_project(project_id):
    """
    GET /builder/projects/<project_id>
    Retrieve details for a single project belonging to the builder.
    """
    # Builder must be authenticated
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403
    return get_project_details(project_id)