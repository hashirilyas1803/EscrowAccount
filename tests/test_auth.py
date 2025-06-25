# test_auth.py

def test_register_user_success(client):
    response = client.post('/auth/register', json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    })
    assert response.status_code == 201  # Use 201 for Created
    assert response.get_json()['status'] == 'success'


def test_register_user_duplicate_email(client):
    user_data = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    }
    client.post('/auth/register', json=user_data)

    # Second request with same email
    user_data['name'] = 'Jane Smith'
    response = client.post('/auth/register', json=user_data)
    assert response.status_code == 400
    assert response.get_json()['status'] == 'failure'


def test_register_user_missing_fields(client):
    response = client.post('/auth/register', json={
        'email': 'jane@example.com',
        'password': 'testpass',
        # missing name and role
    })
    assert response.status_code == 400


def test_login_user_success(client):
    # Step 1: Register the user first
    credentials = {
        'name': 'John Doe', 'email': 'john@example.com', 'password': 'securepass', 'role': 'builder'
    }
    client.post('/auth/register', json=credentials)

    # Step 2: Attempt to log in
    response = client.post('/auth/login', json={
        'email': 'john@example.com', 'password': 'securepass'
    })
    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'


def test_login_user_wrong_password(client):
    credentials = {
        'name': 'John Doe', 'email': 'john@example.com', 'password': 'securepass', 'role': 'builder'
    }
    client.post('/auth/register', json=credentials)

    response = client.post('/auth/login', json={
        'email': 'john@example.com', 'password': 'wrongpass'
    })
    assert response.status_code == 401
    assert response.get_json()['status'] == 'failure'


def test_login_user_not_found(client):
    response = client.post('/auth/login', json={
        'email': 'nonexistent@example.com', 'password': 'anything'
    })
    assert response.status_code == 401
    assert response.get_json()['status'] == 'failure'


def test_logout_user_success(as_user, test_user_builder):
    # Log in first to ensure there's a session to clear
    client = as_user(test_user_builder)
    response = client.post('/auth/logout')
    assert response.status_code == 200
    assert response.get_json()['message'] == 'Logged out successfully'


def test_logout_without_login(client):
    # Logout should succeed even if not logged in
    response = client.post('/auth/logout')
    assert response.status_code == 200
    assert response.get_json()['message'] == 'Logged out successfully'


def test_register_empty_request(client):
    response = client.post('/auth/register', json={})
    assert response.status_code == 400


def test_register_invalid_role(client):
    response = client.post('/auth/register', json={
        'name': 'Bad Role',
        'email': 'bad@role.com',
        'password': 'pass',
        'role': 'superadmin'  # not an allowed role
    })
    assert response.status_code == 400