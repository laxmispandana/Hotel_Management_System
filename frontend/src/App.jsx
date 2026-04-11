import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import Badge from "./components/Badge.jsx";
import Button from "./components/Button.jsx";
import Card from "./components/Card.jsx";
import EmptyState from "./components/EmptyState.jsx";
import InputField from "./components/InputField.jsx";
import Modal from "./components/Modal.jsx";
import SectionHeader from "./components/SectionHeader.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Skeleton from "./components/Skeleton.jsx";
import StatCard from "./components/StatCard.jsx";
import Toasts from "./components/Toasts.jsx";
import Topbar from "./components/Topbar.jsx";

const emptyLogin = { email: "", password: "" };
const emptySignup = { name: "", email: "", password: "" };
const emptyRoom = {
  roomNumber: "",
  type: "Single",
  status: "Available",
  pricePerNight: "",
  capacity: "",
};

const emptyBookingSearch = {
  checkIn: "",
  checkOut: "",
  type: "",
};

const emptyBooking = {
  roomId: "",
  requestedType: "",
  checkIn: "",
  checkOut: "",
  customerName: "",
  phone: "",
};

const emptyService = { name: "", price: "" };
const emptyAttach = { bookingId: "", serviceId: "", quantity: 1 };

const roomTypes = ["Single", "Double", "Deluxe"];
const roomStatuses = ["Available", "Occupied", "Maintenance"];
const rolePresets = {
  admin: { email: "admin@hotel.local", password: "Admin@123" },
  staff: { email: "staff@hotel.local", password: "Staff@123" },
  customer: { email: "guest@hotel.local", password: "Guest@123" },
};

