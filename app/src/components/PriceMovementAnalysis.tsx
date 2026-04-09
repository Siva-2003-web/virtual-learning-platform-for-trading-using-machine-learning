import React, { useEffect, useState } from "react";
import {
	Box,
	Flex,
	Heading,
	Text,
	Spinner,
	HStack,
	VStack,
	Badge,
	Tag,
	Link,
	Tooltip,
	useColorModeValue,
	Divider,
	SimpleGrid,
	keyframes,
} from "@chakra-ui/react";
import {
	InfoOutlineIcon,
	ExternalLinkIcon,
} from "@chakra-ui/icons";
import api from "../services/api.service";

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------
const fadeInUp = keyframes`
	from { opacity: 0; transform: translateY(12px); }
	to { opacity: 1; transform: translateY(0); }
`;



// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface InsightItem {
	type: "bullish" | "bearish" | "neutral";
	icon: string;
	title: string;
	description: string;
	impact: "high" | "medium" | "low";
}

interface Sentiment {
	label: string;
	score: number;
	summary: string;
}

interface NewsItem {
	title: string;
	publisher: string;
	publishedAt: string;
	link: string;
}

interface AnalysisData {
	symbol: string;
	current_price: number;
	previous_close: number;
	day_change: number;
	sentiment: Sentiment;
	insights: InsightItem[];
	related_news: NewsItem[];
	indicators: {
		rsi: number;
		ema12: number;
		ema26: number;
		sma20: number;
		sma50: number;
		bollinger: {
			upper: number;
			middle: number;
			lower: number;
			position: number;
		};
	};
	timestamp: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeSince(dateStr: string): string {
	if (!dateStr) return "";
	const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
	const intervals = [
		{ name: "d", seconds: 86400 },
		{ name: "h", seconds: 3600 },
		{ name: "m", seconds: 60 },
	];
	for (const iv of intervals) {
		const val = Math.floor(seconds / iv.seconds);
		if (val >= 1) return `${val}${iv.name} ago`;
	}
	return "Just now";
}

function getSentimentColor(label: string): string {
	switch (label) {
		case "Strong Bullish":
			return "green";
		case "Bullish":
			return "green";
		case "Strong Bearish":
			return "red";
		case "Bearish":
			return "red";
		default:
			return "yellow";
	}
}

function getSentimentEmoji(label: string): string {
	switch (label) {
		case "Strong Bullish":
			return "🟢";
		case "Bullish":
			return "🟩";
		case "Strong Bearish":
			return "🔴";
		case "Bearish":
			return "🟥";
		default:
			return "🟡";
	}
}

function getImpactColor(impact: string): string {
	switch (impact) {
		case "high":
			return "red";
		case "medium":
			return "orange";
		case "low":
			return "gray";
		default:
			return "gray";
	}
}

// ---------------------------------------------------------------------------
// Sentiment Gauge
// ---------------------------------------------------------------------------
function SentimentGauge({ score }: { score: number }) {
	// Score from -10 to +10
	const normalized = Math.max(-10, Math.min(10, score));
	const percentage = ((normalized + 10) / 20) * 100;

	const gaugeGradient = useColorModeValue(
		"linear-gradient(to right, #e53e3e, #ed8936, #ecc94b, #48bb78, #38a169)",
		"linear-gradient(to right, #fc8181, #f6ad55, #faf089, #68d391, #48bb78)"
	);

	const trackBg = useColorModeValue("gray.200", "gray.600");

	return (
		<Box w="100%">
			<Box
				h="8px"
				bg={trackBg}
				borderRadius="full"
				overflow="hidden"
				position="relative"
			>
				<Box
					h="100%"
					bgGradient={gaugeGradient}
					borderRadius="full"
					position="absolute"
					left="0"
					right="0"
				/>
				<Box
					position="absolute"
					left={`${percentage}%`}
					top="50%"
					transform="translate(-50%, -50%)"
					w="14px"
					h="14px"
					bg="white"
					borderRadius="full"
					boxShadow="0 0 6px rgba(0,0,0,0.3)"
					border="2px solid"
					borderColor="gray.600"
					zIndex={2}
				/>
			</Box>
			<Flex justify="space-between" mt="1">
				<Text fontSize="2xs" color="red.400" fontWeight="600">
					Bearish
				</Text>
				<Text fontSize="2xs" color="gray.500" fontWeight="600">
					Neutral
				</Text>
				<Text fontSize="2xs" color="green.400" fontWeight="600">
					Bullish
				</Text>
			</Flex>
		</Box>
	);
}

// ---------------------------------------------------------------------------
// Insight Card
// ---------------------------------------------------------------------------
function InsightCard({
	insight,
	index,
}: {
	insight: InsightItem;
	index: number;
}) {
	const borderColor = useColorModeValue("gray.100", "gray.600");
	const typeBg = useColorModeValue(
		insight.type === "bullish"
			? "green.50"
			: insight.type === "bearish"
			? "red.50"
			: "gray.50",
		insight.type === "bullish"
			? "rgba(72, 187, 120, 0.08)"
			: insight.type === "bearish"
			? "rgba(245, 101, 101, 0.08)"
			: "rgba(160, 174, 192, 0.08)"
	);
	const typeAccent =
		insight.type === "bullish"
			? "green.500"
			: insight.type === "bearish"
			? "red.500"
			: "gray.500";

	return (
		<Box
			bg={typeBg}
			p="4"
			borderRadius="xl"
			borderWidth="1px"
			borderColor={borderColor}
			borderLeftWidth="4px"
			borderLeftColor={typeAccent}
			animation={`${fadeInUp} 0.4s ease-out ${index * 0.08}s both`}
			transition="all 0.2s"
			_hover={{
				transform: "translateY(-2px)",
				boxShadow: "md",
			}}
		>
			<HStack justify="space-between" mb="2">
				<HStack spacing="2">
					<Text fontSize="lg">{insight.icon}</Text>
					<Text fontWeight="700" fontSize="sm">
						{insight.title}
					</Text>
				</HStack>
				<Tag
					size="sm"
					colorScheme={getImpactColor(insight.impact)}
					borderRadius="full"
					fontSize="2xs"
					fontWeight="600"
					textTransform="uppercase"
					letterSpacing="0.5px"
				>
					{insight.impact}
				</Tag>
			</HStack>
			<Text fontSize="sm" color="gray.500" lineHeight="1.6">
				{insight.description}
			</Text>
		</Box>
	);
}

// ---------------------------------------------------------------------------
// Indicator Pill
// ---------------------------------------------------------------------------
function IndicatorPill({
	label,
	value,
	tooltip,
}: {
	label: string;
	value: string;
	tooltip: string;
}) {
	const bg = useColorModeValue("gray.50", "gray.700");
	const labelColor = useColorModeValue("gray.500", "gray.400");

	return (
		<Tooltip label={tooltip} placement="top" hasArrow>
			<Box
				bg={bg}
				px="3"
				py="2"
				borderRadius="lg"
				textAlign="center"
				cursor="help"
				transition="all 0.2s"
				_hover={{ transform: "scale(1.03)" }}
			>
				<Text fontSize="2xs" color={labelColor} fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">
					{label}
				</Text>
				<Text fontSize="sm" fontWeight="700" mt="0.5">
					{value}
				</Text>
			</Box>
		</Tooltip>
	);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PriceMovementAnalysis({
	symbol,
}: {
	symbol: string;
}) {
	const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const mainBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const headerGradient = useColorModeValue(
		"linear(to-r, blue.50, purple.50, pink.50)",
		"linear(to-r, rgba(66,153,225,0.08), rgba(159,122,234,0.08), rgba(237,100,166,0.08))"
	);
	const subTextColor = useColorModeValue("gray.600", "gray.400");
	const newsBg = useColorModeValue("gray.50", "gray.700");
	const dividerColor = useColorModeValue("gray.200", "gray.600");

	useEffect(() => {
		setLoading(true);
		setError(false);

		api
			.get(`/stocks/${symbol}/analysis`)
			.then((res) => {
				setAnalysis(res.data);
				setLoading(false);
			})
			.catch(() => {
				setError(true);
				setLoading(false);
			});
	}, [symbol]);

	if (loading) {
		return (
			<Box
				borderWidth="1px"
				borderRadius="xl"
				p={6}
				bg={mainBg}
				borderColor={borderColor}
			>
				<HStack spacing="3" mb="4">
					<Box
						w="3px"
						h="20px"
						bgGradient="linear(to-b, blue.400, purple.500)"
						borderRadius="full"
					/>
					<Heading size="md">Price Movement Analysis</Heading>
				</HStack>
				<Flex justify="center" align="center" py="10" direction="column" gap="3">
					<Spinner size="lg" color="blue.400" thickness="3px" />
					<Text color="gray.500" fontSize="sm">
						Analyzing price patterns...
					</Text>
				</Flex>
			</Box>
		);
	}

	if (error || !analysis) {
		return (
			<Box
				borderWidth="1px"
				borderRadius="xl"
				p={6}
				bg={mainBg}
				borderColor={borderColor}
			>
				<HStack spacing="3" mb="3">
					<Box
						w="3px"
						h="20px"
						bgGradient="linear(to-b, blue.400, purple.500)"
						borderRadius="full"
					/>
					<Heading size="md">Price Movement Analysis</Heading>
				</HStack>
				<Text color="gray.500" fontSize="sm">
					Analysis is temporarily unavailable. Please try again later.
				</Text>
			</Box>
		);
	}

	const sentimentColor = getSentimentColor(analysis.sentiment.label);
	const sentimentEmoji = getSentimentEmoji(analysis.sentiment.label);

	return (
		<Box
			borderWidth="1px"
			borderRadius="xl"
			overflow="hidden"
			bg={mainBg}
			borderColor={borderColor}
			boxShadow="sm"
			animation={`${fadeInUp} 0.5s ease-out`}
		>
			{/* Header with gradient */}
			<Box bgGradient={headerGradient} px="6" py="5">
				<HStack spacing="3" mb="3">
					<Box
						w="3px"
						h="24px"
						bgGradient="linear(to-b, blue.400, purple.500)"
						borderRadius="full"
					/>
					<Heading size="md" letterSpacing="-0.3px">
						Price Movement Analysis
					</Heading>
					<Tooltip label="AI-powered analysis of why the stock is moving" hasArrow>
						<InfoOutlineIcon color="gray.400" boxSize="4" cursor="help" />
					</Tooltip>
				</HStack>

				{/* Sentiment overview */}
				<Flex
					direction={{ base: "column", md: "row" }}
					gap="5"
					align={{ base: "stretch", md: "center" }}
				>
					<HStack spacing="3" flex="0 0 auto">
						<Text fontSize="xl">{sentimentEmoji}</Text>
						<VStack align="start" spacing="0">
							<Badge
								colorScheme={sentimentColor}
								fontSize="sm"
								px="3"
								py="1"
								borderRadius="full"
								fontWeight="700"
							>
								{analysis.sentiment.label}
							</Badge>
							<Text fontSize="xs" color={subTextColor} mt="1">
								Overall Signal
							</Text>
						</VStack>
					</HStack>

					<Box flex="1" minW="0">
						<SentimentGauge score={analysis.sentiment.score} />
					</Box>
				</Flex>

				<Text fontSize="sm" color={subTextColor} mt="3" lineHeight="1.6">
					{analysis.sentiment.summary}
				</Text>
			</Box>

			{/* Technical Indicators bar */}
			<Box px="6" py="4" borderBottomWidth="1px" borderColor={dividerColor}>
				<Text fontSize="xs" fontWeight="700" color={subTextColor} textTransform="uppercase" letterSpacing="1px" mb="3">
					Key Indicators
				</Text>
				<SimpleGrid columns={{ base: 3, md: 6 }} spacing="3">
					<IndicatorPill
						label="RSI"
						value={analysis.indicators.rsi.toString()}
						tooltip={`Relative Strength Index: ${analysis.indicators.rsi > 70 ? "Overbought" : analysis.indicators.rsi < 30 ? "Oversold" : "Normal"}`}
					/>
					<IndicatorPill
						label="EMA 12"
						value={`$${analysis.indicators.ema12.toFixed(0)}`}
						tooltip="12-day Exponential Moving Average — short-term trend"
					/>
					<IndicatorPill
						label="EMA 26"
						value={`$${analysis.indicators.ema26.toFixed(0)}`}
						tooltip="26-day Exponential Moving Average — medium-term trend"
					/>
					<IndicatorPill
						label="SMA 20"
						value={`$${analysis.indicators.sma20.toFixed(0)}`}
						tooltip="20-day Simple Moving Average"
					/>
					<IndicatorPill
						label="SMA 50"
						value={`$${analysis.indicators.sma50.toFixed(0)}`}
						tooltip="50-day Simple Moving Average"
					/>
					<IndicatorPill
						label="BB Position"
						value={`${(analysis.indicators.bollinger.position * 100).toFixed(0)}%`}
						tooltip="Bollinger Band Position: -100% (lower band) to +100% (upper band)"
					/>
				</SimpleGrid>
			</Box>

			{/* Insights */}
			<Box px="6" py="5">
				<Text fontSize="xs" fontWeight="700" color={subTextColor} textTransform="uppercase" letterSpacing="1px" mb="4">
					Why is {analysis.symbol}{" "}
					{analysis.day_change >= 0 ? "up" : "down"}?
				</Text>

				<VStack spacing="3" align="stretch">
					{analysis.insights.map((insight, i) => (
						<InsightCard key={i} insight={insight} index={i} />
					))}
				</VStack>
			</Box>

			{/* Related News */}
			{analysis.related_news.length > 0 && (
				<>
					<Divider borderColor={dividerColor} />
					<Box px="6" py="5">
						<Text
							fontSize="xs"
							fontWeight="700"
							color={subTextColor}
							textTransform="uppercase"
							letterSpacing="1px"
							mb="3"
						>
							Related News That May Explain Movement
						</Text>
						<VStack spacing="2" align="stretch">
							{analysis.related_news.map((news, i) => (
								<Link
									key={i}
									href={news.link}
									isExternal
									_hover={{ textDecoration: "none" }}
								>
									<HStack
										bg={newsBg}
										p="3"
										borderRadius="lg"
										spacing="3"
										transition="all 0.2s"
										_hover={{
											transform: "translateX(4px)",
											boxShadow: "sm",
										}}
										animation={`${fadeInUp} 0.3s ease-out ${i * 0.1}s both`}
									>
										<Box flex="1" minW="0">
											<Text
												fontSize="sm"
												fontWeight="600"
												noOfLines={2}
											>
												{news.title}
											</Text>
											<HStack mt="1" spacing="2">
												<Text fontSize="2xs" color="gray.500">
													{news.publisher}
												</Text>
												{news.publishedAt && (
													<Text fontSize="2xs" color="gray.500">
														• {timeSince(news.publishedAt)}
													</Text>
												)}
											</HStack>
										</Box>
										<ExternalLinkIcon color="gray.400" boxSize="3" />
									</HStack>
								</Link>
							))}
						</VStack>
					</Box>
				</>
			)}

			{/* Footer */}
			<Box px="6" py="3" borderTopWidth="1px" borderColor={dividerColor}>
				<Text fontSize="2xs" color="gray.500" textAlign="center">
					Analysis powered by technical indicators • Not financial advice • Updated{" "}
					{new Date(analysis.timestamp).toLocaleTimeString()}
				</Text>
			</Box>
		</Box>
	);
}
