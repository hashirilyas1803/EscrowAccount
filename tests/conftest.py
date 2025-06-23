# conftest.py
import pytest
from backend.server import app

@pytest.fixture
def client():
    app.config['TESTING'] = True

    with app.test_client() as client:
        with app.app_context():
            # Drop & re-create tables or truncate them
            from backend.db.db_connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            cursor.executescript("""
                DELETE FROM User;
                DELETE FROM Buyer;
                DELETE FROM Project;
                DELETE FROM Unit;
                DELETE FROM Booking;
                DELETE FROM Transaction;
            """)
            conn.commit()
            cursor.close()
            conn.close()

        yield client

@pytest.fixture
def login_as_builder(client):
    client.post('/auth/register', json={
        'name': 'Builder Test',
        'email': 'builder@test.com',
        'password': 'builderpass',
        'role': 'builder'
    })
    client.post('/auth/login', json={
        'email': 'builder@test.com',
        'password': 'builderpass'
    })
    return client

@pytest.fixture
def login_as_admin(client):
    client.post('/auth/register', json={
        'name': 'Admin Test',
        'email': 'admin@test.com',
        'password': 'adminpass',
        'role': 'admin'
    })
    client.post('/auth/login', json={
        'email': 'admin@test.com',
        'password': 'adminpass'
    })
    return client
