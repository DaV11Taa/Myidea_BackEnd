const express = require("express");
const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const router = express.Router();

// Never send the password hash back to the client
const SAFE = "-passwordHash";

// GET /api/users → list all users (optional filter: ?role=admin)
router.get("/", async (req, res) => {
	const filter = {};
	if (req.query.role) filter.role = req.query.role;
	const users = await User.find(filter).select(SAFE).sort({ createdAt: -1 });
	res.json(users);
});

// GET /api/users/:id → one user
router.get("/:id", async (req, res) => {
	const user = await User.findById(req.params.id).select(SAFE);
	if (!user) return res.status(404).json({ message: "User not found" });
	res.json(user);
});

// POST /api/users → create a user
// Only name and email are taken from the body, so nobody can create themselves as admin.
// The real password hashing comes in Week 3 (auth). For now the hash is a placeholder.
router.post("/", async (req, res) => {
	const { name, email } = req.body;
	const user = await User.create({ name, email, passwordHash: "not-set-yet" });
	const safe = user.toObject();
	delete safe.passwordHash;
	res.status(201).json(safe);
});

// PUT /api/users/:id → update name, email or isBlocked
// role is not editable here: changing roles needs admin login (Week 3).
router.put("/:id", async (req, res) => {
	const changes = {};
	for (const key of ["name", "email", "isBlocked"]) {
		if (req.body[key] !== undefined) changes[key] = req.body[key];
	}
	const user = await User.findByIdAndUpdate(req.params.id, changes, {
		returnDocument: "after",
		runValidators: true,
	}).select(SAFE);
	if (!user) return res.status(404).json({ message: "User not found" });
	res.json(user);
});

// DELETE /api/users/:id → delete (only if the user has no orders)
router.delete("/:id", async (req, res) => {
	const hasOrders = await Order.exists({ user: req.params.id });
	if (hasOrders) {
		return res.status(409).json({ message: "User still has orders. Block the user instead" });
	}
	const user = await User.findByIdAndDelete(req.params.id);
	if (!user) return res.status(404).json({ message: "User not found" });
	await Cart.deleteMany({ user: req.params.id });
	res.json({ message: "User deleted" });
});

module.exports = router;