# test_builder.py

def test_create_project_success(as_user, test_user_builder):
    client = as_user(test_user_builder)
    response = client.post('/builder/projects', json={
        'name': 'Test Project', 'location': 'Dubai', 'num_units': 10
    })
    assert response.status_code == 201
    assert response.get_json()['status'] == 'success'


def test_create_project_missing_fields(as_user, test_user_builder):
    client = as_user(test_user_builder)
    response = client.post('/builder/projects', json={
        'location': 'Dubai', 'num_units': 10  # Missing 'name'
    })
    assert response.status_code == 400


def test_create_project_unauthenticated(client):
    response = client.post('/builder/projects', json={
        'name': 'Test Project', 'location': 'Dubai', 'num_units': 10
    })
    assert response.status_code in [401, 403]


def test_list_projects_success(as_user, test_user_builder):
    client = as_user(test_user_builder)
    # First, create a project
    client.post('/builder/projects', json={
        'name': 'Test Project', 'location': 'Dubai', 'num_units': 10
    })

    # Then, fetch the list
    response = client.get('/builder/projects')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data.get('projects'), list)
    assert len(data['projects']) == 1
    assert data['projects'][0]['name'] == 'Test Project'


def test_list_projects_unauthenticated(client):
    response = client.get('/builder/projects')
    assert response.status_code in [401, 403]


def test_dashboard_metrics_empty(as_user, test_user_builder):
    client = as_user(test_user_builder)
    response = client.get('/builder/dashboard')
    assert response.status_code == 200
    data = response.get_json()
    assert 'total_projects' in data
    assert data['total_projects'] == 0


def test_dashboard_metrics_with_data(as_user, test_user_builder):
    client = as_user(test_user_builder)
    project_res = client.post('/builder/projects', json={
        'name': 'Metro Heights', 'location': 'Dubai', 'num_units': 5
    })
    project_id = project_res.get_json()['project_id']
    client.post(f'/builder/projects/{project_id}/units', json={
        'unit_id': 'A101', 'floor': 1, 'area': 900, 'price': 100000
    })

    dashboard_res = client.get('/builder/dashboard')
    assert dashboard_res.status_code == 200
    metrics = dashboard_res.get_json()
    assert metrics['total_projects'] == 1
    assert metrics['total_units'] == 1


def test_create_unit_success(as_user, test_user_builder):
    client = as_user(test_user_builder)
    proj_res = client.post('/builder/projects', json={
        'name': 'Elite Towers', 'location': 'Abu Dhabi', 'num_units': 3
    })
    project_id = proj_res.get_json()['project_id']

    unit_res = client.post(f'/builder/projects/{project_id}/units', json={
        'unit_id': 'U102', 'floor': 2, 'area': 850, 'price': 95000
    })
    assert unit_res.status_code == 201
    assert unit_res.get_json()['status'] == 'success'


def test_create_unit_unauthorized(client):
    response = client.post('/builder/projects/1/units', json={
        'unit_id': 'U999', 'floor': 3, 'area': 1000, 'price': 120000
    })
    assert response.status_code in [401, 403]


def test_list_units_success(as_user, test_user_builder):
    client = as_user(test_user_builder)
    proj_res = client.post('/builder/projects', json={
        'name': 'Lakeside Villas', 'location': 'Sharjah', 'num_units': 2
    })
    project_id = proj_res.get_json()['project_id']
    client.post(f'/builder/projects/{project_id}/units', json={
        'unit_id': 'U001', 'floor': 1, 'area': 1000, 'price': 75000
    })

    response = client.get(f'/builder/projects/{project_id}/units')
    assert response.status_code == 200
    assert isinstance(response.get_json().get('units'), list)


def test_list_units_unauthenticated(client):
    response = client.get('/builder/projects/1/units')
    assert response.status_code in [401, 403]