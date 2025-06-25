# test_transaction.py

import pytest

def test_admin_cannot_create_transaction(as_user, as_buyer, test_user_admin, test_user_builder, test_user_buyer):
    # This test assumes an endpoint /admin/transactions for creating transactions
    # and that only specific roles (e.g., not admin) can use it.

    # Step 1: Builder creates project/unit
    builder_client = as_user(test_user_builder)
    project_res = builder_client.post("/builder/projects", json={
        "name": "Skyline View", "location": "Abu Dhabi", "num_units": 1
    })
    project_id = project_res.get_json()["project_id"]
    builder_client.post(f"/builder/projects/{project_id}/units", json={
        "unit_id": "SV101", "floor": 2, "area": 1000, "price": 150000
    })

    # Step 2: Buyer makes a booking
    buyer_client = as_buyer(test_user_buyer)
    booking_res = buyer_client.post("/buyer/bookings", json={
        "unit_id": "SV101", "booking_amount": 150000, "payment_method": "cash", "booking_date": "2025-06-24"
    })
    booking_id = booking_res.get_json().get("booking_id")

    # Step 3: Admin attempts to create a transaction, which should be forbidden
    admin_client = as_user(test_user_admin)
    tx_res = admin_client.post("/admin/transactions", json={
        "amount": 150000, "payment_method": "cash", "booking_id": booking_id, "date": "2025-06-24"
    })
    # Expect Forbidden or Method Not Allowed if the endpoint doesn't exist for POST
    assert tx_res.status_code in [403, 405]


def test_builder_can_match_unmatched_transaction(as_user, as_buyer, test_user_builder, test_user_buyer):
    # Step 1: Builder creates project/unit
    builder_client = as_user(test_user_builder)
    proj = builder_client.post("/builder/projects", json={
        "name": "Sunrise Heights", "location": "Dubai", "num_units": 1
    })
    project_id = proj.get_json()["project_id"]
    builder_client.post(f"/builder/projects/{project_id}/units", json={
        "unit_id": "U123", "floor": 1, "area": 850, "price": 100000
    })

    # Step 2: Buyer makes a booking
    buyer_client = as_buyer(test_user_buyer)
    booking_res = buyer_client.post("/buyer/bookings", json={
        "unit_id": "U123", "booking_amount": 100000, "payment_method": "cash", "booking_date": "2025-06-23"
    })
    booking_id = booking_res.get_json()["booking_id"]

    # Step 3: Simulate creation of an unmatched transaction
    unmatched_tx_res = buyer_client.post("/buyer/transactions", json={
        "amount": 100000, "payment_method": "cash", "date": "2025-06-23"
    })
    assert unmatched_tx_res.status_code == 201
    transaction_id = unmatched_tx_res.get_json()["transaction_id"]

    # Step 4: Builder logs in and matches the transaction
    match_res = builder_client.post("/builder/transactions/match", json={
        "transaction_id": transaction_id,
        "booking_id": booking_id
    })
    assert match_res.status_code == 200
    assert match_res.get_json()["status"] == "success"


def test_transaction_requires_login(client):
    response = client.post('/buyer/transactions', json={
        'amount': 100000, 'payment_method': 'bank transfer', 'booking_id': 1, 'date': '2025-06-23'
    })
    assert response.status_code in [401, 403]


def test_builder_cannot_directly_create_transaction(as_user, test_user_builder):
    builder_client = as_user(test_user_builder)
    response = builder_client.post('/admin/transactions', json={
        'amount': 100000, 'payment_method': 'bank transfer', 'booking_id': 1, 'date': '2025-06-23'
    })
    assert response.status_code in [403, 405]

def test_list_builder_transactions_success(as_user, as_buyer, test_user_builder, test_user_buyer):
    """
    Tests if a builder can successfully fetch a list of transactions
    that are matched to bookings within their projects.
    """
    # ARRANGE: Set up the entire data chain: Project -> Unit -> Booking -> Transaction -> Match
    # 1. Builder creates the project and unit
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post('/builder/projects', json={
        "name": "Transaction Test Project", "location": "Dubai", "num_units": 1
    })
    assert proj_res.status_code == 201
    project_id = proj_res.get_json()["project_id"]

    builder_client.post(f'/builder/projects/{project_id}/units', json={
        "unit_id": "TX101", "floor": 1, "area": 1000, "price": 200000
    })

    # 2. Buyer logs in, books the unit, and creates a transaction
    buyer_client = as_buyer(test_user_buyer)
    booking_res = buyer_client.post('/buyer/bookings', json={
        "unit_id": "TX101", "booking_amount": 20000, "payment_method": "cash", "booking_date": "2025-07-01"
    })
    assert booking_res.status_code == 201
    booking_id = booking_res.get_json()["booking_id"]

    tx_res = buyer_client.post('/buyer/transactions', json={
        "amount": 20000, "payment_method": "cash", "date": "2025-07-01"
    })
    assert tx_res.status_code == 201
    transaction_id = tx_res.get_json()["transaction_id"]

    # 3. Builder matches the transaction to the booking
    match_res = builder_client.post('/builder/transactions/match', json={
        "transaction_id": transaction_id, "booking_id": booking_id
    })
    assert match_res.status_code == 200

    # ACT: Builder requests their list of transactions
    response = builder_client.get('/builder/transactions')

    # ASSERT: The response is successful and contains the correct data
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'transactions' in data
    assert isinstance(data['transactions'], list)
    assert len(data['transactions']) == 1

    # Verify the content of the transaction
    transaction_data = data['transactions'][0]
    assert transaction_data['amount'] == 20000
    assert transaction_data['unit_code'] == 'TX101'
    # The buyer name comes from the test_user_buyer fixture
    assert transaction_data['buyer_name'] == 'Buyer Test'


def test_list_builder_transactions_no_results(as_user, test_user_builder):
    """
    Tests that a builder with no matched transactions receives an empty list.
    """
    # ARRANGE: Log in as a builder who has no data
    builder_client = as_user(test_user_builder)

    # ACT: Request the list of transactions
    response = builder_client.get('/builder/transactions')

    # ASSERT: The response is successful and the transactions list is empty
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert data['transactions'] == []


def test_list_builder_transactions_forbidden_for_admin(as_user, test_user_admin):
    """
    Tests that an admin cannot access the builder-specific transaction endpoint.
    """
    # ARRANGE: Log in as an admin
    admin_client = as_user(test_user_admin)

    # ACT: Attempt to access the endpoint
    response = admin_client.get('/builder/transactions')

    # ASSERT: Access is forbidden
    assert response.status_code == 403