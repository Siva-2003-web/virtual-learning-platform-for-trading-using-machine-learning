// ============================================================================
// Strategy: RSI Mean-Reversion (Phase 2 – Technical Indicators)
// Buys oversold stocks, sells overbought stocks based on RSI.
// ============================================================================

import { IStrategy, TradeSignal } from "../types";
import { rsi } from "../indicators";

export class RsiStrategy implements IStrategy {
	name = "rsi";
	description =
		"Relative Strength Index strategy — buys when RSI drops below the oversold " +
		"threshold (default 30), sells when RSI rises above the overbought threshold (default 70).";

	private oversold: number;
	private overbought: number;
	private period: number;

	constructor(oversold = 30, overbought = 70, period = 14) {
		this.oversold = oversold;
		this.overbought = overbought;
		this.period = period;
	}

	evaluate(symbol: string, prices: number[], _currentPrice: number): TradeSignal {
		if (prices.length < this.period + 1) {
			return this.hold(symbol, `Need at least ${this.period + 1} price points`);
		}

		const currentRsi = rsi(prices, this.period);

		if (currentRsi <= this.oversold) {
			return {
				action: "BUY",
				symbol,
				confidence: Math.min((this.oversold - currentRsi) / 20 + 0.6, 1),
				reason: `RSI = ${currentRsi.toFixed(1)} — stock is oversold (< ${this.oversold})`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators: { rsi: currentRsi },
			};
		}

		if (currentRsi >= this.overbought) {
			return {
				action: "SELL",
				symbol,
				confidence: Math.min((currentRsi - this.overbought) / 20 + 0.6, 1),
				reason: `RSI = ${currentRsi.toFixed(1)} — stock is overbought (> ${this.overbought})`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators: { rsi: currentRsi },
			};
		}

		return this.hold(symbol, `RSI = ${currentRsi.toFixed(1)} — neutral zone`);
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
