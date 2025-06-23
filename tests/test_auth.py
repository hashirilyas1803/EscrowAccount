def test_register_user_success(client):
    response = client.post('/auth/register', json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    })
    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'

def test_register_user_duplicate_email(client):
    client.post('/auth/register', json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    })
    response = client.post('/auth/register', json={
        'name': 'Jane Smith',
        'email': 'john@example.com',  # Same email
        'password': 'anotherpass',
        'role': 'builder'
    })
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
    client.post('/auth/register', json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    })
    response = client.post('/auth/login', json={
        'email': 'john@example.com',
        'password': 'securepass'
    })
    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'

def test_login_user_wrong_password(client):
    client.post('/auth/register', json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass',
        'role': 'builder'
    })
    response = client.post('/auth/login', json={
        'email': 'john@example.com',
        'password': 'wrongpass'
    })
    assert response.status_code == 401
    assert response.get_json()['status'] == 'failure'

def test_login_user_not_found(client):
    response = client.post('/auth/login', json={
        'email': 'nonexistent@example.com',
        'password': 'anything'
    })
    assert response.status_code == 401
    assert response.get_json()['status'] == 'failure'

def test_logout_user_success(login_as_builder):
    response = login_as_builder.post('/auth/logout')
    assert response.status_code == 200
    assert response.get_json()['message'] == 'Logged out successfully'

def test_logout_without_login(client):
    response = client.post('/auth/logout')
    assert response.status_code == 200  # logout still works (clears session)
    assert response.get_json()['message'] == 'Logged out successfully'
