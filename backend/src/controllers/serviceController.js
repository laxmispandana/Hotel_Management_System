const { pool } = require("../db");
const serviceService = require("../services/serviceService");

async function listServices(req, res, next) {
  try {
    const services = await serviceService.listServices();
    res.json(services);
  } catch (err) {
    next(err);
  }
}

async function createService(req, res, next) {
  try {
    const { name, price } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const service = await serviceService.createService({ name, price });
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
}

async function updateService(req, res, next) {
  try {
    const service = await serviceService.updateService(req.params.id, req.body);
    res.json(service);
  } catch (err) {
    next(err);
  }
}

async function deleteService(req, res, next) {
  try {
    await serviceService.deleteService(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function addBookingService(req, res, next) {
  try {
    const { bookingId, serviceId, quantity } = req.body;
    if (!bookingId || !serviceId || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (req.user.role === "customer") {
      const bookingResult = await pool.query(
        "SELECT user_id FROM bookings WHERE id = $1",
        [bookingId]
      );
      const booking = bookingResult.rows[0];
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      if (booking.user_id !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const service = await serviceService.addServiceToBooking({
      bookingId,
      serviceId,
      quantity,
    });
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
}

async function listBookingServices(req, res, next) {
  try {
    const services = await serviceService.listBookingServices(req.params.bookingId);
    res.json(services);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listServices,
  createService,
  updateService,
  deleteService,
  addBookingService,
  listBookingServices,
};
