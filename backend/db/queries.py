import sqlite3
from backend.db.db_connection import get_connection

# --- Data access layer: raw SQL queries for Users, Buyers, Projects, Units, Bookings, Transactions, and Dashboard ---
# Each function opens a new DB connection, executes its query, handles errors, and closes the connection.

# ---------- User ----------

def get_user_by_email(email):
    """
    Fetch a single user record by email.
    Returns a dict of user columns or None if not found/error.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM User WHERE email = ?", (email,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        # On any DB error, return None
        return None
    finally:
        cursor.close()
        conn.close()


def create_user(name, email, password_hash, role, created_at):
    """
    Insert a new user into the User table.
    Returns the new user ID or None on failure.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO User VALUES (NULL,?,?,?,?,?)",
            (name, email, password_hash, role, created_at)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        # Rollback on error and signal failure
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()

# ---------- Buyer ----------

def get_buyer_by_email(email):
    """
    Fetch a single buyer record by email.
    Returns a dict of buyer columns or None if not found/error.
    """
    conn = get_connection()
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
    """
    Fetch a single buyer record by Emirates ID.
    Returns dict or None.
    """
    conn = get_connection()
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
    """
    Insert a new buyer into the Buyer table.
    Returns new buyer ID or None on failure.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO Buyer 
            VALUES (NULL, ?, ?, ?, ?, ?, ?)""",
            (name, emirates_id, phone_number, email, password_hash, created_at)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()

# ---------- Project ----------

def insert_project(builder_id, name, location, num_units, created_at):
    """
    Insert a new project record for a builder.
    Returns new project ID or None on failure.
    """
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
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()


def fetch_projects_by_builder(builder_id):
    """
    Retrieve all projects associated with a builder.
    Returns list of dicts (projects) or empty list on error.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Project WHERE builder_id = ?", (builder_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# ---------- Unit ----------

def insert_unit(project_id, unit_id, floor, area, price, created_at):
    """
    Insert a new unit under a project.
    Returns new unit row ID or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Unit (project_id, unit_id, floor, area, price, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (project_id, unit_id, floor, area, price, created_at)
        )
        id = cursor.lastrowid
        cursor.execute("UPDATE Project SET num_units = num_units + 1 WHERE id = ?", (project_id, ))
        conn.commit()
        return id
    except Exception:
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()


def fetch_units_by_project(project_id):
    """
    Retrieve all units for a given project, including builder name.
    Returns list of dicts or empty list.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT u.*, b.name AS builder_name"
            " FROM Unit u"
            " JOIN Project p ON u.project_id = p.id"
            " LEFT JOIN User b ON b.id = p.builder_id"
            " WHERE u.project_id = ?",
            (project_id,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# ---------- Booking ----------

def create_booking(unit_id, buyer_id, amount, date, created_at):
    """
    Create a new booking and mark the unit as booked.
    Returns booking ID or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Insert booking record
        cursor.execute(
            "INSERT INTO Booking (unit_id, buyer_id, amount, date, created_at)"
            " VALUES (?, ?, ?, ?, ?)",
            (unit_id, buyer_id, amount, date, created_at)
        )
        booking_id = cursor.lastrowid
        # Mark unit as booked
        cursor.execute("UPDATE Unit SET booked = 1 WHERE id = ?", (unit_id,))
        conn.commit()
        return booking_id
    except Exception:
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()


