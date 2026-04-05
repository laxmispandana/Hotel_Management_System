const bookingService = require("../services/bookingService");
const invoiceService = require("../services/invoiceService");

async function listBookings(req, res, next) {
  try {
    const bookings = await bookingService.listBookings({
      role: req.user.role,
      userId: req.user.id,
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function createBooking(req, res, next) {
  try {
    const { roomId, requestedType, checkIn, checkOut } = req.body;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: "checkIn and checkOut are required" });
    }

    const booking = await bookingService.createBooking({
      userId: req.user.id,
      roomId,
      requestedType,
      checkIn,
      checkOut,
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(req.params.code);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

async function checkIn(req, res, next) {
  try {
    const booking = await bookingService.checkInBooking(req.params.code);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function checkOut(req, res, next) {
  try {
    if (req.user.role === "customer") {
      const booking = await bookingService.getBookingByCode(req.params.code);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      if (booking.user_id !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    const result = await bookingService.checkOutBooking(
      req.params.code,
      invoiceService
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getInvoice(req, res, next) {
  try {
    const booking = await bookingService.getBookingByCode(req.params.code);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (req.user.role === "customer" && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    let invoice = await invoiceService.getInvoiceByBooking(booking.id);
    if (!invoice) {
      if (booking.status !== "Checked-out") {
        return res.status(400).json({ error: "Invoice not available yet" });
      }
      invoice = await invoiceService.generateInvoice(booking.id);
    }
    res.json(invoice);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBookings,
  createBooking,
  cancelBooking,
  checkIn,
  checkOut,
  getInvoice,
};
