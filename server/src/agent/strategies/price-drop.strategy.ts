// ============================================================================
// Strategy: Price-Drop (Phase 1 – Rule-Based)
// Buy when price drops significantly, sell on gains or stop-loss.
// ============================================================================

import { IStrategy, TradeSignal } from "../types";

export class PriceDropStrategy implements IStrategy {
	name = "price-drop";
	description =
		"Buys when the daily price drops more than a threshold, sells on gain or stop-loss. " +
		"Great beginner strategy using simple if/then rules.";

	private buyThreshold: number;   // e.g. -0.03 = buy on 3 % drop
	private sellThreshold: number;  // e.g.  0.05 = sell on 5 % gain
	private stopLoss: number;       // e.g. -0.07 = cut losses at 7 %

	constructor(
		buyThreshold = -0.03,
		sellThreshold = 0.05,
		stopLoss = -0.07,
	) {
		this.buyThreshold = buyThreshold;
		this.sellThreshold = sellThreshold;
		this.stopLoss = stopLoss;
	}

	evaluate(symbol: string, prices: number[], currentPrice: number): TradeSignal {
		if (prices.length < 2) {
			return this.hold(symbol, "Not enough data");
		}

		const previousClose = prices[prices.length - 2];
		const dailyChange = (currentPrice - previousClose) / previousClose;

		// Buy signal: daily drop exceeds threshold
		if (dailyChange <= this.buyThreshold) {
			return {
				action: "BUY",
				symbol,
				confidence: Math.min(Math.abs(dailyChange) / 0.10, 1),
				reason: `Price dropped ${(dailyChange * 100).toFixed(1)}% today — below ${(this.buyThreshold * 100).toFixed(0)}% threshold`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators: { dailyChange, previousClose, currentPrice },
			};
		}

		// Sell signal: daily gain exceeds sell threshold
		if (dailyChange >= this.sellThreshold) {
			return {
				action: "SELL",
				symbol,
				confidence: 0.8,
				reason: `Price gained ${(dailyChange * 100).toFixed(1)}% today — above ${(this.sellThreshold * 100).toFixed(0)}% target`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators: { dailyChange },
			};
		}

		return this.hold(symbol, `Daily change ${(dailyChange * 100).toFixed(1)}% — no trigger`);
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
