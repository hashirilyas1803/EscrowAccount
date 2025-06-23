from flask import session, jsonify, make_response
from datetime import datetime

from backend.db.queries import get_user_by_email, create_user
from backend.utils.hashing import check_password, hash_password


def login_user(email, password):
    # Fetch the user by their email address
    user = get_user_by_email(email)

    # Return a failure message if the user does not exist
    if not user:
        return jsonify({'status': 'failure', 'message': 'User not found'}), 401

    # Check the password against the hash stored in the db. Return a failure message if it does not match
    if not check_password(user['password_hash'], password):
        return jsonify({'status': 'failure', 'message': 'Invalid credentials'}), 401

    # Set session variables
    session['user_id'] = user['id']
    session['role'] = user['role']

    # Return a success message if the user is successfully logged in
    return jsonify({'status': 'success', 'user_id': user['id'], 'role': user['role']})


def register_user(name, email, password, role):
    # Check if the email already exists in the database
    existing_user = get_user_by_email(email)
    if existing_user:
        return jsonify({'status': 'failure', 'message': 'Email already in use'}), 401

    # Get the account creation time in ISO format
    created_at = datetime.utcnow().isoformat()

    # Hash the password
    hashed_password = hash_password(password)

    # Register the user in the db
    user_id = create_user(name, email, hashed_password, role, created_at)

    # Log the user in if the account is created successfully
    if user_id is not None:
        session['id'] = user_id
        session['role'] = role
    else:
        return jsonify({'status': 'failure', 'message': 'Email already in use'}), 401


    # Return a success message if the user is successfully logged in
    return jsonify({'status': 'success', 'user_id': session['id'], 'role': session['role']}), 200

def logout_user():
    # Clear the session and return a success message
    session.clear()
    return jsonify({'status': 'success', 'message': 'Logged out successfully'}), 200
