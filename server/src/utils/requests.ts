import yahooFinance from "yahoo-finance2";
import Cache from "node-cache";
import axios from "axios";

const stockCache = new Cache({ stdTTL: 5 * 60 }); // 5 minutes
// Secondary stale cache – keeps values for 1 hour so we can serve them when
// Yahoo rate-limits us (HTTP 429).
const staleCache = new Cache({ stdTTL: 60 * 60 });

import dotenv from "dotenv";
dotenv.config();

// ---------------------------------------------------------------------------
// Browser-like headers so Yahoo doesn't immediately flag us as a bot.
// ---------------------------------------------------------------------------
const YAHOO_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	Accept: "application/json, text/plain, */*",
	"Accept-Language": "en-US,en;q=0.9",
	Referer: "https://finance.yahoo.com/",
	Origin: "https://finance.yahoo.com",
};

// ---------------------------------------------------------------------------
// Sequential request queue: chains every Yahoo Finance call so they execute
// one-at-a-time with a fixed delay between each.
// ---------------------------------------------------------------------------
const YAHOO_DELAY_MS = 600; // ms between consecutive requests
let yahooQueue: Promise<void> = Promise.resolve();

export function throttledYahooCall<T>(fn: () => Promise<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		yahooQueue = yahooQueue
			.catch(() => {})
			.then(() => new Promise<void>((r) => setTimeout(r, YAHOO_DELAY_MS)))
			.then(() => fn())
			.then(resolve)
			.catch(reject);
	});
}

/** Return true when the error looks like a Yahoo 429 "Too Many Requests". */
function isRateLimited(err: any): boolean {
	if (!err) return false;
	const msg = String(err.message || err);
	return (
		msg.includes("Too Many Requests") ||
		msg.includes("is not valid JSON") ||
		msg.includes("429") ||
		(err.response && err.response.status === 429)
	);
}

