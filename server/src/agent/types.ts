// ============================================================================
// Trading Agent – Core Types & Interfaces
// ============================================================================

/** A single OHLCV candlestick bar. */
export interface CandleBar {
	date: number; // unix timestamp (ms)
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

/** Simplified price point (date + close). */
export interface PricePoint {
	date: number; // unix ms
	close: number;
}

/** The three possible trading actions. */
export type TradeAction = "BUY" | "SELL" | "HOLD";

/** Signal emitted by a strategy. */
export interface TradeSignal {
	action: TradeAction;
	symbol: string;
	confidence: number; // 0 – 1
	reason: string;
	strategy: string; // name of the strategy that produced it
	timestamp: number; // when the signal was generated
	indicators?: Record<string, number>; // optional indicator values
}

/** Lightweight representation of a held position inside the agent. */
export interface AgentPosition {
	symbol: string;
	quantity: number;
	entryPrice: number;
	entryDate: number;
	currentPrice?: number;
	unrealisedPnl?: number;
}

/** Snapshot of the agent's portfolio at a point in time. */
export interface PortfolioSnapshot {
	timestamp: number;
	cash: number;
	positions: AgentPosition[];
	totalValue: number;
	dailyReturn: number;
}

/** A completed (or pending) trade record. */
export interface TradeRecord {
	id: string;
	symbol: string;
	action: TradeAction;
	quantity: number;
	price: number;
	timestamp: number;
	strategy: string;
	reason: string;
	pnl?: number; // realised pnl for sell trades
}

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

/** Every strategy must implement this interface. */
export interface IStrategy {
	name: string;
	description: string;
	/** Given historical prices, produce a trading signal. */
	evaluate(symbol: string, prices: number[], currentPrice: number): TradeSignal;
}

// ---------------------------------------------------------------------------
// Risk Manager
// ---------------------------------------------------------------------------

export interface RiskConfig {
	maxPositionPct: number; // max % of portfolio in a single position (0-1)
	maxTotalExposurePct: number; // max % of portfolio in equities (0-1)
	stopLossPct: number; // per-position stop loss pct (e.g. 0.07 = 7%)
	takeProfitPct: number; // per-position take profit pct
	maxDailyTrades: number; // max trades per day
	minCashReservePct: number; // always keep this % as cash
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
	maxPositionPct: 0.2,
	maxTotalExposurePct: 0.8,
	stopLossPct: 0.07,
	takeProfitPct: 0.15,
	maxDailyTrades: 10,
	minCashReservePct: 0.1,
};

// ---------------------------------------------------------------------------
// Backtesting
// ---------------------------------------------------------------------------

export interface BacktestConfig {
	symbols: string[];
	strategyName: string;
	startDate?: string; // ISO date string
	endDate?: string;
	initialCash: number;
}

export interface BacktestResult {
	strategyName: string;
	symbols: string[];
	startDate: string;
	endDate: string;
	initialCash: number;
	finalValue: number;
	totalReturn: number; // %
	annualisedReturn: number; // %
	maxDrawdown: number; // %
	sharpeRatio: number;
	totalTrades: number;
	winRate: number; // %
	trades: TradeRecord[];
	equityCurve: { date: number; value: number }[];
}

// ---------------------------------------------------------------------------
// Agent State
// ---------------------------------------------------------------------------

export type AgentStatus = "idle" | "running" | "paused" | "error";

export interface AgentState {
	status: AgentStatus;
	watchlist: string[];
	activeStrategy: string;
	riskConfig: RiskConfig;
	portfolio: PortfolioSnapshot;
	recentSignals: TradeSignal[];
	recentTrades: TradeRecord[];
	backtestResults: BacktestResult[];
	startedAt: number | null;
	lastTickAt: number | null;
	error: string | null;
}
