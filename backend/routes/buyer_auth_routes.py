from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.services.buyer_auth_services import login_buyer, register_buyer, logout_buyer

buyer_auth_blueprint = Blueprint('buyer_auth', __name__)

@buyer_auth_blueprint.route('/login', methods=['POST'])
def login():
    data = request.json
    return login_buyer(data.get('email'), data.get('password'))

@buyer_auth_blueprint.route('/register', methods=['POST'])
def register():
    data = request.json

    # Basic Emirates ID validation
    emirates_id = data.get('emirates_id')
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

    birth_year_segment = emirates_id[3:7]
    if not birth_year_segment.isdigit():
        return jsonify({'status': 'failure', 'message': 'Invalid birth year in Emirates ID'}), 400
    birth_year = int(birth_year_segment)
    current_year = datetime.utcnow().year
    if birth_year < 1900 or birth_year > current_year:
        return jsonify({'status': 'failure', 'message': 'Birth year in Emirates ID is not valid'}), 400

    return register_buyer(
        data.get('name'),
        emirates_id,
        data.get('phone_number'),
        data.get('email'),
        data.get('password')
    )

@buyer_auth_blueprint.route('/logout', methods=['POST'])
def logout():
    return logout_buyer()