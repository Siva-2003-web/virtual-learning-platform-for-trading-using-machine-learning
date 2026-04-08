// ============================================================================
// Trading Chatbot – AI-powered Q&A using Groq LLM API.
// Falls back to keyword matching if GROQ_API_KEY is not set.
// ============================================================================

import Groq from "groq-sdk";

// ── Groq Client ──────────────────────────────────────────────────────────

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
	if (groqClient) return groqClient;
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) return null;
	groqClient = new Groq({ apiKey });
	return groqClient;
}

// ── System Prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly, expert trading assistant built into the Stotra trading simulator. Your job is to teach beginners about stock trading in simple, clear language.

You know about:
- Stock market basics (stocks, ETFs, IPOs, indices, market cap, dividends)
- Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR, VWAP, Fibonacci)
- Risk management (stop-loss, take-profit, position sizing, diversification, Sharpe ratio, max drawdown)
- Trading strategies (day trading, swing trading, scalping, value investing, trend following)
- Chart patterns (candlesticks, support/resistance, breakouts, Golden Cross, Death Cross)
- Order types (market, limit, stop, stop-limit)
- Trading psychology (fear, greed, discipline, common mistakes)

You also know about the Stotra Agent Dashboard:
- It's a trading robot control panel with 6 tabs: Live Signals, Positions, Trade History, Configuration, Backtest, Chat
- The robot trades with $100,000 virtual cash — no real money
- It checks stocks every 5 minutes using strategies like: price-drop, sma-crossover, rsi, macd, composite
- The composite strategy combines 5 indicators (SMA, RSI, MACD, Bollinger, linear regression) and only trades on strong consensus
- Risk rules: max 20% per position, 7% stop-loss, 15% take-profit, 10% cash reserve, max 10 trades/day
- Positions tab is empty until the robot buys stocks (BUY signals are rare — this is normal)
- The Backtest tab tests strategies on 2 years of historical data
- Default watchlist: AAPL, MSFT, GOOGL, AMZN, TSLA

Rules:
- Keep answers concise (2-4 paragraphs max)
- Use emojis sparingly for visual appeal
- Use bullet points for lists
- Give practical examples when helpful
- If asked something non-trading related, politely redirect to trading topics
- Never give real financial advice — always mention this is for educational purposes`;

// ── AI Answer (Groq) ─────────────────────────────────────────────────────

async function getAIAnswer(question: string): Promise<string | null> {
	const client = getGroqClient();
	if (!client) return null;

	try {
		const completion = await client.chat.completions.create({
			model: "llama-3.3-70b-versatile",
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: question },
			],
			temperature: 0.7,
			max_tokens: 800,
		});

		return completion.choices[0]?.message?.content || null;
	} catch (err: any) {
		console.error("[Chatbot] Groq API error:", err.message);
		return null;
	}
}

// ── Fallback: Keyword Matching ───────────────────────────────────────────

interface QA {
	patterns: string[];
	answer: string;
}

const qaBank: QA[] = [
	{
		patterns: ["what is a stock", "what are stocks", "stock meaning"],
		answer: "A stock is a small piece of ownership in a company. When you buy a stock, you become a partial owner. If the company does well, your stock's value goes up. If it does poorly, the value drops.",
	},
	{
		patterns: ["what is rsi", "relative strength index", "rsi meaning"],
		answer: "RSI (Relative Strength Index) measures momentum on a 0-100 scale.\n\n• RSI > 70 → Overbought (could drop)\n• RSI < 30 → Oversold (could bounce up)\n• RSI 30-70 → Neutral",
	},
	{
		patterns: ["what is macd", "macd meaning"],
		answer: "MACD shows momentum using two EMAs.\n\n• MACD crosses ABOVE signal → Bullish (BUY)\n• MACD crosses BELOW signal → Bearish (SELL)",
	},
	{
		patterns: ["what is sma", "simple moving average", "moving average"],
		answer: "SMA = average closing price over N days. Price above SMA → uptrend. Below → downtrend.\n\n🟢 Golden Cross: Short SMA crosses above long SMA → BUY\n🔴 Death Cross: Short SMA crosses below long SMA → SELL",
	},
	{
		patterns: ["stop loss", "stop-loss", "stoploss"],
		answer: "A stop-loss automatically sells when a stock drops to a certain price to limit losses. Example: Buy at $200, set 7% stop-loss → auto-sells at $186. Always use one!",
	},
	{
		patterns: ["agent dashboard", "what is dashboard", "dashboard components"],
		answer: "The Agent Dashboard has 6 tabs:\n\n📡 Live Signals — BUY/SELL/HOLD signals\n📊 Positions — Stocks owned\n📜 Trade History — Past trades log\n⚙️ Configuration — Strategy & settings\n🧪 Backtest — Test on historical data\n💬 Chat — Ask me anything!",
	},
	{
		patterns: ["positions", "positions empty", "when will positions"],
		answer: "Positions shows stocks the robot owns. It's empty until a BUY signal fires AND the Risk Manager approves. This can take hours — the robot is patient and only acts on strong signals!",
	},
	{
		patterns: ["how does the agent work", "what does agent do"],
		answer: "The agent runs a loop every 5 minutes:\n1. OBSERVE — fetch prices\n2. DECIDE — run strategy\n3. ACT — buy/sell if approved\n4. RECORD — log the trade\n\nStarts with $100,000 virtual cash.",
	},
	{
		patterns: ["which strategy", "best strategy", "recommend strategy"],
		answer: "Beginners: 'price-drop' (simplest). Intermediate: 'rsi' or 'sma-crossover'. Advanced: 'composite' (combines 5 indicators, best accuracy). Use Backtest to compare!",
	},
];

function getFallbackAnswer(question: string): string {
	const q = question.toLowerCase().trim();
	let bestMatch: QA | null = null;
	let bestScore = 0;

	for (const qa of qaBank) {
		let score = 0;
		for (const pattern of qa.patterns) {
			const p = pattern.toLowerCase();
			if (q.includes(p)) score += 20;
			if (p.includes(q)) score += 15;
			const qWords = q.split(/\s+/).filter((w) => w.length >= 2);
			for (const qw of qWords) {
				for (const pw of p.split(/\s+/)) {
					if (pw.includes(qw) || qw.includes(pw)) score += 3;
				}
			}
		}
		if (score > bestScore) {
			bestScore = score;
			bestMatch = qa;
		}
	}

	if (bestMatch && bestScore >= 5) return bestMatch.answer;

	return `I can help with trading questions! Try asking about:\n\n• Technical indicators (RSI, SMA, MACD)\n• Risk management (stop-loss, position sizing)\n• Trading strategies\n• How the Agent Dashboard works\n• Market basics (stocks, ETFs, indices)`;
}

// ── Main Export ───────────────────────────────────────────────────────────

export async function getAnswer(question: string): Promise<string> {
	if (!question.trim()) {
		return "Ask me anything about trading! For example: \"What is RSI?\" or \"How does the agent work?\"";
	}

	// Try Groq AI first
	const aiAnswer = await getAIAnswer(question);
	if (aiAnswer) return aiAnswer;

	// Fallback to keyword matching
	console.log("[Chatbot] No GROQ_API_KEY set, using fallback keyword matching");
	return getFallbackAnswer(question);
}
