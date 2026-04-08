// ============================================================================
// Strategy: Composite (Phase 3 – Multi-Indicator Ensemble)
// Combines SMA, RSI, MACD, and Bollinger Bands for higher-accuracy signals.
// ============================================================================

import { IStrategy, TradeSignal } from "../types";
import { sma, rsi, macd, bollingerPosition, linearRegressionSlope } from "../indicators";

export class CompositeStrategy implements IStrategy {
	name = "composite";
	description =
		"Ensemble strategy that combines SMA trend, RSI, MACD, Bollinger Bands, " +
		"and linear regression. Each indicator votes BUY/SELL/HOLD and the " +
		"weighted score determines the final action — only trades on strong consensus.";

	evaluate(symbol: string, prices: number[], currentPrice: number): TradeSignal {
		if (prices.length < 60) {
			return this.hold(symbol, "Need at least 60 price points for composite analysis");
		}

		let buyScore = 0;
		let sellScore = 0;
		const reasons: string[] = [];
		const indicators: Record<string, number> = {};

		// --- 1. SMA Trend (weight 0.25) ---
		const sma20 = sma(prices, 20);
		const sma50 = sma(prices, 50);
		indicators.sma20 = sma20;
		indicators.sma50 = sma50;
		if (currentPrice > sma20 && sma20 > sma50) {
			buyScore += 0.25;
			reasons.push("SMA: bullish trend (price > SMA20 > SMA50)");
		} else if (currentPrice < sma20 && sma20 < sma50) {
			sellScore += 0.25;
			reasons.push("SMA: bearish trend (price < SMA20 < SMA50)");
		}

		// --- 2. RSI (weight 0.20) ---
		const rsiVal = rsi(prices, 14);
		indicators.rsi = rsiVal;
		if (rsiVal < 30) {
			buyScore += 0.20;
			reasons.push(`RSI: oversold (${rsiVal.toFixed(1)})`);
		} else if (rsiVal > 70) {
			sellScore += 0.20;
			reasons.push(`RSI: overbought (${rsiVal.toFixed(1)})`);
		} else if (rsiVal < 45) {
			buyScore += 0.10;
		} else if (rsiVal > 55) {
			sellScore += 0.10;
		}

		// --- 3. MACD (weight 0.25) ---
		const macdResult = macd(prices);
		indicators.macdHistogram = macdResult.histogram;
		if (macdResult.histogram > 0) {
			buyScore += 0.25;
			reasons.push("MACD: bullish histogram");
		} else {
			sellScore += 0.25;
			reasons.push("MACD: bearish histogram");
		}

		// --- 4. Bollinger Bands (weight 0.15) ---
		const bbPos = bollingerPosition(prices);
		indicators.bollingerPosition = bbPos;
		if (bbPos < -0.8) {
			buyScore += 0.15;
			reasons.push("Bollinger: near lower band (potential bounce)");
		} else if (bbPos > 0.8) {
			sellScore += 0.15;
			reasons.push("Bollinger: near upper band (potential pullback)");
		}

		// --- 5. Linear Regression (weight 0.15) ---
		const lrSlope = linearRegressionSlope(prices, 20);
		indicators.lrSlope = lrSlope;
		if (lrSlope > 0.002) {
			buyScore += 0.15;
			reasons.push(`LinReg: positive slope (${(lrSlope * 100).toFixed(2)}%/day)`);
		} else if (lrSlope < -0.002) {
			sellScore += 0.15;
			reasons.push(`LinReg: negative slope (${(lrSlope * 100).toFixed(2)}%/day)`);
		}

		// --- Decision ---
		const threshold = 0.55;

		if (buyScore >= threshold && buyScore > sellScore) {
			return {
				action: "BUY",
				symbol,
				confidence: Math.min(buyScore, 1),
				reason: `Strong BUY consensus (${(buyScore * 100).toFixed(0)}%): ${reasons.join("; ")}`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators,
			};
		}

		if (sellScore >= threshold && sellScore > buyScore) {
			return {
				action: "SELL",
				symbol,
				confidence: Math.min(sellScore, 1),
				reason: `Strong SELL consensus (${(sellScore * 100).toFixed(0)}%): ${reasons.join("; ")}`,
				strategy: this.name,
				timestamp: Date.now(),
				indicators,
			};
		}

		return this.hold(
			symbol,
			`No consensus — BUY ${(buyScore * 100).toFixed(0)}% vs SELL ${(sellScore * 100).toFixed(0)}%`,
		);
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
