def test_register_user_success(client):
    """
    Verify that a new user can register successfully.
    Sends valid 'builder' credentials to the /auth/register endpoint.
    """
    # Send POST request to the registration endpoint
    response = client.post('/auth/register', json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    })
    # Expect a 201 Created status
    assert response.status_code == 201  # Created
    assert response.get_json()['status'] == 'success'


def test_register_user_duplicate_email(client):
    """
    Ensure registering with an already-used email fails.
    First registers one user, then attempts another with the same email.
    """
    # Register initial user
    user_data = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    }
    client.post('/auth/register', json=user_data)

    # Modify name but reuse email and attempt second registration
    user_data['name'] = 'Jane Smith'
    response = client.post('/auth/register', json=user_data)
    # Expect HTTP 400 and failure status
    assert response.status_code == 400
    assert response.get_json()['status'] == 'failure'


def test_register_user_missing_fields(client):
    """
    Verify registration fails when required fields are missing.
    Omits 'name' and 'role' in the payload.
    """
    # Send incomplete registration data
    response = client.post('/auth/register', json={
        'email': 'jane@example.com',
        'password': 'testpass'
    })
    assert response.status_code == 400


def test_login_user_success(client):
    """
    Test that a registered user can log in with correct credentials.
    """
    # Register the user first
    credentials = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    }
    client.post('/auth/register', json=credentials)

    # Attempt to log in
    response = client.post('/auth/login', json={
        'email': 'john@example.com',
        'password': 'securepass'
    })
    # Should receive HTTP 200 and success status
    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'


def test_login_user_wrong_password(client):
    """
    Ensure login fails with an incorrect password.
    """
    # Register the user first
    credentials = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    }
    client.post('/auth/register', json=credentials)

    # Attempt login with wrong password
    response = client.post('/auth/login', json={
        'email': 'john@example.com',
        'password': 'wrongpass'
    })
    assert response.status_code == 401
    assert response.get_json()['status'] == 'failure'


def test_login_user_not_found(client):
    """
    Verify login fails when the user does not exist.
    """
    response = client.post('/auth/login', json={
        'email': 'nonexistent@example.com',
        'password': 'anything'
    })
    assert response.status_code == 401
    assert response.get_json()['status'] == 'failure'


def test_logout_user_success(as_user, test_user_builder):
    """
    Test that a logged-in user can successfully log out, clearing their session.
    """
    # Log in to establish session
    client = as_user(test_user_builder)
    response = client.post('/auth/logout')
    assert response.status_code == 200
    assert response.get_json()['message'] == 'Logged out successfully'


def test_register_empty_request(client):
    """
    Verify registration returns 400 when payload is empty.
    """
    # Send empty JSON body
    response = client.post('/auth/register', json={})
    assert response.status_code == 400


def test_register_invalid_role(client):
    """
    Ensure registration fails if the role provided is invalid.
    """
    response = client.post('/auth/register', json={
        'name': 'Bad Role',
        'email': 'bad@role.com',
        'password': 'pass',
        'role': 'superadmin'  # not allowed
    })
    assert response.status_code == 400