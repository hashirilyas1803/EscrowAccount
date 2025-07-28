from flask import jsonify
from datetime import datetime

# Import database query functions for booking and transaction operations
from backend.db.queries import (
    create_booking,
    fetch_bookings_by_buyer_id,
    create_transaction,
    get_unit_internal_id_by_unit_code,
    fetch_transactions
)

def create_booking_service(buyer_id, unit_id, amount, date):
    """
    Create a new booking for a buyer.
    - Translates public unit code to internal ID.
    - Inserts a new booking record with timestamp.
    Returns JSON response with booking_id or error.
    """
    # Lookup internal unit record by provided unit code
    unit_record = get_unit_internal_id_by_unit_code(unit_id)
    if not unit_record:
        # Invalid or non-existent unit code
        return jsonify({'status': 'failure', 'message': 'Invalid unit ID'}), 400

    internal_unit_id = unit_record['id']
    created_at = datetime.utcnow().isoformat()

    # Delegate insertion to data layer
    booking_id = create_booking(internal_unit_id, buyer_id, amount, date, created_at)

    if booking_id:
        return jsonify({
            'status': 'success',
            'message': 'Booking successful',
            'booking_id': booking_id
        }), 201

    # Insertion failed
    return jsonify({'status': 'failure', 'message': 'Booking failed'}), 400

def get_my_bookings(buyer_id):
    """
    Retrieve all bookings associated with a buyer.
    Returns JSON list of bookings or error.
    """
    bookings = fetch_bookings_by_buyer_id(buyer_id)
    if bookings is not None:
        return jsonify({'status': 'success', 'bookings': bookings}), 200

    # Data retrieval error
    return jsonify({'status': 'failure', 'message': 'Could not fetch bookings'}), 500

def make_transaction_service(amount, date, payment_type, buyer_id, unit_id):
    """
    Record a new payment transaction for a unit.
    - Resolves public unit code to internal ID.
    - Inserts transaction record with timestamp and payment details.
    Returns JSON response with transaction_id or error.
    """
    created_at = datetime.utcnow().isoformat()

    # Delegate insertion to data layer
    transaction_id = create_transaction(amount, date, payment_type, created_at, buyer_id, unit_id)
    if transaction_id:
        return jsonify({
            'status': 'success',
            'message': 'Transaction successful',
            'transaction_id': transaction_id
        }), 201

    # Insertion failed
    return jsonify({'status': 'failure', 'message': 'Transaction failed'}), 400

def get_transactions(buyer_id):
    """
    Fetch all transactions made by a buyer.
    Returns JSON list of transactions.
    """
    transactions = fetch_transactions()
    return jsonify({'status': 'success', 'transactions': transactions}), 200