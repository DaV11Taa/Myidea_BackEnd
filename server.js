const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Connect to MongoDB Atlas (fail after 5s so Vercel does not time out first)
mongoose
	.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error("MongoDB connection error:", err.message));

// Health endpoint: confirms server + DB status
app.get("/health", async (req, res) => {
	try {
		await mongoose.connection.asPromise();
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