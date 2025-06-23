from flask import Blueprint, request, jsonify, session

from backend.services.admin_services import (
    get_all_builders,
    get_all_projects,
    get_all_bookings,
    get_all_transactions,
    filter_projects_by_builder,
    filter_bookings_by_buyer_or_unit
)

admin_blueprint = Blueprint('admin', __name__)

@admin_blueprint.route('/builders', methods=['GET'])
def list_builders():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_all_builders()

@admin_blueprint.route('/projects', methods=['GET'])
def list_all_projects():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_all_projects()

@admin_blueprint.route('/bookings', methods=['GET'])
def list_all_bookings():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_all_bookings()

@admin_blueprint.route('/transactions', methods=['GET'])
def list_all_transactions():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_all_transactions()

@admin_blueprint.route('/projects/filter', methods=['GET'])
def filter_projects():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    builder_id = request.args.get('builder_id')
    return filter_projects_by_builder(builder_id)

@admin_blueprint.route('/bookings/search', methods=['GET'])
def filter_bookings():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    query = request.args.get('q')
    return filter_bookings_by_buyer_or_unit(query)
