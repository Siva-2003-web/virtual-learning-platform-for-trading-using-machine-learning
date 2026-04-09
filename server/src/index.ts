const morgan = require("morgan");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
import express from "express";
import dotenv from "dotenv";
import yahooFinance from "yahoo-finance2";
dotenv.config();

// Config/initialization
const app = express();

// 1. ABSOLUTE TOP: Universal CORS Guard (Fixes Pre-flight errors)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204
}));
app.options("*", cors()); 

app.set("trust proxy", 1);

// 2. Yahoo Finance Security
yahooFinance.suppressNotices(["yahooSurvey"]);

// 3. Logging & Parsing
app.use(morgan("tiny"));
app.use(express.json());

// 4. Health Check (Instant response for Render)
app.get("/", (req, res) => {
    res.status(200).send({ status: "Stellix Systems Online", time: new Date().toISOString() });
});

// 5. Docs
const { swaggerDocs } = require("./utils/swagger");

// 6. Database & Models
require("./utils/db");
require("./models/user.model");

// 7. Security & Rate Limiting
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1000, 
	standardHeaders: true, 
	legacyHeaders: false, 
});
app.use("/api/", apiLimiter);

// 8. REST Routes
app.use(require("./routes"));

const PORT: number = parseInt(process.env.PORT || "3010");

app.listen(PORT, () => {
	console.log(`[🚀] Stellix Server Active on Port ${PORT}`);
	swaggerDocs(app, PORT);
});
