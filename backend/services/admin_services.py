from flask import jsonify

# Import database query functions for data retrieval and filtering
from backend.db.queries import (
    fetch_all_builders,
    fetch_all_projects,
    fetch_all_bookings,
    fetch_all_transactions,
    fetch_projects_by_builder,
    fetch_bookings_by_buyer_or_unit
)

def get_all_builders():
    """
    Retrieve and return all registered builders.
    Delegates to the database layer, then wraps results in a JSON response.
    """
    builders = fetch_all_builders()
    return jsonify({'status': 'success', 'builders': builders}), 200


def get_all_projects():
    """
    Retrieve and return all projects across builders.
    """
    projects = fetch_all_projects()
    return jsonify({'status': 'success', 'projects': projects}), 200


def get_all_bookings():
    """
    Retrieve and return all unit bookings platform-wide.
    """
    bookings = fetch_all_bookings()
    return jsonify({'status': 'success', 'bookings': bookings}), 200


def get_all_transactions():
    """
    Retrieve and return all payment transaction records.
    """
    transactions = fetch_all_transactions()
    return jsonify({'status': 'success', 'transactions': transactions}), 200


def filter_projects_by_builder(builder_id):
    """
    Filter projects for a specific builder ID.
    If no builder_id provided, falls back to returning all projects.
    """
    if not builder_id:
        # No filter: return all projects
        return get_all_projects()

    projects = fetch_projects_by_builder(builder_id)
    return jsonify({'status': 'success', 'projects': projects}), 200


def filter_bookings_by_buyer_or_unit(query):
    """
    Filter bookings by buyer name or unit number search query.
    If query is empty, returns all bookings.
    """
    if not query:
        return get_all_bookings()

    bookings = fetch_bookings_by_buyer_or_unit(query)
    return jsonify({'status': 'success', 'bookings': bookings}), 200


def filter_projects_by_name(name):
    """
    Perform case-insensitive substring match on project names.
    Returns a list of projects whose name contains the search term.
    """
    # Fetch raw data from DB
    all_projects = fetch_all_projects()

    # Filter in-memory for demo purposes
    filtered_projects = [
        project for project in all_projects
        if name.lower() in project['name'].lower()
    ]

    # Return filtered results as JSON
    return jsonify({'status': 'success', 'projects': filtered_projects}), 200