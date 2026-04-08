import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	Box,
	Container,
	Heading,
	Text,
	Button,
	ButtonGroup,
	Grid,

	Stat,
	StatLabel,
	StatNumber,
	StatHelpText,
	StatArrow,
	Badge,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	Select,
	Input,
	HStack,
	VStack,
	Flex,
	Spacer,
	useColorModeValue,
	useToast,
	Spinner,
	Tag,
	TagLabel,
	TagCloseButton,
	Wrap,
	WrapItem,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
	Progress,
	IconButton,
	Card,
	CardHeader,
	CardBody,
	SimpleGrid,
} from "@chakra-ui/react";
import {
	RepeatIcon,
	TriangleUpIcon,
	InfoIcon,
	WarningIcon,


} from "@chakra-ui/icons";
import api from "../services/api.service";

// ─── Types ───────────────────────────────────────────────────────────────
interface TradeSignal {
	action: "BUY" | "SELL" | "HOLD";
	symbol: string;
	confidence: number;
	reason: string;
	strategy: string;
	timestamp: number;
	indicators?: Record<string, number>;
}

interface TradeRecord {
	id: string;
	symbol: string;
	action: "BUY" | "SELL" | "HOLD";
	quantity: number;
	price: number;
	timestamp: number;
	strategy: string;
	reason: string;
	pnl?: number;
}

interface AgentPosition {
	symbol: string;
	quantity: number;
	entryPrice: number;
	entryDate: number;
	currentPrice?: number;
	unrealisedPnl?: number;
}

interface PortfolioSnapshot {
	timestamp: number;
	cash: number;
	positions: AgentPosition[];
	totalValue: number;
	dailyReturn: number;
}

interface RiskConfig {
	maxPositionPct: number;
	maxTotalExposurePct: number;
	stopLossPct: number;
	takeProfitPct: number;
	maxDailyTrades: number;
	minCashReservePct: number;
}

interface BacktestResult {
	strategyName: string;
	symbols: string[];
	startDate: string;
	endDate: string;
	initialCash: number;
	finalValue: number;
	totalReturn: number;
	annualisedReturn: number;
	maxDrawdown: number;
	sharpeRatio: number;
	totalTrades: number;
	winRate: number;
	trades: TradeRecord[];
	equityCurve: { date: number; value: number }[];
}

interface AgentState {
	status: "idle" | "running" | "paused" | "error";
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

interface StrategyInfo {
	name: string;
	description: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	}).format(n);
}

