from flask import session, jsonify
from datetime import datetime
from backend.db.queries import get_buyer_by_email, create_buyer
from backend.utils.hashing import check_password, hash_password

def login_buyer(email, password):
    buyer = get_buyer_by_email(email)
    if not buyer:
        return jsonify({'status': 'failure', 'message': 'Buyer not found'}), 401

    if not check_password(buyer['password_hash'], password):
        return jsonify({'status': 'failure', 'message': 'Invalid credentials'}), 401

    session['buyer_id'] = buyer['id']

    return jsonify({'status': 'success', 'buyer_id': buyer['id']}), 200

def register_buyer(name, emirates_id, phone_number, email, password):
    existing_buyer = get_buyer_by_email(email)
    if existing_buyer:
        return jsonify({'status': 'failure', 'message': 'Email already in use'}), 401

    created_at = datetime.utcnow().isoformat()
    hashed_password = hash_password(password)
    buyer_id = create_buyer(name, emirates_id, phone_number, email, hashed_password, created_at)

    if buyer_id is not None:
        session['buyer_id'] = buyer_id
    else:
        return jsonify({'status': 'failure', 'message': 'Registration failed'}), 401

    return jsonify({'status': 'success', 'buyer_id': buyer_id}), 200

def logout_buyer():
    session.clear()
    return jsonify({'status': 'success', 'message': 'Logged out successfully'}), 200
