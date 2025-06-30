def test_admin_can_filter_by_project_name(as_user, test_user_admin, test_user_builder):
    """
    Verify that an admin can filter projects by name.
    - A builder creates a project named 'Sunrise'.
    - An admin logs in and queries /admin/filter?project_name=Sunrise.
    - Expect HTTP 200 and returned project name matches.
    """
    # Builder logs in and creates a project
    builder_client = as_user(test_user_builder)
    builder_client.post(
        '/builder/projects',
        json={"name": "Sunrise", "location": "Dubai", "num_units": 1}
    )

    # Admin logs in and applies the project_name filter
    admin_client = as_user(test_user_admin)
    response = admin_client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 200

    data = response.get_json()
    # Ensure the returned project matches the filter term
    assert data['projects'][0]['name'] == 'Sunrise'


def test_admin_filter_with_invalid_field(as_user, test_user_admin):
    """
    Ensure filtering with an unknown parameter does not crash.
    - Admin queries /admin/filter without a valid field.
    - Accept either empty list of 'projects' or 'bookings'.
    """
    admin_client = as_user(test_user_admin)
    # Using an invalid query param 'foo'
    response = admin_client.get('/admin/filter?foo=bar')
    assert response.status_code == 200

    data = response.get_json()
    # Should return no results for any category
    assert data == [] or data.get('bookings') == [] or data.get('projects') == []


def test_admin_filter_unauthenticated_access(client):
    """
    Verify that unauthenticated requests to admin filter endpoints are forbidden.
    """
    # No login: directly access filter endpoint
    response = client.get('/admin/filter?project_name=Sunrise')
    # Expect either 401 Unauthorized or 403 Forbidden
    assert response.status_code in [401, 403]


def test_admin_filter_forbidden_for_builders(as_user, test_user_builder):
    """
    Confirm that users with 'builder' role cannot access admin filters.
    """
    # Builder logs in
    builder_client = as_user(test_user_builder)
    response = builder_client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 403