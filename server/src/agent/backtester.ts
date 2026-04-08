// ============================================================================
// Backtester – replays historical data through a strategy to measure performance.
// ============================================================================

import {
	BacktestConfig,
	BacktestResult,
	TradeRecord,
	AgentPosition,
} from "./types";
import { getStrategy } from "./strategies";
import { RiskManager } from "./risk-manager";
import { stddev } from "./indicators";
import axios from "axios";

const YAHOO_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	Accept: "application/json",
	Referer: "https://finance.yahoo.com/",
};

interface HistoricalBar {
	date: number; // unix ms
	close: number;
}

/** Fetch daily closing prices for backtesting. */
async function fetchBacktestPrices(symbol: string): Promise<HistoricalBar[]> {
	const urls = [
		`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
		`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
	];

	for (const url of urls) {
		try {
			const res = await axios.get(url, {
				params: { range: "2y", interval: "1d" },
				headers: YAHOO_HEADERS,
				timeout: 15000,
			});
			const result = res.data?.chart?.result?.[0];
			if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) continue;

			const timestamps: number[] = result.timestamp;
			const closes: (number | null)[] = result.indicators.quote[0].close;
			const bars: HistoricalBar[] = [];
			for (let i = 0; i < timestamps.length; i++) {
				if (closes[i] != null) {
					bars.push({ date: timestamps[i] * 1000, close: closes[i] as number });
				}
			}
			return bars;
		} catch {
			continue;
		}
	}
	throw new Error("Failed to fetch backtest data for " + symbol);
}

/**
 * Run a full backtest.
 */
