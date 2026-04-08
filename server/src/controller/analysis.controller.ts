import { Request, Response } from "express";
import axios from "axios";
import Cache from "node-cache";

// Cache analysis for 15 minutes
const analysisCache = new Cache({ stdTTL: 15 * 60 });

const YAHOO_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	Accept: "application/json",
	Referer: "https://finance.yahoo.com/",
};

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

interface PricePoint {
	date: number;
	close: number;
	volume: number;
	high: number;
	low: number;
	open: number;
}

async function fetchDetailedPrices(symbol: string): Promise<PricePoint[]> {
	const urls = [
		`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
		`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
	];

	for (const url of urls) {
		try {
			const res = await axios.get(url, {
				params: { range: "3mo", interval: "1d" },
				headers: YAHOO_HEADERS,
				timeout: 10000,
			});

			const result = res.data?.chart?.result?.[0];
			if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) continue;

			const timestamps: number[] = result.timestamp;
			const quote = result.indicators.quote[0];
			const closes: (number | null)[] = quote.close;
			const volumes: (number | null)[] = quote.volume;
			const highs: (number | null)[] = quote.high;
			const lows: (number | null)[] = quote.low;
			const opens: (number | null)[] = quote.open;

			const points: PricePoint[] = [];
			for (let i = 0; i < timestamps.length; i++) {
				if (closes[i] != null) {
					points.push({
						date: timestamps[i],
						close: closes[i] as number,
						volume: (volumes[i] as number) || 0,
						high: (highs[i] as number) || closes[i] as number,
						low: (lows[i] as number) || closes[i] as number,
						open: (opens[i] as number) || closes[i] as number,
					});
				}
			}
			return points;
		} catch (_) {
			continue;
		}
	}
	throw new Error("Failed to fetch historical prices for " + symbol);
}

async function fetchNews(symbol: string): Promise<any[]> {
	const urls = [
		"https://query1.finance.yahoo.com/v1/finance/search",
		"https://query2.finance.yahoo.com/v1/finance/search",
	];

	for (const url of urls) {
		try {
			const res = await axios.get(url, {
				params: {
					q: symbol,
					quotesCount: 0,
					newsCount: 5,
					enableFuzzyQuery: false,
				},
				headers: YAHOO_HEADERS,
				timeout: 8000,
			});

			const rawNews = res.data?.news || [];
			return rawNews.map((item: any) => ({
				title: item.title || "",
				publisher: item.publisher || "",
				publishedAt: item.providerPublishTime
					? new Date(item.providerPublishTime * 1000).toISOString()
					: "",
				link: item.link || "",
			}));
		} catch (_) {
			continue;
		}
	}
	return [];
}

// ---------------------------------------------------------------------------
// Technical Indicators
// ---------------------------------------------------------------------------

