import sqlite3

# Utility for obtaining a SQLite connection with proper settings.
# Ensures use of Row factory and enforces foreign key constraints.

def get_connection():
    """
    Open and return a SQLite connection to the escrow database.
    - Sets row_factory to sqlite3.Row for dict-like row access.
    - Enables PRAGMA foreign_keys to enforce referential integrity.

    Returns:
        sqlite3.Connection: Configured DB connection.
    """
    # Connect to the local SQLite file within the backend/db folder
    conn = sqlite3.connect("backend/db/escrow.db")
    # Return rows as sqlite3.Row to allow dict-style access (row['col'])
    conn.row_factory = sqlite3.Row
    # Turn on foreign key support in SQLite (off by default)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn