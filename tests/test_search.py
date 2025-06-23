def test_filter_by_project_name(client, login_as_admin):
    response = client.get('/admin/filter?project_name=Sunrise')
    assert response.status_code == 200


def test_filter_by_buyer_name(client, login_as_admin):
    response = client.get('/admin/filter?buyer_name=Ali')
    assert response.status_code == 200


def test_filter_by_unit_id(client, login_as_admin):
    response = client.get('/admin/filter?unit_id=APT101')
    assert response.status_code == 200