def test_successful_booking(client):
    client.post('/login', json={'email': 'buyer@example.com', 'password': 'test123'})
    response = client.post('/bookings', json={
        'unit_id': 1,
        'amount': 100000,
        'date': '2025-06-22'
    })
    assert response.status_code == 200
    assert response.json['status'] == 'success'

def test_booking_already_booked_unit(client):
    response = client.post('/bookings', json={
        'unit_id': 1,  # same as before
        'amount': 100000,
        'date': '2025-06-22'
    })
    assert response.status_code == 400

def test_booking_requires_login(client):
    client.post('/logout')
    response = client.post('/bookings', json={
        'unit_id': 2,
        'amount': 50000,
        'date': '2025-06-22'
    })
    assert response.status_code == 403