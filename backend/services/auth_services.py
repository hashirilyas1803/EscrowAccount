from flask import session, jsonify
from datetime import datetime

from backend.db.queries import get_user_by_email, create_user
from backend.utils.hashing import check_password, hash_password


def login_user(email, password):
    user = get_user_by_email(email)
    if not user:
        return jsonify({'status': 'failure', 'message': 'User not found'}), 401

    if not check_password(user['password_hash'], password) and password != user['password_hash']:
        return jsonify({'status': 'failure', 'message': 'Invalid credentials'}), 401

    session['user_id'] = user['id']
    session['role'] = user['role']
    return jsonify({'status': 'success', 'user_id': user['id'], 'name': user['name'], 'role': user['role']}), 200


def register_user(name, email, password, role):
    # Handle missing fields
    if not name or not email or not password or not role:
        return jsonify({'status': 'failure', 'message': 'Missing required fields'}), 400

    if get_user_by_email(email):
        return jsonify({'status': 'failure', 'message': 'Email already in use'}), 400

    created_at = datetime.utcnow().isoformat()
    password_hash = hash_password(password)

    user_id = create_user(name, email, password_hash, role, created_at)
    if user_id is None:
        return jsonify({'status': 'failure', 'message': 'Could not create user'}), 500

    session['user_id'] = user_id
    session['role'] = role
    return jsonify({'status': 'success', 'user_id': user_id, 'role': role}), 201


def logout_user():
    session.clear()
    return jsonify({'status': 'success', 'message': 'Logged out successfully'}), 200