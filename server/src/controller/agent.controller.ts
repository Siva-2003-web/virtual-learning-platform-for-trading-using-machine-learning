// ============================================================================
// Agent API Controller – REST endpoints for the trading agent.
// ============================================================================

import { Request, Response } from "express";
import {
	getAgentState,
	startAgent,
	stopAgent,
	pauseAgent,
	updateWatchlist,
	setStrategy,
	updateRiskConfig,
	resetAgent,
	getAvailableStrategies,
	addBacktestResult,
} from "../agent/engine";
import { runBacktest } from "../agent/backtester";
import { getAnswer } from "../agent/chatbot";

/** GET /api/agent/status – current agent state */
const getStatus = async (_req: Request, res: Response) => {
	try {
		res.status(200).json(getAgentState());
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

/** POST /api/agent/start – start the agent loop */
const start = async (_req: Request, res: Response) => {
	try {
		const state = startAgent();
		res.status(200).json({ message: "Agent started", state });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

/** POST /api/agent/stop – stop the agent */
const stop = async (_req: Request, res: Response) => {
	try {
		const state = stopAgent();
		res.status(200).json({ message: "Agent stopped", state });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

/** POST /api/agent/pause – pause the agent */
const pause = async (_req: Request, res: Response) => {
	try {
		const state = pauseAgent();
		res.status(200).json({ message: "Agent paused", state });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

/** POST /api/agent/reset – reset agent to defaults */
const reset = async (_req: Request, res: Response) => {
	try {
		const state = resetAgent();
		res.status(200).json({ message: "Agent reset", state });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

/** PUT /api/agent/watchlist – update watchlist */
const setWatchlist = async (req: Request, res: Response) => {
	try {
		const { symbols } = req.body;
		if (!symbols || !Array.isArray(symbols)) {
			res.status(400).json({ error: "symbols array required" });
			return;
		}
		const state = updateWatchlist(symbols);
		res.status(200).json({ message: "Watchlist updated", state });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

/** PUT /api/agent/strategy – change active strategy */
const changeStrategy = async (req: Request, res: Response) => {
	try {
		const { strategy } = req.body;
		if (!strategy) {
			res.status(400).json({ error: "strategy name required" });
			return;
		}
		const state = setStrategy(strategy);
		res.status(200).json({ message: "Strategy changed", state });
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};

/** GET /api/agent/strategies – list all available strategies */
const listStrategies = async (_req: Request, res: Response) => {
	try {
		res.status(200).json({ strategies: getAvailableStrategies() });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

/** PUT /api/agent/risk – update risk configuration */
const changeRiskConfig = async (req: Request, res: Response) => {
	try {
		const state = updateRiskConfig(req.body);
		res.status(200).json({ message: "Risk config updated", state });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

/** POST /api/agent/backtest – run a backtest */
const backtest = async (req: Request, res: Response) => {
	try {
		const {
			symbols = ["AAPL"],
			strategyName = "composite",
			initialCash = 100000,
			startDate,
			endDate,
		} = req.body;

		const result = await runBacktest({
			symbols: Array.isArray(symbols) ? symbols : [symbols],
			strategyName,
			initialCash,
			startDate,
			endDate,
		});

		addBacktestResult(result);
		res.status(200).json(result);
	} catch (err: any) {
		console.error("[Backtest] Error:", err.message);
		res.status(500).json({ error: err.message });
	}
};

/** POST /api/agent/chat – ask a trading question */
const chat = async (req: Request, res: Response) => {
	try {
		const { message } = req.body;
		if (!message || !message.trim()) {
			res.status(400).json({ error: "message is required" });
			return;
		}
		const answer = await getAnswer(message);
		res.status(200).json({ question: message, answer });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

export default {
	getStatus,
	start,
	stop,
	pause,
	reset,
	setWatchlist,
	changeStrategy,
	listStrategies,
	changeRiskConfig,
	backtest,
	chat,
};
