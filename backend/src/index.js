require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init } = require("./db");
const { requireAuth, requireRole } = require("./middleware/auth");
const authController = require("./controllers/authController");
const roomController = require("./controllers/roomController");
const bookingController = require("./controllers/bookingController");
const invoiceController = require("./controllers/invoiceController");
const serviceController = require("./controllers/serviceController");
const dashboardController = require("./controllers/dashboardController");
const userService = require("./services/userService");
const bookingService = require("./services/bookingService");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/signup", authController.signup);
app.post("/api/auth/login", authController.login);
app.get("/api/auth/me", requireAuth, authController.me);

app.get("/api/rooms", requireAuth, roomController.listRooms);
app.get("/api/rooms/availability", requireAuth, roomController.availability);
app.post(
  "/api/rooms",
  requireAuth,
  requireRole("admin"),
  roomController.createRoom
);
app.put(
  "/api/rooms/:id",
  requireAuth,
  requireRole("admin"),
  roomController.updateRoom
);
app.delete(
  "/api/rooms/:id",
  requireAuth,
  requireRole("admin"),
  roomController.deleteRoom
);

app.get("/api/bookings", requireAuth, bookingController.listBookings);
app.post("/api/bookings", requireAuth, bookingController.createBooking);
app.post(
  "/api/bookings/:code/cancel",
  requireAuth,
  bookingController.cancelBooking
);
app.post(
  "/api/bookings/:code/check-in",
  requireAuth,
  requireRole("admin", "staff"),
  bookingController.checkIn
);
app.post(
  "/api/bookings/:code/check-out",
  requireAuth,
  requireRole("admin", "staff", "customer"),
  bookingController.checkOut
);
app.get(
  "/api/bookings/:code/invoice",
  requireAuth,
  bookingController.getInvoice
);
app.get(
  "/api/invoice/:bookingId",
  requireAuth,
  invoiceController.getInvoiceByBookingId
);
app.post(
  "/api/invoice/:bookingId/pay",
  requireAuth,
  invoiceController.payInvoice
);

app.get("/api/services", requireAuth, serviceController.listServices);
app.post(
  "/api/services",
  requireAuth,
  requireRole("admin"),
  serviceController.createService
);
app.put(
  "/api/services/:id",
  requireAuth,
  requireRole("admin"),
  serviceController.updateService
);
app.delete(
  "/api/services/:id",
  requireAuth,
  requireRole("admin"),
  serviceController.deleteService
);
app.post(
  "/api/services/attach",
  requireAuth,
  requireRole("admin", "staff", "customer"),
  serviceController.addBookingService
);
app.get(
  "/api/bookings/:bookingId/services",
  requireAuth,
  serviceController.listBookingServices
);

app.get(
  "/api/dashboard/summary",
  requireAuth,
  requireRole("admin", "staff"),
  dashboardController.summary
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = process.env.PORT || 8081;

init()
  .then(async () => {
    await userService.ensureDefaultUsers();
    await bookingService.ensureBookingIds();
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init database", err);
    process.exit(1);
  });
  app.get("/", (req, res) => {
  res.send("Hotel Management API is running");
});
