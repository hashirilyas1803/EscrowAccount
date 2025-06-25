from flask import jsonify
from datetime import datetime
from backend.db.queries import (
    create_booking,
    fetch_bookings_by_buyer_id,
    create_transaction,
    get_unit_internal_id_by_unit_code  # new import
)

def create_booking_service(buyer_id, unit_code, amount, date):
    # Get the internal unit ID from the public unit code
    unit_record = get_unit_internal_id_by_unit_code(unit_code)
    if not unit_record:
        return jsonify({'status': 'failure', 'message': 'Invalid unit ID'}), 400

    internal_unit_id = unit_record['id']
    created_at = datetime.utcnow().isoformat()
    booking_id = create_booking(internal_unit_id, buyer_id, amount, date, created_at)

    if booking_id:
        return jsonify({'status': 'success', 'message': 'Booking successful', 'booking_id': booking_id}), 201

    return jsonify({'status': 'failure', 'message': 'Booking failed'}), 400

def get_my_bookings(buyer_id):
    bookings = fetch_bookings_by_buyer_id(buyer_id)
    if bookings is not None:
        return jsonify({'status': 'success', 'bookings': bookings}), 200
    return jsonify({'status': 'failure', 'message': 'Could not fetch bookings'}), 500

def make_transaction_service(amount, date, payment_type):
    created_at = datetime.utcnow().isoformat()
    transaction_id = create_transaction(amount, date, payment_type, created_at)
    if transaction_id:
        return jsonify({'status': 'success', 'message': 'Transaction successful', 'transaction_id': transaction_id}), 201
    return jsonify({'status': 'failure', 'message': 'Transaction failed'}), 400
