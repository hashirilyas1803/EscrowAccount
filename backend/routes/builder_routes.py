from flask import Blueprint, request, jsonify, session
from datetime import datetime

from backend.services.builder_services import (
    create_project, create_unit, get_builder_projects,
    get_project_units, get_dashboard_metrics
)

builder_blueprint = Blueprint('builder', __name__)


@builder_blueprint.route('/projects', methods=['POST'])
def create_new_project():
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json
    builder_id = session['user_id']
    return create_project(
        builder_id,
        data.get('name'),
        data.get('location'),
        data.get('num_units')
    )

@builder_blueprint.route('/projects', methods=['GET'])
def list_builder_projects():
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_builder_projects(session['user_id'])



@builder_blueprint.route('/projects/<int:project_id>/units', methods=['POST'])
def create_new_unit(project_id):
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json
    return create_unit(
        project_id,
        data.get('unit_id'),
        data.get('floor'),
        data.get('area'),
        data.get('price')
    )

@builder_blueprint.route('/projects/<int:project_id>/units', methods=['GET'])
def list_units_for_project(project_id):
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_project_units(project_id)


@builder_blueprint.route('/dashboard', methods=['GET'])
def builder_dashboard():
    if 'user_id' not in session or session.get('role') != 'builder':
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_dashboard_metrics(session['user_id'])