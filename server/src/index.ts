import morgan from "morgan";
import cors from "cors";
const { rateLimit } = require("express-rate-limit");
import express, { Express, Request, Response } from "express";
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
import "./utils/db";
import "./models/user.model";

// Middleware
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

// Ratelimiting
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 250, // Limit each IP
	standardHeaders: true, 
	legacyHeaders: false, 
});

const createAccountLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 5, 
	message: "Too many accounts created from this IP, please try again after an hour",
	standardHeaders: true, 
	legacyHeaders: false, 
});

app.use("/api/", apiLimiter);
app.use("/api/auth/signup", createAccountLimiter);

const PORT: number = parseInt(process.env.PORT || "10000");

// REST Routes
app.use(require("./routes"));

app.listen(PORT, async () => {
	console.log(`Server listening on port ${PORT}`);
	swaggerDocs(app, PORT);
});
