const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error("MongoDB connection error:", err));

// Health endpoint — confirms server + DB status
app.get("/health", (req, res) => {
	const dbStatus =
		mongoose.connection.readyState === 1 ? "connected" : "disconnected";
	res.json({
		status: "ok",
		database: dbStatus,
		timestamp: new Date().toISOString(),
	});
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;