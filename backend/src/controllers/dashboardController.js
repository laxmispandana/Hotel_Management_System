const { pool } = require("../db");
const roomService = require("../services/roomService");
const invoiceService = require("../services/invoiceService");

async function summary(req, res, next) {
  try {
    const roomStats = await roomService.countRoomStats();
    const bookings = await pool.query(
      "SELECT COUNT(*)::int AS total FROM bookings"
    );
    const revenue = await invoiceService.revenueSummary();

    res.json({
      totalBookings: bookings.rows[0].total,
      availableRooms: roomStats.available,
      occupiedRooms: roomStats.occupied,
      revenue: revenue.revenue,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  summary,
};
