# conftest.py
import pytest
from backend.server import app
from backend.db.db_connection import get_connection
import sqlite3 # Import for row_factory

# -----------------------------------------------------------------------------
# 1. CORE FIXTURES
# -----------------------------------------------------------------------------

@pytest.fixture
def client():
    """Provides a test client for the Flask app and resets the database."""
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False

    with app.test_client() as client:
        with app.app_context():
            conn = get_connection()
            cursor = conn.cursor()

            # --- Step 1: Ensure tables exist using the schema ---
            with open('backend/db/schema.sql', 'r') as f:
                cursor.executescript(f.read())

            # --- Step 2: Clear all data from all tables before each test ---
            cursor.executescript("""
                DELETE FROM Transaction_log;
                DELETE FROM Booking;
                DELETE FROM Unit;
                DELETE FROM Project;
                DELETE FROM Buyer;
                DELETE FROM User;
            """)
            conn.commit()
            cursor.close()
            conn.close()

        yield client


# -----------------------------------------------------------------------------
# 2. CREDENTIAL FIXTURES
#    Scope is 'function' (default) to match the client fixture.
# -----------------------------------------------------------------------------

@pytest.fixture
def test_user_builder(client):
    """Creates a builder user for a single test."""
    credentials = {
        'name': 'Builder Test', 'email': 'builder@test.com', 'password': 'builderpass', 'role': 'builder'
    }
    client.post('/auth/register', json=credentials)
    return {'email': credentials['email'], 'password': credentials['password']}

@pytest.fixture
def test_user_admin(client):
    """Creates an admin user for a single test."""
    credentials = {
        'name': 'Admin Test', 'email': 'admin@test.com', 'password': 'adminpass', 'role': 'admin'
    }
    client.post('/auth/register', json=credentials)
    return {'email': credentials['email'], 'password': credentials['password']}

@pytest.fixture
def test_user_buyer(client):
    """Creates a buyer for a single test."""
    credentials = {
        'name': 'Buyer Test', 'emirates_id': '784199001010001', 'phone_number': '0501234567',
        'email': 'buyer@test.com', 'password': 'buyerpass'
    }
    client.post('/buyer/auth/register', json=credentials)
    return {'email': credentials['email'], 'password': credentials['password']}


# -----------------------------------------------------------------------------
# 3. MANAGER FIXTURES
# -----------------------------------------------------------------------------

@pytest.fixture
def as_user(client):
    """Manager fixture for logging in as a User (Builder or Admin)."""
    def _as_user(user_credentials):
        response = client.post('/auth/login', json=user_credentials)
        assert response.status_code == 200, f"Login failed for user: {user_credentials['email']}"
        return client
    yield _as_user
    client.post('/auth/logout')

@pytest.fixture
def as_buyer(client):
    """Manager fixture for logging in as a Buyer."""
    def _as_buyer(buyer_credentials):
        response = client.post('/buyer/auth/login', json=buyer_credentials)
        assert response.status_code == 200, f"Login failed for buyer: {buyer_credentials['email']}"
        return client
    yield _as_buyer
    client.post('/buyer/auth/logout')