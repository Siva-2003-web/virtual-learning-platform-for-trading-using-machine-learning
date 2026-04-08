import {
	Box,
	Flex,
	Heading,
	Text,
	useBreakpointValue,
	VStack,
	HStack,
	Button,
	keyframes,
} from "@chakra-ui/react";
import PortfolioPreview from "../components/PortfolioPreview";
import React from "react";
import PositionsList from "../components/PositionsList";
import Newsfeed from "../components/Newsfeed";
import Watchlist from "../components/Watchlist";
import tokens from "../services/tokens.service";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

export default function Dashboard() {
	const isOnMobile = useBreakpointValue({ base: true, md: false });

	return (
		<Box className="Dashboard">
			{!tokens.isAuthenticated() ? (
				/* ─── Unauthenticated Hero ──────────────────────────── */
				<MotionBox
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<Box
						position="relative"
						overflow="hidden"
						bg="rgba(15, 20, 30, 0.85)"
						backdropFilter="blur(20px)"
						border="1px solid"
						borderColor="rgba(255, 255, 255, 0.06)"
						borderRadius="2xl"
						p={{ base: 8, md: 12 }}
						mb={8}
					>
						{/* Glow */}
						<Box
							position="absolute"
							top="-100px"
							right="-100px"
							w="300px"
							h="300px"
							borderRadius="full"
							bg="radial-gradient(circle, rgba(0,181,216,0.1) 0%, transparent 70%)"
							pointerEvents="none"
						/>
						<Box
							position="absolute"
							bottom="-80px"
							left="-80px"
							w="200px"
							h="200px"
							borderRadius="full"
							bg="radial-gradient(circle, rgba(0,181,216,0.06) 0%, transparent 70%)"
							pointerEvents="none"
							animation={`${pulse} 4s ease-in-out infinite`}
						/>

						<VStack align="start" spacing={4} position="relative" zIndex={2}>
							<HStack spacing={3}>
								<Box
									w="48px"
									h="48px"
									borderRadius="14px"
									bg="linear-gradient(135deg, #00B5D8 0%, #0987A0 100%)"
									display="flex"
									alignItems="center"
									justifyContent="center"
									boxShadow="0 4px 20px rgba(0, 181, 216, 0.3)"
								>
									<svg width="26" height="26" viewBox="0 0 128 128" fill="none">
										<path
											d="M64 0L81.5 46.5L128 64L81.5 81.5L64 128L46.5 81.5L0 64L46.5 46.5L64 0Z"
											fill="white"
										/>
									</svg>
								</Box>
								<VStack align="start" spacing={0}>
									<Heading fontSize="2xl" fontWeight="800" color="white">
										Stellix
									</Heading>
									<Text fontSize="xs" color="gray.500" fontWeight="500">
										Stock Trading Simulator
									</Text>
								</VStack>
							</HStack>

							<Heading
								fontSize={{ base: "xl", md: "2xl" }}
								fontWeight="700"
								color="gray.200"
								mt={2}
							>
								Practice trading with{" "}
								<Text
									as="span"
									bgGradient="linear(to-r, cyan.400, teal.300)"
									bgClip="text"
								>
									$100,000
								</Text>{" "}
								in virtual cash
							</Heading>

							<Text color="gray.500" fontSize="sm" maxW="500px" lineHeight="1.7">
								Build your portfolio, compete on leaderboards, and sharpen your
								investment instincts — all without risking real money.
							</Text>

							<HStack spacing={3} mt={2}>
								<Button
									as={RouterLink}
									to="/signup"
									bg="linear-gradient(135deg, #00B5D8 0%, #0987A0 100%)"
									color="white"
									fontWeight="700"
									size="md"
									borderRadius="xl"
									px={6}
									_hover={{
										transform: "translateY(-1px)",
										boxShadow: "0 6px 20px rgba(0, 181, 216, 0.3)",
									}}
									transition="all 0.2s ease"
									boxShadow="0 4px 15px rgba(0, 181, 216, 0.2)"
								>
									Get Started
								</Button>
								<Button
									as={RouterLink}
									to="/login"
									variant="outline"
									borderColor="rgba(255,255,255,0.1)"
									color="gray.300"
									fontWeight="600"
									size="md"
									borderRadius="xl"
									px={6}
									_hover={{
										bg: "rgba(255,255,255,0.04)",
										borderColor: "rgba(0,181,216,0.3)",
									}}
								>
									Sign In
								</Button>
							</HStack>
						</VStack>
					</Box>
				</MotionBox>
			) : (
				/* ─── Authenticated Portfolio ───────────────────────── */
				<PortfolioPreview />
			)}

			<Flex direction={{ base: "column", md: "row" }} gap={6}>
				{/* Main Content */}
				<Box flex="1">
					{tokens.isAuthenticated() && (
						<Box mb={6}>
							{/* Positions and Watchlist on mobile */}
							{isOnMobile && (
								<Flex direction="column" gap={4} mb={6}>
									<PositionsList />
									<Watchlist />
								</Flex>
							)}
						</Box>
					)}

					<Box>
						<HStack mb={4} justify="space-between" align="center">
							<Heading
								size="md"
								fontWeight="700"
								color="gray.200"
							>
								📰 Market News
							</Heading>
						</HStack>
						<Newsfeed symbol={""} />
					</Box>
				</Box>

				{/* Sidebar */}
				{!isOnMobile && (
					<Box w={{ md: "320px", lg: "350px" }} flexShrink={0}>
						{tokens.isAuthenticated() ? (
							<Flex direction="column" gap={4} position="sticky" top="80px">
								<PositionsList />
								<Watchlist />
							</Flex>
						) : (
							<Box
								bg="rgba(15, 20, 30, 0.85)"
								backdropFilter="blur(20px)"
								border="1px solid"
								borderColor="rgba(255, 255, 255, 0.06)"
								borderRadius="xl"
								p={6}
								textAlign="center"
							>
								<Text fontSize="3xl" mb={3}>
									📈
								</Text>
								<Heading size="sm" color="gray.300" mb={2}>
									Track Your Investments
								</Heading>
								<Text fontSize="sm" color="gray.500">
									Sign in to view your portfolio, positions, and watchlist.
								</Text>
							</Box>
						)}
					</Box>
				)}
			</Flex>
		</Box>
	);
}
