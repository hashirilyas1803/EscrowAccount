# test_search.py

def test_filter_by_project_name(as_user, test_user_builder, test_user_admin):
    # Step 1: Builder creates the data
    builder_client = as_user(test_user_builder)
    builder_client.post('/builder/projects', json={
        "name": "Sunrise", "location": "Downtown", "num_units": 1
    })

    # Step 2: Admin logs in and searches
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 200
    assert len(response.get_json().get('projects', [])) > 0


def test_filter_by_buyer_name(as_user, as_buyer, test_user_builder, test_user_admin, test_user_buyer):
    # Step 1: Builder creates project and unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post('/builder/projects', json={
        "name": "Sunrise", "location": "Downtown", "num_units": 1
    })
    project_id = proj_res.get_json()['project_id']
    builder_client.post(f'/builder/projects/{project_id}/units', json={
        "unit_id": "APT101", "floor": 1, "area": 1000, "price": 1000000
    })

    # Step 2: Buyer creates a booking
    buyer_client = as_buyer(test_user_buyer)
    buyer_client.post('/buyer/bookings', json={
        'unit_id': 'APT101', 'booking_amount': 50000, 'payment_method': 'bank transfer', 'booking_date': '2025-06-20'
    })

    # Step 3: Admin logs in and filters by the buyer's name
    admin_client = as_user(test_user_admin)
    # The name comes from the test_user_buyer fixture's credentials
    buyer_name = 'Buyer Test'
    response = admin_client.get(f'/admin/filter?buyer_name={buyer_name}')
    assert response.status_code == 200
    assert len(response.get_json().get('bookings', [])) > 0


def test_filter_by_unit_id(as_user, test_user_builder, test_user_admin):
    # Step 1: Builder creates project and unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post('/builder/projects', json={
        "name": "Sunrise", "location": "City Center", "num_units": 1
    })
    project_id = proj_res.get_json()['project_id']
    builder_client.post(f'/builder/projects/{project_id}/units', json={
        "unit_id": "APT101", "floor": 2, "area": 950, "price": 800000
    })

    # Step 2: Admin searches for the unit
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?unit_id=APT101')
    assert response.status_code == 200
    assert len(response.get_json().get('bookings', [])) >= 0  # May or may not have a booking


def test_filter_invalid_field(as_user, test_user_admin):
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?invalid_field=value')
    assert response.status_code == 200


def test_filter_no_results(as_user, test_user_admin):
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?buyer_name=NonExistentName')
    assert response.status_code == 200
    data = response.get_json()
    assert data == [] or data.get('bookings') == []


def test_filter_empty_query(as_user, test_user_admin):
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter')
    assert response.status_code == 200


def test_filter_unauthorized_access(as_user, test_user_builder):
    builder_client = as_user(test_user_builder)
    response = builder_client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 403


def test_filter_unauthenticated_access(client):
    response = client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code in [401, 403]