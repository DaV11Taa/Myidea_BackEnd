const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { requireAuth, requireAdmin, adminForChanges } = require("./middleware/auth");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const uploadRoutes = require("./routes/uploads");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Connect to MongoDB Atlas on demand.
// If a previous attempt failed, the next call tries again instead of staying disconnected.
let connecting = null;

async function connectDB() {
	if (mongoose.connection.readyState === 1) return;
	if (!connecting) {
		connecting = mongoose
			.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
			.finally(() => {
				connecting = null;
			});
	}
	await connecting;
}

// Try once at startup so the terminal shows the result
connectDB()
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error("MongoDB connection error:", err.message));

// Health endpoint: confirms server + DB status
app.get("/health", async (req, res) => {
	try {
		await connectDB();
		res.json({
			status: "ok",
			database: "connected",
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		res.json({
			status: "ok",
			database: "disconnected",
			error: err.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Make sure the database is connected before any /api route runs
app.use("/api", async (req, res, next) => {
	await connectDB();
	next();
});

// Routes
// Login and registration are open to everyone
app.use("/api/auth", authRoutes);
// Anyone may read; only an admin may create, change or delete
app.use("/api/categories", adminForChanges, categoryRoutes);
app.use("/api/products", adminForChanges, productRoutes);
// Users contain emails and roles, so only a logged-in admin may use these routes
app.use("/api/users", requireAuth, requireAdmin, userRoutes);
// Only an admin may ask for an upload signature
app.use("/api/uploads", requireAuth, requireAdmin, uploadRoutes);
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);

// Unknown route
app.use((req, res) => {
	res.status(404).json({ message: "Route not found" });
});

// Error handler: must come last
app.use((err, req, res, next) => {
	if (err.type === "entity.parse.failed") {
		return res.status(400).json({ message: "The request body is not valid JSON" });
	}
	if (err.name === "ValidationError") {
		return res.status(400).json({ message: err.message });
	}
	if (err.name === "CastError") {
		return res.status(400).json({ message: `Invalid value for ${err.path}: ${err.value}` });
	}
	if (err.code === 11000) {
		return res.status(409).json({ message: "That value already exists", fields: err.keyValue });
	}
	console.error(err);
	res.status(500).json({ message: "Something went wrong" });
});

// Locally: node server.js starts the server. On Vercel the file is imported instead.
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
}

module.exports = app;