function sma(prices: number[], period: number): number {
	if (prices.length < period) return prices[prices.length - 1];
	const slice = prices.slice(-period);
	return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function ema(prices: number[], period: number): number {
	if (prices.length === 0) return 0;
	const k = 2 / (period + 1);
	let emaVal = prices[0];
	for (let i = 1; i < prices.length; i++) {
		emaVal = prices[i] * k + emaVal * (1 - k);
	}
	return emaVal;
}

function rsi(prices: number[], period: number = 14): number {
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

function bollingerBands(prices: number[], period: number = 20) {
	const data = prices.slice(-period);
	const mean = data.reduce((a, b) => a + b, 0) / data.length;
	const variance = data.reduce((sum, p) => sum + (p - mean) ** 2, 0) / data.length;
	const stdDev = Math.sqrt(variance);
	return {
		upper: mean + 2 * stdDev,
		middle: mean,
		lower: mean - 2 * stdDev,
		position: stdDev === 0 ? 0 : (prices[prices.length - 1] - mean) / (2 * stdDev),
	};
}

function avgVolume(volumes: number[], period: number): number {
	const slice = volumes.slice(-period);
	return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// ---------------------------------------------------------------------------
// Analysis Logic
// ---------------------------------------------------------------------------

interface InsightItem {
	type: "bullish" | "bearish" | "neutral";
	icon: string;
	title: string;
	description: string;
	impact: "high" | "medium" | "low";
}

function generateInsights(prices: PricePoint[]): InsightItem[] {
	const insights: InsightItem[] = [];
	const closePrices = prices.map(p => p.close);
	const volumes = prices.map(p => p.volume);
	const current = closePrices[closePrices.length - 1];
	const previous = closePrices[closePrices.length - 2] || current;
	const dayChange = ((current - previous) / previous) * 100;

	// 1. Daily price movement
	if (Math.abs(dayChange) > 0.1) {
		insights.push({
			type: dayChange > 0 ? "bullish" : "bearish",
			icon: dayChange > 0 ? "📈" : "📉",
			title: dayChange > 0 ? "Price Gaining Momentum" : "Price Under Pressure",
			description: dayChange > 0
				? `Stock rose ${dayChange.toFixed(2)}% today, indicating buying interest and positive sentiment among traders.`
				: `Stock fell ${Math.abs(dayChange).toFixed(2)}% today, suggesting selling pressure and cautious sentiment.`,
			impact: Math.abs(dayChange) > 3 ? "high" : Math.abs(dayChange) > 1 ? "medium" : "low",
		});
	}

	// 2. RSI Analysis
	const currentRSI = rsi(closePrices);
	if (currentRSI > 70) {
		insights.push({
			type: "bearish",
			icon: "⚠️",
			title: "Overbought Signal (RSI)",
			description: `RSI is at ${currentRSI.toFixed(1)}, above the overbought threshold of 70. This often indicates the stock has rallied too fast and may face a correction or pullback soon.`,
			impact: currentRSI > 80 ? "high" : "medium",
		});
	} else if (currentRSI < 30) {
		insights.push({
			type: "bullish",
			icon: "💡",
			title: "Oversold Signal (RSI)",
			description: `RSI is at ${currentRSI.toFixed(1)}, below the oversold threshold of 30. This suggests the stock may be undervalued and could be due for a bounce as sellers become exhausted.`,
			impact: currentRSI < 20 ? "high" : "medium",
		});
	} else {
		insights.push({
			type: "neutral",
			icon: "📊",
			title: "Neutral Momentum (RSI)",
			description: `RSI is at ${currentRSI.toFixed(1)}, in the neutral zone. Neither overbought nor oversold — the stock's momentum is balanced.`,
			impact: "low",
		});
	}

	// 3. EMA Crossover (MACD-like)
	const ema12 = ema(closePrices, 12);
	const ema26 = ema(closePrices, 26);
	const emaDiff = ((ema12 - ema26) / current) * 100;

	if (Math.abs(emaDiff) > 0.2) {
		insights.push({
			type: ema12 > ema26 ? "bullish" : "bearish",
			icon: ema12 > ema26 ? "🚀" : "🔻",
			title: ema12 > ema26 ? "Bullish Trend (EMA Crossover)" : "Bearish Trend (EMA Crossover)",
			description: ema12 > ema26
				? `The 12-day EMA ($${ema12.toFixed(2)}) is above the 26-day EMA ($${ema26.toFixed(2)}), confirming a short-term uptrend. Buyers are dominating.`
				: `The 12-day EMA ($${ema12.toFixed(2)}) is below the 26-day EMA ($${ema26.toFixed(2)}), confirming a short-term downtrend. Sellers are in control.`,
			impact: Math.abs(emaDiff) > 1 ? "high" : "medium",
		});
	}

	// 4. Bollinger Band analysis
	const bb = bollingerBands(closePrices);
	if (current >= bb.upper) {
		insights.push({
			type: "bearish",
			icon: "🔝",
			title: "Near Upper Bollinger Band",
			description: `Price ($${current.toFixed(2)}) is at or above the upper Bollinger Band ($${bb.upper.toFixed(2)}). This means the stock is trading at unusually high levels and may revert to the mean.`,
			impact: "medium",
		});
	} else if (current <= bb.lower) {
		insights.push({
			type: "bullish",
			icon: "🔽",
			title: "Near Lower Bollinger Band",
			description: `Price ($${current.toFixed(2)}) is at or below the lower Bollinger Band ($${bb.lower.toFixed(2)}). This suggests the stock is trading at unusually low levels and may bounce back.`,
			impact: "medium",
		});
	}

	// 5. Volume analysis
	const currentVol = volumes[volumes.length - 1] || 0;
	const avgVol20 = avgVolume(volumes, 20);
	const volRatio = avgVol20 > 0 ? currentVol / avgVol20 : 1;

	if (volRatio > 1.5) {
		insights.push({
			type: dayChange > 0 ? "bullish" : "bearish",
			icon: "🔊",
			title: "High Volume Activity",
			description: `Trading volume (${(currentVol / 1e6).toFixed(1)}M) is ${volRatio.toFixed(1)}x the 20-day average (${(avgVol20 / 1e6).toFixed(1)}M). ${dayChange > 0 ? "High volume on an up move confirms strong buying conviction." : "High volume on a down move signals strong selling conviction."}`,
			impact: "high",
		});
	} else if (volRatio < 0.5) {
		insights.push({
			type: "neutral",
			icon: "🔇",
			title: "Low Volume Activity",
			description: `Trading volume is only ${(volRatio * 100).toFixed(0)}% of the 20-day average. Low participation may indicate a lack of conviction in the current move.`,
			impact: "low",
		});
	}

	// 6. Multi-day trend (5-day)
	if (closePrices.length >= 6) {
		const fiveDayAgo = closePrices[closePrices.length - 6];
		const fiveDayChange = ((current - fiveDayAgo) / fiveDayAgo) * 100;
		if (Math.abs(fiveDayChange) > 1) {
			insights.push({
				type: fiveDayChange > 0 ? "bullish" : "bearish",
				icon: fiveDayChange > 0 ? "📅" : "📅",
				title: fiveDayChange > 0 ? "5-Day Uptrend" : "5-Day Downtrend",
				description: fiveDayChange > 0
					? `Stock has gained ${fiveDayChange.toFixed(2)}% over the past 5 trading days, showing sustained buying pressure.`
					: `Stock has declined ${Math.abs(fiveDayChange).toFixed(2)}% over the past 5 trading days, showing persistent selling pressure.`,
				impact: Math.abs(fiveDayChange) > 5 ? "high" : "medium",
			});
		}
	}

	// 7. Support/Resistance levels
	if (prices.length >= 20) {
		const recent = prices.slice(-20);
		const recentHighest = Math.max(...recent.map(p => p.high));
		const recentLowest = Math.min(...recent.map(p => p.low));
		const range = recentHighest - recentLowest;
		const posInRange = range > 0 ? (current - recentLowest) / range : 0.5;

		if (posInRange > 0.9) {
			insights.push({
				type: "bullish",
				icon: "🏔️",
				title: "Testing Resistance",
				description: `Price is near the 20-day high of $${recentHighest.toFixed(2)}. A breakout above this level could trigger further upside momentum.`,
				impact: "medium",
			});
		} else if (posInRange < 0.1) {
			insights.push({
				type: "bearish",
				icon: "🏚️",
				title: "Testing Support",
				description: `Price is near the 20-day low of $${recentLowest.toFixed(2)}. A break below this level could trigger further selling.`,
				impact: "medium",
			});
		}
	}

	return insights;
}

// ---------------------------------------------------------------------------
// Determine overall sentiment
// ---------------------------------------------------------------------------

function overallSentiment(insights: InsightItem[]): {
	label: string;
	score: number;
	summary: string;
} {
	let score = 0;
	const weights = { high: 3, medium: 2, low: 1 };

	for (const insight of insights) {
		const w = weights[insight.impact];
		if (insight.type === "bullish") score += w;
		else if (insight.type === "bearish") score -= w;
	}

	// Normalize to -10 to +10
	const maxPossible = insights.length * 3;
	const normalized = maxPossible > 0 ? Math.round((score / maxPossible) * 10) : 0;

	let label: string;
	let summary: string;

	if (normalized >= 5) {
		label = "Strong Bullish";
		summary = "Multiple indicators are confirming a strong upward trend. The stock shows solid buying momentum with favorable technical signals.";
	} else if (normalized >= 2) {
		label = "Bullish";
		summary = "Technical indicators lean towards a positive outlook. The stock has upward momentum, though some caution is warranted.";
	} else if (normalized <= -5) {
		label = "Strong Bearish";
		summary = "Multiple indicators signal downward pressure. The stock is facing significant selling momentum with weak technical signals.";
	} else if (normalized <= -2) {
		label = "Bearish";
		summary = "Technical indicators suggest a negative outlook. The stock is experiencing selling pressure with weakening momentum.";
	} else {
		label = "Neutral";
		summary = "Technical signals are mixed — neither bulls nor bears have a clear advantage. The stock is in a consolidation phase.";
	}

	return { label, score: normalized, summary };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

const getAnalysis = async (req: Request, res: Response) => {
	/*
	#swagger.tags = ['Stock Analysis']
	*/
	const symbol = req.params.symbol?.toUpperCase();
	if (!symbol) {
		res.status(400).json({ error: "Missing symbol parameter" });
		return;
	}

	const cacheKey = `analysis-${symbol}`;
	if (analysisCache.has(cacheKey)) {
		res.status(200).json(analysisCache.get(cacheKey));
		return;
	}

	try {
		// Fetch data in parallel
		const [prices, news] = await Promise.all([
			fetchDetailedPrices(symbol),
			fetchNews(symbol).catch(() => []),
		]);

		if (prices.length < 10) {
			res.status(400).json({ error: "Not enough data for analysis" });
			return;
		}

		const closePrices = prices.map(p => p.close);
		const current = closePrices[closePrices.length - 1];
		const previous = closePrices[closePrices.length - 2] || current;
		const dayChange = ((current - previous) / previous) * 100;

		// Generate technical insights
		const insights = generateInsights(prices);
		const sentiment = overallSentiment(insights);

		// Build news context (correlated with movement)
		const newsInsights = news.slice(0, 3).map((item: any) => ({
			title: item.title,
			publisher: item.publisher,
			publishedAt: item.publishedAt,
			link: item.link,
		}));

		const result = {
			symbol,
			current_price: current,
			previous_close: previous,
			day_change: Math.round(dayChange * 100) / 100,
			sentiment,
			insights,
			related_news: newsInsights,
			indicators: {
				rsi: Math.round(rsi(closePrices) * 10) / 10,
				ema12: Math.round(ema(closePrices, 12) * 100) / 100,
				ema26: Math.round(ema(closePrices, 26) * 100) / 100,
				sma20: Math.round(sma(closePrices, 20) * 100) / 100,
				sma50: Math.round(sma(closePrices, 50) * 100) / 100,
				bollinger: bollingerBands(closePrices),
			},
			timestamp: new Date().toISOString(),
		};

		analysisCache.set(cacheKey, result);
		res.status(200).json(result);
	} catch (error: any) {
		console.error("Analysis error for", symbol, ":", error.message);
		res.status(500).json({ error: "Failed to generate analysis" });
	}
};

export default { getAnalysis };
