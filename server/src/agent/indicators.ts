// ============================================================================
// Technical Indicator Helpers (shared by strategies & backtester)
// ============================================================================

/** Simple Moving Average over the last `period` values. */
export function sma(prices: number[], period: number): number {
	if (prices.length < period) return prices[prices.length - 1] ?? 0;
	const slice = prices.slice(-period);
	return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/** Full SMA series – one value per element starting after enough data. */
export function smaSeries(prices: number[], period: number): number[] {
	const result: number[] = [];
	for (let i = period - 1; i < prices.length; i++) {
		let sum = 0;
		for (let j = i - period + 1; j <= i; j++) sum += prices[j];
		result.push(sum / period);
	}
	return result;
}

/** Exponential Moving Average. */
export function ema(prices: number[], period: number): number {
	if (prices.length === 0) return 0;
	const k = 2 / (period + 1);
	let val = prices[0];
	for (let i = 1; i < prices.length; i++) {
		val = prices[i] * k + val * (1 - k);
	}
	return val;
}

/** Full EMA series. */
export function emaSeries(prices: number[], period: number): number[] {
	if (prices.length === 0) return [];
	const k = 2 / (period + 1);
	const result: number[] = [prices[0]];
	for (let i = 1; i < prices.length; i++) {
		result.push(prices[i] * k + result[i - 1] * (1 - k));
	}
	return result;
}

/**
 * Relative Strength Index (0-100).
 * RSI > 70  → overbought
 * RSI < 30  → oversold
 */
export function rsi(prices: number[], period: number = 14): number {
	if (prices.length < period + 1) return 50;
	let gains = 0;
	let losses = 0;
	for (let i = prices.length - period; i < prices.length; i++) {
		const change = prices[i] - prices[i - 1];
		if (change > 0) gains += change;
		else losses -= change;
	}
	if (losses === 0) return 100;
	const rs = gains / losses;
	return 100 - 100 / (1 + rs);
}

/**
 * MACD (Moving Average Convergence Divergence).
 * Returns { macd, signal, histogram }.
 */
export function macd(
	prices: number[],
	fastPeriod: number = 12,
	slowPeriod: number = 26,
	signalPeriod: number = 9,
): { macd: number; signal: number; histogram: number } {
	const fastEma = ema(prices, fastPeriod);
	const slowEma = ema(prices, slowPeriod);
	const macdVal = fastEma - slowEma;

	// Build a mini MACD series to compute the signal line
	const fastSeries = emaSeries(prices, fastPeriod);
	const slowSeries = emaSeries(prices, slowPeriod);
	const minLen = Math.min(fastSeries.length, slowSeries.length);
	const offset = fastSeries.length - minLen;
	const macdSeries: number[] = [];
	for (let i = 0; i < minLen; i++) {
		macdSeries.push(fastSeries[i + offset] - slowSeries[i]);
	}
	const signalVal = ema(macdSeries, signalPeriod);
	return { macd: macdVal, signal: signalVal, histogram: macdVal - signalVal };
}

/**
 * Bollinger Band position: -1 (at lower band) to +1 (at upper band).
 */
export function bollingerPosition(prices: number[], period: number = 20): number {
	const data = prices.slice(-period);
	const mean = data.reduce((a, b) => a + b, 0) / data.length;
	const variance = data.reduce((sum, p) => sum + (p - mean) ** 2, 0) / data.length;
	const stdDev = Math.sqrt(variance);
	if (stdDev === 0) return 0;
	const current = prices[prices.length - 1];
	return (current - mean) / (2 * stdDev);
}

/**
 * Linear regression slope normalised as a daily % change.
 */
export function linearRegressionSlope(prices: number[], period: number): number {
	const data = prices.slice(-period);
	const n = data.length;
	if (n < 2) return 0;
	let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
	for (let i = 0; i < n; i++) {
		sumX += i;
		sumY += data[i];
		sumXY += i * data[i];
		sumX2 += i * i;
	}
	const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
	const avgPrice = sumY / n;
	return slope / avgPrice;
}

/** Standard deviation of an array. */
export function stddev(arr: number[]): number {
	const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
	const variance = arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
	return Math.sqrt(variance);
}