def fetch_booking_by_unit_id(unit_id):
    """
    Retrieve a single booking by unit internal ID.
    Returns dict or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT Booking.*, Buyer.name AS buyer_name"
            " FROM Booking"
            " JOIN Buyer ON Booking.buyer_id = Buyer.id"
            " WHERE unit_id = ?", (unit_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()


def fetch_bookings_by_buyer_id(buyer_id):
    """
    Retrieve all bookings associated with a buyer.
    Returns list of dicts or empty list.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT Booking.*, Unit.unit_id AS unit_number"
            " FROM Booking"
            " JOIN Unit ON Booking.unit_id = Unit.id"
            " WHERE buyer_id = ?", (buyer_id,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()


def fetch_all_bookings():
    """
    Retrieve all bookings with buyer and unit info.
    Returns list of dicts or empty list.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT Booking.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number, Project.name AS project_name"
            " FROM Booking"
            " JOIN Buyer ON Booking.buyer_id = Buyer.id"
            " JOIN Unit ON Booking.unit_id = Unit.id"
            " JOIN Project ON Project.id = Unit.project_id"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# ---------- Transaction ----------

def create_transaction(amount, date, payment_method, created_at, buyer_id, unit_id):
    """
    Create a new transaction record linked to a unit.
    Returns transaction ID or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Transaction_log (amount, date, payment_method, created_at, buyer_id, unit_id)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (amount, date, payment_method, created_at, buyer_id, unit_id)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()


def fetch_all_transactions():
    """
    Retrieve all transactions with optional booking, buyer, and unit info.
    Returns list of dicts or empty list.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT Transaction_log.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number, Project.name AS project_name"
            " FROM Transaction_log"
            " LEFT JOIN Booking ON Transaction_log.booking_id = Booking.id"
            " LEFT JOIN Buyer ON Transaction_log.buyer_id = Buyer.id"
            " LEFT JOIN Unit ON Booking.unit_id = Unit.id"
            " LEFT JOIN Project ON Unit.project_id = Project.id"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()


def fetch_transactions_by_builder(builder_id):
    """
    Fetch all transactions (matched and unmatched) for a builder's units.
    Frontend can filter unmatched by booking_id IS NULL.
    Returns list of dicts.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT t.id AS id, t.amount, t.booking_id,"
            " u.id AS unit_id, u.unit_id AS unit_code"
            " FROM Transaction_log AS t"
            " JOIN Unit AS u ON t.unit_id = u.id"
            " JOIN Project AS p ON u.project_id = p.id"
            " WHERE p.builder_id = ?",
            (builder_id,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()


def fetch_transactions():
    """
    Fetch all transactions for a buyer's bookings.
    Returns list of dicts.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT t.id AS id, t.amount, t.booking_id,"
            " u.id AS unit_id"
            " FROM Transaction_log AS t"
            " LEFT JOIN Unit AS u ON t.unit_id = u.id"
            " LEFT JOIN Booking AS b ON u.id = b.unit_id"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()

# ---------- Dashboard ----------

def fetch_dashboard_data(builder_id):
    """
    Aggregate key metrics for a builder's dashboard:
      total_projects, total_units, units_booked,
      total_booking_amount, unmatched_transactions.
    Returns dict or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT
              (SELECT COUNT(*) FROM Project WHERE builder_id = ?) AS total_projects,
              (SELECT COUNT(*) FROM Unit u JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS total_units,
              (SELECT COUNT(*) FROM Booking b JOIN Unit u ON b.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS units_booked,
              (SELECT COALESCE(SUM(b.amount), 0) FROM Booking b JOIN Unit u ON b.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS total_booking_amount,
              (SELECT COUNT(*) FROM Transaction_log t JOIN Unit u ON t.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ? AND t.booking_id IS NULL) AS unmatched_transactions
            """,
            (builder_id, builder_id, builder_id, builder_id, builder_id)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_additional_dashboard_data(builder_id):
    """
    Aggregate additional metrics for a builder's dashboard:
      units_per_project, bookings_per_project, amount_per_project, unmatched_transactions_per_project.
    Returns dict or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT
                p.id AS project_id,
                p.name AS name,
                COUNT(DISTINCT u.id) AS units_per_project,
                COUNT(DISTINCT b.id) AS bookings_per_project,
                COALESCE(SUM(b.amount), 0) AS amount_per_project,
                COUNT(DISTINCT t.id) FILTER (WHERE t.booking_id IS NULL) AS unmatched_transactions_per_project
                FROM Project p
                LEFT JOIN Unit u ON u.project_id = p.id
                LEFT JOIN Booking b ON b.unit_id = u.id
                LEFT JOIN Transaction_log t ON t.unit_id = u.id
                WHERE p.builder_id = ?
                GROUP BY p.id
            """,
            (builder_id,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows] if rows else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

# ---------- Admin (Global) ----------

def fetch_all_builders():
    """
    Fetch all builder users (id, name, email).
    Returns list of dicts.
    """
    conn = get_connection()
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
    """
    Fetch all projects across all builders.
    Returns list of dicts.
    """
    conn = get_connection()
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

# ---------- Search Filters ----------

def fetch_bookings_by_buyer_or_unit(query):
    """
    Search bookings by buyer name or unit code substring.
    Returns list of dicts.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        search_term = f"%{query}%"
        cursor.execute(
            "SELECT Booking.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number"
            " FROM Booking"
            " JOIN Buyer ON Booking.buyer_id = Buyer.id"
            " JOIN Unit ON Booking.unit_id = Unit.id"
            " WHERE Buyer.name LIKE ? OR Unit.unit_id LIKE ?",
            (search_term, search_term)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()


def get_unit_internal_id_by_unit_code(unit_id):
    """
    Retrieve internal primary key ID for a unit given its public code.
    Returns dict {'id': ...} or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM Unit WHERE unit_id = ?", (unit_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()


def get_unit_by_internal_id(unit_code):
    """
    Fetch a unit record by its internal primary key.
    Returns dict or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM Unit WHERE id = ?", (unit_code,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()


def match_transaction_to_booking(transaction_id, booking_id):
    """
    Link a transaction to a booking by updating booking_id.
    Returns number of rows updated (1 if successful, 0 otherwise).
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Transaction_log SET booking_id = ? WHERE id = ?",
            (booking_id, transaction_id)
        )
        conn.commit()
        return cursor.rowcount
    except Exception:
        conn.rollback()
        return 0
    finally:
        cursor.close()
        conn.close()

# ---------- Additional Queries ----------

def fetch_bookings_by_builder_id(builder_id):
    """
    Retrieve all bookings for units belonging to a specific builder.
    Returns list of dicts.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT b.*, u.unit_id AS unit_code, byr.name AS buyer_name"
            " FROM Booking b"
            " JOIN Unit u ON b.unit_id = u.id"
            " JOIN Project p ON u.project_id = p.id"
            " JOIN Buyer byr ON b.buyer_id = byr.id"
            " WHERE p.builder_id = ?",
            (builder_id,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        cursor.close()
        conn.close()


def fetch_project_by_id(project_id):
    """
    Fetch detailed information for a single project, including builder name.
    Returns dict or None.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT p.id AS id, p.builder_id AS builder_id, p.name AS name, p.location AS location, p.num_units AS num_units, p.created_at AS created_at, u.name AS builder_name"
            " FROM Project p"
            " JOIN User u ON p.builder_id = u.id"
            " WHERE p.id = ?",
            (project_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        cursor.close()
        conn.close()