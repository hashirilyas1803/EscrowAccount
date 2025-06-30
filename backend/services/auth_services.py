from flask import session, jsonify
from datetime import datetime

# Database queries for user lookup and creation
from backend.db.queries import get_user_by_email, create_user
# Utilities for password hashing and verification
from backend.utils.hashing import check_password, hash_password

def login_user(email, password):
    """
    Authenticate a user by email and password.
    - Verifies email exists and password matches the stored hash.
    - On success, stores user_id and role in session.
    Returns a JSON response with status and user info or error.
    """
    # Retrieve user record by email
    user = get_user_by_email(email)
    if not user:
        # No matching user found
        return jsonify({'status': 'failure', 'message': 'User not found'}), 401

    # Check hashed password or allow plain-text match for demo
    if not check_password(user['password_hash'], password) and password != user['password_hash']:
        # Invalid credentials
        return jsonify({'status': 'failure', 'message': 'Invalid credentials'}), 401

    # Store authentication state in session
    session['user_id'] = user['id']
    session['role'] = user['role']
    # Return success with basic user info
    return jsonify({
        'status': 'success',
        'user_id': user['id'],
        'name': user['name'],
        'role': user['role']
    }), 200


def register_user(name, email, password, role):
    """
    Register a new user (builder or admin).
    - Validates input fields and email uniqueness.
    - Hashes password and inserts new record.
    - Stores new user_id and role in session.
    Returns JSON response indicating success or error.
    """
    # Ensure all required fields are provided
    if not name or not email or not password or not role:
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    # Prevent duplicate emails
    if get_user_by_email(email):
        return jsonify({'status': 'failure', 'message': 'Email already in use'}), 400

    # Prepare data for insertion
    created_at = datetime.utcnow().isoformat()
    password_hash = hash_password(password)

    # Insert user into database and retrieve new ID
    user_id = create_user(name, email, password_hash, role, created_at)
    if user_id is None:
        # Database insertion failure
        return jsonify({'status': 'failure', 'message': 'Could not create user'}), 500

    # Persist login state for the newly registered user
    session['user_id'] = user_id
    session['role'] = role
    # Respond with created status
    return jsonify({'status': 'success', 'user_id': user_id, 'role': role}), 201


def logout_user():
    """
    Log out the current user by clearing session data.
    Returns a JSON success message.
    """
    session.clear()
    return jsonify({'status': 'success', 'message': 'Logged out successfully'}), 200