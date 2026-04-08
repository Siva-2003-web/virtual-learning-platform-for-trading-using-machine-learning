const morgan = require("morgan");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
import express from "express";
import dotenv from "dotenv";
dotenv.config();

// Config/initialization
const app = express();

// 1. ABSOLUTE TOP: Universal CORS Guard
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.options("*", cors()); // Perfect pre-flight for all routes

app.set("trust proxy", 1);

// 2. Logging & Parsing
app.use(morgan("tiny"));
app.use(express.json());

// 3. Health Check (Instant response for Render)
app.get("/", (req, res) => {
    res.status(200).send({ status: "Stellix Systems Online", time: new Date().toISOString() });
});

// 4. Docs
const { swaggerDocs } = require("./utils/swagger");

// 5. Database & Models
require("./utils/db");
require("./models/user.model");

// 6. Security & Rate Limiting (Moved down to avoid blocking health checks)
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1000, // Very generous for testing
	standardHeaders: true, 
	legacyHeaders: false, 
});
app.use("/api/", apiLimiter);

// 7. REST Routes
app.use(require("./routes"));

const PORT: number = parseInt(process.env.PORT || "3010");

app.listen(PORT, () => {
	console.log(`[🚀] Stellix Server Active on Port ${PORT}`);
	swaggerDocs(app, PORT);
});
