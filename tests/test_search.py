def test_filter_by_project_name(as_user, test_user_builder, test_user_admin):
    """
    Verify admin can filter projects by name.
    1. Builder creates a project named 'Sunrise'.
    2. Admin searches with project_name=Sunrise.
    """
    # Step 1: Builder logs in and creates a project
    builder_client = as_user(test_user_builder)
    builder_client.post(
        '/builder/projects',
        json={"name": "Sunrise", "location": "Downtown", "num_units": 1}
    )

    # Step 2: Admin logs in and performs the filter request
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 200
    # Ensure at least one project is returned
    assert len(response.get_json().get('projects', [])) > 0


def test_filter_by_buyer_name(as_user, as_buyer, test_user_builder, test_user_admin, test_user_buyer):
    """
    Verify admin can filter bookings by buyer name.
    1. Builder sets up a project and unit.
    2. Buyer books the unit.
    3. Admin filters by buyer name.
    """
    # Step 1: Builder creates project and unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post(
        '/builder/projects',
        json={"name": "Sunrise", "location": "Downtown", "num_units": 1}
    )
    project_id = proj_res.get_json()['project_id']
    builder_client.post(
        f'/builder/projects/{project_id}/units',
        json={"unit_id": "APT101", "floor": 1, "area": 1000, "price": 1000000}
    )

    # Step 2: Buyer logs in and makes a booking for that unit
    buyer_client = as_buyer(test_user_buyer)
    buyer_client.post(
        '/buyer/bookings',
        json={
            'unit_id': 'APT101',
            'booking_amount': 50000,
            'payment_method': 'bank transfer',
            'booking_date': '2025-06-20'
        }
    )

    # Step 3: Admin logs in and filters bookings by the buyer's name
    admin_client = as_user(test_user_admin)
    buyer_name = 'Buyer Test'  # From test_user_buyer fixture
    response = admin_client.get(f'/admin/filter?buyer_name={buyer_name}')
    assert response.status_code == 200
    # Ensure at least one booking matches the buyer name
    assert len(response.get_json().get('bookings', [])) > 0


def test_filter_by_unit_id(as_user, test_user_builder, test_user_admin):
    """
    Verify admin can filter bookings by unit ID (even if no booking exists).
    """
    # Step 1: Builder creates project and unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post(
        '/builder/projects',
        json={"name": "Sunrise", "location": "City Center", "num_units": 1}
    )
    project_id = proj_res.get_json()['project_id']
    builder_client.post(
        f'/builder/projects/{project_id}/units',
        json={"unit_id": "APT101", "floor": 2, "area": 950, "price": 800000}
    )

    # Step 2: Admin filters by unit ID
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?unit_id=APT101')
    assert response.status_code == 200
    # Even if no booking exists, response should include 'bookings' key
    assert 'bookings' in response.get_json()


def test_filter_invalid_field(as_user, test_user_admin):
    """
    Ensure that filtering with an unknown query parameter returns HTTP 200 without error.
    """
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?invalid_field=value')
    assert response.status_code == 200


def test_filter_no_results(as_user, test_user_admin):
    """
    Verify that filtering for non-existent data returns an empty list.
    """
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?buyer_name=NonExistentName')
    assert response.status_code == 200
    data = response.get_json()
    # Expect no bookings or projects in the response
    assert data == [] or data.get('bookings') == []


def test_filter_empty_query(as_user, test_user_admin):
    """
    Verify that calling the filter endpoint with no parameters returns HTTP 200.
    """
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter')
    assert response.status_code == 200


def test_filter_unauthorized_access(as_user, test_user_builder):
    """
    Confirm that users with 'builder' role are forbidden from using admin filters.
    """
    builder_client = as_user(test_user_builder)
    response = builder_client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 403


def test_filter_unauthenticated_access(client):
    """
    Verify that unauthenticated requests to admin filter are rejected.
    """
    response = client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code in [401, 403]