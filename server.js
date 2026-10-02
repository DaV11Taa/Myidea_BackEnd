const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

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

// Locally: node server.js starts the server. On Vercel the file is imported instead.
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
}

module.exports = app;