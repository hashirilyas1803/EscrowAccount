from db_connection import get_connection

def get_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM User WHERE email = ?", (email,))
        return cursor.fetchone()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def create_user(name, email, password_hash, role, created_at):
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

def get_buyer_by_email(email):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Buyer WHERE email = ?", (email,))
        return cursor.fetchone()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def create_buyer(name, emirates_id, phone_number, email, password_hash, created_at):
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

def insert_project(builder_id, name, location, num_units):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Project (builder_id, name, location, num_units) VALUES (?, ?, ?, ?)",
            (builder_id, name, location, num_units)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def insert_unit(project_id, unit_id, floor, area, price):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Unit (project_id, unit_id, floor, area, price) VALUES (?, ?, ?, ?, ?)",
            (project_id, unit_id, floor, area, price)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_projects_by_builder(builder_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Project WHERE builder_id = ?", (builder_id,))
        return cursor.fetchall()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_units_by_project(project_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Unit WHERE project_id = ?", (project_id,))
        return cursor.fetchall()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_dashboard_data(builder_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                (SELECT COUNT(*) FROM Unit u JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS total_units,
                (SELECT COUNT(*) FROM Booking b JOIN Unit u ON b.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS units_booked,
                (SELECT COALESCE(SUM(b.amount), 0) FROM Booking b JOIN Unit u ON b.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ?) AS total_booking_amount,
                (SELECT COUNT(*) FROM Transaction t LEFT JOIN Booking b ON t.booking_id = b.id JOIN Unit u ON b.unit_id = u.id JOIN Project p ON u.project_id = p.id WHERE p.builder_id = ? AND b.id IS NULL) AS unmatched_transactions
        """, (builder_id, builder_id, builder_id, builder_id))
        return cursor.fetchone()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_all_builders():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, email FROM User WHERE role = 'builder'")
        return cursor.fetchall()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_all_projects():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Project")
        return cursor.fetchall()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_all_bookings():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT Booking.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number
            FROM Booking
            JOIN Buyer ON Booking.buyer_id = Buyer.id
            JOIN Unit ON Booking.unit_id = Unit.id
        """)
        return cursor.fetchall()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_all_transactions():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT Transaction.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number
            FROM Transaction
            LEFT JOIN Booking ON Transaction.booking_id = Booking.id
            LEFT JOIN Buyer ON Booking.buyer_id = Buyer.id
            LEFT JOIN Unit ON Booking.unit_id = Unit.id
        """)
        return cursor.fetchall()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_projects_by_builder_id(builder_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Project WHERE builder_id = ?", (builder_id,))
        return cursor.fetchall()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def fetch_bookings_by_buyer_or_unit(query):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        search_term = f"%{query}%"
        cursor.execute("""
            SELECT Booking.*, Buyer.name AS buyer_name, Unit.unit_id AS unit_number
            FROM Booking
            JOIN Buyer ON Booking.buyer_id = Buyer.id
            JOIN Unit ON Booking.unit_id = Unit.id
            WHERE Buyer.name LIKE ? OR Unit.unit_id LIKE ?
        """, (search_term, search_term))
        return cursor.fetchall()
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()