function formatPct(n: number): string {
	return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

function timeAgo(ts: number): string {
	const seconds = Math.floor((Date.now() - ts) / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h ago`;
}

// ─── Status Badge ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
	const colorMap: Record<string, string> = {
		idle: "gray",
		running: "green",
		paused: "yellow",
		error: "red",
	};
	return (
		<Badge
			colorScheme={colorMap[status] || "gray"}
			fontSize="sm"
			px="3"
			py="1"
			borderRadius="full"
			textTransform="uppercase"
			letterSpacing="wider"
		>
			{status === "running" ? "● " : ""}
			{status}
		</Badge>
	);
}

// ─── Action Color ────────────────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
	const colorMap: Record<string, string> = {
		BUY: "green",
		SELL: "red",
		HOLD: "gray",
	};
	return (
		<Badge colorScheme={colorMap[action] || "gray"} variant="subtle">
			{action}
		</Badge>
	);
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function AgentDashboard() {
	const [state, setState] = useState<AgentState | null>(null);
	const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [newSymbol, setNewSymbol] = useState("");
	const [backtestLoading, setBacktestLoading] = useState(false);
	const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
	const [btSymbols, setBtSymbols] = useState("AAPL,MSFT");
	const [btStrategy, setBtStrategy] = useState("composite");
	const [btCash, setBtCash] = useState("100000");
	const [chatMessages, setChatMessages] = useState<{role: "user" | "bot"; text: string}[]>([]);
	const [chatInput, setChatInput] = useState("");
	const [chatLoading, setChatLoading] = useState(false);
	const chatEndRef = useRef<HTMLDivElement>(null);

	const toast = useToast();
	const cardBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const subtleBg = useColorModeValue("gray.50", "gray.900");
	const greenColor = useColorModeValue("green.500", "green.300");
	const redColor = useColorModeValue("red.500", "red.300");

	// ── Fetch state ────────────────────────────────────────────────────────
	const fetchState = useCallback(async () => {
		try {
			const [statusRes, stratRes] = await Promise.all([
				api.get("/agent/status"),
				api.get("/agent/strategies"),
			]);
			setState(statusRes.data);
			setStrategies(stratRes.data.strategies);
		} catch (err) {
			console.error("Failed to fetch agent state", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchState();
		const interval = setInterval(fetchState, 10000); // auto refresh
		return () => clearInterval(interval);
	}, [fetchState]);

	// ── Actions ─────────────────────────────────────────────────────────────
	const doAction = async (
		action: string,
		method: "post" | "put" = "post",
		body?: any,
	) => {
		setActionLoading(true);
		try {
			const res =
				method === "put"
					? await api.put(`/agent/${action}`, body)
					: await api.post(`/agent/${action}`, body);
			setState(res.data.state || res.data);
			toast({
				title: res.data.message || "Done",
				status: "success",
				duration: 2000,
				isClosable: true,
				position: "top-right",
			});
		} catch (err: any) {
			toast({
				title: "Error",
				description: err.response?.data?.error || err.message,
				status: "error",
				duration: 3000,
				isClosable: true,
				position: "top-right",
			});
		} finally {
			setActionLoading(false);
			fetchState();
		}
	};

	const addSymbol = () => {
		if (!newSymbol.trim() || !state) return;
		const updated = [...state.watchlist, newSymbol.trim().toUpperCase()];
		doAction("watchlist", "put", { symbols: updated });
		setNewSymbol("");
	};

	const removeSymbol = (sym: string) => {
		if (!state) return;
		const updated = state.watchlist.filter((s) => s !== sym);
		doAction("watchlist", "put", { symbols: updated });
	};

	const runBacktest = async () => {
		setBacktestLoading(true);
		setBacktestResult(null);
		try {
			const res = await api.post("/agent/backtest", {
				symbols: btSymbols
					.split(",")
					.map((s) => s.trim().toUpperCase())
					.filter(Boolean),
				strategyName: btStrategy,
				initialCash: parseInt(btCash) || 100000,
			});
			setBacktestResult(res.data);
			toast({
				title: "Backtest complete",
				status: "success",
				duration: 2000,
				position: "top-right",
			});
		} catch (err: any) {
			toast({
				title: "Backtest failed",
				description: err.response?.data?.error || err.message,
				status: "error",
				duration: 3000,
				position: "top-right",
			});
		} finally {
			setBacktestLoading(false);
		}
	};

	// ── Loading state ────────────────────────────────────────────────────────
	if (loading || !state) {
		return (
			<Container maxW="container.xl" py="10">
				<VStack spacing="4">
					<Spinner size="xl" />
					<Text>Loading Trading Agent...</Text>
				</VStack>
			</Container>
		);
	}

	const totalPositionsValue = state.portfolio.positions.reduce(
		(s, p) => s + p.quantity * (p.currentPrice ?? p.entryPrice),
		0,
	);
	const totalUnrealisedPnl = state.portfolio.positions.reduce(
		(s, p) => s + (p.unrealisedPnl ?? 0),
		0,
	);

	return (
		<Box pb="10">
			{/* ── Header ────────────────────────────────────────────────────── */}
			<Flex
				align="center"
				mb="6"
				flexWrap="wrap"
				gap="3"
			>
				<VStack align="start" spacing="1">
					<HStack>
						<Heading size="lg">🤖 Trading Agent</Heading>
						<StatusBadge status={state.status} />
					</HStack>
					{state.lastTickAt && (
						<Text fontSize="xs" color="gray.500">
							Last tick: {timeAgo(state.lastTickAt)} · Strategy:{" "}
							<Text as="span" fontWeight="bold">
								{state.activeStrategy}
							</Text>
						</Text>
					)}
				</VStack>
				<Spacer />
				<ButtonGroup size="sm" isAttached variant="outline">
					<Button
						colorScheme="green"
						onClick={() => doAction("start")}
						isLoading={actionLoading}
						isDisabled={state.status === "running"}
						leftIcon={<TriangleUpIcon />}
					>
						Start
					</Button>
					<Button
						colorScheme="yellow"
						onClick={() => doAction("pause")}
						isLoading={actionLoading}
						isDisabled={state.status !== "running"}
					>
						Pause
					</Button>
					<Button
						colorScheme="red"
						onClick={() => doAction("stop")}
						isLoading={actionLoading}
						isDisabled={state.status === "idle"}
					>
						Stop
					</Button>
					<Button
						onClick={() => doAction("reset")}
						isLoading={actionLoading}
					>
						Reset
					</Button>
				</ButtonGroup>
				<IconButton
					aria-label="Refresh"
					icon={<RepeatIcon />}
					size="sm"
					onClick={fetchState}
					variant="ghost"
				/>
			</Flex>

			{state.error && (
				<Box
					mb="4"
					p="3"
					bg="red.50"
					borderRadius="md"
					border="1px solid"
					borderColor="red.200"
				>
					<HStack>
						<WarningIcon color="red.500" />
						<Text color="red.700" fontSize="sm">
							{state.error}
						</Text>
					</HStack>
				</Box>
			)}

			{/* ── Portfolio Stats ────────────────────────────────────────────── */}
			<SimpleGrid columns={{ base: 2, md: 4 }} spacing="4" mb="6">
				<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
					<CardBody py="4">
						<Stat>
							<StatLabel fontSize="xs" textTransform="uppercase" letterSpacing="wider">
								Portfolio Value
							</StatLabel>
							<StatNumber fontSize="xl">
								{formatCurrency(state.portfolio.totalValue)}
							</StatNumber>
							<StatHelpText mb="0">
								<StatArrow
									type={state.portfolio.dailyReturn >= 0 ? "increase" : "decrease"}
								/>
								{formatPct(state.portfolio.dailyReturn)} today
							</StatHelpText>
						</Stat>
					</CardBody>
				</Card>

				<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
					<CardBody py="4">
						<Stat>
							<StatLabel fontSize="xs" textTransform="uppercase" letterSpacing="wider">
								Cash Available
							</StatLabel>
							<StatNumber fontSize="xl">
								{formatCurrency(state.portfolio.cash)}
							</StatNumber>
							<StatHelpText mb="0">
								{((state.portfolio.cash / state.portfolio.totalValue) * 100).toFixed(
									1,
								)}
								% of portfolio
							</StatHelpText>
						</Stat>
					</CardBody>
				</Card>

				<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
					<CardBody py="4">
						<Stat>
							<StatLabel fontSize="xs" textTransform="uppercase" letterSpacing="wider">
								Positions Value
							</StatLabel>
							<StatNumber fontSize="xl">
								{formatCurrency(totalPositionsValue)}
							</StatNumber>
							<StatHelpText mb="0">
								{state.portfolio.positions.length} position
								{state.portfolio.positions.length !== 1 ? "s" : ""} held
							</StatHelpText>
						</Stat>
					</CardBody>
				</Card>

				<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
					<CardBody py="4">
						<Stat>
							<StatLabel fontSize="xs" textTransform="uppercase" letterSpacing="wider">
								Unrealised P&L
							</StatLabel>
							<StatNumber
								fontSize="xl"
								color={totalUnrealisedPnl >= 0 ? greenColor : redColor}
							>
								{formatCurrency(totalUnrealisedPnl)}
							</StatNumber>
							<StatHelpText mb="0">
								{state.recentTrades.length} trades total
							</StatHelpText>
						</Stat>
					</CardBody>
				</Card>
			</SimpleGrid>

			{/* ── Tabs ──────────────────────────────────────────────────────── */}
			<Tabs variant="enclosed" colorScheme="cyan">
				<TabList>
					<Tab>📡 Live Signals</Tab>
					<Tab>📊 Positions</Tab>
					<Tab>📜 Trade History</Tab>
					<Tab>⚙️ Configuration</Tab>
					<Tab>🧪 Backtest</Tab>
					<Tab>💬 Chat</Tab>
				</TabList>

				<TabPanels>
					{/* ── Tab 1: Live Signals ─────────────────────────────────── */}
					<TabPanel px="0">
						{state.recentSignals.length === 0 ? (
							<Box
								textAlign="center"
								py="12"
								bg={subtleBg}
								borderRadius="lg"
							>
								<InfoIcon boxSize="8" color="gray.400" mb="3" />
								<Text color="gray.500">
									No signals yet. Start the agent and wait for the next tick.
								</Text>
							</Box>
						) : (
							<Box overflowX="auto">
								<Table size="sm">
									<Thead>
										<Tr>
											<Th>Symbol</Th>
											<Th>Signal</Th>
											<Th>Confidence</Th>
											<Th>Reason</Th>
											<Th>Time</Th>
										</Tr>
									</Thead>
									<Tbody>
										{state.recentSignals.map((sig, i) => (
											<Tr key={i}>
												<Td fontWeight="bold">{sig.symbol}</Td>
												<Td>
													<ActionBadge action={sig.action} />
												</Td>
												<Td>
													<HStack spacing="2">
														<Progress
															value={sig.confidence * 100}
															size="sm"
															colorScheme={
																sig.action === "BUY"
																	? "green"
																	: sig.action === "SELL"
																	? "red"
																	: "gray"
															}
															borderRadius="full"
															w="60px"
														/>
														<Text fontSize="xs">
															{(sig.confidence * 100).toFixed(0)}%
														</Text>
													</HStack>
												</Td>
												<Td>
													<Text fontSize="xs" maxW="350px" noOfLines={2}>
														{sig.reason}
													</Text>
												</Td>
												<Td fontSize="xs" color="gray.500">
													{timeAgo(sig.timestamp)}
												</Td>
											</Tr>
										))}
									</Tbody>
								</Table>
							</Box>
						)}
					</TabPanel>

					{/* ── Tab 2: Positions ─────────────────────────────────────── */}
					<TabPanel px="0">
						{state.portfolio.positions.length === 0 ? (
							<Box
								textAlign="center"
								py="12"
								bg={subtleBg}
								borderRadius="lg"
							>
								<InfoIcon boxSize="8" color="gray.400" mb="3" />
								<Text color="gray.500">
									No open positions. The agent will buy stocks when it detects a
									buy signal.
								</Text>
							</Box>
						) : (
							<Box overflowX="auto">
								<Table size="sm">
									<Thead>
										<Tr>
											<Th>Symbol</Th>
											<Th isNumeric>Qty</Th>
											<Th isNumeric>Entry Price</Th>
											<Th isNumeric>Current Price</Th>
											<Th isNumeric>Market Value</Th>
											<Th isNumeric>P&L</Th>
											<Th isNumeric>P&L %</Th>
										</Tr>
									</Thead>
									<Tbody>
										{state.portfolio.positions.map((pos, i) => {
											const cp = pos.currentPrice ?? pos.entryPrice;
											const pnl = (cp - pos.entryPrice) * pos.quantity;
											const pnlPct =
												((cp - pos.entryPrice) / pos.entryPrice) * 100;
											return (
												<Tr key={i}>
													<Td fontWeight="bold">{pos.symbol}</Td>
													<Td isNumeric>{pos.quantity}</Td>
													<Td isNumeric>{formatCurrency(pos.entryPrice)}</Td>
													<Td isNumeric>{formatCurrency(cp)}</Td>
													<Td isNumeric>{formatCurrency(cp * pos.quantity)}</Td>
													<Td
														isNumeric
														color={pnl >= 0 ? greenColor : redColor}
														fontWeight="semibold"
													>
														{formatCurrency(pnl)}
													</Td>
													<Td
														isNumeric
														color={pnlPct >= 0 ? greenColor : redColor}
													>
														{formatPct(pnlPct)}
													</Td>
												</Tr>
											);
										})}
									</Tbody>
								</Table>
							</Box>
						)}
					</TabPanel>

					{/* ── Tab 3: Trade History ─────────────────────────────────── */}
					<TabPanel px="0">
						{state.recentTrades.length === 0 ? (
							<Box
								textAlign="center"
								py="12"
								bg={subtleBg}
								borderRadius="lg"
							>
								<InfoIcon boxSize="8" color="gray.400" mb="3" />
								<Text color="gray.500">No trades yet.</Text>
							</Box>
						) : (
							<Box overflowX="auto">
								<Table size="sm">
									<Thead>
										<Tr>
											<Th>Time</Th>
											<Th>Symbol</Th>
											<Th>Action</Th>
											<Th isNumeric>Qty</Th>
											<Th isNumeric>Price</Th>
											<Th isNumeric>P&L</Th>
											<Th>Strategy</Th>
											<Th>Reason</Th>
										</Tr>
									</Thead>
									<Tbody>
										{state.recentTrades.slice(0, 50).map((trade) => (
											<Tr key={trade.id}>
												<Td fontSize="xs" whiteSpace="nowrap">
													{new Date(trade.timestamp).toLocaleString()}
												</Td>
												<Td fontWeight="bold">{trade.symbol}</Td>
												<Td>
													<ActionBadge action={trade.action} />
												</Td>
												<Td isNumeric>{trade.quantity}</Td>
												<Td isNumeric>{formatCurrency(trade.price)}</Td>
												<Td
													isNumeric
													color={
														trade.pnl != null
															? trade.pnl >= 0
																? greenColor
																: redColor
															: undefined
													}
													fontWeight={trade.pnl != null ? "semibold" : "normal"}
												>
													{trade.pnl != null
														? formatCurrency(trade.pnl)
														: "—"}
												</Td>
												<Td>
													<Badge variant="outline" size="sm">
														{trade.strategy}
													</Badge>
												</Td>
												<Td>
													<Text fontSize="xs" maxW="280px" noOfLines={1}>
														{trade.reason}
													</Text>
												</Td>
											</Tr>
										))}
									</Tbody>
								</Table>
							</Box>
						)}
					</TabPanel>

					{/* ── Tab 4: Configuration ────────────────────────────────── */}
					<TabPanel>
						<Grid
							templateColumns={{ base: "1fr", md: "1fr 1fr" }}
							gap="6"
						>
							{/* Strategy selector */}
							<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
								<CardHeader pb="2">
									<Heading size="sm">Strategy</Heading>
								</CardHeader>
								<CardBody>
									<Select
										value={state.activeStrategy}
										onChange={(e) =>
											doAction("strategy", "put", {
												strategy: e.target.value,
											})
										}
										mb="3"
									>
										{strategies.map((s) => (
											<option key={s.name} value={s.name}>
												{s.name}
											</option>
										))}
									</Select>
									{strategies
										.filter((s) => s.name === state.activeStrategy)
										.map((s) => (
											<Text key={s.name} fontSize="sm" color="gray.500">
												{s.description}
											</Text>
										))}
								</CardBody>
							</Card>

							{/* Watchlist */}
							<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
								<CardHeader pb="2">
									<Heading size="sm">Watchlist</Heading>
								</CardHeader>
								<CardBody>
									<Wrap mb="3">
										{state.watchlist.map((sym) => (
											<WrapItem key={sym}>
												<Tag
													size="md"
													borderRadius="full"
													variant="subtle"
													colorScheme="cyan"
												>
													<TagLabel>{sym}</TagLabel>
													<TagCloseButton
														onClick={() => removeSymbol(sym)}
													/>
												</Tag>
											</WrapItem>
										))}
									</Wrap>
									<HStack>
										<Input
											size="sm"
											placeholder="Add symbol (e.g. NVDA)"
											value={newSymbol}
											onChange={(e) => setNewSymbol(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && addSymbol()}
										/>
										<Button size="sm" onClick={addSymbol} colorScheme="cyan">
											Add
										</Button>
									</HStack>
								</CardBody>
							</Card>

							{/* Risk Configuration */}
							<Card
								bg={cardBg}
								borderWidth="1px"
								borderColor={borderColor}
								gridColumn={{ md: "span 2" }}
							>
								<CardHeader pb="2">
									<Heading size="sm">Risk Management</Heading>
								</CardHeader>
								<CardBody>
									<SimpleGrid columns={{ base: 2, md: 3 }} spacing="4">
										<Box>
											<Text fontSize="xs" mb="1" fontWeight="bold">
												Max Position Size
											</Text>
											<Text fontSize="lg">
												{(state.riskConfig.maxPositionPct * 100).toFixed(0)}%
											</Text>
											<Progress
												value={state.riskConfig.maxPositionPct * 100}
												size="xs"
												colorScheme="blue"
												borderRadius="full"
											/>
										</Box>
										<Box>
											<Text fontSize="xs" mb="1" fontWeight="bold">
												Total Exposure Cap
											</Text>
											<Text fontSize="lg">
												{(state.riskConfig.maxTotalExposurePct * 100).toFixed(0)}%
											</Text>
											<Progress
												value={state.riskConfig.maxTotalExposurePct * 100}
												size="xs"
												colorScheme="purple"
												borderRadius="full"
											/>
										</Box>
										<Box>
											<Text fontSize="xs" mb="1" fontWeight="bold">
												Stop-Loss
											</Text>
											<Text fontSize="lg" color={redColor}>
												-{(state.riskConfig.stopLossPct * 100).toFixed(0)}%
											</Text>
										</Box>
										<Box>
											<Text fontSize="xs" mb="1" fontWeight="bold">
												Take-Profit
											</Text>
											<Text fontSize="lg" color={greenColor}>
												+{(state.riskConfig.takeProfitPct * 100).toFixed(0)}%
											</Text>
										</Box>
										<Box>
											<Text fontSize="xs" mb="1" fontWeight="bold">
												Max Daily Trades
											</Text>
											<Text fontSize="lg">
												{state.riskConfig.maxDailyTrades}
											</Text>
										</Box>
										<Box>
											<Text fontSize="xs" mb="1" fontWeight="bold">
												Cash Reserve
											</Text>
											<Text fontSize="lg">
												{(state.riskConfig.minCashReservePct * 100).toFixed(0)}%
											</Text>
										</Box>
									</SimpleGrid>
								</CardBody>
							</Card>
						</Grid>
					</TabPanel>

					{/* ── Tab 5: Backtest ──────────────────────────────────────── */}
					<TabPanel>
						<Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb="6">
							<CardHeader pb="2">
								<Heading size="sm">Run Backtest</Heading>
							</CardHeader>
							<CardBody>
								<Grid
									templateColumns={{ base: "1fr", md: "1fr 1fr 1fr auto" }}
									gap="3"
									alignItems="end"
								>
									<Box>
										<Text fontSize="xs" mb="1" fontWeight="bold">
											Symbols (comma separated)
										</Text>
										<Input
											size="sm"
											value={btSymbols}
											onChange={(e) => setBtSymbols(e.target.value)}
											placeholder="AAPL,MSFT,GOOGL"
										/>
									</Box>
									<Box>
										<Text fontSize="xs" mb="1" fontWeight="bold">
											Strategy
										</Text>
										<Select
											size="sm"
											value={btStrategy}
											onChange={(e) => setBtStrategy(e.target.value)}
										>
											{strategies.map((s) => (
												<option key={s.name} value={s.name}>
													{s.name}
												</option>
											))}
										</Select>
									</Box>
									<Box>
										<Text fontSize="xs" mb="1" fontWeight="bold">
											Initial Cash
										</Text>
										<Input
											size="sm"
											value={btCash}
											onChange={(e) => setBtCash(e.target.value)}
											type="number"
										/>
									</Box>
									<Button
										colorScheme="cyan"
										size="sm"
										onClick={runBacktest}
										isLoading={backtestLoading}
										loadingText="Running..."
									>
										Run Backtest
									</Button>
								</Grid>
							</CardBody>
						</Card>

						{backtestLoading && (
							<Box textAlign="center" py="12">
								<Spinner size="xl" mb="3" />
								<Text>
									Running backtest on 2 years of data... This may take a moment.
								</Text>
							</Box>
						)}

						{backtestResult && !backtestLoading && (
							<>
								{/* Results summary */}
								<SimpleGrid
									columns={{ base: 2, md: 4 }}
									spacing="4"
									mb="6"
								>
									<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
										<CardBody py="3">
											<Stat size="sm">
												<StatLabel fontSize="xs">Total Return</StatLabel>
												<StatNumber
													fontSize="lg"
													color={
														backtestResult.totalReturn >= 0
															? greenColor
															: redColor
													}
												>
													{formatPct(backtestResult.totalReturn)}
												</StatNumber>
												<StatHelpText fontSize="xs" mb="0">
													{formatCurrency(backtestResult.initialCash)} →{" "}
													{formatCurrency(backtestResult.finalValue)}
												</StatHelpText>
											</Stat>
										</CardBody>
									</Card>

									<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
										<CardBody py="3">
											<Stat size="sm">
												<StatLabel fontSize="xs">Sharpe Ratio</StatLabel>
												<StatNumber fontSize="lg">
													{backtestResult.sharpeRatio.toFixed(2)}
												</StatNumber>
												<StatHelpText fontSize="xs" mb="0">
													{backtestResult.sharpeRatio > 1
														? "Good"
														: backtestResult.sharpeRatio > 0.5
														? "Moderate"
														: "Low"}{" "}
													risk-adjusted return
												</StatHelpText>
											</Stat>
										</CardBody>
									</Card>

									<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
										<CardBody py="3">
											<Stat size="sm">
												<StatLabel fontSize="xs">Max Drawdown</StatLabel>
												<StatNumber fontSize="lg" color={redColor}>
													-{backtestResult.maxDrawdown.toFixed(1)}%
												</StatNumber>
												<StatHelpText fontSize="xs" mb="0">
													Worst peak-to-trough decline
												</StatHelpText>
											</Stat>
										</CardBody>
									</Card>

									<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
										<CardBody py="3">
											<Stat size="sm">
												<StatLabel fontSize="xs">Win Rate</StatLabel>
												<StatNumber fontSize="lg">
													{backtestResult.winRate.toFixed(1)}%
												</StatNumber>
												<StatHelpText fontSize="xs" mb="0">
													{backtestResult.totalTrades} trades ({backtestResult.startDate}{" "}
													to {backtestResult.endDate})
												</StatHelpText>
											</Stat>
										</CardBody>
									</Card>
								</SimpleGrid>

								{/* Equity curve (text-based) */}
								<Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb="6">
									<CardHeader pb="0">
										<Heading size="sm">Equity Curve</Heading>
									</CardHeader>
									<CardBody>
										{backtestResult.equityCurve.length > 0 && (
											<Box>
												<Flex justify="space-between" mb="2">
													<Text fontSize="sm" color="gray.500">
														{backtestResult.startDate}
													</Text>
													<Text fontSize="sm" fontWeight="bold">
														{formatCurrency(backtestResult.finalValue)}
													</Text>
													<Text fontSize="sm" color="gray.500">
														{backtestResult.endDate}
													</Text>
												</Flex>
												<Progress
													value={
														((backtestResult.finalValue -
															backtestResult.initialCash) /
															backtestResult.initialCash) *
															100 +
														50
													}
													size="lg"
													colorScheme={
														backtestResult.totalReturn >= 0
															? "green"
															: "red"
													}
													borderRadius="full"
													hasStripe
													isAnimated
												/>
												<Flex justify="space-between" mt="1">
													<Text fontSize="xs" color="gray.500">
														{formatCurrency(backtestResult.initialCash)}
													</Text>
													<Text
														fontSize="xs"
														color={
															backtestResult.totalReturn >= 0
																? greenColor
																: redColor
														}
														fontWeight="bold"
													>
														{formatPct(backtestResult.totalReturn)}
													</Text>
												</Flex>
											</Box>
										)}
									</CardBody>
								</Card>

								{/* Backtest trades */}
								{backtestResult.trades.length > 0 && (
									<Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
										<CardHeader pb="0">
											<Heading size="sm">
												Backtest Trades ({backtestResult.trades.length})
											</Heading>
										</CardHeader>
										<CardBody>
											<Box overflowX="auto" maxH="400px" overflowY="auto">
												<Table size="sm">
													<Thead position="sticky" top="0" bg={cardBg} zIndex="1">
														<Tr>
															<Th>Date</Th>
															<Th>Symbol</Th>
															<Th>Action</Th>
															<Th isNumeric>Qty</Th>
															<Th isNumeric>Price</Th>
															<Th isNumeric>P&L</Th>
															<Th>Reason</Th>
														</Tr>
													</Thead>
													<Tbody>
														{backtestResult.trades
															.slice(0, 100)
															.map((trade) => (
																<Tr key={trade.id}>
																	<Td fontSize="xs" whiteSpace="nowrap">
																		{new Date(
																			trade.timestamp,
																		).toLocaleDateString()}
																	</Td>
																	<Td fontWeight="bold">
																		{trade.symbol}
																	</Td>
																	<Td>
																		<ActionBadge action={trade.action} />
																	</Td>
																	<Td isNumeric>{trade.quantity}</Td>
																	<Td isNumeric>
																		{formatCurrency(trade.price)}
																	</Td>
																	<Td
																		isNumeric
																		color={
																			trade.pnl != null
																				? trade.pnl >= 0
																					? greenColor
																					: redColor
																				: undefined
																		}
																	>
																		{trade.pnl != null
																			? formatCurrency(trade.pnl)
																			: "—"}
																	</Td>
																	<Td>
																		<Text
																			fontSize="xs"
																			maxW="200px"
																			noOfLines={1}
																		>
																			{trade.reason}
																		</Text>
																	</Td>
																</Tr>
															))}
													</Tbody>
												</Table>
											</Box>
										</CardBody>
									</Card>
								)}
							</>
						)}

						{/* Previous backtest results */}
						{state.backtestResults.length > 0 && (
							<Box mt="6">
								<Heading size="sm" mb="3">
									Previous Backtests
								</Heading>
								<Box overflowX="auto">
									<Table size="sm">
										<Thead>
											<Tr>
												<Th>Strategy</Th>
												<Th>Symbols</Th>
												<Th>Period</Th>
												<Th isNumeric>Return</Th>
												<Th isNumeric>Sharpe</Th>
												<Th isNumeric>Max DD</Th>
												<Th isNumeric>Win Rate</Th>
												<Th isNumeric>Trades</Th>
											</Tr>
										</Thead>
										<Tbody>
											{state.backtestResults.map((bt, i) => (
												<Tr key={i}>
													<Td>
														<Badge variant="outline">{bt.strategyName}</Badge>
													</Td>
													<Td fontSize="xs">{bt.symbols.join(", ")}</Td>
													<Td fontSize="xs">
														{bt.startDate} → {bt.endDate}
													</Td>
													<Td
														isNumeric
														color={
															bt.totalReturn >= 0
																? greenColor
																: redColor
														}
														fontWeight="bold"
													>
														{formatPct(bt.totalReturn)}
													</Td>
													<Td isNumeric>{bt.sharpeRatio.toFixed(2)}</Td>
													<Td isNumeric color={redColor}>
														-{bt.maxDrawdown.toFixed(1)}%
													</Td>
													<Td isNumeric>{bt.winRate.toFixed(1)}%</Td>
													<Td isNumeric>{bt.totalTrades}</Td>
												</Tr>
											))}
										</Tbody>
									</Table>
								</Box>
							</Box>
						)}
					</TabPanel>

					{/* ── Tab 6: Chat ─────────────────────────────────────── */}
					<TabPanel px="0">
						<Box
							bg={subtleBg}
							borderRadius="xl"
							p="4"
							minH="400px"
							maxH="500px"
							overflowY="auto"
							mb="3"
							display="flex"
							flexDirection="column"
							gap="3"
						>
							{chatMessages.length === 0 && (
								<Flex
									align="center"
									justify="center"
									flex="1"
									minH="350px"
									flexDirection="column"
								>
									<Text fontSize="5xl" mb="2">🤖</Text>
									<Text fontWeight="bold" fontSize="lg" mb="1">Trading Assistant</Text>
									<Text color="gray.500" fontSize="sm" textAlign="center" maxW="300px">
										Ask me anything about trading — indicators, strategies,
										risk management, or how the agent works.
									</Text>
								</Flex>
							)}

							{chatMessages.map((msg, i) => (
								<Flex
									key={i}
									justify={msg.role === "user" ? "flex-end" : "flex-start"}
								>
									<Box
										maxW="80%"
										px="4"
										py="3"
										borderRadius="xl"
										bg={msg.role === "user" ? "cyan.500" : cardBg}
										color={msg.role === "user" ? "white" : undefined}
										boxShadow="sm"
										borderWidth={msg.role === "bot" ? "1px" : "0"}
										borderColor={borderColor}
									>
										{msg.role === "bot" && (
											<Text fontSize="xs" fontWeight="bold" mb="1" color="cyan.500">
												🤖 Trading Bot
											</Text>
										)}
										<Text
											fontSize="sm"
											whiteSpace="pre-line"
											lineHeight="1.6"
										>
											{msg.text}
										</Text>
									</Box>
								</Flex>
							))}

							{chatLoading && (
								<Flex justify="flex-start">
									<Box
										px="4"
										py="3"
										borderRadius="xl"
										bg={cardBg}
										boxShadow="sm"
										borderWidth="1px"
										borderColor={borderColor}
									>
										<HStack spacing="1">
											<Spinner size="xs" color="cyan.500" />
											<Text fontSize="sm" color="gray.500">Thinking...</Text>
										</HStack>
									</Box>
								</Flex>
							)}
							<div ref={chatEndRef} />
						</Box>

						<HStack>
							<Input
								placeholder="Ask anything about trading..."
								value={chatInput}
								onChange={(e) => setChatInput(e.target.value)}
								onKeyDown={async (e) => {
									if (e.key === "Enter" && chatInput.trim() && !chatLoading) {
										const question = chatInput.trim();
										setChatInput("");
										setChatMessages(prev => [...prev, { role: "user", text: question }]);
										setChatLoading(true);
										setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
										try {
											const res = await api.post("/agent/chat", { message: question });
											setChatMessages(prev => [...prev, { role: "bot", text: res.data.answer }]);
										} catch {
											setChatMessages(prev => [...prev, { role: "bot", text: "Sorry, I couldn't process that. Try asking about RSI, MACD, stop-loss, or any trading concept!" }]);
										}
										setChatLoading(false);
										setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
									}
								}}
								borderRadius="full"
								size="lg"
							/>
							<Button
								colorScheme="cyan"
								borderRadius="full"
								size="lg"
								isLoading={chatLoading}
								onClick={async () => {
									if (!chatInput.trim() || chatLoading) return;
									const question = chatInput.trim();
									setChatInput("");
									setChatMessages(prev => [...prev, { role: "user", text: question }]);
									setChatLoading(true);
									setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
									try {
										const res = await api.post("/agent/chat", { message: question });
										setChatMessages(prev => [...prev, { role: "bot", text: res.data.answer }]);
									} catch {
										setChatMessages(prev => [...prev, { role: "bot", text: "Sorry, I couldn't process that. Try asking about RSI, MACD, stop-loss, or any trading concept!" }]);
									}
									setChatLoading(false);
									setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
								}}
							>
								Send
							</Button>
						</HStack>
					</TabPanel>
				</TabPanels>
			</Tabs>
		</Box>
	);
}
