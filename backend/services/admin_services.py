from flask import jsonify

from backend.db.queries import (
    fetch_all_builders,
    fetch_all_projects,
    fetch_all_bookings,
    fetch_all_transactions,
    fetch_projects_by_builder_id,
    fetch_bookings_by_buyer_or_unit
)

def get_all_builders():
    builders = fetch_all_builders()
    return jsonify({'status': 'success', 'builders': builders})

def get_all_projects():
    projects = fetch_all_projects()
    return jsonify({'status': 'success', 'projects': projects})

def get_all_bookings():
    bookings = fetch_all_bookings()
    return jsonify({'status': 'success', 'bookings': bookings})

def get_all_transactions():
    transactions = fetch_all_transactions()
    return jsonify({'status': 'success', 'transactions': transactions})

def filter_projects_by_builder(builder_id):
    if not builder_id:
        return get_all_projects()
    projects = fetch_projects_by_builder_id(builder_id)
    return jsonify({'status': 'success', 'projects': projects})

def filter_bookings_by_buyer_or_unit(query):
    if not query:
        return get_all_bookings()
    bookings = fetch_bookings_by_buyer_or_unit(query)
    return jsonify({'status': 'success', 'bookings': bookings})
