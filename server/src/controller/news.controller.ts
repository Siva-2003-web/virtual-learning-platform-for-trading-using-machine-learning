import { Request, Response } from "express";
import axios from "axios";
import { throttledYahooCall } from "../utils/requests";

import dotenv from "dotenv";
dotenv.config();

const { SearchApi } = require("financial-news-api");
const searchApi = SearchApi(process.env.STOTRA_NEWSFILTER_API);

// Cache the results for 15 minutes
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 15 * 60 });

// Browser-like headers for direct Yahoo API calls
const YAHOO_HEADERS: Record<string, string> = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	Accept: "application/json, text/plain, */*",
	"Accept-Language": "en-US,en;q=0.9",
	Referer: "https://finance.yahoo.com/",
	Origin: "https://finance.yahoo.com",
};

const getNews = async (req: Request, res: Response) => {
	/* 
	#swagger.tags = ['News']
	*/
	var symbol = req.params.symbol || "";
	const symbolQuery = symbol !== "" ? "symbols:" + symbol + " AND " : "";

	if (cache.has(symbol + "-news")) {
		res.status(200).json(cache.get(symbol + "-news"));
		return;
	}

	// If no API key for NewsFilter is provided, use Yahoo Finance API
	if (
		process.env.STOTRA_NEWSFILTER_API === undefined ||
		process.env.STOTRA_NEWSFILTER_API === ""
	) {
		console.warn("No NewsFilter API key provided. Using Yahoo Finance API.");
		yahooNews(symbol)
			.then((news) => {
				res.status(200).json(news);
			})
			.catch((err: any) => {
				console.log(err);
				res.status(200).json([]);
			});
		return;
	}

	const query = {
		queryString:
			symbolQuery +
			"(source.id:bloomberg OR source.id:reuters OR source.id:cnbc OR source.id:wall-street-journal)",
		from: 0,
		size: 10,
	};

	searchApi
		.getNews(query)
		.then((response: any) => {
			let news = response.articles.map((newsItem: any) => {
				return {
					title: newsItem.title,
					publishedAt: newsItem.publishedAt,
					source: newsItem.source.name,
					sourceUrl: newsItem.sourceUrl,
					symbols: newsItem.symbols,
					description: newsItem.description,
				};
			});
			cache.set(symbol + "-news", news);
			res.status(200).json(news);
		})
		.catch((err: any) => {
			if (err.response && err.response.data && err.response.data.message) {
				yahooNews(symbol)
					.then((news) => {
						res.status(200).json(news);
					})
					.catch(() => {
						res.status(200).json([]);
					});
			} else {
				console.log(err);
				res.status(200).json([]);
			}
		});
};

/**
 * Fetch news using Yahoo's direct search API (bypasses yahoo-finance2 library).
 * Tries query1 then query2 as fallback.
 */
function yahooNews(symbol: string): Promise<any> {
	const query = symbol === "" ? "stock market" : symbol;

	const urls = [
		"https://query1.finance.yahoo.com/v1/finance/search",
		"https://query2.finance.yahoo.com/v1/finance/search",
	];

	return throttledYahooCall(async () => {
		let lastError: any = null;

		for (const url of urls) {
			try {
				const res = await axios.get(url, {
					params: {
						q: query,
						quotesCount: 0,
						newsCount: 10,
						enableFuzzyQuery: false,
					},
					headers: YAHOO_HEADERS,
					timeout: 10000,
				});

				const rawNews = res.data?.news || [];
				const news = rawNews.map((newsItem: any) => ({
					title: newsItem.title,
					publishedAt: newsItem.providerPublishTime
						? new Date(newsItem.providerPublishTime * 1000).toISOString()
						: "",
					source: newsItem.publisher || "",
					sourceUrl: newsItem.link || "",
					symbols: newsItem.relatedTickers || [],
					description: "",
				}));

				cache.set(symbol + "-news", news);
				return news;
			} catch (err: any) {
				lastError = err;
				console.warn(`[News] ${url} failed for "${query}": ${err.message}`);
				// Try next URL
				continue;
			}
		}

        // Strategy 2: Try Legacy Yahoo RSS (almost never blocked)
        try {
            console.log(`[News] Trying Legacy RSS for "${symbol}"`);
            const rssUrl = symbol === "" 
                ? "https://finance.yahoo.com/news/rssindex" 
                : `https://finance.yahoo.com/rss/headline?s=${symbol}`;
            
            const res = await axios.get(rssUrl, { timeout: 8000 });
            // Simple regex parser for RSS items (faster than XML parser on free tier)
            const items = res.data.match(/<item>([\s\S]*?)<\/item>/g) || [];
            const news = items.slice(0, 10).map((item: string) => {
                const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
                const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
                const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
                const source = item.match(/<source[\s\S]*?>([\s\S]*?)<\/source>/)?.[1] || "Yahoo Finance";
                
                return {
                    title: title.replace("<![CDATA[", "").replace("]]>", ""),
                    publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                    source: source,
                    sourceUrl: link,
                    symbols: [symbol],
                    description: ""
                };
            });
            if (news.length > 0) {
                cache.set(symbol + "-news", news);
                return news;
            }
        } catch (rssErr) {
            console.warn(`[News] RSS Fallback failed:`, rssErr);
        }

		// All URLs failed
		throw lastError || new Error("All news URLs failed");
	}).catch((err: any) => {
		const msg = String(err.message || err);
		if (
			msg.includes("Too Many Requests") ||
			msg.includes("429") ||
			msg.includes("is not valid JSON")
		) {
			console.warn(
				`[Rate-limited] Yahoo Finance news 429 for "${symbol}". Returning empty news.`,
			);
		} else {
			console.warn(`[News] Failed to fetch for "${symbol}": ${msg}`);
		}
		cache.set(symbol + "-news", [], 2 * 60);
		return [];
	});
}

export default { getNews };
