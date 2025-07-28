-- User Table
CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE CHECK (instr(email, '@') > 1),
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('builder', 'admin')),
    created_at TEXT NOT NULL
);

-- Buyer Table
CREATE TABLE IF NOT EXISTS Buyer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emirates_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE CHECK (instr(email, '@') > 1),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Project Table
CREATE TABLE IF NOT EXISTS Project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    num_units INTEGER NOT NULL,
    builder_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (builder_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Unit Table
CREATE TABLE Unit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    unit_id TEXT NOT NULL,
    floor INTEGER NOT NULL,
    area REAL NOT NULL,
    price REAL NOT NULL,
    created_at TEXT NOT NULL,
    booked INTEGER NOT NULL DEFAULT 0 CHECK (booked IN (0,1)),
    FOREIGN KEY (project_id) REFERENCES Project(id) ON DELETE CASCADE,
    UNIQUE(project_id, unit_id)
);

-- Booking Table
CREATE TABLE IF NOT EXISTS Booking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (unit_id) REFERENCES Unit(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES Buyer(id) ON DELETE CASCADE
);

-- Transaction Table
CREATE TABLE Transaction_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    unit_id INTEGER NOT NULL UNIQUE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank transfer')),
    booking_id INTEGER,
    buyer_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (unit_id) REFERENCES Unit(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES Booking(id) ON DELETE SET NULL,
    FOREIGN KEY (buyer_id) REFERENCES Buyer(id) ON DELETE SET NULL
);