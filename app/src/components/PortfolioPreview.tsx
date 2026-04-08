import React, { useState, useEffect } from "react";
import {
	Box,
	Flex,
	Heading,
	Spinner,
	Text,
	useToast,
	SimpleGrid,
	VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import accounts from "../services/accounts.service";
import tokens from "../services/tokens.service";
import { useNavigate } from "react-router-dom";

const MotionBox = motion(Box);

const formatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

function PortfolioPreview() {
	const [portfolioValue, setPortfolioValue] = useState(-1);
	const [prevCloseValue, setPrevCloseValue] = useState(0.0);
	const [cash, setCash] = useState(0.0);
	const [isLoading, setIsLoading] = useState(true);

	const toast = useToast();
	const navigate = useNavigate();

	useEffect(() => {
		accounts
			.getPortfolio()
			.then(({ portfolioValue, portfolioPrevCloseValue, cash }) => {
				setPortfolioValue(portfolioValue);
				setPrevCloseValue(portfolioPrevCloseValue);
				setCash(cash);
				setIsLoading(false);
			})
			.catch((err) => {
				if (err.response && err.response.status === 401) {
					tokens.clearToken();
					toast({
						title: `You are not logged in! Redirecting to login...`,
						status: "error",
						isClosable: true,
					});
					navigate("/login");
				}
			});
	}, []);

	const changeValue = portfolioValue - prevCloseValue;
	const changePercent =
		prevCloseValue > 0
			? (100 * (portfolioValue - prevCloseValue)) / prevCloseValue
			: 0;
	const isUp = portfolioValue >= prevCloseValue;

	return (
		<MotionBox
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			mb={6}
		>
			<SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
				{/* Portfolio Value Card */}
				<Box
					bg="rgba(15, 20, 30, 0.85)"
					backdropFilter="blur(20px)"
					border="1px solid"
					borderColor="rgba(255, 255, 255, 0.06)"
					borderRadius="xl"
					p={6}
					position="relative"
					overflow="hidden"
				>
					<Box
						position="absolute"
						top="-40px"
						right="-40px"
						w="120px"
						h="120px"
						borderRadius="full"
						bg={`radial-gradient(circle, ${isUp ? "rgba(72,187,120,0.08)" : "rgba(245,101,101,0.08)"} 0%, transparent 70%)`}
						pointerEvents="none"
					/>
					{isLoading ? (
						<Spinner size="lg" />
					) : (
						<VStack align="start" spacing={1}>
							<Text
								fontSize="xs"
								color="gray.500"
								fontWeight="700"
								textTransform="uppercase"
								letterSpacing="wider"
							>
								Total Portfolio
							</Text>
							<Heading fontSize="2xl" fontWeight="800" color="white">
								{formatter.format(portfolioValue)}
							</Heading>
							{portfolioValue > 0 && (
								<Flex align="center" gap={2}>
									<Text
										fontSize="sm"
										fontWeight="700"
										color={isUp ? "green.400" : "red.400"}
									>
										{isUp ? "▲" : "▼"} {formatter.format(Math.abs(changeValue))}
									</Text>
									<Text
										fontSize="xs"
										fontWeight="600"
										color={isUp ? "green.400" : "red.400"}
										bg={isUp ? "rgba(72,187,120,0.1)" : "rgba(245,101,101,0.1)"}
										px={2}
										py={0.5}
										borderRadius="full"
									>
										{changePercent >= 0 ? "+" : ""}
										{changePercent.toFixed(
											Math.abs(changePercent) < 0.01 ? 4 : 2
										)}
										%
									</Text>
								</Flex>
							)}
						</VStack>
					)}
				</Box>

				{/* Cash Card */}
				<Box
					bg="rgba(15, 20, 30, 0.85)"
					backdropFilter="blur(20px)"
					border="1px solid"
					borderColor="rgba(255, 255, 255, 0.06)"
					borderRadius="xl"
					p={6}
				>
					{isLoading ? (
						<Spinner size="lg" />
					) : (
						<VStack align="start" spacing={1}>
							<Text
								fontSize="xs"
								color="gray.500"
								fontWeight="700"
								textTransform="uppercase"
								letterSpacing="wider"
							>
								Buying Power
							</Text>
							<Heading fontSize="2xl" fontWeight="800" color="white">
								{formatter.format(cash)}
							</Heading>
							<Text fontSize="xs" color="gray.500">
								Available for trades
							</Text>
						</VStack>
					)}
				</Box>

				{/* Daily Summary Card */}
				<Box
					bg="rgba(15, 20, 30, 0.85)"
					backdropFilter="blur(20px)"
					border="1px solid"
					borderColor="rgba(255, 255, 255, 0.06)"
					borderRadius="xl"
					p={6}
				>
					{isLoading ? (
						<Spinner size="lg" />
					) : (
						<VStack align="start" spacing={1}>
							<Text
								fontSize="xs"
								color="gray.500"
								fontWeight="700"
								textTransform="uppercase"
								letterSpacing="wider"
							>
								Today's Change
							</Text>
							<Heading
								fontSize="2xl"
								fontWeight="800"
								color={isUp ? "green.400" : "red.400"}
							>
								{isUp ? "+" : ""}
								{changePercent.toFixed(2)}%
							</Heading>
							<Text fontSize="xs" color="gray.500">
								{portfolioValue > 0
									? "Since market open"
									: "Make some trades to get started!"}
							</Text>
						</VStack>
					)}
				</Box>
			</SimpleGrid>
		</MotionBox>
	);
}

export default PortfolioPreview;