const statusTone = {
  Available: "success",
  Occupied: "danger",
  Maintenance: "warning",
  Confirmed: "info",
  Cancelled: "danger",
  "Checked-in": "success",
  "Checked-out": "neutral",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const DemoQr = () => (
  <svg
    viewBox="0 0 120 120"
    className="h-32 w-32 rounded-xl border border-white/10 bg-slate-950/40 p-3"
    role="img"
    aria-label="Demo payment QR code"
  >
    <rect width="120" height="120" fill="none" />
    <rect x="10" y="10" width="30" height="30" fill="#e2e8f0" />
    <rect x="15" y="15" width="20" height="20" fill="#0f172a" />
    <rect x="80" y="10" width="30" height="30" fill="#e2e8f0" />
    <rect x="85" y="15" width="20" height="20" fill="#0f172a" />
    <rect x="10" y="80" width="30" height="30" fill="#e2e8f0" />
    <rect x="15" y="85" width="20" height="20" fill="#0f172a" />
    <rect x="50" y="50" width="10" height="10" fill="#e2e8f0" />
    <rect x="65" y="50" width="10" height="10" fill="#e2e8f0" />
    <rect x="50" y="65" width="10" height="10" fill="#e2e8f0" />
    <rect x="65" y="65" width="10" height="10" fill="#e2e8f0" />
    <rect x="40" y="40" width="8" height="8" fill="#e2e8f0" />
    <rect x="72" y="38" width="6" height="6" fill="#e2e8f0" />
    <rect x="38" y="72" width="6" height="6" fill="#e2e8f0" />
    <rect x="78" y="72" width="8" height="8" fill="#e2e8f0" />
    <rect x="56" y="30" width="6" height="6" fill="#e2e8f0" />
    <rect x="30" y="56" width="6" height="6" fill="#e2e8f0" />
    <rect x="84" y="56" width="6" height="6" fill="#e2e8f0" />
  </svg>
);

const buildUpiPayload = (upiId) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=StayFlow%20Hotel&cu=INR`;

export default function App() {
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || "http://localhost:8081",
    []
  );

  const [token, setToken] = useState(() => localStorage.getItem("hotel_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("hotel_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [tab, setTab] = useState("Dashboard");
  const [authView, setAuthView] = useState("landing");
  const [login, setLogin] = useState(emptyLogin);
  const [signup, setSignup] = useState(emptySignup);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [roomFilters, setRoomFilters] = useState({ type: "", status: "" });
  const [bookingSearch, setBookingSearch] = useState(emptyBookingSearch);
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [attachForm, setAttachForm] = useState(emptyAttach);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [upiId, setUpiId] = useState(() => localStorage.getItem("hotel_upi") || "");
  const [upiQr, setUpiQr] = useState(() => localStorage.getItem("hotel_upi_qr") || "");
  const [upiSaving, setUpiSaving] = useState(false);
  const [checkCode, setCheckCode] = useState("");
  const [checkoutCode, setCheckoutCode] = useState("");
  const [invoiceCode, setInvoiceCode] = useState("");
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!upiId || upiQr) return;
    QRCode.toDataURL(buildUpiPayload(upiId), {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        setUpiQr(url);
        localStorage.setItem("hotel_upi_qr", url);
      })
      .catch(() => {});
  }, [upiId, upiQr]);

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const handleUpiSave = async (event) => {
    event.preventDefault();
    if (!upiId || !upiId.includes("@")) {
      addToast("Enter a valid UPI ID.", "error");
      return;
    }
    try {
      setUpiSaving(true);
      const url = await QRCode.toDataURL(buildUpiPayload(upiId), {
        width: 220,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setUpiQr(url);
      localStorage.setItem("hotel_upi", upiId);
      localStorage.setItem("hotel_upi_qr", url);
      addToast("UPI saved. QR updated.");
    } catch (err) {
      addToast("Unable to generate QR.", "error");
    } finally {
      setUpiSaving(false);
    }
  };

  const handleUpiClear = () => {
    setUpiId("");
    setUpiQr("");
    localStorage.removeItem("hotel_upi");
    localStorage.removeItem("hotel_upi_qr");
    addToast("UPI cleared.");
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const apiFetch = async (path, options = {}) => {
    const res = await fetch(`${apiBase}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {}),
      },
      ...options,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload.error || "Request failed");
    }
    return payload;
  };

  const refreshData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [roomsData, bookingData, serviceData] = await Promise.all([
        apiFetch(`/api/rooms`),
        apiFetch(`/api/bookings`),
        apiFetch(`/api/services`),
      ]);
      setRooms(roomsData);
      setBookings(bookingData);
      setServices(serviceData);

      if (user?.role !== "customer") {
        const dash = await apiFetch(`/api/dashboard/summary`);
        setDashboard(dash);
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const payload = await apiFetch(`/api/auth/login`, {
        method: "POST",
        body: JSON.stringify(login),
      });
      localStorage.setItem("hotel_token", payload.token);
      localStorage.setItem("hotel_user", JSON.stringify(payload.user));
      setToken(payload.token);
      setUser(payload.user);
      setLogin(emptyLogin);
      setAuthView("landing");
      setTab(payload.user.role === "customer" ? "Rooms" : "Dashboard");
      addToast("Logged in successfully.");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    try {
      const payload = await apiFetch(`/api/auth/signup`, {
        method: "POST",
        body: JSON.stringify(signup),
      });
      localStorage.setItem("hotel_token", payload.token);
      localStorage.setItem("hotel_user", JSON.stringify(payload.user));
      setToken(payload.token);
      setUser(payload.user);
      setSignup(emptySignup);
      setAuthView("landing");
      setTab("Rooms");
      addToast("Account created.");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hotel_token");
    localStorage.removeItem("hotel_user");
    setToken(null);
    setUser(null);
    setRooms([]);
    setBookings([]);
    setServices([]);
    setDashboard(null);
    setAuthView("landing");
  };

  const handleRoomSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingRoomId) {
        await apiFetch(`/api/rooms/${editingRoomId}`, {
          method: "PUT",
          body: JSON.stringify(roomForm),
        });
        addToast("Room updated.");
      } else {
        await apiFetch(`/api/rooms`, {
          method: "POST",
          body: JSON.stringify(roomForm),
        });
        addToast("Room added.");
      }
      setRoomForm(emptyRoom);
      setEditingRoomId(null);
      setRoomModalOpen(false);
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };
  const handleRoomEdit = (room) => {
    setRoomForm({
      roomNumber: room.room_number,
      type: room.type,
      status: room.status,
      pricePerNight: room.price_per_night,
      capacity: room.capacity,
    });
    setEditingRoomId(room.id);
    setRoomModalOpen(true);
  };

  const handleRoomDelete = async (id) => {
    try {
      await apiFetch(`/api/rooms/${id}`, { method: "DELETE" });
      addToast("Room deleted.");
      setConfirmDelete(null);
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleAvailability = async (event) => {
    event.preventDefault();
    try {
      const params = new URLSearchParams(bookingSearch);
      const data = await apiFetch(`/api/rooms/availability?${params.toString()}`);
      setAvailability(data);
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleBooking = async (event) => {
    event.preventDefault();
    try {
      if (!bookingForm.customerName.trim()) {
        addToast("Customer name is required.", "error");
        return;
      }
      if (!/^[0-9]{7,15}$/.test(bookingForm.phone)) {
        addToast("Phone number must be 7-15 digits.", "error");
        return;
      }
      await apiFetch(`/api/bookings`, {
        method: "POST",
        body: JSON.stringify({
          roomId: bookingForm.roomId ? Number(bookingForm.roomId) : null,
          requestedType: bookingForm.requestedType || null,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          customerName: bookingForm.customerName,
          phone: bookingForm.phone,
        }),
      });
      addToast("Booking confirmed.");
      setBookingForm(emptyBooking);
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleCancel = async (code) => {
    try {
      await apiFetch(`/api/bookings/${code}/cancel`, { method: "POST" });
      addToast("Booking cancelled.");
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleCheckIn = async () => {
    try {
      await apiFetch(`/api/bookings/${checkCode}/check-in`, { method: "POST" });
      addToast("Checked in.");
      setCheckCode("");
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleCheckOut = async () => {
    try {
      const data = await apiFetch(`/api/bookings/${checkoutCode}/check-out`, {
        method: "POST",
      });
      setInvoice(data.invoice);
      addToast("Checked out and invoice generated.");
      setCheckoutCode("");
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleCustomerCheckout = async (bookingId) => {
    try {
      const data = await apiFetch(`/api/bookings/${bookingId}/check-out`, {
        method: "POST",
      });
      setInvoice(data.invoice);
      addToast("Checked out and invoice generated.");
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleServiceCreate = async (event) => {
    event.preventDefault();
    try {
      await apiFetch(`/api/services`, {
        method: "POST",
        body: JSON.stringify(serviceForm),
      });
      addToast("Service created.");
      setServiceForm(emptyService);
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleAttachService = async (event) => {
    event.preventDefault();
    try {
      await apiFetch(`/api/services/attach`, {
        method: "POST",
        body: JSON.stringify({
          bookingId: Number(attachForm.bookingId),
          serviceId: Number(attachForm.serviceId),
          quantity: Number(attachForm.quantity),
        }),
      });
      addToast("Service attached.");
      setAttachForm(emptyAttach);
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleInvoiceLookup = async () => {
    try {
      const data = await apiFetch(`/api/invoice/${invoiceCode}`);
      setInvoice(data);
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleViewInvoice = async (bookingId) => {
    try {
      const data = await apiFetch(`/api/invoice/${bookingId}`);
      setInvoice(data);
      setTab("Billing");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoice) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("StayFlow Hotel Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Invoice No: ${invoice.invoice_number || "N/A"}`, 14, 32);
    doc.text(`Booking: ${invoice.payload?.bookingCode || ""}`, 14, 40);
    doc.text(
      `Room: ${invoice.payload?.roomNumber || ""} (${invoice.payload?.roomType || ""})`,
      14,
      48
    );
    doc.text(`Nights: ${invoice.payload?.nights || ""}`, 14, 56);
    doc.text(`Room Charges: ₹${invoice.room_charges}`, 14, 68);
    doc.text(`Service Charges: ₹${invoice.service_charges}`, 14, 76);
    doc.text(`Tax: ₹${invoice.tax_amount || invoice.tax}`, 14, 84);
    doc.setFontSize(14);
    doc.text(`Total: ₹${invoice.total_amount || invoice.total}`, 14, 96);
    doc.setFontSize(10);
    doc.text("Thank you for staying with StayFlow.", 14, 110);
    doc.save(`invoice-${invoice.payload?.bookingCode || "booking"}.pdf`);
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;
    try {
      const data = await apiFetch(
        `/api/invoice/${invoice.payload?.bookingCode}/pay`,
        {
          method: "POST",
          body: JSON.stringify({ method: "Card" }),
        }
      );
      setInvoice(data);
      addToast("Payment successful.");
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSidebarToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen((prev) => !prev);
      return;
    }
    setSidebarCollapsed((prev) => !prev);
  };

  const tabsByRole = {
    admin: ["Dashboard", "Rooms", "Bookings", "Services", "Billing"],
    staff: ["Dashboard", "Bookings", "Check-in/out", "Services", "Billing"],
    customer: ["Rooms", "My Bookings", "Request Services", "Billing"],
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gradient-to-br dark:from-[#0b1120] dark:via-[#0f172a] dark:to-[#111827] dark:text-slate-100">
        <Toasts items={toasts} onRemove={removeToast} />
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
          <div className="grid w-full gap-10 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-glass backdrop-blur-xl lg:grid-cols-2">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                Hotel Management System
              </p>
              <h1 className="text-4xl font-semibold text-slate-900 dark:text-white sm:text-5xl">
                Manage bookings, rooms, and services with clarity.
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-600 dark:text-slate-300">
                A smart and efficient system to manage hotel bookings, rooms, and
                services.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setAuthView("login")}>Login</Button>
                <Button variant="ghost" onClick={() => setAuthView("signup")}>
                  Sign Up
                </Button>
              </div>
            </div>
            <div className="space-y-6">
              {authView === "landing" && (
                <Card className="text-center">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-500 dark:text-slate-400">
                    Sign in to access dashboards, bookings, and billing.
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <Button onClick={() => setAuthView("login")}>Login</Button>
                    <Button variant="ghost" onClick={() => setAuthView("signup")}>
                      Create an account
                    </Button>
                  </div>
                </Card>
              )}
              {authView === "login" && (
                <Card>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Login
                    </h2>
                    <button
                      type="button"
                      onClick={() => setAuthView("landing")}
                      className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"
                    >
                      Back
                    </button>
                  </div>
                  <form className="mt-4 space-y-4" onSubmit={handleLogin}>
                    <InputField
                      label="Email"
                      type="email"
                      value={login.email}
                      onChange={(e) =>
                        setLogin({ ...login, email: e.target.value })
                      }
                      placeholder="you@hotel.com"
                      required
                    />
                    <InputField
                      label="Password"
                      type="password"
                      value={login.password}
                      onChange={(e) =>
                        setLogin({ ...login, password: e.target.value })
                      }
                      placeholder="Enter password"
                      required
                    />
                    <Button type="submit" className="w-full">
                      Sign In
                    </Button>
                  </form>
                  <div className="mt-6 space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                      Quick Access
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button
                        variant="ghost"
                        onClick={() => setLogin(rolePresets.admin)}
                      >
                        Admin
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setLogin(rolePresets.staff)}
                      >
                        Staff
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setLogin(rolePresets.customer)}
                      >
                        Customer
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              {authView === "signup" && (
                <Card>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Sign Up
                    </h2>
                    <button
                      type="button"
                      onClick={() => setAuthView("landing")}
                      className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"
                    >
                      Back
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Customer signup only. Admin and staff accounts are created by
                    the admin.
                  </p>
                  <form className="mt-4 space-y-4" onSubmit={handleSignup}>
                    <InputField
                      label="Full name"
                      value={signup.name}
                      onChange={(e) =>
                        setSignup({ ...signup, name: e.target.value })
                      }
                      placeholder="Your name"
                      required
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={signup.email}
                      onChange={(e) =>
                        setSignup({ ...signup, email: e.target.value })
                      }
                      placeholder="you@hotel.com"
                      required
                    />
                    <InputField
                      label="Password"
                      type="password"
                      value={signup.password}
                      onChange={(e) =>
                        setSignup({ ...signup, password: e.target.value })
                      }
                      placeholder="Create password"
                      required
                    />
                    <Button type="submit" variant="ghost" className="w-full">
                      Create Account
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gradient-to-br dark:from-[#0b1120] dark:via-[#0f172a] dark:to-[#111827] dark:text-slate-100">
      <Toasts items={toasts} onRemove={removeToast} />
      <div className="flex min-h-screen flex-col md:flex-row">
        <div
          className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            items={tabsByRole[user.role]}
            active={tab}
            onSelect={setTab}
            collapsed={sidebarCollapsed}
            onItemSelect={() => setSidebarOpen(false)}
          />
        </div>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="flex flex-1 flex-col gap-8 p-6 md:ml-0">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <Topbar
            user={user}
            onToggleSidebar={handleSidebarToggle}
            onSignOut={handleLogout}
          />

            {loading && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[...Array(4)].map((_, idx) => (
                  <Skeleton key={idx} className="h-28" />
                ))}
              </div>
            )}

          {tab === "Dashboard" && user.role !== "customer" && (
            <div className="space-y-6">
              <SectionHeader
                title="Executive Dashboard"
                subtitle="Live occupancy and revenue insights."
              />
              {user.role === "admin" && (
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Payment Settings
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        Register UPI ID (Demo QR)
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Add a UPI ID to show a payment QR on invoices.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {upiQr ? (
                        <img
                          src={upiQr}
                          alt="UPI QR"
                          className="h-28 w-28 rounded-xl border border-white/10 bg-white p-2"
                        />
                      ) : (
                        <DemoQr />
                      )}
                    </div>
                  </div>
                  <form
                    className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]"
                    onSubmit={handleUpiSave}
                  >
                    <input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="example@upi"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                      required
                    />
                    <button
                      type="submit"
                      disabled={upiSaving}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {upiSaving ? "Generating..." : "Save UPI"}
                    </button>
                  </form>
                  {upiId && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleUpiClear}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                      >
                        Clear UPI
                      </button>
                    </div>
                  )}
                </Card>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Bookings"
                  value={dashboard?.totalBookings ?? 0}
                  gradient="from-indigo-500/40 via-purple-500/20 to-transparent"
                  icon="📌"
                />
                <StatCard
                  title="Revenue"
                  value={`₹${dashboard?.revenue ?? 0}`}
                  gradient="from-emerald-500/40 via-sky-500/20 to-transparent"
                  icon="💳"
                />
                <StatCard
                  title="Available"
                  value={dashboard?.availableRooms ?? 0}
                  gradient="from-cyan-500/40 via-blue-500/20 to-transparent"
                  icon="🛏️"
                />
                <StatCard
                  title="Occupied"
                  value={dashboard?.occupiedRooms ?? 0}
                  gradient="from-rose-500/40 via-purple-500/20 to-transparent"
                  icon="🏨"
                />
              </div>
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Trend</h3>
                <div className="mt-4 h-32 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-sky-500/30" />
              </Card>
            </div>
          )}

          {tab === "Rooms" && user.role === "admin" && (
            <div className="space-y-6">
              <SectionHeader
                title="Room Management"
                subtitle="Update pricing, status, and capacity."
                action={
                  <button
                    onClick={() => {
                      setEditingRoomId(null);
                      setRoomForm(emptyRoom);
                      setRoomModalOpen(true);
                    }}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Add Room
                  </button>
                }
              />
              <div className="flex flex-wrap gap-3">
                <select
                  value={roomFilters.type}
                  onChange={(e) =>
                    setRoomFilters((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={roomFilters.status}
                  onChange={(e) =>
                    setRoomFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                >
                  <option value="">All Status</option>
                  {roomStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {rooms
                  .filter((room) =>
                    roomFilters.type ? room.type === roomFilters.type : true
                  )
                  .filter((room) =>
                    roomFilters.status ? room.status === roomFilters.status : true
                  )
                  .map((room) => (
                    <Card key={room.id} className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Room</p>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            {room.room_number}
                          </h3>
                        </div>
                        <Badge label={room.status} tone={statusTone[room.status]} />
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <p>Type: {room.type}</p>
                        <p>Capacity: {room.capacity} guests</p>
                        <p>Price: ₹{room.price_per_night}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRoomEdit(room)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(room.id)}
                          className="rounded-xl border border-rose-400/40 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {tab === "Rooms" && user.role === "customer" && (
            <div className="space-y-6">
              <SectionHeader
                title="Find Your Stay"
                subtitle="Pick dates, explore rooms, and confirm your booking."
              />
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <Card>
                    <form
                      className="grid gap-4 md:grid-cols-3"
                      onSubmit={handleAvailability}
                    >
                      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Check-in
                        <input
                          type="date"
                          value={bookingSearch.checkIn}
                          onChange={(e) =>
                            setBookingSearch({
                              ...bookingSearch,
                              checkIn: e.target.value,
                            })
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Check-out
                        <input
                          type="date"
                          value={bookingSearch.checkOut}
                          onChange={(e) =>
                            setBookingSearch({
                              ...bookingSearch,
                              checkOut: e.target.value,
                            })
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Room type
                        <select
                          value={bookingSearch.type}
                          onChange={(e) =>
                            setBookingSearch({
                              ...bookingSearch,
                              type: e.target.value,
                            })
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                        >
                          <option value="">Any Type</option>
                          {roomTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white md:col-span-3">
                        Search Availability
                      </button>
                    </form>
                  </Card>
                  {availability.length === 0 ? (
                    <EmptyState
                      title="No rooms loaded"
                      message="Run a search to see available rooms."
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {availability.map((room) => (
                        <Card key={room.id} className="flex flex-col gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                              Room {room.room_number}
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                              {room.type}
                            </h3>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            ₹{room.price_per_night} per night
                          </p>
                          <button
                            onClick={() =>
                              setBookingForm({
                                ...bookingForm,
                                roomId: room.id,
                                requestedType: room.type,
                                checkIn: bookingSearch.checkIn,
                                checkOut: bookingSearch.checkOut,
                              })
                            }
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                          >
                            Select Room
                          </button>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <Card>
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Selected Room
                      </p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {bookingForm.roomId
                          ? `Room #${bookingForm.roomId}`
                          : "Choose a room to proceed"}
                      </p>
                      {bookingForm.requestedType && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Type: {bookingForm.requestedType}
                        </p>
                      )}
                    </div>
                    <form
                      className="grid gap-4 md:grid-cols-2"
                      onSubmit={handleBooking}
                    >
                      <InputField
                        label="Customer name"
                        value={bookingForm.customerName}
                        onChange={(e) =>
                          setBookingForm({
                            ...bookingForm,
                            customerName: e.target.value,
                          })
                        }
                        placeholder="Full name"
                        required
                      />
                      <InputField
                        label="Phone number"
                        value={bookingForm.phone}
                        onChange={(e) =>
                          setBookingForm({
                            ...bookingForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="10 digit mobile"
                        required
                      />
                      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Room ID
                        <input
                          value={bookingForm.roomId}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              roomId: e.target.value,
                            })
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                          placeholder="Room ID"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Check-in
                        <input
                          type="date"
                          value={bookingForm.checkIn}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              checkIn: e.target.value,
                            })
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Check-out
                        <input
                          type="date"
                          value={bookingForm.checkOut}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              checkOut: e.target.value,
                            })
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                          required
                        />
                      </label>
                      <button className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
                        Confirm Booking
                      </button>
                    </form>
                  </Card>
                  <Card className="border border-white/5 bg-white/5 text-sm text-slate-600 dark:text-slate-300">
                    Tip: Bookings are confirmed instantly and protected against
                    double-booking. You can cancel anytime before check-in.
                  </Card>
                </div>
              </div>
            </div>
          )}

          {tab === "Bookings" && (
            <div className="space-y-6">
              <SectionHeader
                title="Bookings"
                subtitle="Monitor all reservations and status."
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                          Booking
                        </p>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {booking.booking_id}
                        </h3>
                      </div>
                      <Badge
                        label={booking.status}
                        tone={statusTone[booking.status]}
                      />
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <p>Room: {booking.room_number || "Unassigned"}</p>
                      <p>
                        Dates: {formatDate(booking.check_in)} →{" "}
                        {formatDate(booking.check_out)}
                      </p>
                      <p>Guest: {booking.guest_name || user.name}</p>
                    </div>
                    <div className="flex gap-2">
                      {booking.status === "Confirmed" && (
                        <button
                          onClick={() => handleCancel(booking.booking_id)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      )}
                      {booking.status === "Checked-out" && (
                        <button
                          onClick={() => handleViewInvoice(booking.booking_id)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                          View Invoice
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {tab === "Check-in/out" && (
            <div className="space-y-6">
              <SectionHeader
                title="Check-in / Check-out"
                subtitle="Update stay status instantly."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Check-in</h3>
                  <input
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                    value={checkCode}
                    onChange={(e) => setCheckCode(e.target.value)}
                    placeholder="Booking ID"
                  />
                  <button
                    onClick={handleCheckIn}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Check-in
                  </button>
                </Card>
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Check-out</h3>
                  <input
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                    value={checkoutCode}
                    onChange={(e) => setCheckoutCode(e.target.value)}
                    placeholder="Booking ID"
                  />
                  <button
                    onClick={handleCheckOut}
                    className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
                  >
                    Check-out
                  </button>
                </Card>
              </div>
            </div>
          )}

          {tab === "Services" && (
            <div className="space-y-6">
              <SectionHeader
                title="Service Management"
                subtitle="Offer premium add-ons and extras."
              />
              <div className="grid gap-4 md:grid-cols-3">
                {services.map((service) => (
                  <Card key={service.id} className="flex flex-col gap-3">
                    <div className="text-3xl">🍽️</div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">₹{service.price}</p>
                  </Card>
                ))}
              </div>
              {user.role === "admin" && (
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Service</h3>
                  <form
                    className="mt-4 grid gap-4 md:grid-cols-2"
                    onSubmit={handleServiceCreate}
                  >
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                      value={serviceForm.name}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, name: e.target.value })
                      }
                      placeholder="Service name"
                      required
                    />
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                      type="number"
                      value={serviceForm.price}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, price: e.target.value })
                      }
                      placeholder="Price"
                      required
                    />
                    <button className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
                      Create Service
                    </button>
                  </form>
                </Card>
              )}
              {(user.role === "admin" || user.role === "staff") && (
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Attach Service</h3>
                  <form
                    className="mt-4 grid gap-4 md:grid-cols-3"
                    onSubmit={handleAttachService}
                  >
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                      value={attachForm.bookingId}
                      onChange={(e) =>
                        setAttachForm({ ...attachForm, bookingId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select booking</option>
                      {bookings.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.booking_id} ({booking.status})
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                      value={attachForm.serviceId}
                      onChange={(e) =>
                        setAttachForm({ ...attachForm, serviceId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                      type="number"
                      min="1"
                      value={attachForm.quantity}
                      onChange={(e) =>
                        setAttachForm({ ...attachForm, quantity: e.target.value })
                      }
                    />
                    <button className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 md:col-span-3">
                      Attach
                    </button>
                  </form>
                </Card>
              )}
            </div>
          )}
          {tab === "Request Services" && user.role === "customer" && (
            <div className="space-y-6">
              <SectionHeader
                title="Request Services"
                subtitle="Tap to add extras to your stay."
              />
              <div className="grid gap-4 md:grid-cols-3">
                {services.map((service) => (
                  <Card key={service.id} className="flex flex-col gap-3">
                    <div className="text-3xl">🧺</div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">₹{service.price}</p>
                  </Card>
                ))}
              </div>
              <Card>
                <form
                  className="grid gap-4 md:grid-cols-3"
                  onSubmit={handleAttachService}
                >
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                    value={attachForm.bookingId}
                    onChange={(e) =>
                      setAttachForm({ ...attachForm, bookingId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select booking</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.booking_id}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                    value={attachForm.serviceId}
                    onChange={(e) =>
                      setAttachForm({ ...attachForm, serviceId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                    type="number"
                    min="1"
                    value={attachForm.quantity}
                    onChange={(e) =>
                      setAttachForm({ ...attachForm, quantity: e.target.value })
                    }
                  />
                  <button className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white md:col-span-3">
                    Request Service
                  </button>
                </form>
              </Card>
            </div>
          )}

          {tab === "Billing" && (
            <div className="space-y-6">
              <SectionHeader
                title="Billing & Invoice"
                subtitle="View receipts and complete payment."
              />
              <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Lookup</h3>
                  <input
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
                    value={invoiceCode}
                    onChange={(e) => setInvoiceCode(e.target.value)}
                    placeholder="Booking ID"
                  />
                  <button
                    onClick={handleInvoiceLookup}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Fetch Invoice
                  </button>
                </Card>
                {invoice ? (
                  <Card className="bg-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                          Invoice
                        </p>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {invoice.invoice_number || "N/A"}
                        </h3>
                      </div>
                      <Badge
                        label={invoice.payment_status || "Unpaid"}
                        tone={invoice.payment_status === "Paid" ? "success" : "warning"}
                      />
                    </div>
                    <div className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p>Booking: {invoice.payload?.bookingCode}</p>
                      <p>Room: {invoice.payload?.roomNumber} ({invoice.payload?.roomType})</p>
                      <p>Nights: {invoice.payload?.nights}</p>
                    </div>
                    <div className="my-6 border-t border-white/10 pt-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Room Charges</span>
                        <span>₹{invoice.room_charges}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Service Charges</span>
                        <span>₹{invoice.service_charges}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tax (10%)</span>
                        <span>₹{invoice.tax_amount || invoice.tax}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-lg font-semibold text-slate-900 dark:text-white">
                      <span>Total</span>
                      <span>₹{invoice.total_amount || invoice.total}</span>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {invoice.payment_status !== "Paid" && (
                        <button
                          onClick={handlePayInvoice}
                          className="rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Pay Now
                        </button>
                      )}
                      <button
                        onClick={handleDownloadInvoice}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                      >
                        Download PDF
                      </button>
                    </div>
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        {upiId ? "UPI QR Payment" : "Demo QR Payment"}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        {upiQr ? (
                          <img
                            src={upiQr}
                            alt="UPI QR"
                            className="h-32 w-32 rounded-xl border border-white/10 bg-white p-2"
                          />
                        ) : (
                          <DemoQr />
                        )}
                        <div className="text-sm text-slate-300">
                          <p>
                            {upiId
                              ? `Scan to pay via ${upiId}.`
                              : "Scan to complete a demo payment."}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {upiId
                              ? "Payments are handled externally."
                              : "This QR is for UI preview only."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <EmptyState
                    title="No invoice loaded"
                    message="Enter a booking ID to generate a receipt."
                  />
                )}
              </div>
            </div>
          )}

          {tab === "My Bookings" && user.role === "customer" && (
            <div className="space-y-6">
              <SectionHeader
                title="My Bookings"
                subtitle="Track your stays and billing."
              />
              {bookings.length === 0 && (
                <EmptyState
                  title="No bookings yet"
                  message="Search rooms and confirm a booking to see it here."
                />
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                          Booking
                        </p>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {booking.booking_id}
                        </h3>
                      </div>
                      <Badge label={booking.status} tone={statusTone[booking.status]} />
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <p>Room: {booking.room_number || "Unassigned"}</p>
                      <p>
                        Dates: {formatDate(booking.check_in)} →{" "}
                        {formatDate(booking.check_out)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {booking.status === "Confirmed" && (
                        <button
                          onClick={() => handleCancel(booking.booking_id)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      )}
                      {booking.status === "Checked-in" && (
                        <button
                          onClick={() => handleCustomerCheckout(booking.booking_id)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                          Check-out
                        </button>
                      )}
                      {booking.status === "Checked-out" && (
                        <button
                          onClick={() => handleViewInvoice(booking.booking_id)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        >
                          View Invoice
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <Modal
        open={roomModalOpen}
        title={editingRoomId ? "Update Room" : "Add Room"}
        onClose={() => setRoomModalOpen(false)}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleRoomSubmit}>
          <input
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
            value={roomForm.roomNumber}
            onChange={(e) =>
              setRoomForm({ ...roomForm, roomNumber: e.target.value })
            }
            placeholder="Room Number"
            required
          />
          <select
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
            value={roomForm.type}
            onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
          >
            {roomTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
            value={roomForm.status}
            onChange={(e) =>
              setRoomForm({ ...roomForm, status: e.target.value })
            }
          >
            {roomStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
            type="number"
            value={roomForm.pricePerNight}
            onChange={(e) =>
              setRoomForm({ ...roomForm, pricePerNight: e.target.value })
            }
            placeholder="Price per night"
            required
          />
          <input
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
            type="number"
            value={roomForm.capacity}
            onChange={(e) =>
              setRoomForm({ ...roomForm, capacity: e.target.value })
            }
            placeholder="Capacity"
            required
          />
          <button className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
            Save Room
          </button>
        </form>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        title="Confirm Delete"
        onClose={() => setConfirmDelete(null)}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete this room? This action cannot be
          undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => handleRoomDelete(confirmDelete)}
            className="rounded-xl border border-rose-400/40 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
          >
            Delete
          </button>
          <button
            onClick={() => setConfirmDelete(null)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
