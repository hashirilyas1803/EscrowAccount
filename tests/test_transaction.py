def test_admin_cannot_create_transaction(as_user, as_buyer, test_user_admin, test_user_builder, test_user_buyer):
    """
    Ensure that an admin user is forbidden from creating transactions via the admin endpoint.
    """
    # Step 1: Builder sets up project and unit
    builder_client = as_user(test_user_builder)
    project_res = builder_client.post(
        "/builder/projects", json={
            "name": "Skyline View", "location": "Abu Dhabi", "num_units": 1
        }
    )
    project_id = project_res.get_json()["project_id"]
    builder_client.post(
        f"/builder/projects/{project_id}/units", json={
            "unit_id": "SV101", "floor": 2, "area": 1000, "price": 150000
        }
    )

    # Step 2: Buyer makes a booking
    buyer_client = as_buyer(test_user_buyer)
    booking_res = buyer_client.post(
        "/buyer/bookings", json={
            "unit_id": "SV101", "booking_amount": 150000,
            "payment_method": "cash", "booking_date": "2025-06-24"
        }
    )
    booking_id = booking_res.get_json().get("booking_id")

    # Step 3: Admin attempts to create a transaction (should be forbidden)
    admin_client = as_user(test_user_admin)
    tx_res = admin_client.post(
        "/admin/transactions", json={
            "amount": 150000,
            "payment_method": "cash",
            "booking_id": booking_id,
            "date": "2025-06-24"
        }
    )
    # Expect 403 Forbidden or 405 Method Not Allowed
    assert tx_res.status_code in [403, 405]


def test_builder_can_match_unmatched_transaction(as_user, as_buyer, test_user_builder, test_user_buyer):
    """
    Verify builder transaction-matching flow:
    1. Builder creates project and unit.
    2. Buyer books unit and makes a payment.
    3. Builder matches the transaction to the booking.
    """
    # Step 1: Builder creates project and unit
    builder_client = as_user(test_user_builder)
    proj = builder_client.post(
        "/builder/projects", json={
            "name": "Sunrise Heights", "location": "Dubai", "num_units": 1
        }
    )
    project_id = proj.get_json()["project_id"]
    builder_client.post(
        f"/builder/projects/{project_id}/units", json={
            "unit_id": "U123", "floor": 1, "area": 850, "price": 100000
        }
    )

    # Step 2: Buyer books and pays
    buyer_client = as_buyer(test_user_buyer)
    booking_res = buyer_client.post(
        "/buyer/bookings", json={
            "unit_id": "U123", "booking_amount": 100000,
            "payment_method": "cash", "booking_date": "2025-06-23"
        }
    )
    booking_id = booking_res.get_json()["booking_id"]

    # Simulate unmatched transaction creation
    unmatched_tx_res = buyer_client.post(
        "/buyer/transactions", json={
            "amount": 100000, "payment_method": "cash",
            "date": "2025-06-23", "unit_id": "U123"
        }
    )
    assert unmatched_tx_res.status_code == 201
    transaction_id = unmatched_tx_res.get_json()["transaction_id"]

    # Step 3: Builder matches the transaction
    match_res = builder_client.post(
        "/builder/transactions/match", json={
            "transaction_id": transaction_id,
            "booking_id": booking_id
        }
    )
    assert match_res.status_code == 200
    assert match_res.get_json()["status"] == "success"


def test_transaction_requires_login(client):
    """
    Verify that creating a transaction requires authentication.
    """
    response = client.post(
        '/buyer/transactions', json={
            'amount': 100000,
            'payment_method': 'bank transfer',
            'booking_id': 1,
            'date': '2025-06-23'
        }
    )
    # Expect 401 Unauthorized or 403 Forbidden
    assert response.status_code in [401, 403]


def test_builder_cannot_directly_create_transaction(as_user, test_user_builder):
    """
    Ensure that builder cannot directly create transactions via admin endpoint.
    """
    builder_client = as_user(test_user_builder)
    response = builder_client.post(
        '/admin/transactions', json={
            'amount': 100000,
            'payment_method': 'bank transfer',
            'booking_id': 1,
            'date': '2025-06-23'
        }
    )
    assert response.status_code in [403, 405]


def test_list_builder_transactions_success(as_user, as_buyer, test_user_builder, test_user_buyer):
    """
    Test that a builder can retrieve a list of matched transactions.
    """
    # ARRANGE: Full flow to create and match a transaction
    builder_client = as_user(test_user_builder)
    proj_res = builder_client.post(
        '/builder/projects', json={
            "name": "Transaction Test Project", "location": "Dubai", "num_units": 1
        }
    )
    assert proj_res.status_code == 201
    project_id = proj_res.get_json()["project_id"]

    # Add a unit
    builder_client.post(
        f'/builder/projects/{project_id}/units', json={
            "unit_id": "TX101", "floor": 1, "area": 1000, "price": 200000
        }
    )

    # Buyer books and pays
    buyer_client = as_buyer(test_user_buyer)
    booking_res = buyer_client.post(
        '/buyer/bookings', json={
            "unit_id": "TX101", "booking_amount": 20000,
            "payment_method": "cash", "booking_date": "2025-07-01"
        }
    )
    assert booking_res.status_code == 201
    booking_id = booking_res.get_json()["booking_id"]

    tx_res = buyer_client.post(
        '/buyer/transactions', json={
            "amount": 20000, "payment_method": "cash",
            "date": "2025-07-01", "unit_id":"TX101"
        }
    )
    assert tx_res.status_code == 201
    transaction_id = tx_res.get_json()["transaction_id"]

    # Match the transaction
    match_res = builder_client.post(
        '/builder/transactions/match', json={
            "transaction_id": transaction_id,
            "booking_id": booking_id
        }
    )
    assert match_res.status_code == 200

    # ACT: Builder lists their transactions
    response = builder_client.get('/builder/transactions')

    # ASSERT: Response success and correct transaction data
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert isinstance(data['transactions'], list)
    assert len(data['transactions']) == 1

    tx_data = data['transactions'][0]
    assert tx_data['amount'] == 20000
    assert tx_data['unit_code'] == 'TX101'


def test_list_builder_transactions_no_results(as_user, test_user_builder):
    """
    Ensure that a builder with no matched transactions receives an empty list.
    """
    # ARRANGE: Log in as builder without any transactions
    builder_client = as_user(test_user_builder)

    # ACT: Request transaction list
    response = builder_client.get('/builder/transactions')

    # ASSERT: Success response with empty list
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert data['transactions'] == []


def test_list_builder_transactions_forbidden_for_admin(as_user, test_user_admin):
    """
    Verify that admin users cannot access builder-specific transaction listing.
    """
    # ARRANGE: Log in as admin
    admin_client = as_user(test_user_admin)

    # ACT: Attempt to fetch builder transactions
    response = admin_client.get('/builder/transactions')

    # ASSERT: Access is forbidden
    assert response.status_code == 403