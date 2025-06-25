import sqlite3
from backend.db.db_connection import get_connection

# ---------- User ----------
def get_user_by_email(email):
    """Fetches a single user by email and returns their data as a dictionary."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row  # Set row_factory to get dict-like rows
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM User WHERE email = ?", (email,))
        row = cursor.fetchone()
        # Convert the Row object to a dictionary before returning, or return None if not found.
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def create_user(name, email, password_hash, role, created_at):
    """Inserts a new user and returns their ID."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO User VALUES (NULL,?,?,?,?,?)", (name, email, password_hash, role, created_at))
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

# ---------- Buyer ----------
def get_buyer_by_email(email):
    """Fetches a single buyer by email and returns their data as a dictionary."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Buyer WHERE email = ?", (email,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def get_buyer_by_emirates_id(emirates_id):
    """Fetches a single buyer by Emirates ID and returns their data as a dictionary."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Buyer WHERE emirates_id = ?", (emirates_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def create_buyer(name, emirates_id, phone_number, email, password_hash, created_at):
    """Inserts a new buyer and returns their ID."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO Buyer 
            VALUES (NULL, ?, ?, ?, ?, ?, ?)""",
            (name, emirates_id, phone_number, email, password_hash, created_at))
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

# ---------- Project ----------
def insert_project(builder_id, name, location, num_units, created_at):
    """Inserts a new project and returns its ID."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Project (builder_id, name, location, num_units, created_at) VALUES (?, ?, ?, ?, ?)",
            (builder_id, name, location, num_units, created_at)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_projects_by_builder(builder_id):
    """Fetches all projects for a builder and returns them as a list of dictionaries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Project WHERE builder_id = ?", (builder_id,))
        rows = cursor.fetchall()
        # Convert list of Row objects to a list of dictionaries.
        return [dict(row) for row in rows]
    except Exception:
        return [] # Return an empty list on error for consistency
    finally:
        cursor.close()
        conn.close()

# ---------- Unit ----------
def insert_unit(project_id, unit_id, floor, area, price, created_at):
    """Inserts a new unit and returns its ID."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Unit (project_id, unit_id, floor, area, price, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (project_id, unit_id, floor, area, price, created_at)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_units_by_project(project_id):
    """Fetches all units for a project and returns them as a list of dictionaries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Unit WHERE project_id = ?", (project_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# ---------- Booking ----------
def create_booking(unit_id, buyer_id, amount, date, created_at):
    """Creates a new booking and returns its ID."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO Booking (unit_id, buyer_id, amount, date, created_at)
            VALUES (?, ?, ?, ?, ?)""",
            (unit_id, buyer_id, amount, date, created_at))
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_booking_by_unit_id(unit_id):
    """Fetches a single booking by unit ID and returns it as a dictionary."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT Booking.*, Buyer.name AS buyer_name
            FROM Booking
            JOIN Buyer ON Booking.buyer_id = Buyer.id
            WHERE unit_id = ?""", (unit_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_bookings_by_buyer_id(buyer_id):
    """Fetches all bookings for a buyer and returns them as a list of dictionaries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT Booking.*, Unit.unit_id AS unit_number
            FROM Booking
            JOIN Unit ON Booking.unit_id = Unit.id
            WHERE buyer_id = ?""", (buyer_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

def fetch_all_bookings():
    """Fetches all bookings with joined data, returned as a list of dictionaries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT Booking.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number
            FROM Booking
            JOIN Buyer ON Booking.buyer_id = Buyer.id
            JOIN Unit ON Booking.unit_id = Unit.id
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# ---------- Transaction ----------
def create_transaction(amount, date, payment_method, created_at):
    """Creates a new transaction and returns its ID."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO Transaction_log (amount, date, payment_method, created_at)
            VALUES (?, ?, ?, ?)""",
            (amount, date, payment_method, created_at))
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_all_transactions():
    """Fetches all transactions with joined data, returned as a list of dictionaries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT Transaction_log.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number
            FROM Transaction_log
            LEFT JOIN Booking ON Transaction_log.booking_id = Booking.id
            LEFT JOIN Buyer ON Booking.buyer_id = Buyer.id
            LEFT JOIN Unit ON Booking.unit_id = Unit.id
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# Add this function to the end of queries.py
def fetch_transactions_by_builder(builder_id):
    """Fetches all transactions linked to a specific builder's projects."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        # This query finds transactions where the associated booking is for a unit
        # within a project owned by the specified builder.
        cursor.execute("""
            SELECT 
                t.*,
                b.id as booking_id_val,
                u.unit_id as unit_code,
                buy.name as buyer_name
            FROM Transaction_log t
            JOIN Booking b ON t.booking_id = b.id
            JOIN Unit u ON b.unit_id = u.id
            JOIN Project p ON u.project_id = p.id
            JOIN Buyer buy ON b.buyer_id = buy.id
            WHERE p.builder_id = ?
        """, (builder_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# ---------- Dashboard ----------
def fetch_dashboard_data(builder_id):
    """Fetches aggregated dashboard data for a builder, returned as a dictionary."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                (SELECT COUNT(*) FROM Project WHERE builder_id = ?) AS total_projects,
                (SELECT COUNT(*) FROM Unit u JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS total_units,
                (SELECT COUNT(*) FROM Booking b JOIN Unit u ON b.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS units_booked,
                (SELECT COALESCE(SUM(b.amount), 0) FROM Booking b JOIN Unit u ON b.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS total_booking_amount,
                (SELECT COUNT(*) FROM Transaction_log t LEFT JOIN Booking b ON t.booking_id = b.id JOIN Unit u ON b.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ? AND b.id IS NULL) AS unmatched_transactions
        """, (builder_id, builder_id, builder_id, builder_id, builder_id))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

# ---------- Admin ----------
def fetch_all_builders():
    """Fetches all builder users, returned as a list of dictionaries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, name, email FROM User WHERE role = 'builder'")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

def fetch_all_projects():
    """Fetches all projects from all builders, returned as a list of dictionaries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Project")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# ---------- Filter Search ----------
def fetch_bookings_by_buyer_or_unit(query):
    """Fetches bookings by buyer name or unit ID, returned as a list of dictionaries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        search_term = f"%{query}%"
        cursor.execute("""
            SELECT Booking.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number
            FROM Booking
            JOIN Buyer ON Booking.buyer_id = Buyer.id
            JOIN Unit ON Booking.unit_id = Unit.id
            WHERE Buyer.name LIKE ? OR Unit.unit_id LIKE ?
        """, (search_term, search_term))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

def get_unit_internal_id_by_unit_code(unit_code):
    """Gets the internal primary key for a unit based on its public-facing unit_id code."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM Unit WHERE unit_id = ?", (unit_code,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def match_transaction_to_booking(transaction_id, booking_id):
    """
    Updates a transaction record to link it to a booking.
    Returns the number of rows updated (1 if successful, 0 if not found).
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Transaction_log SET booking_id = ? WHERE id = ?",
            (booking_id, transaction_id)
        )
        conn.commit()
        # Return the number of rows affected by the update.
        return cursor.rowcount
    except Exception:
        # On error, rollback any changes and return 0.
        conn.rollback()
        return 0
    finally:
        cursor.close()
        conn.close()