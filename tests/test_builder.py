def test_create_project_success(login_as_builder):
    response = login_as_builder.post('/builder/projects', json={
        'name': 'Test Project',
        'location': 'Dubai',
        'num_units': 10
    })
    assert response.status_code == 201
    assert response.get_json()['status'] == 'success'


def test_create_project_missing_fields(login_as_builder):
    # Missing name
    response = login_as_builder.post('/builder/projects', json={
        'location': 'Dubai',
        'num_units': 10
    })
    assert response.status_code in (400, 422)


def test_create_project_unauthenticated(client):
    # No login
    response = client.post('/builder/projects', json={
        'name': 'Test Project',
        'location': 'Dubai',
        'num_units': 10
    })
    assert response.status_code == 403


def test_list_projects_success(login_as_builder):
    # First create a project
    login_as_builder.post('/builder/projects', json={
        'name': 'Test Project',
        'location': 'Dubai',
        'num_units': 10
    })

    # Then fetch
    response = login_as_builder.get('/builder/projects')
    assert response.status_code == 200
    assert isinstance(response.get_json()['projects'], list)


def test_list_projects_unauthenticated(client):
    response = client.get('/builder/projects')
    assert response.status_code == 403


def test_dashboard_metrics_empty(login_as_builder):
    response = login_as_builder.get('/builder/dashboard')
    assert response.status_code == 200
    data = response.get_json()
    assert 'total_projects' in data
    assert data['total_projects'] == 0


def test_dashboard_metrics_with_data(login_as_builder):
    # Add project and unit
    project_res = login_as_builder.post('/builder/projects', json={
        'name': 'Metro Heights',
        'location': 'Dubai',
        'num_units': 5
    })
    project_id = project_res.get_json()['project_id']

    login_as_builder.post(f'/builder/projects/{project_id}/units', json={
        'unit_id': 'A101',
        'floor': 1,
        'area': 900,
        'price': 100000
    })

    dashboard_res = login_as_builder.get('/builder/dashboard')
    assert dashboard_res.status_code == 200
    metrics = dashboard_res.get_json()
    assert metrics['total_projects'] == 1
    assert metrics['total_units'] == 1


def test_create_unit_success(login_as_builder):
    # Create project
    proj_res = login_as_builder.post('/builder/projects', json={
        'name': 'Elite Towers',
        'location': 'Abu Dhabi',
        'num_units': 3
    })
    project_id = proj_res.get_json()['project_id']

    # Create unit
    unit_res = login_as_builder.post(f'/builder/projects/{project_id}/units', json={
        'unit_id': 'U102',
        'floor': 2,
        'area': 850,
        'price': 95000
    })
    assert unit_res.status_code == 200
    assert unit_res.get_json()['status'] == 'success'


def test_create_unit_unauthorized(client):
    response = client.post('/builder/projects/1/units', json={
        'unit_id': 'U999',
        'floor': 3,
        'area': 1000,
        'price': 120000
    })
    assert response.status_code == 403


def test_list_units_success(login_as_builder):
    # Create project and unit
    proj_res = login_as_builder.post('/builder/projects', json={
        'name': 'Lakeside Villas',
        'location': 'Sharjah',
        'num_units': 2
    })
    project_id = proj_res.get_json()['project_id']

    login_as_builder.post(f'/builder/projects/{project_id}/units', json={
        'unit_id': 'U001',
        'floor': 1,
        'area': 1000,
        'price': 75000
    })

    response = login_as_builder.get(f'/builder/projects/{project_id}/units')
    assert response.status_code == 200
    assert isinstance(response.get_json()['units'], list)


def test_list_units_unauthenticated(client):
    response = client.get('/builder/projects/1/units')
    assert response.status_code == 403
