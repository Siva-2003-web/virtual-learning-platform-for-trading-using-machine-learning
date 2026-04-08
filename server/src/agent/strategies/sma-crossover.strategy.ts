// ============================================================================
// Strategy: SMA Crossover (Phase 2 – Technical Indicators)
// Golden Cross (buy) / Death Cross (sell) using two moving averages.
// ============================================================================

import { IStrategy, TradeSignal } from "../types";
import { smaSeries } from "../indicators";

export class SmaCrossoverStrategy implements IStrategy {
	name = "sma-crossover";
	description =
		"Uses a fast and slow Simple Moving Average. When the fast SMA crosses " +
		"above the slow SMA (Golden Cross) → BUY. When it crosses below (Death Cross) → SELL.";

	private shortPeriod: number;
	private longPeriod: number;

	constructor(shortPeriod = 20, longPeriod = 50) {
		this.shortPeriod = shortPeriod;
		this.longPeriod = longPeriod;
	}

	evaluate(symbol: string, prices: number[], _currentPrice: number): TradeSignal {
		if (prices.length < this.longPeriod + 2) {
			return this.hold(symbol, `Need at least ${this.longPeriod + 2} price points`);
		}

		const shortSma = smaSeries(prices, this.shortPeriod);
		const longSma = smaSeries(prices, this.longPeriod);

		// Align arrays
		const offset = shortSma.length - longSma.length;
		const curShort = shortSma[shortSma.length - 1];
		const prevShort = shortSma[shortSma.length - 2];
		const curLong = longSma[longSma.length - 1];
		const prevLong = longSma[longSma.length - 2];

		// Golden Cross: short crosses above long
		if (prevShort <= prevLong && curShort > curLong) {
			return {
				action: "BUY",
				symbol,
				confidence: 0.75,
				reason: `Golden Cross — SMA(${this.shortPeriod}) crossed above SMA(${this.longPeriod})`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators: { shortSma: curShort, longSma: curLong },
			};
		}

		// Death Cross: short crosses below long
		if (prevShort >= prevLong && curShort < curLong) {
			return {
				action: "SELL",
				symbol,
				confidence: 0.75,
				reason: `Death Cross — SMA(${this.shortPeriod}) crossed below SMA(${this.longPeriod})`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators: { shortSma: curShort, longSma: curLong },
			};
		}

		const trend = curShort > curLong ? "bullish" : "bearish";
		return this.hold(symbol, `No crossover — trend is ${trend}`);
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
