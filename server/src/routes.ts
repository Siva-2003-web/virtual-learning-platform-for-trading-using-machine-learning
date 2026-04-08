import express from "express";
const router = express.Router();
import { verifySignUp, authJwt } from "./middleware";
import authController from "./controller/auth.controller";
import userController from "./controller/user.controller";
import stocksController from "./controller/stocks.controller";
import newsController from "./controller/news.controller";
import leaderboardController from "./controller/leaderboard.controller";
import debugController from "./controller/debug.controller";
import predictionController from "./controller/prediction.controller";
import analysisController from "./controller/analysis.controller";
import agentController from "./controller/agent.controller";

// Auth routes
router.post(
	"/api/auth/signup",
	[verifySignUp.checkDuplicateUsername],
	authController.signup
);
router.post("/api/auth/login", authController.login);

// User data routes
router.get("/api/user/ledger", [authJwt.verifyToken], userController.getLedger);
router.get(
	"/api/user/holdings",
	[authJwt.verifyToken],
	userController.getHoldings
);
router.get(
	"/api/user/portfolio",
	[authJwt.verifyToken],
	userController.getPortfolio
);
router.get("/api/user/leaderboard", leaderboardController.getLeaderboard);

// User watchlist routes
router.get(
	"/api/user/watchlist",
	[authJwt.verifyToken],
	userController.getWatchlist
);
router.post(
	"/api/user/watchlist/add/:symbol",
	[authJwt.verifyToken],
	userController.addToWatchlist
);
router.post(
	"/api/user/watchlist/remove/:symbol",
	[authJwt.verifyToken],
	userController.removeFromWatchlist
);

// Stocks routes
router.get("/api/stocks/search/:query", stocksController.search);
router.get("/api/stocks/:symbol/info", stocksController.getInfo);
router.get("/api/stocks/:symbol/historical", stocksController.getHistorical);

router.post(
	"/api/stocks/:symbol/buy",
	[authJwt.verifyToken],
	stocksController.buyStock
);

router.post(
	"/api/stocks/:symbol/sell",
	[authJwt.verifyToken],
	stocksController.sellStock
);

// News routes
router.get("/api/news", newsController.getNews);
router.get("/api/news/:symbol", newsController.getNews);

// Prediction routes (ML service)
router.get("/api/stocks/:symbol/predict", predictionController.getPrediction);
router.post("/api/predict/batch", predictionController.batchPrediction);

// Analysis routes (Price movement insights)
router.get("/api/stocks/:symbol/analysis", analysisController.getAnalysis);

// Development-only debug routes (do not enable in production)
router.get("/api/debug/user/:username", debugController.getUserRaw);

// ── Trading Agent routes ─────────────────────────────────────────────────
router.get("/api/agent/status", agentController.getStatus);
router.get("/api/agent/strategies", agentController.listStrategies);
router.post("/api/agent/start", agentController.start);
router.post("/api/agent/stop", agentController.stop);
router.post("/api/agent/pause", agentController.pause);
router.post("/api/agent/reset", agentController.reset);
router.put("/api/agent/watchlist", agentController.setWatchlist);
router.put("/api/agent/strategy", agentController.changeStrategy);
router.put("/api/agent/risk", agentController.changeRiskConfig);
router.post("/api/agent/backtest", agentController.backtest);
router.post("/api/agent/chat", agentController.chat);

module.exports = router;
