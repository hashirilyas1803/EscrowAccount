from flask import Blueprint, request, jsonify, session

# Import service functions for buyer operations: bookings, transactions, and project browsing
from backend.services.admin_services import get_all_projects
from backend.services.builder_services import get_project_details, get_project_units
from backend.services.buyer_services import (
    create_booking_service,
    get_my_bookings,
    get_transactions,
    make_transaction_service
)

# Define allowed payment methods for transaction creation
VALID_PAYMENT_METHOD = {'cash', 'bank transfer'}

# Blueprint for buyer-facing endpoints under '/buyer'
buyer_blueprint = Blueprint('buyer', __name__)

@buyer_blueprint.route('/bookings', methods=['POST'])
def book_unit():
    """
    POST /buyer/bookings
    Create a new unit booking for the authenticated buyer.
    Expects JSON with 'unit_id', 'booking_amount', and 'booking_date'.
    """
    # Ensure buyer is logged in
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json or {}
    unit_id = data.get('unit_id')
    amount = data.get('booking_amount')
    date = data.get('booking_date')

    # Basic validation of required fields
    if not all([unit_id, amount, date]):
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    # Delegate booking creation to the service layer
    return create_booking_service(
        session['buyer_id'],
        unit_id,
        amount,
        date
    )

@buyer_blueprint.route('/bookings', methods=['GET'])
def view_my_bookings():
    """
    GET /buyer/bookings
    Retrieve all bookings for the authenticated buyer.
    """
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 400

    return get_my_bookings(session['buyer_id'])

@buyer_blueprint.route('/transactions', methods=['POST'])
def create_transaction():
    """
    POST /buyer/transactions
    Record a new payment transaction. Expects JSON with 'amount', 'date', 'payment_method', and 'unit_id'.
    """
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json or {}
    amount = data.get('amount')
    date = data.get('date')
    payment_method = data.get('payment_method')
    unit_id = data.get('unit_id')

    # Validate presence of all fields
    if not all([amount, date, payment_method, unit_id]):
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    # Validate payment method against allowed types
    if payment_method not in VALID_PAYMENT_METHOD:
        return jsonify({'status': 'failure', 'message': 'Invalid payment type'}), 400

    # Delegate transaction creation to service layer
    return make_transaction_service(
        amount,
        date,
        payment_method,
        unit_id
    )

@buyer_blueprint.route('/projects', methods=['GET'])
def list_all_available_projects():
    """
    GET /buyer/projects
    List all available projects across builders for logged-in buyers.
    """
    # Authentication check
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Authentication required'}), 401

    # Reuse admin service to fetch project list
    return get_all_projects()

@buyer_blueprint.route('/projects/<int:project_id>', methods=['GET'])
def buyer_view_project(project_id):
    """
    GET /buyer/projects/<project_id>
    Retrieve details of a single project for buyers to view.
    """
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_project_details(project_id)

@buyer_blueprint.route('/projects/<int:project_id>/units', methods=['GET'])
def buyer_list_units(project_id):
    """
    GET /buyer/projects/<project_id>/units
    List all units under a specific project for buyers.
    """
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_project_units(project_id)

@buyer_blueprint.route('/transactions', methods=['GET'])
def list_my_transactions():
    """
    GET /buyer/transactions
    Retrieve all transactions made by the authenticated buyer.
    """
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    return get_transactions(session['buyer_id'])