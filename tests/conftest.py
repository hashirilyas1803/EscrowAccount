"""
Pytest fixtures for the escrow demo application.

Provides:
- `client`: fresh Flask test client with database reset before each test.
- Credential fixtures (`test_user_builder`, `test_user_admin`, `test_user_buyer`) to create users.
- Manager fixtures (`as_user`, `as_buyer`) to simplify login/logout flows in tests.
"""
import pytest
from backend.server import app
from backend.db.db_connection import get_connection
import sqlite3  # Used to set row_factory for dict-like access if needed

# -----------------------------------------------------------------------------
# 1. CORE FIXTURES
# -----------------------------------------------------------------------------

@pytest.fixture
def client():
    """
    Provides a Flask test client and resets the database schema and data.
    - Enables TESTING mode and disables CSRF for form submissions.
    - Loads the schema SQL to recreate tables.
    - Clears all tables to ensure a clean state per test.
    """
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False

    with app.test_client() as client:
        with app.app_context():
            conn = get_connection()
            cursor = conn.cursor()

            # Step 1: Re-create tables using the schema file
            with open('backend/db/schema.sql', 'r') as f:
                cursor.executescript(f.read())

            # Step 2: Clear existing data from all tables
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
# -----------------------------------------------------------------------------

@pytest.fixture
def test_user_builder(client):
    """
    Registers a builder user and returns their login credentials.
    """
    credentials = {
        'name': 'Builder Test',
        'email': 'builder@test.com',
        'password': 'builderpass',
        'role': 'builder'
    }
    client.post('/auth/register', json=credentials)
    return {'email': credentials['email'], 'password': credentials['password']}

@pytest.fixture
def test_user_admin(client):
    """
    Registers an admin user and returns their login credentials.
    """
    credentials = {
        'name': 'Admin Test',
        'email': 'admin@test.com',
        'password': 'adminpass',
        'role': 'admin'
    }
    client.post('/auth/register', json=credentials)
    return {'email': credentials['email'], 'password': credentials['password']}

@pytest.fixture
def test_user_buyer(client):
    """
    Registers a buyer user and returns their login credentials.
    """
    credentials = {
        'name': 'Buyer Test',
        'emirates_id': '784199001010001',
        'phone_number': '0501234567',
        'email': 'buyer@test.com',
        'password': 'buyerpass'
    }
    client.post('/buyer/auth/register', json=credentials)
    return {'email': credentials['email'], 'password': credentials['password']}


# -----------------------------------------------------------------------------
# 3. MANAGER FIXTURES
# -----------------------------------------------------------------------------

@pytest.fixture
def as_user(client):
    """
    Helper fixture to log in as a builder or admin and yield the authenticated client.
    Automatically logs out after test completes.
    """
    def _as_user(user_credentials):
        response = client.post('/auth/login', json=user_credentials)
        assert response.status_code == 200, (
            f"Login failed for user: {user_credentials['email']}"
        )
        return client
    yield _as_user
    # Ensure session is cleared after using this fixture
    client.post('/auth/logout')

@pytest.fixture
def as_buyer(client):
    """
    Helper fixture to log in as a buyer and yield the authenticated client.
    Automatically logs out after test completes.
    """
    def _as_buyer(buyer_credentials):
        response = client.post('/buyer/auth/login', json=buyer_credentials)
        assert response.status_code == 200, (
            f"Login failed for buyer: {buyer_credentials['email']}"
        )
        return client
    yield _as_buyer
    # Ensure buyer session is cleared after using this fixture
    client.post('/buyer/auth/logout')