from flask import session, jsonify
from datetime import datetime
from backend.db.queries import get_buyer_by_email, create_buyer
from backend.utils.hashing import check_password, hash_password

def login_buyer(email, password):
    """
    Authenticate buyer credentials.
    - Verifies email exists and password matches stored hash.
    - On success, stores buyer_id in session for future requests.
    Returns JSON response indicating success or failure.
    """
    # Look up buyer record by email
    buyer = get_buyer_by_email(email)
    if not buyer:
        return jsonify({'status': 'failure', 'message': 'Buyer not found'}), 401

    # Validate provided password against stored hash
    if not check_password(buyer['password_hash'], password):
        return jsonify({'status': 'failure', 'message': 'Invalid credentials'}), 401

    # Persist buyer login state in session
    session['buyer_id'] = buyer['id']
    # Return success with buyer details
    return jsonify({'status': 'success', 'buyer_id': buyer['id'], 'name': buyer['name']}), 200

def register_buyer(name, emirates_id, phone_number, email, password):
    """
    Register a new buyer account.
    - Checks for existing email to prevent duplicates.
    - Hashes password and saves new record with timestamp.
    - Stores new buyer_id in session upon success.
    Returns JSON response with registration outcome.
    """
    # Prevent duplicate registrations
    existing_buyer = get_buyer_by_email(email)
    if existing_buyer:
        return jsonify({'status': 'failure', 'message': 'Email already in use'}), 401

    # Prepare data for insertion
    created_at = datetime.utcnow().isoformat()
    hashed_password = hash_password(password)
    # Insert new buyer record
    buyer_id = create_buyer(name, emirates_id, phone_number, email, hashed_password, created_at)

    # Handle possible insertion failure
    if buyer_id is not None:
        session['buyer_id'] = buyer_id
    else:
        return jsonify({'status': 'failure', 'message': 'Registration failed'}), 401

    # Respond with success and buyer ID
    return jsonify({'status': 'success', 'buyer_id': buyer_id}), 200

def logout_buyer():
    """
    Log out the current buyer by clearing session data.
    Returns JSON confirmation of logout.
    """
    session.clear()
    return jsonify({'status': 'success', 'message': 'Logged out successfully'}), 200