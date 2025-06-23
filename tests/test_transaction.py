def test_transaction_creation(client):
    response = client.post('/transactions', json={
        'amount': 100000,
        'payment_method': 'cash',
        'booking_id': 1,
        'date': '2025-06-22'
    })
    assert response.status_code == 200


def test_transaction_for_already_paid_booking(client):
    response = client.post('/transactions', json={
        'amount': 100000,
        'payment_method': 'bank transfer',
        'booking_id': 1,
        'date': '2025-06-22'
    })
    assert response.status_code == 400