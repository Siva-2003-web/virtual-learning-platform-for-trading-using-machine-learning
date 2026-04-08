import yahooFinance from "yahoo-finance2";
import Cache from "node-cache";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const stockCache = new Cache({ stdTTL: 5 * 60 });
const staleCache = new Cache({ stdTTL: 60 * 60 });

const YAHOO_HEADERS = {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	Accept: "application/json, text/plain, */*",
	"Accept-Language": "en-US,en;q=0.9",
	Referer: "https://finance.yahoo.com/",
	Origin: "https://finance.yahoo.com",
};

const YAHOO_DELAY_MS = 100;
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

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries: number = 2): Promise<T> {
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try { return await fn(); } catch (err: any) {
			if (isRateLimited(err) && attempt < maxRetries) {
				const delay = Math.pow(2, attempt + 1) * 1000;
				await new Promise((r) => setTimeout(r, delay));
			} else { throw err; }
		}
	}
	throw new Error("Max retries exceeded for " + label);
}

async function directYahooQuote(symbol: string): Promise<any> {
	const urls = [
		`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
		`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
	];
	for (const url of urls) {
		try {
			const res = await axios.get(url, { headers: YAHOO_HEADERS, timeout: 8000 });
			const meta = res.data?.chart?.result?.[0]?.meta;
			if (!meta) continue;
			return {
				symbol: meta.symbol || symbol,
				longName: meta.longName || meta.shortName || symbol,
				regularMarketPrice: meta.regularMarketPrice ?? 0,
				regularMarketPreviousClose: meta.chartPreviousClose ?? meta.previousClose ?? 0,
				regularMarketChangePercent: meta.regularMarketPrice && meta.chartPreviousClose ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : 0,
			};
		} catch (err: any) { continue; }
	}
	throw new Error("Quote failed for " + symbol);
}

async function directYahooSearch(query: string): Promise<any[]> {
    if (!query || query.length < 1) return [];
	const results: any[] = [];

	// 1. Alpha Vantage Symbol Search (Most reliable on Cloud)
	try {
        const avKey = process.env.STOTRA_ALPHAVANTAGE_API;
        if (avKey && avKey.length > 5) {
            const res = await axios.get(`https://www.alphavantage.co/query`, {
                params: { function: 'SYMBOL_SEARCH', keywords: query, apikey: avKey },
                timeout: 5000
            });
            const matches = res.data?.bestMatches || [];
            if (matches.length > 0) {
                return matches.map((m: any) => ({
                    symbol: m['1. symbol'],
                    shortname: m['2. name'],
                    longname: m['2. name'],
                    quoteType: 'EQUITY',
                    exchange: m['4. region']
                }));
            }
        }
	} catch (_) { }

	// 2. Direct Symbol Ticker Check (Immediate match)
    const ticker = query.toUpperCase().trim();
    if (ticker.length <= 5 && !ticker.includes(" ")) {
        try {
            const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`, {
                params: { range: "1d", interval: "1d" },
                headers: YAHOO_HEADERS,
                timeout: 4000,
            });
            const meta = res.data?.chart?.result?.[0]?.meta;
            if (meta && meta.regularMarketPrice) {
                results.push({
                    symbol: meta.symbol || ticker,
                    shortname: meta.shortName || ticker,
                    longname: meta.longName || ticker,
                    quoteType: meta.instrumentType || "EQUITY",
                    exchange: meta.exchangeName || ""
                });
            }
        } catch (_) { }
    }

	// 3. Last Resort: Standard Search
    try {
        const res = await axios.get("https://query1.finance.yahoo.com/v1/finance/search", {
            params: { q: query, quotesCount: 6, newsCount: 0 },
            headers: YAHOO_HEADERS,
            timeout: 5000,
        });
        const quotes = res.data?.quotes || [];
        if (quotes.length > 0) return quotes;
    } catch (_) { }

	return results;
}

export const fetchStockData = async (symbol: string): Promise<any> => {
	const cacheKey = symbol + "-quote";
	if (stockCache.has(cacheKey)) return stockCache.get(cacheKey);
	try {
		const stockData = await throttledYahooCall(() => withRetry(() => directYahooQuote(symbol), `quote:${symbol}`));
		stockCache.set(cacheKey, stockData);
		staleCache.set(cacheKey, stockData);
		return stockData;
	} catch (err: any) {
		if (staleCache.has(cacheKey)) return staleCache.get(cacheKey);
		return { symbol, longName: symbol, regularMarketPrice: 0, regularMarketPreviousClose: 0, regularMarketChangePercent: 0, _error: true };
	}
};

export const fetchHistoricalStockData = async (symbol: string, period: string = "1d"): Promise<any> => {
	const cacheKey = symbol + "-historical-" + period;
	if (stockCache.has(cacheKey)) return stockCache.get(cacheKey);
	try {
		const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`, {
			params: { range: period, interval: period === "1d" ? "15m" : "1d" },
			headers: YAHOO_HEADERS,
			timeout: 10000,
		});
		const result = res.data?.chart?.result?.[0];
		if (!result || !result.timestamp) return [];
		const timestamps = result.timestamp;
		const closes = result.indicators?.quote?.[0]?.close || [];
		const formatted = timestamps.map((ts: number, i: number) => [ts * 1000, closes[i]]).filter((d: any[]) => d[1] != null);
		stockCache.set(cacheKey, formatted);
		return formatted;
	} catch (err) { return []; }
};

export const searchStocks = async (query: string): Promise<any[]> => {
	return throttledYahooCall(() => directYahooSearch(query)).catch(() => []);
};
