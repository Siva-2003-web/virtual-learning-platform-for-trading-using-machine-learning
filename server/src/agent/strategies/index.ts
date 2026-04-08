// ============================================================================
// Strategy Registry — central place to get any strategy by name.
// ============================================================================

import { IStrategy } from "../types";
import { PriceDropStrategy } from "./price-drop.strategy";
import { SmaCrossoverStrategy } from "./sma-crossover.strategy";
import { RsiStrategy } from "./rsi.strategy";
import { MacdStrategy } from "./macd.strategy";
import { CompositeStrategy } from "./composite.strategy";

const strategyInstances: IStrategy[] = [
	new PriceDropStrategy(),
	new SmaCrossoverStrategy(),
	new RsiStrategy(),
	new MacdStrategy(),
	new CompositeStrategy(),
];

const strategyMap = new Map<string, IStrategy>();
for (const s of strategyInstances) {
	strategyMap.set(s.name, s);
}

export function getStrategy(name: string): IStrategy | undefined {
	return strategyMap.get(name);
}

export function getAllStrategies(): IStrategy[] {
	return [...strategyInstances];
}

export function getStrategyNames(): string[] {
	return strategyInstances.map((s) => s.name);
}
