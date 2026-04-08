// ============================================================================
// Strategy: MACD Momentum (Phase 2 – Technical Indicators)
// Buys on bullish MACD crossover, sells on bearish crossover.
// ============================================================================

import { IStrategy, TradeSignal } from "../types";
import { macd } from "../indicators";

export class MacdStrategy implements IStrategy {
	name = "macd";
	description =
		"MACD momentum strategy — buys when MACD line crosses above the signal " +
		"line (bullish), sells when it crosses below (bearish). Uses histogram " +
		"strength for confidence scoring.";

	private fastPeriod: number;
	private slowPeriod: number;
	private signalPeriod: number;

	constructor(fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
		this.fastPeriod = fastPeriod;
		this.slowPeriod = slowPeriod;
		this.signalPeriod = signalPeriod;
	}

	evaluate(symbol: string, prices: number[], currentPrice: number): TradeSignal {
		if (prices.length < this.slowPeriod + this.signalPeriod) {
			return this.hold(symbol, "Not enough data for MACD calculation");
		}

		// Current MACD
		const current = macd(prices, this.fastPeriod, this.slowPeriod, this.signalPeriod);
		// Previous MACD (exclude last price)
		const prev = macd(
			prices.slice(0, -1),
			this.fastPeriod,
			this.slowPeriod,
			this.signalPeriod,
		);

		// Bullish crossover: histogram was negative, now positive
		if (prev.histogram <= 0 && current.histogram > 0) {
			return {
				action: "BUY",
				symbol,
				confidence: Math.min(Math.abs(current.histogram / currentPrice) * 500 + 0.5, 1),
				reason: `Bullish MACD crossover — histogram turned positive (${current.histogram.toFixed(3)})`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators: {
					macd: current.macd,
					signal: current.signal,
					histogram: current.histogram,
				},
			};
		}

		// Bearish crossover: histogram was positive, now negative
		if (prev.histogram >= 0 && current.histogram < 0) {
			return {
				action: "SELL",
				symbol,
				confidence: Math.min(Math.abs(current.histogram / currentPrice) * 500 + 0.5, 1),
				reason: `Bearish MACD crossover — histogram turned negative (${current.histogram.toFixed(3)})`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators: {
					macd: current.macd,
					signal: current.signal,
					histogram: current.histogram,
				},
			};
		}

		const trend = current.histogram > 0 ? "bullish" : "bearish";
		return this.hold(symbol, `MACD histogram ${trend} (${current.histogram.toFixed(3)}) — no crossover`);
	}

	private hold(symbol: string, reason: string): TradeSignal {
		return {
			action: "HOLD",
			symbol,
			confidence: 0.5,
			reason,
			strategy: this.name,
			timestamp: Date.now(),
		};
	}
}
