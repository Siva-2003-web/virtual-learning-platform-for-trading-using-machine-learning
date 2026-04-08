import React, { useEffect, useReducer, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
	Heading,
	Flex,
	Box,
	Button,
	Spinner,
	HStack,
	Text,
	VStack,
} from "@chakra-ui/react";
import axios from "axios";
import StockChart from "../components/StockChart";
import TransactionPane from "../components/TransactionPane";
import accounts from "../services/accounts.service";
import tokens from "../services/tokens.service";
import Newsfeed from "../components/Newsfeed";
import PriceMovementAnalysis from "../components/PriceMovementAnalysis";
import {
	AddIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	MinusIcon,
} from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const formatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

function StockView() {
	const { symbol } = useParams();
	const location = useLocation();

	const [onWatchlist, setOnWatchlist] = useState(false);
	const [prediction, setPrediction] = useState<any>(null);
	const [loadingPrediction, setLoadingPrediction] = useState(false);

	const [stock, setStock] = useReducer(
		(state: any, newState: any) => ({ ...state, ...newState }),
		{
			symbol,
			longName: "",
			regularMarketPrice: -1,
			regularMarketChangePercent: 0,
		}
	);

	useEffect(() => {
		if (tokens.isAuthenticated()) {
			accounts.getWatchlist(true).then((res: any[]) => {
				setOnWatchlist(res.some((stock) => stock.symbol === symbol));
			});
		}

		axios
			.get(`/api/stocks/${symbol}/info`)
			.then((res) => {
				setStock({ ...res.data });
			})
			.catch((err) => {
				console.log(err);
			});

		setLoadingPrediction(true);
		axios
			.get(`/api/stocks/${symbol}/predict`)
			.then((res) => {
				setPrediction(res.data);
				setLoadingPrediction(false);
			})
			.catch((err) => {
				console.log("Prediction error:", err);
				setLoadingPrediction(false);
			});
	}, [location]);

	if (stock.regularMarketPrice < 0) {
		return (
			<Flex justifyContent="center" alignItems="center" minH="60vh">
				<VStack spacing={4}>
					<Spinner size="xl" color="cyan.500" thickness="3px" />
					<Text color="gray.500">Loading stock data...</Text>
				</VStack>
			</Flex>
		);
	}

	const isUp = stock.regularMarketChangePercent > 0;

	return (
		<>
			{stock.regularMarketPrice > 0 && (
				<Flex direction={{ base: "column", md: "row" }} gap={6}>
					<Box flex={tokens.isAuthenticated() ? "1" : "1"}>
						{/* Stock Header */}
						<MotionBox
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
						>
							<Flex
								justify="space-between"
								align="start"
								bg="rgba(15, 20, 30, 0.85)"
								backdropFilter="blur(20px)"
								border="1px solid"
								borderColor="rgba(255, 255, 255, 0.06)"
								borderRadius="xl"
								p={6}
								mb={4}
								position="relative"
								overflow="hidden"
							>
								<Box
									position="absolute"
									top="-50px"
									right="-50px"
									w="150px"
									h="150px"
									borderRadius="full"
									bg={`radial-gradient(circle, ${isUp ? "rgba(72,187,120,0.06)" : "rgba(245,101,101,0.06)"} 0%, transparent 70%)`}
									pointerEvents="none"
								/>
								<VStack align="start" spacing={1}>
									<Text fontSize="sm" color="gray.500" fontWeight="600">
										{stock.longName}
									</Text>
									<Heading size="xl" fontWeight="800" color="white">
										{formatter.format(stock.regularMarketPrice)}
									</Heading>
									<HStack spacing={2}>
										<Text
											fontSize="md"
											fontWeight="700"
											color={isUp ? "green.400" : "red.400"}
										>
											{isUp ? <ArrowUpIcon mr={1} /> : <ArrowDownIcon mr={1} />}
											{stock.regularMarketChangePercent.toFixed(2)}%
										</Text>
										<Text fontSize="sm" color="gray.500">
											Today
										</Text>
									</HStack>
								</VStack>

								{tokens.isAuthenticated() && (
									<Button
										leftIcon={onWatchlist ? <MinusIcon /> : <AddIcon />}
										variant="outline"
										size="sm"
										borderColor="rgba(255,255,255,0.1)"
										color="gray.300"
										borderRadius="xl"
										_hover={{
											bg: "rgba(255,255,255,0.04)",
											borderColor: "rgba(0,181,216,0.3)",
										}}
										onClick={() =>
											accounts
												.editWatchlist(
													symbol as string,
													onWatchlist ? "remove" : "add"
												)
												.then(() => setOnWatchlist(!onWatchlist))
										}
									>
										{onWatchlist ? "Remove" : "Watchlist"}
									</Button>
								)}
							</Flex>
						</MotionBox>

						{/* Chart */}
						<MotionBox
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1, duration: 0.4 }}
							bg="rgba(15, 20, 30, 0.85)"
							backdropFilter="blur(20px)"
							border="1px solid"
							borderColor="rgba(255, 255, 255, 0.06)"
							borderRadius="xl"
							p={4}
							mb={4}
							overflow="hidden"
						>
							<StockChart symbol={symbol as string} />
						</MotionBox>

						{/* Price Movement Analysis */}
						<MotionBox
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.4 }}
							mb={4}
						>
							<PriceMovementAnalysis symbol={symbol as string} />
						</MotionBox>

						{/* AI Predictions */}
						<MotionBox
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.4 }}
							bg="rgba(15, 20, 30, 0.85)"
							backdropFilter="blur(20px)"
							border="1px solid"
							borderColor="rgba(255, 255, 255, 0.06)"
							borderRadius="xl"
							p={6}
							mb={4}
						>
							<HStack mb={4} spacing={2}>
								<Text fontSize="lg">🤖</Text>
								<Heading size="md" fontWeight="700" color="gray.200">
									AI Predictions
								</Heading>
							</HStack>
							{loadingPrediction ? (
								<Flex justifyContent="center" p={5}>
									<Spinner color="cyan.500" thickness="3px" />
								</Flex>
							) : prediction ? (
								<Flex direction={{ base: "column", md: "row" }} gap={4}>
									{/* Next Day */}
									<Box
										flex="1"
										p={4}
										bg="rgba(255,255,255,0.02)"
										borderRadius="xl"
										border="1px solid"
										borderColor="rgba(255,255,255,0.04)"
									>
										<Text
											fontSize="xs"
											color="gray.500"
											fontWeight="700"
											textTransform="uppercase"
											letterSpacing="wider"
											mb={1}
										>
											Next Day
										</Text>
										{prediction?.next_day?.target && (
											<Text fontSize="xs" color="gray.600" mb={2}>
												{prediction.next_day.target.day},{" "}
												{prediction.next_day.target.date}
											</Text>
										)}
										<Heading size="lg" fontWeight="800" color="white" mb={1}>
											{formatter.format(
												prediction.next_day?.predicted_price || 0
											)}
										</Heading>
										<HStack>
											<Text
												fontSize="sm"
												fontWeight="700"
												color={
													(prediction.next_day?.change || 0) > 0
														? "green.400"
														: "red.400"
												}
											>
												{(prediction.next_day?.change || 0) > 0 ? (
													<ArrowUpIcon mr={1} />
												) : (
													<ArrowDownIcon mr={1} />
												)}
												{(
													prediction.next_day?.change_percent || 0
												).toFixed(2)}
												%
											</Text>
											<Text fontSize="xs" color="gray.500">
												(
												{formatter.format(
													Math.abs(prediction.next_day?.change || 0)
												)}
												)
											</Text>
										</HStack>
									</Box>

									{/* Next Week */}
									<Box
										flex="1"
										p={4}
										bg="rgba(255,255,255,0.02)"
										borderRadius="xl"
										border="1px solid"
										borderColor="rgba(255,255,255,0.04)"
									>
										<Text
											fontSize="xs"
											color="gray.500"
											fontWeight="700"
											textTransform="uppercase"
											letterSpacing="wider"
											mb={1}
										>
											Next Week (7 days)
										</Text>
										{prediction?.next_week?.target && (
											<Text fontSize="xs" color="gray.600" mb={2}>
												{prediction.next_week.target.day},{" "}
												{prediction.next_week.target.date}
											</Text>
										)}
										<Heading size="lg" fontWeight="800" color="white" mb={1}>
											{formatter.format(
												prediction.next_week?.predicted_price || 0
											)}
										</Heading>
										<HStack>
											<Text
												fontSize="sm"
												fontWeight="700"
												color={
													(prediction.next_week?.change || 0) > 0
														? "green.400"
														: "red.400"
												}
											>
												{(prediction.next_week?.change || 0) > 0 ? (
													<ArrowUpIcon mr={1} />
												) : (
													<ArrowDownIcon mr={1} />
												)}
												{(
													prediction.next_week?.change_percent || 0
												).toFixed(2)}
												%
											</Text>
											<Text fontSize="xs" color="gray.500">
												(
												{formatter.format(
													Math.abs(prediction.next_week?.change || 0)
												)}
												)
											</Text>
										</HStack>
									</Box>
								</Flex>
							) : (
								<Box textAlign="center" py={4}>
									<Text color="gray.500" fontSize="sm">
										Predictions unavailable for this stock
									</Text>
								</Box>
							)}
							{prediction && (
								<Text
									fontSize="xs"
									color="gray.600"
									textAlign="center"
									mt={3}
								>
									Powered by LSTM + XGBoost AI Model
								</Text>
							)}
						</MotionBox>
					</Box>

					{/* Transaction Pane */}
					{tokens.isAuthenticated() && (
						<Box
							w={{ base: "100%", md: "320px" }}
							flexShrink={0}
							position={{ base: "static", md: "sticky" }}
							top="80px"
							h="fit-content"
						>
							<MotionBox
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.15, duration: 0.4 }}
								bg="rgba(15, 20, 30, 0.85)"
								backdropFilter="blur(20px)"
								border="1px solid"
								borderColor="rgba(255, 255, 255, 0.06)"
								borderRadius="xl"
								p={5}
								overflow="hidden"
							>
								<TransactionPane
									symbol={symbol as string}
									price={stock.regularMarketPrice}
								/>
							</MotionBox>
						</Box>
					)}
				</Flex>
			)}

			{/* News Section */}
			<Box mt={6}>
				<HStack mb={4} spacing={2}>
					<Text fontSize="lg">📰</Text>
					<Heading size="md" fontWeight="700" color="gray.200">
						{symbol as string} News
					</Heading>
				</HStack>
				<Newsfeed symbol={symbol as string} />
			</Box>
		</>
	);
}

export default StockView;
