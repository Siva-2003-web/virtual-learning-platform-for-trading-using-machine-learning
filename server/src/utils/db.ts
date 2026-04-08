import mongoose from "mongoose";
mongoose.Promise = global.Promise;

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/";

mongoose
	.connect(uri, {
		serverSelectionTimeoutMS: 10000,
		socketTimeoutMS: 45000,
	})
	.then(() => {
		console.log("Connected to Database");
	})
	.catch((err) => {
		console.error("Database connection error:", err);
	});

const db = mongoose.connection;

module.exports = db;
