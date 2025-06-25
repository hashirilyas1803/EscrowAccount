from flask import Blueprint, request, jsonify, Response

from backend.services.auth_services import login_user, register_user, logout_user

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/login', methods=['POST'])
def login():
    data = request.json

    # Parse the request and extract the email and password
    response_data = login_user(data.get('email'), data.get('password'))
    return response_data

@auth_blueprint.route('/register', methods=['POST'])
def register():
    data = request.json
    role = data.get('role')
    if role not in ['builder', 'admin']:
        return jsonify({'status': 'failure', 'message': 'Invalid role'}), 400

    # Return the response of the register function
    return register_user(data.get('name'), data.get('email'), data.get('password'), role)

@auth_blueprint.route('/logout', methods=['POST'])
def logout():
    return logout_user()