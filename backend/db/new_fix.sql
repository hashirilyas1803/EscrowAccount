-- -- Step 1: Rename the old table
-- ALTER TABLE Unit RENAME TO Unit_old;

-- -- Step 2: Create the new table with the correct schema
-- CREATE TABLE Unit (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     project_id INTEGER NOT NULL,
--     unit_id TEXT NOT NULL,
--     floor INTEGER NOT NULL,
--     area REAL NOT NULL,
--     price REAL NOT NULL,
--     created_at TEXT NOT NULL,
--     booked INTEGER NOT NULL DEFAULT 0 CHECK (booked IN (0,1)),
--     FOREIGN KEY (project_id) REFERENCES Project(id) ON DELETE CASCADE,
--     UNIQUE(project_id, unit_id)
-- );

-- -- Step 3: Copy data over (if needed, convert unit_id to TEXT during insert)
-- INSERT INTO Unit (
--     id, project_id, unit_id, floor, area, price, created_at, booked
-- )
-- SELECT
--     id, project_id, unit_id, floor, area, price, created_at, booked
-- FROM Unit_old;

-- -- Step 4: Drop the old table
-- DROP TABLE Unit_old;

-- UPDATE Project SET num_units = (SELECT COUNT(*) FROM Unit u WHERE u.project_id = Project.id);

-- -- Rename old table
-- ALTER TABLE Transaction_log RENAME TO Transaction_log_old;

-- -- Create new table with NOT NULL buyer_id
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

-- INSERT INTO Transaction_log (id, amount, date, unit_id, payment_method, booking_id, buyer_id, created_at)
-- SELECT t.id, t.amount, t.date, t.unit_id, t.payment_method, t.booking_id, b.buyer_id, t.created_at
-- FROM Transaction_log_old t
-- LEFT JOIN Booking b ON t.booking_id = b.id;

-- DROP TABLE Transaction_log_old;