export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
	const strategy = getStrategy(config.strategyName);
	if (!strategy) throw new Error("Unknown strategy: " + config.strategyName);

	const riskManager = new RiskManager();

	// Fetch data for all symbols
	const allPrices = new Map<string, HistoricalBar[]>();
	for (const sym of config.symbols) {
		const bars = await fetchBacktestPrices(sym);
		allPrices.set(sym, bars);
	}

	// Determine date range
	let allDates = new Set<number>();
	for (const bars of allPrices.values()) {
		for (const b of bars) allDates.add(b.date);
	}
	let sortedDates = Array.from(allDates).sort((a, b) => a - b);

	if (config.startDate) {
		const start = new Date(config.startDate).getTime();
		sortedDates = sortedDates.filter((d) => d >= start);
	}
	if (config.endDate) {
		const end = new Date(config.endDate).getTime();
		sortedDates = sortedDates.filter((d) => d <= end);
	}

	// State
	let cash = config.initialCash;
	const positions: AgentPosition[] = [];
	const trades: TradeRecord[] = [];
	const equityCurve: { date: number; value: number }[] = [];
	let tradeCounter = 0;

	// Pre-index: for each symbol, build a lookup from date → cumulative prices
	const priceHistoryBySymbol = new Map<string, Map<number, number[]>>();
	for (const [sym, bars] of allPrices.entries()) {
		const lookup = new Map<number, number[]>();
		for (let i = 0; i < bars.length; i++) {
			lookup.set(bars[i].date, bars.slice(0, i + 1).map((b) => b.close));
		}
		priceHistoryBySymbol.set(sym, lookup);
	}

	// Walk through each date
	for (const date of sortedDates) {
		// Update current prices for held positions
		for (const pos of positions) {
			const lookup = priceHistoryBySymbol.get(pos.symbol);
			const cumPrices = lookup?.get(date);
			if (cumPrices) {
				pos.currentPrice = cumPrices[cumPrices.length - 1];
				pos.unrealisedPnl =
					(pos.currentPrice - pos.entryPrice) * pos.quantity;
			}
		}

		// Check stop-loss / take-profit on existing positions
		for (let i = positions.length - 1; i >= 0; i--) {
			const pos = positions[i];
			const check = riskManager.checkPositionLimits(pos);
			if (check.shouldClose && pos.currentPrice) {
				const pnl = (pos.currentPrice - pos.entryPrice) * pos.quantity;
				cash += pos.currentPrice * pos.quantity;
				trades.push({
					id: `bt-${++tradeCounter}`,
					symbol: pos.symbol,
					action: "SELL",
					quantity: pos.quantity,
					price: pos.currentPrice,
					timestamp: date,
					strategy: "risk-manager",
					reason: check.reason,
					pnl,
				});
				positions.splice(i, 1);
			}
		}

		// Evaluate strategy for each symbol
		const todaysTrades = trades.filter((t) => t.timestamp === date);

		for (const sym of config.symbols) {
			const lookup = priceHistoryBySymbol.get(sym);
			const cumPrices = lookup?.get(date);
			if (!cumPrices || cumPrices.length < 2) continue;

			const currentPrice = cumPrices[cumPrices.length - 1];
			const signal = strategy.evaluate(sym, cumPrices, currentPrice);

			if (signal.action === "BUY") {
				const totalValue =
					cash +
					positions.reduce(
						(s, p) => s + p.quantity * (p.currentPrice ?? p.entryPrice),
						0,
					);
				const { quantity } = riskManager.calculateBuyQuantity(
					signal,
					cash,
					totalValue,
					currentPrice,
					positions,
					todaysTrades,
				);
				if (quantity > 0) {
					cash -= currentPrice * quantity;
					positions.push({
						symbol: sym,
						quantity,
						entryPrice: currentPrice,
						entryDate: date,
						currentPrice,
						unrealisedPnl: 0,
					});
					trades.push({
						id: `bt-${++tradeCounter}`,
						symbol: sym,
						action: "BUY",
						quantity,
						price: currentPrice,
						timestamp: date,
						strategy: strategy.name,
						reason: signal.reason,
					});
				}
			} else if (signal.action === "SELL") {
				// Sell all shares of this symbol
				for (let i = positions.length - 1; i >= 0; i--) {
					if (positions[i].symbol === sym) {
						const pos = positions[i];
						const pnl = (currentPrice - pos.entryPrice) * pos.quantity;
						cash += currentPrice * pos.quantity;
						trades.push({
							id: `bt-${++tradeCounter}`,
							symbol: sym,
							action: "SELL",
							quantity: pos.quantity,
							price: currentPrice,
							timestamp: date,
							strategy: strategy.name,
							reason: signal.reason,
							pnl,
						});
						positions.splice(i, 1);
					}
				}
			}
		}

		// Record equity curve
		const portfolioValue =
			cash +
			positions.reduce(
				(s, p) => s + p.quantity * (p.currentPrice ?? p.entryPrice),
				0,
			);
		equityCurve.push({ date, value: Math.round(portfolioValue * 100) / 100 });
	}

	// Compute final stats
	const finalValue =
		cash +
		positions.reduce(
			(s, p) => s + p.quantity * (p.currentPrice ?? p.entryPrice),
			0,
		);
	const totalReturn =
		((finalValue - config.initialCash) / config.initialCash) * 100;
	const daysElapsed =
		(sortedDates[sortedDates.length - 1] - sortedDates[0]) / (1000 * 60 * 60 * 24);
	const yearsElapsed = daysElapsed / 365.25;
	const annualisedReturn =
		yearsElapsed > 0
			? (Math.pow(finalValue / config.initialCash, 1 / yearsElapsed) - 1) * 100
			: totalReturn;

	// Max drawdown
	let peak = -Infinity;
	let maxDrawdown = 0;
	for (const pt of equityCurve) {
		if (pt.value > peak) peak = pt.value;
		const dd = (peak - pt.value) / peak;
		if (dd > maxDrawdown) maxDrawdown = dd;
	}

	// Sharpe ratio (annualised)
	const dailyReturns: number[] = [];
	for (let i = 1; i < equityCurve.length; i++) {
		dailyReturns.push(
			(equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value,
		);
	}
	const avgDailyReturn =
		dailyReturns.length > 0
			? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
			: 0;
	const dailyStdDev = dailyReturns.length > 1 ? stddev(dailyReturns) : 1;
	const sharpeRatio =
		dailyStdDev > 0 ? (avgDailyReturn / dailyStdDev) * Math.sqrt(252) : 0;

	// Win rate
	const sellTrades = trades.filter((t) => t.action === "SELL" && t.pnl !== undefined);
	const wins = sellTrades.filter((t) => (t.pnl ?? 0) > 0).length;
	const winRate = sellTrades.length > 0 ? (wins / sellTrades.length) * 100 : 0;

	return {
		strategyName: config.strategyName,
		symbols: config.symbols,
		startDate: new Date(sortedDates[0]).toISOString().split("T")[0],
		endDate: new Date(sortedDates[sortedDates.length - 1]).toISOString().split("T")[0],
		initialCash: config.initialCash,
		finalValue: Math.round(finalValue * 100) / 100,
		totalReturn: Math.round(totalReturn * 100) / 100,
		annualisedReturn: Math.round(annualisedReturn * 100) / 100,
		maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
		sharpeRatio: Math.round(sharpeRatio * 100) / 100,
		totalTrades: trades.length,
		winRate: Math.round(winRate * 100) / 100,
		trades,
		equityCurve,
	};
}
