// ============================================================================
// Agent Engine – the main observe-decide-act loop that ties everything together.
// ============================================================================

import {
	AgentState,
	AgentStatus,
	TradeSignal,
	TradeRecord,
	AgentPosition,
	PortfolioSnapshot,
	BacktestResult,
	DEFAULT_RISK_CONFIG,
} from "./types";
import { getStrategy, getAllStrategies } from "./strategies";
import { RiskManager } from "./risk-manager";
import { fetchStockData, fetchHistoricalStockData } from "../utils/requests";

// ---------------------------------------------------------------------------
// Singleton agent state
// ---------------------------------------------------------------------------

let agentState: AgentState = {
	status: "idle",
	watchlist: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
	activeStrategy: "composite",
	riskConfig: { ...DEFAULT_RISK_CONFIG },
	portfolio: {
		timestamp: Date.now(),
		cash: 100_000,
		positions: [],
		totalValue: 100_000,
		dailyReturn: 0,
	},
	recentSignals: [],
	recentTrades: [],
	backtestResults: [],
	startedAt: null,
	lastTickAt: null,
	error: null,
};

const riskManager = new RiskManager();
let tickInterval: ReturnType<typeof setInterval> | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAgentState(): AgentState {
	return { ...agentState };
}

export function startAgent(): AgentState {
	if (agentState.status === "running") return agentState;
	agentState.status = "running";
	agentState.startedAt = Date.now();
	agentState.error = null;

	// Run a tick immediately then every 5 minutes
	runTick();
	tickInterval = setInterval(runTick, 5 * 60 * 1000);
	return agentState;
}

export function stopAgent(): AgentState {
	if (tickInterval) {
		clearInterval(tickInterval);
		tickInterval = null;
	}
	agentState.status = "idle";
	return agentState;
}

export function pauseAgent(): AgentState {
	if (tickInterval) {
		clearInterval(tickInterval);
		tickInterval = null;
	}
	agentState.status = "paused";
	return agentState;
}

export function updateWatchlist(symbols: string[]): AgentState {
	agentState.watchlist = symbols.map((s) => s.toUpperCase());
	return agentState;
}

export function setStrategy(name: string): AgentState {
	const s = getStrategy(name);
	if (!s) throw new Error("Unknown strategy: " + name);
	agentState.activeStrategy = name;
	return agentState;
}

export function updateRiskConfig(
	patch: Partial<typeof DEFAULT_RISK_CONFIG>,
): AgentState {
	agentState.riskConfig = { ...agentState.riskConfig, ...patch };
	riskManager.updateConfig(patch);
	return agentState;
}

export function resetAgent(): AgentState {
	stopAgent();
	agentState = {
		status: "idle",
		watchlist: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
		activeStrategy: "composite",
		riskConfig: { ...DEFAULT_RISK_CONFIG },
		portfolio: {
			timestamp: Date.now(),
			cash: 100_000,
			positions: [],
			totalValue: 100_000,
			dailyReturn: 0,
		},
		recentSignals: [],
		recentTrades: [],
		backtestResults: [],
		startedAt: null,
		lastTickAt: null,
		error: null,
	};
	return agentState;
}

export function addBacktestResult(result: BacktestResult): void {
	agentState.backtestResults.unshift(result);
	// Keep only last 10
	if (agentState.backtestResults.length > 10) {
		agentState.backtestResults = agentState.backtestResults.slice(0, 10);
	}
}

export function getAvailableStrategies() {
	return getAllStrategies().map((s) => ({
		name: s.name,
		description: s.description,
	}));
}

// ---------------------------------------------------------------------------
// Core Tick – observe → decide → act → record
// ---------------------------------------------------------------------------

