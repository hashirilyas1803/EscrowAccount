def test_get_all_builders(client, login_as_admin):
    response = client.get('/admin/builders')
    assert response.status_code == 200
    assert 'builders' in response.get_json()

def test_admin_can_view_all_builders(client):
    client.post('/login', json={'email': 'admin@example.com', 'password': 'admin123'})
    response = client.get('/admin/builders')
    assert response.status_code == 200
    assert 'builders' in response.json

def test_admin_can_view_all_projects(client):
    response = client.get('/admin/projects')
    assert response.status_code == 200

def test_admin_can_view_all_bookings(client):
    response = client.get('/admin/bookings')
    assert response.status_code == 200 or response.status_code == 201
