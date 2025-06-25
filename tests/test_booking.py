# test_booking.py

def test_successful_booking(as_user, as_buyer, test_user_builder, test_user_buyer):
    # Step 1: Builder logs in and creates project/unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post('/builder/projects', json={
        "name": "Demo Project", "location": "Dubai", "num_units": 1
    })
    assert proj_res.status_code == 201
    project_id = proj_res.get_json()['project_id']

    builder_client.post(f'/builder/projects/{project_id}/units', json={
        "unit_id": "APT101", "floor": 1, "area": 1000, "price": 500000
    })

    # Step 2: Buyer logs in and books the unit
    buyer_client = as_buyer(test_user_buyer)
    response = buyer_client.post('/buyer/bookings', json={
        'unit_id': 'APT101',
        'booking_amount': 100000,
        'payment_method': 'cash',
        'booking_date': '2025-06-22'
    })
    assert response.status_code == 201
    assert response.get_json()['status'] == 'success'


def test_booking_already_booked_unit(as_user, as_buyer, test_user_builder, test_user_buyer):
    # Step 1: Builder sets up the unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post('/builder/projects', json={
        "name": "Occupied Project", "location": "Dubai", "num_units": 1
    })
    project_id = proj_res.get_json()['project_id']
    builder_client.post(f'/builder/projects/{project_id}/units', json={
        "unit_id": "APT202", "floor": 2, "area": 900, "price": 400000
    })

    # Step 2: Buyer logs in and books the unit successfully
    buyer_client = as_buyer(test_user_buyer)
    booking_data = {
        'unit_id': 'APT202', 'booking_amount': 100000, 'payment_method': 'cash', 'booking_date': '2025-06-22'
    }
    first_booking = buyer_client.post('/buyer/bookings', json=booking_data)
    assert first_booking.status_code == 201

    # Step 3: A second attempt to book the same unit should fail (can be same or different buyer)
    response = buyer_client.post('/buyer/bookings', json=booking_data)
    assert response.status_code == 400  # Or 409 Conflict
    assert response.get_json()['status'] == 'failure'


def test_booking_requires_login(as_user, test_user_builder, client):
    # Step 1: Builder creates a unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post('/builder/projects', json={
        "name": "Secure Project", "location": "Abu Dhabi", "num_units": 1
    })
    project_id = proj_res.get_json()['project_id']
    builder_client.post(f'/builder/projects/{project_id}/units', json={
        "unit_id": "APT301", "floor": 3, "area": 950, "price": 600000
    })

    # Step 2: Make unauthenticated booking attempt using the raw client
    response = client.post('/buyer/bookings', json={
        'unit_id': 'APT301', 'booking_amount': 100000, 'payment_method': 'cash', 'booking_date': '2025-06-22'
    })
    assert response.status_code in [401, 403]


def test_booking_invalid_unit_id(as_buyer, test_user_buyer):
    # Log in as buyer
    buyer_client = as_buyer(test_user_buyer)
    response = buyer_client.post('/buyer/bookings', json={
        'unit_id': 'DOESNOTEXIST', 'booking_amount': 100000, 'payment_method': 'cash', 'booking_date': '2025-06-22'
    })
    assert response.status_code == 400  # Or 404 Not Found
    assert response.get_json()['status'] == 'failure'