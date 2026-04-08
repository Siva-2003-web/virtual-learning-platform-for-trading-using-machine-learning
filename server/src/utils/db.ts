import mongoose from "mongoose";
mongoose.Promise = global.Promise;

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/";
mongoose.connect(uri);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

db.once("open", () => {
	console.log("Connected to Database");
});

module.exports = db;
