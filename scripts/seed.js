require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

async function seed() {
	await mongoose.connect(process.env.MONGO_URI);
	console.log("Connected. Clearing old seed data...");

	// Careful: this deletes everything in these collections.
	await Product.deleteMany({});
	await Category.deleteMany({});
	await User.deleteMany({ passwordHash: "not-set-yet" });

	const [keyboards, mice] = await Category.insertMany([
		{ name: "Keyboards", slug: "keyboards" },
		{ name: "Mice", slug: "mice" },
	]);
	const [mechanical, wireless] = await Category.insertMany([
		{ name: "Mechanical keyboards", slug: "mechanical-keyboards", parent: keyboards._id },
		{ name: "Wireless keyboards", slug: "wireless-keyboards", parent: keyboards._id },
	]);
	await Product.insertMany([
		{ title: "Forge 75 Mechanical Keyboard", description: "Hot-swappable, 75% layout.", price: 89, stock: 14, category: mechanical._id },
		{ title: "Anvil TKL Mechanical Keyboard", description: "Tenkeyless, brown switches.", price: 69, stock: 20, category: mechanical._id },
		{ title: "Breeze Wireless Keyboard", description: "Slim, 3 device pairing.", price: 49, stock: 30, category: wireless._id },
		{ title: "Orbit Wireless Mouse", description: "Quiet clicks, 6 month battery.", price: 29, stock: 40, category: mice._id },
		{ title: "Falcon Gaming Mouse", description: "8000 DPI, 6 buttons.", price: 39, stock: 0, category: mice._id },
	]);

	await User.insertMany([
		{ name: "Admin Test", email: "admin@example.com", passwordHash: "not-set-yet", role: "admin" },
		{ name: "Nika Beridze", email: "nika@example.com", passwordHash: "not-set-yet" },
		{ name: "Mari Kapanadze", email: "mari@example.com", passwordHash: "not-set-yet" },
		{ name: "Luka Gelashvili", email: "luka@example.com", passwordHash: "not-set-yet" },
		{ name: "Ana Japaridze", email: "ana@example.com", passwordHash: "not-set-yet" },
		{ name: "Blocked Test", email: "blocked@example.com", passwordHash: "not-set-yet", isBlocked: true },
	]);

	console.log(
		`Done: ${await Category.countDocuments()} categories, ${await Product.countDocuments()} products, ${await User.countDocuments()} users.`
	);
	await mongoose.disconnect();
}

seed().catch((err) => {
	console.error("Seed failed:", err.message);
	process.exit(1);
});