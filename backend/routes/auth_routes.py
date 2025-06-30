from flask import Blueprint, request, jsonify, Response

from backend.services.auth_services import login_user, register_user, logout_user

# Blueprint for authentication-related endpoints (login, register, logout)
auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/login', methods=['POST'])
def login():
    """
    Handle user login requests.
    Expects JSON payload with 'email' and 'password'.
    Delegates authentication logic to auth_services.login_user().
    """
    data = request.json  # Parsed JSON body of the request

    # Extract credentials and perform login
    response_data: Response = login_user(
        data.get('email'),
        data.get('password')
    )

    # Return Flask Response (JSON with status/cookie headers)
    return response_data

@auth_blueprint.route('/register', methods=['POST'])
def register():
    """
    Handle new user registration.
    Expects JSON with 'name', 'email', 'password', and 'role' ('builder' or 'admin').
    Validates role before delegating to auth_services.register_user().
    """
    data = request.json
    role = data.get('role')

    # Validate that role is one of the allowed types
    if role not in ['builder', 'admin']:
        return jsonify({
            'status': 'failure',
            'message': 'Invalid role'
        }), 400

    # Create user account and return the service response
    return register_user(
        data.get('name'),
        data.get('email'),
        data.get('password'),
        role
    )

@auth_blueprint.route('/logout', methods=['POST'])
def logout():
    """
    Handle user logout by clearing session/cookie data.
    Delegates to auth_services.logout_user().
    """
    return logout_user()