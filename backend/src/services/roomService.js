const { pool } = require("../db");

async function listRooms({ type, status, search }) {
  const filters = [];
  const values = [];

  if (type) {
    values.push(type);
    filters.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    filters.push(`status = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    filters.push(`room_number ILIKE $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT * FROM rooms ${where} ORDER BY room_number`,
    values
  );
  return rows;
}

async function createRoom(payload) {
  const { roomNumber, type, status, pricePerNight, capacity } = payload;
  const { rows } = await pool.query(
    `INSERT INTO rooms (room_number, type, status, price_per_night, capacity)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [roomNumber, type, status, pricePerNight, capacity]
  );
  return rows[0];
}

async function updateRoom(id, payload) {
  const { roomNumber, type, status, pricePerNight, capacity } = payload;
  const { rows } = await pool.query(
    `UPDATE rooms
     SET room_number = $1,
         type = $2,
         status = $3,
         price_per_night = $4,
         capacity = $5
     WHERE id = $6
     RETURNING *`,
    [roomNumber, type, status, pricePerNight, capacity, id]
  );
  return rows[0];
}

async function deleteRoom(id) {
  await pool.query("DELETE FROM rooms WHERE id = $1", [id]);
}

async function findAvailableRooms({ checkIn, checkOut, type }) {
  const values = [checkIn, checkOut];
  let typeClause = "";
  if (type) {
    values.push(type);
    typeClause = `AND r.type = $${values.length}`;
  }

  const { rows } = await pool.query(
    `SELECT r.*
     FROM rooms r
     WHERE r.status = 'Available'
       ${typeClause}
       AND NOT EXISTS (
         SELECT 1
         FROM bookings b
         WHERE b.room_id = r.id
           AND b.status <> 'Cancelled'
           AND NOT (b.check_out <= $1 OR b.check_in >= $2)
       )
     ORDER BY r.room_number`,
    values
  );
  return rows;
}

async function countRoomStats() {
  const { rows } = await pool.query(
    `SELECT
      COUNT(*)::int AS total,
      SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END)::int AS available,
      SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END)::int AS occupied
     FROM rooms`
  );
  return rows[0];
}

module.exports = {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  findAvailableRooms,
  countRoomStats,
};
