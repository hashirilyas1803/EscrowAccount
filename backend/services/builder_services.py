from flask import jsonify
from backend.db.queries import (
    insert_project,
    insert_unit,
    fetch_projects_by_builder,
    fetch_units_by_project,
    fetch_dashboard_data
)

def create_project(builder_id, name, location, num_units):
    project_id = insert_project(builder_id, name, location, num_units)
    if project_id:
        return jsonify({
            'status': 'success',
            'message': 'Project created successfully',
            'project_id': project_id
        }), 201
    return jsonify({'status': 'failure', 'message': 'Could not create project'}), 400


def create_unit(project_id, unit_id, floor, area, price):
    unit_row_id = insert_unit(project_id, unit_id, floor, area, price)
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
        return jsonify({'status': 'success', 'projects': projects}), 200
    return jsonify({'status': 'failure', 'message': 'Could not fetch projects'}), 500


def get_project_units(project_id):
    units = fetch_units_by_project(project_id)
    if units is not None:
        return jsonify({'status': 'success', 'units': units}), 200
    return jsonify({'status': 'failure', 'message': 'Could not fetch units'}), 500


def get_dashboard_metrics(builder_id):
    metrics = fetch_dashboard_data(builder_id)
    if metrics is not None:
        return jsonify({'status': 'success', 'dashboard': metrics}), 200
    return jsonify({'status': 'failure', 'message': 'Could not fetch dashboard metrics'}), 500