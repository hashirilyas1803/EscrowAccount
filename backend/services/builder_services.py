from flask import jsonify
from datetime import datetime

from backend.db.queries import (
    insert_project,
    insert_unit,
    fetch_projects_by_builder,
    fetch_units_by_project,
    fetch_dashboard_data,
    match_transaction_to_booking,
    fetch_transactions_by_builder
)


def create_project(builder_id, name, location, num_units):
    if not all([builder_id, name, location, num_units]):
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    created_at = datetime.utcnow().isoformat()
    project_id = insert_project(builder_id, name, location, num_units, created_at)

    if project_id:
        return jsonify({
            'status': 'success',
            'message': 'Project created successfully',
            'project_id': project_id
        }), 201

    return jsonify({'status': 'failure', 'message': 'Could not create project'}), 400


def create_unit(project_id, unit_id, floor, area, price):
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

    return jsonify({'status': 'failure', 'message': 'Could not add unit'}), 400


def get_builder_projects(builder_id):
    projects = fetch_projects_by_builder(builder_id)

    if projects is not None:
        projects_list = [dict(row) for row in projects]
        return jsonify({'status': 'success', 'projects': projects_list}), 200

    return jsonify({'status': 'failure', 'message': 'Could not fetch projects'}), 500


def get_project_units(project_id):
    units = fetch_units_by_project(project_id)
    if units is not None:
        units_list = [dict(row) for row in units]
        response = jsonify({'status': 'success', 'units': units_list})
        response.status_code = 200
        return response

    return jsonify({'status': 'failure', 'message': 'Could not fetch units'}), 500


def get_dashboard_metrics(builder_id):
    metrics = fetch_dashboard_data(builder_id)

    if metrics is not None:
        return jsonify({
            'status': 'success',
            **dict(metrics)
        }), 200

    return jsonify({'status': 'failure', 'message': 'Could not fetch dashboard metrics'}), 404

def match_transaction(transaction_id, booking_id):
    """
    Handles the business logic for matching a transaction to a booking.
    """
    if not transaction_id or not booking_id:
        return jsonify({'status': 'failure', 'message': 'Transaction ID and Booking ID are required'}), 400

    # Call the database query to perform the update.
    rows_updated = match_transaction_to_booking(transaction_id, booking_id)

    # Check if the update was successful.
    if rows_updated > 0:
        return jsonify({
            'status': 'success',
            'message': 'Transaction successfully matched to booking'
        }), 200
    else:
        # This can happen if the transaction_id does not exist or if there's a DB error.
        return jsonify({'status': 'failure', 'message': 'Could not match transaction. Invalid ID or database error.'}), 404


def get_builder_transactions(builder_id):
    """Service to get all transactions for a given builder."""
    transactions = fetch_transactions_by_builder(builder_id)
    return jsonify({'status': 'success', 'transactions': transactions}), 200