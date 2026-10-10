const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// GET /api/products → list all. Optional: /api/products?category=<categoryId>
router.get("/", async (req, res) => {
	const filter = {};
	if (req.query.category) filter.category = req.query.category;

	const products = await Product.find(filter)
		.populate("category", "name slug")
		.sort({ createdAt: -1 });
	res.json(products);
});

// GET /api/products/:id → one product
router.get("/:id", async (req, res) => {
	const product = await Product.findById(req.params.id).populate("category", "name slug");
	if (!product) return res.status(404).json({ message: "Product not found" });
	res.json(product);
});

// POST /api/products → create
router.post("/", async (req, res) => {
	const product = await Product.create(req.body);
	res.status(201).json(product);
});

// PUT /api/products/:id → update
router.put("/:id", async (req, res) => {
	const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		returnDocument: "after",
		runValidators: true,
	});
	if (!product) return res.status(404).json({ message: "Product not found" });
	res.json(product);
});

// DELETE /api/products/:id → delete
router.delete("/:id", async (req, res) => {
	const product = await Product.findByIdAndDelete(req.params.id);
	if (!product) return res.status(404).json({ message: "Product not found" });
	res.json({ message: "Product deleted" });
});

module.exports = router;