// ---------------------------------------------------------------------------
// Retry helper with exponential backoff
// ---------------------------------------------------------------------------
async function withRetry<T>(
	fn: () => Promise<T>,
	label: string,
	maxRetries: number = 2,
): Promise<T> {
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (err: any) {
			if (isRateLimited(err) && attempt < maxRetries) {
				const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
				console.warn(
					`[Retry] ${label} rate-limited, waiting ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
				);
				await new Promise((r) => setTimeout(r, delay));
			} else {
				throw err;
			}
		}
	}
	throw new Error("Max retries exceeded for " + label);
}

// ---------------------------------------------------------------------------
// Direct Yahoo Finance API calls (bypasses yahoo-finance2 library's
// cookie/crumb flow which itself gets rate-limited)
// ---------------------------------------------------------------------------

/** Fetch a stock quote using Yahoo's v6/v7 quote endpoint directly. */
async function directYahooQuote(symbol: string): Promise<any> {
	// Try the v8 endpoint first (no crumb needed), fall back to v6
	const urls = [
		`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
		`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
	];

	for (const url of urls) {
		try {
			const res = await axios.get(url, {
				headers: YAHOO_HEADERS,
				timeout: 10000,
			});

			const result = res.data?.chart?.result?.[0];
			if (!result) continue;

			const meta = result.meta;
			return {
				symbol: meta.symbol || symbol,
				longName: meta.longName || meta.shortName || symbol,
				regularMarketPrice: meta.regularMarketPrice ?? 0,
				regularMarketPreviousClose: meta.chartPreviousClose ?? meta.previousClose ?? 0,
				regularMarketChangePercent:
					meta.regularMarketPrice && meta.chartPreviousClose
						? ((meta.regularMarketPrice - meta.chartPreviousClose) /
								meta.chartPreviousClose) *
							100
						: 0,
			};
		} catch (err: any) {
			if (err.response?.status === 429) {
				throw err; // Let the retry/rate-limit handler deal with it
			}
			// Try next URL
			continue;
		}
	}

	throw new Error("All Yahoo quote endpoints failed for " + symbol);
}

/** Search stocks using Yahoo's search endpoints with multiple fallbacks. */
async function directYahooSearch(query: string): Promise<any[]> {
	// Strategy 1: Try v1/finance/search (may be down)
	const searchUrls = [
		"https://query1.finance.yahoo.com/v1/finance/search",
		"https://query2.finance.yahoo.com/v1/finance/search",
	];

	for (const url of searchUrls) {
		try {
			const res = await axios.get(url, {
				params: {
					q: query,
					quotesCount: 10,
					newsCount: 0,
					enableFuzzyQuery: true,
					quotesQueryId: "tss_match_phrase_query",
				},
				headers: YAHOO_HEADERS,
				timeout: 8000,
			});
			const quotes = res.data?.quotes || [];
			if (quotes.length > 0) return quotes;
		} catch (err: any) {
			if (err.response?.status === 429) throw err;
			// Continue to next fallback
		}
	}

	// Strategy 2: Try to look up the query directly as a symbol via v8/chart
	// (this endpoint is the most reliable and almost never goes down)
	const possibleSymbols = [query.toUpperCase()];
	// Also try common suffixes for the query
	if (!query.includes(".") && query.length <= 5) {
		possibleSymbols.push(query.toUpperCase());
	}

	const results: any[] = [];
	for (const sym of possibleSymbols) {
		try {
			const res = await axios.get(
				`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}`,
				{
					params: { range: "1d", interval: "1d" },
					headers: YAHOO_HEADERS,
					timeout: 5000,
				},
			);
			const meta = res.data?.chart?.result?.[0]?.meta;
			if (meta && meta.regularMarketPrice) {
				results.push({
					symbol: meta.symbol || sym,
					shortname: meta.shortName || meta.longName || sym,
					longname: meta.longName || meta.shortName || sym,
					quoteType: meta.instrumentType || "EQUITY",
					exchange: meta.exchangeName || "",
				});
			}
		} catch (_) {
			// Symbol doesn't exist, that's fine
		}
	}

	return results;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

export const fetchStockData = async (symbol: string): Promise<any> => {
	const cacheKey = symbol + "-quote";

	// 1. Fresh cache hit
	if (stockCache.has(cacheKey)) {
		return stockCache.get(cacheKey);
	}

	try {
		// Use direct API call with retry, queued through the throttle
		const stockData = await throttledYahooCall(() =>
			withRetry(() => directYahooQuote(symbol), `quote:${symbol}`),
		);

		stockCache.set(cacheKey, stockData);
		staleCache.set(cacheKey, stockData);
		return stockData;
	} catch (err: any) {
		// Fallback: try the yahoo-finance2 library (it may have cached crumbs)
		try {
			const quote = await yahooFinance.quoteCombine(symbol, {
				fields: [
					"regularMarketPrice",
					"regularMarketChangePercent",
					"longName",
					"regularMarketPreviousClose",
				],
			});
			const stockData = {
				symbol,
				longName: quote.longName,
				regularMarketPrice: quote.regularMarketPrice,
				regularMarketPreviousClose: quote.regularMarketPreviousClose,
				regularMarketChangePercent: quote.regularMarketChangePercent,
			};
			stockCache.set(cacheKey, stockData);
			staleCache.set(cacheKey, stockData);
			return stockData;
		} catch (_) {
			// ignore library fallback error
		}

		// Yahoo validation errors sometimes carry the data in err.result
		if (err.result && Array.isArray(err.result)) {
			let quote = err.result[0];
			const stockData = {
				symbol,
				longName: quote.longName,
				regularMarketPrice: quote.regularMarketPrice,
				regularMarketPreviousClose: quote.regularMarketPreviousClose,
				regularMarketChangePercent: quote.regularMarketChangePercent,
			};
			stockCache.set(cacheKey, stockData);
			staleCache.set(cacheKey, stockData);
			return stockData;
		}

		// Rate-limited – serve stale data if we have it
		if (isRateLimited(err)) {
			console.warn(
				`[Rate-limited] Yahoo Finance 429 for ${symbol}. Serving stale/fallback data.`,
			);
			if (staleCache.has(cacheKey)) {
				return staleCache.get(cacheKey);
			}
			return {
				symbol,
				longName: symbol,
				regularMarketPrice: 0,
				regularMarketPreviousClose: 0,
				regularMarketChangePercent: 0,
				_rateLimited: true,
			};
		}

		console.error("Error fetching " + symbol + " stock data:", err);
		throw new Error(err);
	}
};

export const fetchHistoricalStockData = async (
	symbol: string,
	period: "1d" | "5d" | "1m" | "6m" | "YTD" | "1y" | "all" = "1d",
): Promise<any> => {
	const periodTerm =
		period === "1d" || period === "5d" || period === "1m" ? "short" : "long";
	const cacheKey = symbol + "-historical-" + periodTerm;

	try {
		if (stockCache.has(cacheKey)) {
			return stockCache.get(cacheKey);
		} else {
			let formattedData: number[][] = [];

			if (periodTerm == "short") {
				// If the period is less than 1 month, use intraday data from Alpha Vantage
				let res = await axios.get(
					"https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" +
						symbol +
						"&interval=15min&extended_hours=true&outputsize=full&apikey=" +
						process.env.STOTRA_ALPHAVANTAGE_API,
				);
				const alphaData = res.data["Time Series (15min)"];

				if (!alphaData) {
					return fetchHistoricalStockData(symbol, "6m");
				}

				formattedData = Object.keys(alphaData)
					.map((key) => {
						return [
							new Date(key).getTime(),
							parseFloat(alphaData[key]["4. close"]),
						];
					})
					.sort((a, b) => a[0] - b[0]);
			} else {
				// Use direct chart API for historical data
				try {
					const chartData = await throttledYahooCall(() =>
						withRetry(async () => {
							const res = await axios.get(
								`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
								{
									params: {
										period1: "946684800", // 2000-01-01
										period2: Math.floor(Date.now() / 1000).toString(),
										interval: "1d",
									},
									headers: YAHOO_HEADERS,
									timeout: 15000,
								},
							);
							return res.data;
						}, `historical:${symbol}`),
					);

					const result = chartData?.chart?.result?.[0];
					if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
						const timestamps = result.timestamp;
						const closes = result.indicators.quote[0].close;
						formattedData = timestamps
							.map((ts: number, i: number) => [ts * 1000, closes[i]])
							.filter((d: any[]) => d[1] != null);
					}
				} catch (_directErr) {
					// Final fallback: use yahoo-finance2 library
					const yahooData = await throttledYahooCall(() =>
						yahooFinance.historical(symbol, {
							period1: "2000-01-01",
							interval: "1d",
						}),
					);
					formattedData = yahooData.map(
						(data: { date: { getTime: () => any }; close: any }) => {
							return [data.date.getTime(), data.close];
						},
					);
				}
			}
			stockCache.set(cacheKey, formattedData);
			return formattedData;
		}
	} catch (error: any) {
		if (isRateLimited(error)) {
			console.warn(
				`[Rate-limited] Yahoo Finance 429 for ${symbol} historical. Returning empty data.`,
			);
			return [];
		}
		console.error("Error fetching " + symbol + " historical data:", error);
		return null;
	}
};

export const searchStocks = async (query: string): Promise<any> => {
	return throttledYahooCall(() =>
		withRetry(() => directYahooSearch(query), `search:${query}`),
	).catch((err) => {
		if (isRateLimited(err)) {
			console.warn(
				`[Rate-limited] Yahoo Finance 429 for search "${query}". Returning empty results.`,
			);
			return [];
		}
		console.error(err);
		throw new Error(err);
	});
};
