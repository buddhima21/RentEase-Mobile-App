const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const dns = require("dns");
const connectDB = require("./config/db");

dotenv.config();

// Use Google DNS to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Connect database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/properties", require("./routes/propertyRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/agreements", require("./routes/agreementRoutes"));

// ── Tenant Booking & Allocation routes ──
app.use("/api/bookings",  require("./routes/bookingRoutes"));

// ── Invoice, Wallet, Bank Card & Payment routes ──
app.use("/api/invoices",       require("./routes/invoiceRoutes"));
app.use("/api/wallet",         require("./routes/walletRoutes"));
app.use("/api/bank-cards",     require("./routes/bankCardRoutes"));
app.use("/api/payments",       require("./routes/paymentRoutes"));
app.use("/api/notifications",  require("./routes/notificationRoutes"));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "RentEase API is running 🚀" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});