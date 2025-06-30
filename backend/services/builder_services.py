from flask import jsonify
from datetime import datetime

# Import database query functions for builder operations
from backend.db.queries import (
    insert_project,
    insert_unit,
    fetch_projects_by_builder,
    fetch_units_by_project,
    fetch_dashboard_data,
    match_transaction_to_booking,
    fetch_transactions_by_builder,
    fetch_bookings_by_builder_id,
    fetch_project_by_id
)


def create_project(builder_id, name, location, num_units):
    """
    Create a new project record for a builder.
    - Validates required fields are present.
    - Inserts a project into the DB with timestamp.
    Returns JSON response with status and new project_id or error.
    """
    # Ensure all necessary data was provided
    if not all([builder_id, name, location, num_units]):
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    # Use UTC ISO timestamp for created_at field
    created_at = datetime.utcnow().isoformat()
    project_id = insert_project(builder_id, name, location, num_units, created_at)

    if project_id:
        return jsonify({
            'status': 'success',
            'message': 'Project created successfully',
            'project_id': project_id
        }), 201

    # Insertion failed
    return jsonify({'status': 'failure', 'message': 'Could not create project'}), 400


def create_unit(project_id, unit_id, floor, area, price):
    """
    Add a new unit under a specific project.
    - Validates required fields.
    - Inserts into units table with timestamp.
    Returns JSON response with new unit row ID or error.
    """
    if not all([project_id, unit_id, floor, area, price]):
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    created_at = datetime.utcnow().isoformat()
    unit_row_id = insert_unit(project_id, unit_id, floor, area, price, created_at)

    if unit_row_id:
        return jsonify({
            'status': 'success',
            'message': 'Unit added successfully',
            'unit_id': unit_row_id
        }), 201

    # Insertion failed
    return jsonify({'status': 'failure', 'message': 'Could not add unit'}), 400


def get_builder_projects(builder_id):
    """
    Fetch all projects owned by a builder.
    - Retrieves raw rows and converts them to dictionaries.
    Returns JSON list of projects or error.
    """
    projects = fetch_projects_by_builder(builder_id)

    if projects is not None:
        # Convert each DB row to a JSON-serializable dict
        projects_list = [dict(row) for row in projects]
        return jsonify({'status': 'success', 'projects': projects_list}), 200

    # Query failure
    return jsonify({'status': 'failure', 'message': 'Could not fetch projects'}), 500


def get_project_units(project_id):
    """
    Retrieve all units for a given project.
    Returns JSON array of unit objects or error.
    """
    units = fetch_units_by_project(project_id)
    if units is not None:
        units_list = [dict(row) for row in units]
        response = jsonify({'status': 'success', 'units': units_list})
        response.status_code = 200
        return response

    # Query failure
    return jsonify({'status': 'failure', 'message': 'Could not fetch units'}), 500


def get_dashboard_metrics(builder_id):
    """
    Aggregate and return dashboard metrics for a builder:
    total units, booked units, booking amounts, unmatched transactions.
    """
    metrics = fetch_dashboard_data(builder_id)

    if metrics is not None:
        # Merge metrics tuple into JSON response
        return jsonify({
            'status': 'success',
            **dict(metrics)
        }), 200

    # Data not found or error
    return jsonify({'status': 'failure', 'message': 'Could not fetch dashboard metrics'}), 404


def match_transaction(transaction_id, booking_id):
    """
    Match an existing payment transaction to a booking record.
    - Validates input IDs.
    - Performs update in DB and returns status.
    """
    if not transaction_id or not booking_id:
        return jsonify({'status': 'failure', 'message': 'Transaction ID and Booking ID are required'}), 400

    # Attempt to update the transaction record
    rows_updated = match_transaction_to_booking(transaction_id, booking_id)

    if rows_updated > 0:
        return jsonify({
            'status': 'success',
            'message': 'Transaction successfully matched to booking'
        }), 200
    # No rows updated implies invalid IDs or DB issue
    return jsonify({'status': 'failure', 'message': 'Could not match transaction. Invalid ID or database error.'}), 404


def get_builder_transactions(builder_id):
    """
    Retrieve all transactions (matched/unmatched) for a builder.
    Returns JSON list of transactions.
    """
    transactions = fetch_transactions_by_builder(builder_id)
    return jsonify({'status': 'success', 'transactions': transactions}), 200


def get_builder_bookings(builder_id):
    """
    Fetch all booking records associated with a builder.
    Returns JSON list of bookings.
    """
    bookings = fetch_bookings_by_builder_id(builder_id)
    return jsonify({'status': 'success', 'bookings': bookings}), 200


def get_project_details(project_id):
    """
    Retrieve detailed information for a single project by ID.
    Returns JSON with project data or error if not found.
    """
    project = fetch_project_by_id(project_id)
    if project:
        return jsonify({'status': 'success', 'project': project}), 200
    return jsonify({'status': 'failure', 'message': 'Project not found'}), 404