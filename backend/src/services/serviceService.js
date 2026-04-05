const { pool } = require("../db");

async function listServices() {
  const { rows } = await pool.query(
    "SELECT * FROM services WHERE active = TRUE ORDER BY name"
  );
  return rows;
}

async function createService({ name, price }) {
  const { rows } = await pool.query(
    `INSERT INTO services (name, price)
     VALUES ($1, $2)
     RETURNING *`,
    [name, price]
  );
  return rows[0];
}

async function updateService(id, { name, price, active }) {
  const { rows } = await pool.query(
    `UPDATE services
     SET name = $1, price = $2, active = $3
     WHERE id = $4
     RETURNING *`,
    [name, price, active, id]
  );
  return rows[0];
}

async function deleteService(id) {
  await pool.query("DELETE FROM services WHERE id = $1", [id]);
}

async function addServiceToBooking({ bookingId, serviceId, quantity }) {
  const { rows: serviceRows } = await pool.query(
    "SELECT * FROM services WHERE id = $1",
    [serviceId]
  );
  const service = serviceRows[0];
  if (!service) {
    throw new Error("Service not found");
  }

  const { rows } = await pool.query(
    `INSERT INTO booking_services (booking_id, service_id, quantity, price_at_time)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [bookingId, serviceId, quantity, service.price]
  );
  return rows[0];
}

async function listBookingServices(bookingId) {
  const { rows } = await pool.query(
    `SELECT bs.*, s.name
     FROM booking_services bs
     JOIN services s ON s.id = bs.service_id
     WHERE bs.booking_id = $1`,
    [bookingId]
  );
  return rows;
}

module.exports = {
  listServices,
  createService,
  updateService,
  deleteService,
  addServiceToBooking,
  listBookingServices,
};
