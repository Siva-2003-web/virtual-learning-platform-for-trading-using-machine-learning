const morgan = require("morgan");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import yahooFinance from "yahoo-finance2";

// Config/initialization
const app = express();
app.set("trust proxy", 1);

// Suppress Yahoo Finance survey notices
yahooFinance.suppressNotices(["yahooSurvey"]);
try {
	yahooFinance.setGlobalConfig({ validation: { logErrors: true, logOptionsErrors: false } });
} catch (_) { }

// Docs
const { swaggerDocs } = require("./utils/swagger");

// Database
require("./utils/db");
require("./models/user.model");

// Explicit CORS - Universal Access
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(morgan("tiny"));
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
    res.status(200).send({ status: "Stellix Systems Online", timestamp: new Date().toISOString() });
});

// Ratelimiting
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500, // Increased limit for production
	standardHeaders: true, 
	legacyHeaders: false, 
});

const createAccountLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, 
	message: "Too many accounts created from this IP, please try again after an hour",
	standardHeaders: true, 
	legacyHeaders: false, 
});

app.use("/api/", apiLimiter);
app.use("/api/auth/signup", createAccountLimiter);

const PORT: number = parseInt(process.env.PORT || "3010");

// REST Routes
app.use(require("./routes"));

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
	swaggerDocs(app, PORT);
});
