import { Request, Response } from "express";
import axios from "axios";
import Cache from "node-cache";

// Cache predictions for 30 minutes – they don't change that fast
const predictionCache = new Cache({ stdTTL: 30 * 60 });

const YAHOO_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	Accept: "application/json",
	Referer: "https://finance.yahoo.com/",
};

// ---------------------------------------------------------------------------
// Lightweight statistical prediction (replaces Python LSTM+XGBoost service)
// Uses: EMA trends, linear regression, RSI momentum, and Bollinger Bands
// ---------------------------------------------------------------------------

interface PricePoint {
	date: number; // unix timestamp in seconds
	close: number;
}

/** Fetch 6 months of daily close prices from Yahoo chart API. */
async function fetchHistoricalPrices(symbol: string): Promise<PricePoint[]> {
	const urls = [
		`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
		`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
	];

	for (const url of urls) {
		try {
			const res = await axios.get(url, {
				params: { range: "6mo", interval: "1d" },
				headers: YAHOO_HEADERS,
				timeout: 10000,
			});

			const result = res.data?.chart?.result?.[0];
			if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) continue;

			const timestamps: number[] = result.timestamp;
			const closes: (number | null)[] = result.indicators.quote[0].close;

			const points: PricePoint[] = [];
			for (let i = 0; i < timestamps.length; i++) {
				if (closes[i] != null) {
					points.push({ date: timestamps[i], close: closes[i] as number });
				}
			}
			return points;
		} catch (_) {
			continue;
		}
	}
	throw new Error("Failed to fetch historical prices for " + symbol);
}

/** Simple Moving Average */
function sma(prices: number[], period: number): number {
	if (prices.length < period) return prices[prices.length - 1];
	const slice = prices.slice(-period);
	return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/** Exponential Moving Average */
function ema(prices: number[], period: number): number {
	if (prices.length === 0) return 0;
	const k = 2 / (period + 1);
	let emaVal = prices[0];
	for (let i = 1; i < prices.length; i++) {
		emaVal = prices[i] * k + emaVal * (1 - k);
	}
	return emaVal;
}

/** RSI (Relative Strength Index) */
function rsi(prices: number[], period: number = 14): number {
	if (prices.length < period + 1) return 50; // neutral default
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

/** Linear regression slope (normalized as daily % change) */
function linearRegressionSlope(prices: number[], period: number): number {
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
	return slope / avgPrice; // normalized daily change rate
}

/** Bollinger Band position: -1 (at lower band) to +1 (at upper band) */
function bollingerPosition(prices: number[], period: number = 20): number {
	const data = prices.slice(-period);
	const mean = data.reduce((a, b) => a + b, 0) / data.length;
	const variance = data.reduce((sum, p) => sum + (p - mean) ** 2, 0) / data.length;
	const stdDev = Math.sqrt(variance);
	if (stdDev === 0) return 0;
	const currentPrice = prices[prices.length - 1];
	return (currentPrice - mean) / (2 * stdDev); // -1 to +1
}

/**
 * Predict future price using a weighted ensemble of technical indicators.
 * This replaces the LSTM+XGBoost model with a fast, dependency-free approach.
 */
function predictPrice(prices: number[], daysAhead: number): number {
	const current = prices[prices.length - 1];

	// 1. Linear regression trend (strongest signal for short-term)
	const shortSlope = linearRegressionSlope(prices, 20); // 20-day trend
	const longSlope = linearRegressionSlope(prices, 60);  // 60-day trend
	const lrPrediction = current * (1 + shortSlope * daysAhead * 0.6 + longSlope * daysAhead * 0.4);

	// 2. EMA trend direction
	const ema12 = ema(prices, 12);
	const ema26 = ema(prices, 26);
	const emaTrend = (ema12 - ema26) / current; // MACD normalized
	const emaPrediction = current * (1 + emaTrend * daysAhead * 0.3);

	// 3. Mean reversion signal (RSI + Bollinger)
	const currentRSI = rsi(prices);
	const bbPos = bollingerPosition(prices);

	// RSI mean reversion: overbought (>70) suggests pullback, oversold (<30) suggests bounce
	let rsiAdjustment = 0;
	if (currentRSI > 70) rsiAdjustment = -0.002 * daysAhead; // overbought, slight pull down
	else if (currentRSI < 30) rsiAdjustment = 0.002 * daysAhead; // oversold, slight push up

	// Bollinger mean reversion
	const bbAdjustment = -bbPos * 0.001 * daysAhead;

	const meanReversionPrediction = current * (1 + rsiAdjustment + bbAdjustment);

	// 4. Weighted ensemble
	const weights = {
		lr: 0.50,      // Linear regression gets highest weight
		ema: 0.30,     // EMA trend
		meanRev: 0.20, // Mean reversion
	};

	const prediction =
		lrPrediction * weights.lr +
		emaPrediction * weights.ema +
		meanReversionPrediction * weights.meanRev;

	return Math.round(prediction * 100) / 100;
}

/** Get next business day from a date */
function nextBusinessDay(date: Date): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + 1);
	while (next.getDay() === 0 || next.getDay() === 6) {
		next.setDate(next.getDate() + 1);
	}
	return next;
}

