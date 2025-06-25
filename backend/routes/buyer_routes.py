from flask import Blueprint, request, jsonify, session
from backend.services.buyer_services import (
    create_booking_service,
    get_my_bookings,
    make_transaction_service
)

buyer_blueprint = Blueprint('buyer', __name__)

VALID_PAYMENT_METHOD = {'cash', 'bank transfer'}

@buyer_blueprint.route('/bookings', methods=['POST'])
def book_unit():
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json or {}
    unit_id = data.get('unit_id')
    amount = data.get('booking_amount')
    date = data.get('booking_date')

    if not all([unit_id, amount, date]):
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    return create_booking_service(
        session['buyer_id'],
        unit_id,
        amount,
        date
    )


@buyer_blueprint.route('/bookings', methods=['GET'])
def view_my_bookings():
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 400

    return get_my_bookings(session['buyer_id'])


@buyer_blueprint.route('/transactions', methods=['POST'])
def create_transaction():
    if 'buyer_id' not in session:
        return jsonify({'status': 'failure', 'message': 'Unauthorized'}), 403

    data = request.json or {}
    amount = data.get('amount')
    date = data.get('date')
    payment_method = data.get('payment_method')

    if not all([amount, date, payment_method]):
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    if payment_method not in VALID_PAYMENT_METHOD:
        return jsonify({'status': 'failure', 'message': 'Invalid payment type'}), 400

    return make_transaction_service(
        amount,
        date,
        payment_method
    )