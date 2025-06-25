def test_admin_can_filter_by_project_name(as_user, test_user_admin, test_user_builder):
    # Step 1: Builder creates a project to be found
    builder_client = as_user(test_user_builder)
    builder_client.post('/builder/projects', json={
        "name": "Sunrise", "location": "Dubai", "num_units": 1
    })

    # Step 2: Admin logs in and performs the filter
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 200
    data = response.get_json()
    assert data['projects'][0]['name'] == 'Sunrise'


def test_admin_filter_with_invalid_field(as_user, test_user_admin):
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?invalid_field=value')
    assert response.status_code == 200  # Should handle gracefully


def test_admin_filter_no_results(as_user, test_user_admin):
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?buyer_name=ThisNameDoesNotExist')
    assert response.status_code == 200
    data = response.get_json()
    assert data == [] or data.get('bookings') == [] or data.get('projects') == []


def test_admin_filter_unauthenticated_access(client):
    # No login performed
    response = client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code in [401, 403]


def test_admin_filter_forbidden_for_builders(as_user, test_user_builder):
    # Log in as builder
    builder_client = as_user(test_user_builder)
    response = builder_client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 403