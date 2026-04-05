const { pool } = require("../db");

const TAX_RATE = Number(process.env.TAX_RATE || 0.1);
const INVOICE_PREFIX = "INV";

function generateInvoiceNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${INVOICE_PREFIX}-${stamp}-${random}`;
}

async function generateInvoice(bookingId) {
  const existing = await pool.query(
    "SELECT * FROM invoices WHERE booking_id = $1",
    [bookingId]
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const bookingResult = await pool.query(
    `SELECT b.*, r.price_per_night, r.room_number, r.type AS room_type
     FROM bookings b
     LEFT JOIN rooms r ON r.id = b.room_id
     WHERE b.id = $1`,
    [bookingId]
  );
  const booking = bookingResult.rows[0];
  if (!booking) {
    throw new Error("Booking not found");
  }

  const nightsRaw = Math.ceil(
    (new Date(booking.check_out) - new Date(booking.check_in)) /
      (1000 * 60 * 60 * 24)
  );
  const nights = Math.max(nightsRaw, 1);
  const roomCharges = Number(booking.price_per_night || 0) * nights;

  const servicesResult = await pool.query(
    `SELECT bs.quantity, bs.price_at_time, s.name
     FROM booking_services bs
     JOIN services s ON s.id = bs.service_id
     WHERE bs.booking_id = $1`,
    [bookingId]
  );

  const serviceCharges = servicesResult.rows.reduce(
    (sum, item) => sum + Number(item.price_at_time) * item.quantity,
    0
  );

  const tax = Number(((roomCharges + serviceCharges) * TAX_RATE).toFixed(2));
  const total = Number((roomCharges + serviceCharges + tax).toFixed(2));

  const payload = {
    bookingCode: booking.booking_id,
    roomNumber: booking.room_number,
    roomType: booking.room_type,
    nights,
    roomCharges,
    serviceCharges,
    taxRate: TAX_RATE,
    tax,
    total,
    services: servicesResult.rows,
  };

  const { rows } = await pool.query(
    `INSERT INTO invoices (booking_id, invoice_number, room_charges, service_charges, tax, total, tax_amount, total_amount, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      bookingId,
      generateInvoiceNumber(),
      roomCharges,
      serviceCharges,
      tax,
      total,
      tax,
      total,
      payload,
    ]
  );

  return rows[0];
}

async function getInvoiceByBooking(bookingId) {
  const { rows } = await pool.query(
    "SELECT * FROM invoices WHERE booking_id = $1",
    [bookingId]
  );
  return rows[0];
}

async function markInvoicePaid(bookingId, { method }) {
  const { rows } = await pool.query(
    `UPDATE invoices
     SET payment_status = 'Paid',
         payment_method = $2,
         paid_at = NOW()
     WHERE booking_id = $1
     RETURNING *`,
    [bookingId, method || "Card"]
  );
  return rows[0];
}

async function revenueSummary() {
  const { rows } = await pool.query(
    "SELECT COALESCE(SUM(COALESCE(total_amount, total)), 0)::numeric AS revenue FROM invoices"
  );
  return rows[0];
}

module.exports = {
  generateInvoice,
  getInvoiceByBooking,
  markInvoicePaid,
  revenueSummary,
};
