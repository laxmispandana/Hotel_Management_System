const { pool } = require("../db");

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChunk(length = 4) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return result;
}

function generateBookingId() {
  return `BK${randomChunk(4)}`;
}

async function ensureUniqueBookingId(client) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const bookingId = generateBookingId();
    const exists = await client.query(
      "SELECT 1 FROM bookings WHERE booking_id = $1",
      [bookingId]
    );
    if (exists.rows.length === 0) {
      return bookingId;
    }
  }
  throw new Error("Failed to generate unique booking ID");
}

async function listBookings({ role, userId }) {
  if (role === "customer") {
    const { rows } = await pool.query(
      `SELECT b.*, r.room_number, r.type AS room_type
       FROM bookings b
       LEFT JOIN rooms r ON r.id = b.room_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return rows;
  }

  const { rows } = await pool.query(
    `SELECT b.*, u.name AS guest_name, u.email AS guest_email, r.room_number, r.type AS room_type
     FROM bookings b
     LEFT JOIN users u ON u.id = b.user_id
     LEFT JOIN rooms r ON r.id = b.room_id
     ORDER BY b.created_at DESC`
  );
  return rows;
}

async function getBookingByCode(bookingId) {
  const { rows } = await pool.query(
    "SELECT * FROM bookings WHERE booking_id = $1",
    [bookingId]
  );
  return rows[0];
}

async function createBooking({ userId, roomId, requestedType, checkIn, checkOut }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let room = null;

    if (roomId) {
      const roomResult = await client.query(
        "SELECT * FROM rooms WHERE id = $1 FOR UPDATE",
        [roomId]
      );
      room = roomResult.rows[0];
      if (!room) {
        throw new Error("Room not found");
      }
      if (room.status !== "Available") {
        throw new Error("Room is not available");
      }
    } else if (requestedType) {
      const roomResult = await client.query(
        `SELECT r.*
         FROM rooms r
         WHERE r.status = 'Available'
           AND r.type = $1
           AND NOT EXISTS (
             SELECT 1 FROM bookings b
             WHERE b.room_id = r.id
               AND b.status <> 'Cancelled'
               AND NOT (b.check_out <= $2 OR b.check_in >= $3)
           )
         ORDER BY r.room_number
         FOR UPDATE SKIP LOCKED
         LIMIT 1`,
        [requestedType, checkIn, checkOut]
      );
      room = roomResult.rows[0];
      if (!room) {
        throw new Error("No available room for selected type");
      }
    }

    if (room) {
      const overlap = await client.query(
        `SELECT 1
         FROM bookings
         WHERE room_id = $1
           AND status <> 'Cancelled'
           AND check_in < $3
           AND check_out > $2
         FOR UPDATE`,
        [room.id, checkIn, checkOut]
      );

      if (overlap.rows.length > 0) {
        throw new Error("Room not available for selected dates");
      }
    }

    const { rows } = await client.query(
      `INSERT INTO bookings (booking_id, user_id, room_id, requested_type, status, check_in, check_out)
       VALUES ($1, $2, $3, $4, 'Confirmed', $5, $6)
       RETURNING *`,
      [
        await ensureUniqueBookingId(client),
        userId,
        room ? room.id : null,
        requestedType || room?.type || null,
        checkIn,
        checkOut,
      ]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function cancelBooking(bookingId) {
  const { rows } = await pool.query(
    `UPDATE bookings
     SET status = 'Cancelled'
     WHERE booking_id = $1
     RETURNING *`,
    [bookingId]
  );
  return rows[0];
}

async function checkInBooking(bookingId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      "SELECT * FROM bookings WHERE booking_id = $1 FOR UPDATE",
      [bookingId]
    );
    const booking = bookingResult.rows[0];
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.status !== "Confirmed") {
      throw new Error("Booking is not eligible for check-in");
    }

    let roomId = booking.room_id;
    if (!roomId) {
      const roomResult = await client.query(
        `SELECT * FROM rooms
         WHERE status = 'Available'
           AND type = $1
         ORDER BY room_number
         FOR UPDATE SKIP LOCKED
         LIMIT 1`,
        [booking.requested_type]
      );
      const room = roomResult.rows[0];
      if (!room) {
        throw new Error("No available room to assign");
      }
      roomId = room.id;
    }

    await client.query(
      "UPDATE rooms SET status = 'Occupied' WHERE id = $1",
      [roomId]
    );

    const { rows } = await client.query(
      `UPDATE bookings
       SET status = 'Checked-in', room_id = $1
       WHERE booking_id = $2
       RETURNING *`,
      [roomId, bookingId]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function checkOutBooking(bookingId, invoiceService) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const bookingResult = await client.query(
      "SELECT * FROM bookings WHERE booking_id = $1 FOR UPDATE",
      [bookingId]
    );
    const booking = bookingResult.rows[0];
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.status !== "Checked-in") {
      throw new Error("Booking is not eligible for check-out");
    }

    await client.query(
      "UPDATE rooms SET status = 'Available' WHERE id = $1",
      [booking.room_id]
    );

    const { rows } = await client.query(
      `UPDATE bookings
       SET status = 'Checked-out'
       WHERE booking_id = $1
       RETURNING *`,
      [bookingId]
    );

    await client.query("COMMIT");

    const invoice = await invoiceService.generateInvoice(booking.id);
    return { booking: rows[0], invoice };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function ensureBookingIds() {
  const { rows } = await pool.query(
    "SELECT id FROM bookings WHERE booking_id IS NULL"
  );
  for (const booking of rows) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const bookingId = await ensureUniqueBookingId(client);
      await client.query(
        "UPDATE bookings SET booking_id = $1 WHERE id = $2",
        [bookingId, booking.id]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = {
  generateBookingId,
  listBookings,
  getBookingByCode,
  createBooking,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  ensureBookingIds,
};
