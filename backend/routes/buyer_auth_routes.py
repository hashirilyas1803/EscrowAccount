from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.services.buyer_auth_services import login_buyer, register_buyer, logout_buyer

# Blueprint for buyer-specific authentication endpoints under '/buyer/auth'
buyer_auth_blueprint = Blueprint('buyer_auth', __name__)

@buyer_auth_blueprint.route('/login', methods=['POST'])
def login():
    """
    POST /buyer/auth/login
    Authenticate a buyer using email and password.
    Delegates to buyer_auth_services.login_buyer()
    """
    data = request.json  # Parse incoming JSON payload
    # Return service layer's response (sets session or token)
    return login_buyer(data.get('email'), data.get('password'))

@buyer_auth_blueprint.route('/register', methods=['POST'])
def register():
    """
    POST /buyer/auth/register
    Register a new buyer with Emirates ID, contact info, and credentials.
    Performs basic Emirates ID format validation before delegating to service.
    """
    data = request.json

    emirates_id = data.get('emirates_id')
    # Ensure Emirates ID is provided and follows UAE-specific rules
    if not emirates_id:
        return jsonify({'status': 'failure', 'message': 'Emirates ID is required'}), 400
    if not emirates_id.isdigit():
        return jsonify({'status': 'failure', 'message': 'Emirates ID must contain only digits'}), 400
    if len(emirates_id) != 15:
        return jsonify({'status': 'failure', 'message': 'Emirates ID must be exactly 15 digits'}), 400
    if emirates_id == '784000000000000':
        return jsonify({'status': 'failure', 'message': 'Emirates ID cannot be all zeroes'}), 400
    if not emirates_id.startswith('784'):
        return jsonify({'status': 'failure', 'message': 'Emirates ID must start with 784 (UAE code)'}), 400

    # Extract birth year portion and validate it
    birth_year_segment = emirates_id[3:7]
    if not birth_year_segment.isdigit():
        return jsonify({'status': 'failure', 'message': 'Invalid birth year in Emirates ID'}), 400
    birth_year = int(birth_year_segment)
    current_year = datetime.utcnow().year
    if birth_year < 1900 or birth_year > current_year:
        return jsonify({'status': 'failure', 'message': 'Birth year in Emirates ID is not valid'}), 400

    # All validations passed, delegate to registration service
    return register_buyer(
        data.get('name'),
        emirates_id,
        data.get('phone_number'),
        data.get('email'),
        data.get('password')
    )

@buyer_auth_blueprint.route('/logout', methods=['POST'])
def logout():
    """
    POST /buyer/auth/logout
    Log out the currently authenticated buyer by clearing session data.
    """
    return logout_buyer()