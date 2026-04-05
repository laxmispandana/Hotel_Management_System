const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  const roomsColumns = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms'"
  );
  if (
    roomsColumns.rows.length > 0 &&
    !roomsColumns.rows.some((col) => col.column_name === "room_number")
  ) {
    await pool.query("ALTER TABLE rooms RENAME TO rooms_legacy");
  }

  const bookingsColumns = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'"
  );
  const hasBookingCode = bookingsColumns.rows.some(
    (col) => col.column_name === "booking_code"
  );
  if (
    bookingsColumns.rows.length > 0 &&
    !bookingsColumns.rows.some((col) => col.column_name === "booking_id")
  ) {
    await pool.query("ALTER TABLE bookings RENAME TO bookings_legacy");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      room_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('Single', 'Double', 'Deluxe')),
      status TEXT NOT NULL CHECK (status IN ('Available', 'Occupied', 'Maintenance')),
      price_per_night NUMERIC(10, 2) NOT NULL,
      capacity INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      booking_id TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      requested_type TEXT CHECK (requested_type IN ('Single', 'Double', 'Deluxe')),
      status TEXT NOT NULL CHECK (status IN ('Confirmed', 'Cancelled', 'Checked-in', 'Checked-out')),
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS booking_id TEXT
  `);

  await pool.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_id_idx ON bookings (booking_id)"
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS bookings_room_dates_idx ON bookings (room_id, check_in, check_out)"
  );

  if (hasBookingCode) {
    await pool.query("ALTER TABLE bookings ALTER COLUMN booking_code DROP NOT NULL");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_services (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      price_at_time NUMERIC(10, 2) NOT NULL
    );
  `);

  const bookingServiceFk = await pool.query(`
    SELECT conname, confrelid::regclass::text AS ref_table
    FROM pg_constraint
    WHERE conname = 'booking_services_booking_id_fkey'
  `);
  if (
    bookingServiceFk.rows.length > 0 &&
    bookingServiceFk.rows[0].ref_table === "bookings_legacy"
  ) {
    await pool.query(
      "ALTER TABLE booking_services DROP CONSTRAINT booking_services_booking_id_fkey"
    );
    await pool.query(
      "ALTER TABLE booking_services ADD CONSTRAINT booking_services_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE"
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      invoice_number TEXT UNIQUE,
      room_charges NUMERIC(10, 2) NOT NULL,
      service_charges NUMERIC(10, 2) NOT NULL,
      tax NUMERIC(10, 2) NOT NULL,
      total NUMERIC(10, 2) NOT NULL,
      tax_amount NUMERIC(10, 2),
      total_amount NUMERIC(10, 2),
      payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Paid')),
      payment_method TEXT,
      paid_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      payload JSONB NOT NULL
    );
  `);

  await pool.query(`
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2)
  `);
  await pool.query(`
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2)
  `);
  await pool.query(`
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS invoice_number TEXT
  `);
  await pool.query(`
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Unpaid'
  `);
  await pool.query(`
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS payment_method TEXT
  `);
  await pool.query(`
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP
  `);
  await pool.query(`
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()
  `);

  const invoiceFk = await pool.query(`
    SELECT conname, confrelid::regclass::text AS ref_table
    FROM pg_constraint
    WHERE conname = 'invoices_booking_id_fkey'
  `);
  if (
    invoiceFk.rows.length > 0 &&
    invoiceFk.rows[0].ref_table === "bookings_legacy"
  ) {
    await pool.query(
      "ALTER TABLE invoices DROP CONSTRAINT invoices_booking_id_fkey"
    );
    await pool.query(
      "ALTER TABLE invoices ADD CONSTRAINT invoices_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE"
    );
  }

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM rooms");
  if (rows[0].count === 0) {
    await pool.query(
      `INSERT INTO rooms (room_number, type, status, price_per_night, capacity)
       VALUES
         ('101', 'Single', 'Available', 1200, 1),
         ('102', 'Double', 'Available', 1800, 2),
         ('201', 'Deluxe', 'Available', 2600, 3)`
    );
  }

  const services = await pool.query("SELECT COUNT(*)::int AS count FROM services");
  if (services.rows[0].count === 0) {
    await pool.query(
      `INSERT INTO services (name, price)
       VALUES
         ('Room Service', 350),
         ('Food Order', 500),
         ('Laundry', 250)`
    );
  }
}

module.exports = {
  pool,
  init,
};