/** Format target date metadata */
function formatTarget(dt: Date) {
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	return {
		iso: dt.toISOString(),
		date: dt.toISOString().split("T")[0],
		day: days[dt.getDay()],
		year: dt.getFullYear(),
	};
}

// ---------------------------------------------------------------------------
// Controller endpoints
// ---------------------------------------------------------------------------

const getPrediction = async (req: Request, res: Response) => {
	/* 
	#swagger.tags = ['Stock Prediction']
	*/
	const symbol = req.params.symbol?.toUpperCase();
	if (!symbol) {
		res.status(400).json({ error: "Missing symbol parameter" });
		return;
	}

	// Check cache
	const cacheKey = `prediction-${symbol}`;
	if (predictionCache.has(cacheKey)) {
		res.status(200).json(predictionCache.get(cacheKey));
		return;
	}

	try {
		const prices = await fetchHistoricalPrices(symbol);

		if (prices.length < 30) {
			res.status(400).json({ error: "Not enough historical data for prediction" });
			return;
		}

		const closePrices = prices.map((p) => p.close);
		const currentPrice = closePrices[closePrices.length - 1];
		const lastDate = new Date(prices[prices.length - 1].date * 1000);

		// Predict next day
		const nextDayPrice = predictPrice(closePrices, 1);
		const nextDayDate = nextBusinessDay(lastDate);

		// Predict next week (7 calendar days)
		const nextWeekPrice = predictPrice(closePrices, 7);
		const nextWeekDate = new Date(lastDate);
		nextWeekDate.setDate(nextWeekDate.getDate() + 7);

		const result = {
			symbol,
			current_price: currentPrice,
			next_day: {
				predicted_price: nextDayPrice,
				change: Math.round((nextDayPrice - currentPrice) * 100) / 100,
				change_percent:
					Math.round(((nextDayPrice - currentPrice) / currentPrice) * 10000) / 100,
				target: formatTarget(nextDayDate),
			},
			next_week: {
				predicted_price: nextWeekPrice,
				change: Math.round((nextWeekPrice - currentPrice) * 100) / 100,
				change_percent:
					Math.round(((nextWeekPrice - currentPrice) / currentPrice) * 10000) / 100,
				target: formatTarget(nextWeekDate),
			},
			confidence: "medium",
			timestamp: new Date().toISOString(),
		};

		predictionCache.set(cacheKey, result);
		res.status(200).json(result);
	} catch (error: any) {
		console.error("Prediction error for", symbol, ":", error.message);
		res.status(500).json({ error: "Failed to generate prediction" });
	}
};

const batchPrediction = async (req: Request, res: Response) => {
	/* 
	#swagger.tags = ['Stock Prediction']
	*/
	const symbols = req.body.symbols;

	if (!symbols || !Array.isArray(symbols)) {
		res.status(400).json({ error: "symbols array is required" });
		return;
	}

	try {
		const results = [];
		for (const sym of symbols) {
			try {
				const cacheKey = `prediction-${sym.toUpperCase()}`;
				if (predictionCache.has(cacheKey)) {
					results.push(predictionCache.get(cacheKey));
					continue;
				}

				const prices = await fetchHistoricalPrices(sym.toUpperCase());
				const closePrices = prices.map((p) => p.close);
				const currentPrice = closePrices[closePrices.length - 1];
				const lastDate = new Date(prices[prices.length - 1].date * 1000);

				const nextDayPrice = predictPrice(closePrices, 1);
				const nextWeekPrice = predictPrice(closePrices, 7);

				const result = {
					symbol: sym.toUpperCase(),
					current_price: currentPrice,
					next_day: {
						predicted_price: nextDayPrice,
						change: Math.round((nextDayPrice - currentPrice) * 100) / 100,
						change_percent:
							Math.round(
								((nextDayPrice - currentPrice) / currentPrice) * 10000,
							) / 100,
						target: formatTarget(nextBusinessDay(lastDate)),
					},
					next_week: {
						predicted_price: nextWeekPrice,
						change: Math.round((nextWeekPrice - currentPrice) * 100) / 100,
						change_percent:
							Math.round(
								((nextWeekPrice - currentPrice) / currentPrice) * 10000,
							) / 100,
						target: formatTarget(
							new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000),
						),
					},
					confidence: "medium",
					timestamp: new Date().toISOString(),
				};

				predictionCache.set(cacheKey, result);
				results.push(result);
			} catch (e: any) {
				results.push({ symbol: sym.toUpperCase(), error: e.message });
			}
		}

		res.status(200).json({ predictions: results });
	} catch (error: any) {
		console.error("Batch prediction error:", error.message);
		res.status(500).json({ error: "Failed to get batch predictions" });
	}
};

export default { getPrediction, batchPrediction };
