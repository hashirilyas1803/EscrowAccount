def test_successful_booking(as_user, as_buyer, test_user_builder, test_user_buyer):
    """
    End-to-end booking scenario:
    1. Builder creates a project and adds a unit.
    2. Buyer books the unit successfully.
    """
    # Step 1: Builder logs in and creates a project
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post(
        '/builder/projects',
        json={"name": "Demo Project", "location": "Dubai", "num_units": 1}
    )
    assert proj_res.status_code == 201  # Project creation should succeed
    project_id = proj_res.get_json()['project_id']

    # Step 1b: Builder adds a new unit to the project
    builder_client.post(
        f'/builder/projects/{project_id}/units',
        json={"unit_id": "APT101", "floor": 1, "area": 1000, "price": 500000}
    )

    # Step 2: Buyer logs in and books the created unit
    buyer_client = as_buyer(test_user_buyer)
    response = buyer_client.post(
        '/buyer/bookings',
        json={
            'unit_id': 'APT101',
            'booking_amount': 100000,
            'payment_method': 'cash',
            'booking_date': '2025-06-22'
        }
    )
    assert response.status_code == 201  # Booking should be created
    assert response.get_json()['status'] == 'success'


def test_booking_already_booked_unit(as_user, as_buyer, test_user_builder, test_user_buyer):
    """
    Ensure booking the same unit twice is not allowed.
    """
    # Step 1: Builder sets up a project and unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post(
        '/builder/projects',
        json={"name": "Occupied Project", "location": "Dubai", "num_units": 1}
    )
    project_id = proj_res.get_json()['project_id']
    builder_client.post(
        f'/builder/projects/{project_id}/units',
        json={"unit_id": "APT202", "floor": 2, "area": 900, "price": 400000}
    )

    # Step 2: Buyer books the unit for the first time
    buyer_client = as_buyer(test_user_buyer)
    booking_data = {
        'unit_id': 'APT202',
        'booking_amount': 100000,
        'payment_method': 'cash',
        'booking_date': '2025-06-22'
    }
    first_booking = buyer_client.post('/buyer/bookings', json=booking_data)
    assert first_booking.status_code == 201

    # Step 3: Attempt to book the same unit again should fail
    second_booking = buyer_client.post('/buyer/bookings', json=booking_data)
    assert second_booking.status_code == 400  # Conflict or bad request
    assert second_booking.get_json()['status'] == 'failure'


def test_booking_requires_login(as_user, test_user_builder, client):
    """
    Verify that booking endpoints require authentication.
    """
    # Step 1: Setup project and unit by builder
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post(
        '/builder/projects',
        json={"name": "Secure Project", "location": "Abu Dhabi", "num_units": 1}
    )
    project_id = proj_res.get_json()['project_id']
    builder_client.post(
        f'/builder/projects/{project_id}/units',
        json={"unit_id": "APT301", "floor": 3, "area": 950, "price": 600000}
    )

    # Step 2: Unauthenticated booking attempt should be rejected
    unauth_response = client.post(
        '/buyer/bookings',
        json={
            'unit_id': 'APT301',
            'booking_amount': 100000,
            'payment_method': 'cash',
            'booking_date': '2025-06-22'
        }
    )
    assert unauth_response.status_code in [401, 403]


def test_booking_invalid_unit_id(as_buyer, test_user_buyer):
    """
    Booking should fail when an invalid unit code is provided.
    """
    # Log in as buyer and attempt booking with non-existent unit ID
    buyer_client = as_buyer(test_user_buyer)
    response = buyer_client.post(
        '/buyer/bookings',
        json={
            'unit_id': 'DOESNOTEXIST',
            'booking_amount': 100000,
            'payment_method': 'cash',
            'booking_date': '2025-06-22'
        }
    )
    assert response.status_code == 400  # Bad request for invalid unit
    assert response.get_json()['status'] == 'failure'