async function runTick(): Promise<void> {
	if (agentState.status !== "running") return;

	try {
		const strategy = getStrategy(agentState.activeStrategy);
		if (!strategy) {
			agentState.error = "Strategy not found: " + agentState.activeStrategy;
			return;
		}

		const signals: TradeSignal[] = [];
		const prevTotalValue = agentState.portfolio.totalValue;

		for (const symbol of agentState.watchlist) {
			try {
				// 1. OBSERVE – fetch current + historical prices
				const [quote, historical] = await Promise.all([
					fetchStockData(symbol),
					fetchHistoricalStockData(symbol, "6m"),
				]);

				const currentPrice = quote.regularMarketPrice;
				if (!currentPrice || currentPrice <= 0) continue;

				// Build close price series
				const closePrices: number[] = Array.isArray(historical)
					? historical.map((d: number[]) => d[1]).filter(Boolean)
					: [];
				if (closePrices.length < 10) continue;

				// Update held position prices
				for (const pos of agentState.portfolio.positions) {
					if (pos.symbol === symbol) {
						pos.currentPrice = currentPrice;
						pos.unrealisedPnl =
							(currentPrice - pos.entryPrice) * pos.quantity;
					}
				}

				// 2. DECIDE – evaluate strategy
				const signal = strategy.evaluate(symbol, closePrices, currentPrice);
				signals.push(signal);

				// Check risk-manager forced closes
				for (let i = agentState.portfolio.positions.length - 1; i >= 0; i--) {
					const pos = agentState.portfolio.positions[i];
					if (pos.symbol !== symbol) continue;
					const check = riskManager.checkPositionLimits(pos);
					if (check.shouldClose) {
						// Force sell
						const pnl = (currentPrice - pos.entryPrice) * pos.quantity;
						agentState.portfolio.cash += currentPrice * pos.quantity;
						const trade: TradeRecord = {
							id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
							symbol,
							action: "SELL",
							quantity: pos.quantity,
							price: currentPrice,
							timestamp: Date.now(),
							strategy: "risk-manager",
							reason: check.reason,
							pnl,
						};
						agentState.recentTrades.unshift(trade);
						agentState.portfolio.positions.splice(i, 1);
					}
				}

				// 3. ACT
				const todayStart = new Date();
				todayStart.setHours(0, 0, 0, 0);
				const todaysTrades = agentState.recentTrades.filter(
					(t) => t.timestamp >= todayStart.getTime(),
				);

				if (signal.action === "BUY") {
					const totalValue =
						agentState.portfolio.cash +
						agentState.portfolio.positions.reduce(
							(s, p) => s + p.quantity * (p.currentPrice ?? p.entryPrice),
							0,
						);
					const { quantity, reason } = riskManager.calculateBuyQuantity(
						signal,
						agentState.portfolio.cash,
						totalValue,
						currentPrice,
						agentState.portfolio.positions,
						todaysTrades,
					);
					if (quantity > 0) {
						agentState.portfolio.cash -= currentPrice * quantity;
						agentState.portfolio.positions.push({
							symbol,
							quantity,
							entryPrice: currentPrice,
							entryDate: Date.now(),
							currentPrice,
							unrealisedPnl: 0,
						});
						agentState.recentTrades.unshift({
							id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
							symbol,
							action: "BUY",
							quantity,
							price: currentPrice,
							timestamp: Date.now(),
							strategy: strategy.name,
							reason: signal.reason,
						});
					}
				} else if (signal.action === "SELL") {
					for (let i = agentState.portfolio.positions.length - 1; i >= 0; i--) {
						const pos = agentState.portfolio.positions[i];
						if (pos.symbol === symbol) {
							const pnl = (currentPrice - pos.entryPrice) * pos.quantity;
							agentState.portfolio.cash += currentPrice * pos.quantity;
							agentState.recentTrades.unshift({
								id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
								symbol,
								action: "SELL",
								quantity: pos.quantity,
								price: currentPrice,
								timestamp: Date.now(),
								strategy: strategy.name,
								reason: signal.reason,
								pnl,
							});
							agentState.portfolio.positions.splice(i, 1);
						}
					}
				}
			} catch (err: any) {
				console.warn(`[Agent] Error processing ${symbol}:`, err.message);
			}
		}

		// 4. RECORD
		agentState.recentSignals = signals;
		const newTotalValue =
			agentState.portfolio.cash +
			agentState.portfolio.positions.reduce(
				(s, p) => s + p.quantity * (p.currentPrice ?? p.entryPrice),
				0,
			);
		agentState.portfolio.totalValue =
			Math.round(newTotalValue * 100) / 100;
		agentState.portfolio.dailyReturn =
			prevTotalValue > 0
				? Math.round(
						((newTotalValue - prevTotalValue) / prevTotalValue) * 10000,
					) / 100
				: 0;
		agentState.portfolio.timestamp = Date.now();
		agentState.lastTickAt = Date.now();

		// Trim trades to last 100
		if (agentState.recentTrades.length > 100) {
			agentState.recentTrades = agentState.recentTrades.slice(0, 100);
		}
	} catch (err: any) {
		agentState.error = err.message;
		console.error("[Agent] Tick error:", err);
	}
}
