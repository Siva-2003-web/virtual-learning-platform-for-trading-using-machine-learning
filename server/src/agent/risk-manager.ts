// ============================================================================
// Risk Manager – guards every trade through risk rules before execution.
// ============================================================================

import {
	RiskConfig,
	DEFAULT_RISK_CONFIG,
	TradeSignal,
	AgentPosition,
	TradeRecord,
} from "./types";

export class RiskManager {
	private config: RiskConfig;

	constructor(config: Partial<RiskConfig> = {}) {
		this.config = { ...DEFAULT_RISK_CONFIG, ...config };
	}

	getConfig(): RiskConfig {
		return { ...this.config };
	}

	updateConfig(patch: Partial<RiskConfig>): void {
		this.config = { ...this.config, ...patch };
	}

	/**
	 * Calculate the number of shares to buy given the signal, current
	 * portfolio cash, total value, and existing positions.
	 * Returns 0 if the trade is rejected by any risk rule.
	 */
	calculateBuyQuantity(
		signal: TradeSignal,
		cash: number,
		totalPortfolioValue: number,
		currentPrice: number,
		positions: AgentPosition[],
		todaysTrades: TradeRecord[],
	): { quantity: number; reason: string } {
		// --- Rule 1: Daily trade cap ---
		if (todaysTrades.length >= this.config.maxDailyTrades) {
			return { quantity: 0, reason: "Daily trade limit reached" };
		}

		// --- Rule 2: Minimum cash reserve ---
		const minCash = totalPortfolioValue * this.config.minCashReservePct;
		const availableCash = cash - minCash;
		if (availableCash <= 0) {
			return { quantity: 0, reason: "Cash reserve floor would be breached" };
		}

		// --- Rule 3: Maximum single-position size ---
		const maxPositionValue = totalPortfolioValue * this.config.maxPositionPct;
		// How much of this symbol do we already hold?
		const existingValue = positions
			.filter((p) => p.symbol === signal.symbol)
			.reduce((sum, p) => sum + p.quantity * (p.currentPrice ?? currentPrice), 0);
		const allowedValue = Math.max(0, maxPositionValue - existingValue);

		// --- Rule 4: Total exposure cap ---
		const currentExposure = positions.reduce(
			(sum, p) => sum + p.quantity * (p.currentPrice ?? p.entryPrice),
			0,
		);
		const maxExposure = totalPortfolioValue * this.config.maxTotalExposurePct;
		const exposureRoom = Math.max(0, maxExposure - currentExposure);

		// Take the most restrictive limit
		const spendable = Math.min(availableCash, allowedValue, exposureRoom);
		const quantity = Math.floor(spendable / currentPrice);

		if (quantity <= 0) {
			return { quantity: 0, reason: "Position/exposure limits prevent this trade" };
		}

		return { quantity, reason: "OK" };
	}

	/**
	 * Check whether a position should be forcibly closed due to
	 * stop-loss or take-profit rules.
	 */
	checkPositionLimits(
		position: AgentPosition,
	): { shouldClose: boolean; reason: string } {
		if (!position.currentPrice) {
			return { shouldClose: false, reason: "" };
		}

		const pnlPct =
			(position.currentPrice - position.entryPrice) / position.entryPrice;

		if (pnlPct <= -this.config.stopLossPct) {
			return {
				shouldClose: true,
				reason: `Stop-loss triggered: ${(pnlPct * 100).toFixed(1)}% loss exceeds -${(this.config.stopLossPct * 100).toFixed(0)}% limit`,
			};
		}

		if (pnlPct >= this.config.takeProfitPct) {
			return {
				shouldClose: true,
				reason: `Take-profit triggered: ${(pnlPct * 100).toFixed(1)}% gain exceeds +${(this.config.takeProfitPct * 100).toFixed(0)}% target`,
			};
		}

		return { shouldClose: false, reason: "" };
	}
}
