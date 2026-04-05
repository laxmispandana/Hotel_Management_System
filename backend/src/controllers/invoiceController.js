const invoiceService = require("../services/invoiceService");
const bookingService = require("../services/bookingService");

async function getInvoiceByBookingId(req, res, next) {
  try {
    const bookingId = req.params.bookingId;
    const booking = await bookingService.getBookingByCode(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.status !== "Checked-out") {
      return res.status(400).json({ error: "Invoice not available yet" });
    }
    if (req.user.role === "customer" && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const invoice = await invoiceService.generateInvoice(booking.id);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
}

async function payInvoice(req, res, next) {
  try {
    const bookingId = req.params.bookingId;
    const booking = await bookingService.getBookingByCode(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.status !== "Checked-out") {
      return res.status(400).json({ error: "Invoice not available yet" });
    }
    if (req.user.role === "customer" && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    let invoice = await invoiceService.getInvoiceByBooking(booking.id);
    if (!invoice) {
      invoice = await invoiceService.generateInvoice(booking.id);
    }
    if (invoice.payment_status === "Paid") {
      return res.json(invoice);
    }
    const updated = await invoiceService.markInvoicePaid(booking.id, {
      method: req.body?.method,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInvoiceByBookingId,
  payInvoice,
};
