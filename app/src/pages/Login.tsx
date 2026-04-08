import {
	Box,
	FormControl,
	FormLabel,
	Input,
	Stack,
	Button,
	Heading,
	Text,
	InputGroup,
	InputRightElement,
	Link,
	HStack,
	useToast,
	Flex,
	VStack,
	keyframes,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import React, { useEffect, useReducer, useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import accounts from "../services/accounts.service";
import tokens from "../services/tokens.service";

const MotionBox = motion(Box);
const MotionText = motion(Text);
const MotionHeading = motion(Heading);

// ─── Keyframes ──────────────────────────────────────────────────────────────
const float1 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -50px) scale(1.1); }
  50% { transform: translate(-20px, -100px) scale(0.95); }
  75% { transform: translate(50px, -30px) scale(1.05); }
`;

const float2 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, -60px) scale(1.15); }
  66% { transform: translate(60px, -40px) scale(0.9); }
`;

const float3 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(50px, -80px) scale(1.08); }
  40% { transform: translate(-30px, -120px) scale(0.92); }
  60% { transform: translate(70px, -60px) scale(1.12); }
  80% { transform: translate(-50px, -30px) scale(0.96); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const drawLine = keyframes`
  0% { stroke-dashoffset: 2000; }
  100% { stroke-dashoffset: 0; }
`;

// ─── Animated Stock Chart SVG ───────────────────────────────────────────────
function AnimatedStockChart() {
	// Generates a realistic looking stock chart path
	const chartPath =
		"M 0 180 Q 30 175, 50 160 T 100 140 T 150 155 T 200 120 T 250 130 T 300 95 T 350 105 T 400 70 T 450 85 T 500 50 T 550 60 T 600 30";
	const areaPath = chartPath + " L 600 220 L 0 220 Z";

	return (
		<Box position="absolute" bottom="0" left="0" right="0" height="55%" opacity={0.35} overflow="hidden">
			<svg
				viewBox="0 0 600 220"
				style={{ width: "100%", height: "100%" }}
				preserveAspectRatio="none"
			>
				<defs>
					<linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#00B5D8" stopOpacity="0.6" />
						<stop offset="100%" stopColor="#00B5D8" stopOpacity="0.02" />
					</linearGradient>
					<linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="#00D1FF" />
						<stop offset="50%" stopColor="#00B5D8" />
						<stop offset="100%" stopColor="#0987A0" />
					</linearGradient>
				</defs>
				{/* Grid lines */}
				{[40, 80, 120, 160].map((y) => (
					<line
						key={y}
						x1="0"
						y1={y}
						x2="600"
						y2={y}
						stroke="rgba(0, 181, 216, 0.08)"
						strokeWidth="1"
					/>
				))}
				{/* Area fill */}
				<path
					d={areaPath}
					fill="url(#chartGradient)"
					style={{
						animation: `${drawLine} 3s ease-out forwards`,
						strokeDasharray: 2000,
						strokeDashoffset: 2000,
					}}
				/>
				{/* Main line */}
				<path
					d={chartPath}
					fill="none"
					stroke="url(#lineGradient)"
					strokeWidth="2.5"
					strokeLinecap="round"
					style={{
						animation: `${drawLine} 2.5s ease-out forwards`,
						strokeDasharray: 2000,
						strokeDashoffset: 2000,
					}}
				/>
				{/* Glow line */}
				<path
					d={chartPath}
					fill="none"
					stroke="#00D1FF"
					strokeWidth="6"
					strokeLinecap="round"
					opacity="0.15"
					style={{
						animation: `${drawLine} 2.5s ease-out forwards`,
						strokeDasharray: 2000,
						strokeDashoffset: 2000,
						filter: "blur(4px)",
					}}
				/>
			</svg>
		</Box>
	);
}

// ─── Floating Orb ───────────────────────────────────────────────────────────
function FloatingOrb({
	size,
	color,
	top,
	left,
	animationName,
	duration,
	blur,
}: {
	size: string;
	color: string;
	top: string;
	left: string;
	animationName: string;
	duration: string;
	blur: string;
}) {
	const anim =
		animationName === "float1"
			? float1
			: animationName === "float2"
				? float2
				: float3;
	return (
		<Box
			position="absolute"
			top={top}
			left={left}
			w={size}
			h={size}
			borderRadius="full"
			bg={color}
			filter={`blur(${blur})`}
			animation={`${anim} ${duration} ease-in-out infinite`}
			pointerEvents="none"
		/>
	);
}

// ─── Particle Dot ───────────────────────────────────────────────────────────
function ParticleDot({ delay, x, y }: { delay: number; x: string; y: string }) {
	return (
		<Box
			position="absolute"
			left={x}
			top={y}
			w="3px"
			h="3px"
			borderRadius="full"
			bg="cyan.400"
			animation={`${pulse} ${2 + delay}s ease-in-out infinite`}
			style={{ animationDelay: `${delay}s` }}
			pointerEvents="none"
			opacity={0.5}
		/>
	);
}

// ─── Mock Stats ─────────────────────────────────────────────────────────────
function StatsRow() {
	const stats = [
		{ label: "Market Cap", value: "$2.4T", change: "+2.1%" },
		{ label: "Volume", value: "89.2M", change: "+5.7%" },
		{ label: "P/E Ratio", value: "28.4", change: "-0.3%" },
	];

	return (
		<HStack spacing={6} justify="center">
			{stats.map((stat, i) => (
				<MotionBox
					key={stat.label}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1.2 + i * 0.15, duration: 0.5 }}
					bg="rgba(0, 181, 216, 0.08)"
					borderRadius="xl"
					px={4}
					py={3}
					border="1px solid"
					borderColor="rgba(0, 181, 216, 0.15)"
					backdropFilter="blur(10px)"
					minW="100px"
				>
					<Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
						{stat.label}
					</Text>
					<Text fontSize="lg" color="white" fontWeight="bold" mt={0.5}>
						{stat.value}
					</Text>
					<Text
						fontSize="xs"
						color={stat.change.startsWith("+") ? "green.400" : "red.400"}
						fontWeight="600"
					>
						{stat.change}
					</Text>
				</MotionBox>
			))}
		</HStack>
	);
}

// ─── Ticker Tape Component ──────────────────────────────────────────────────
const tickerScroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

function TickerTape() {
	const tickers = [
		{ symbol: "AAPL", price: "189.84", change: "+1.24%" },
		{ symbol: "MSFT", price: "378.91", change: "+0.87%" },
		{ symbol: "GOOGL", price: "141.80", change: "-0.32%" },
		{ symbol: "AMZN", price: "178.25", change: "+2.15%" },
		{ symbol: "TSLA", price: "248.48", change: "+3.41%" },
		{ symbol: "NVDA", price: "875.28", change: "+1.98%" },
		{ symbol: "META", price: "505.95", change: "+0.65%" },
		{ symbol: "BRK.B", price: "408.72", change: "-0.12%" },
	];
	const duplicated = [...tickers, ...tickers];

	return (
		<Box
			position="absolute"
			top="0"
			left="0"
			right="0"
			overflow="hidden"
			bg="rgba(0, 0, 0, 0.4)"
			backdropFilter="blur(10px)"
			borderBottom="1px solid"
			borderColor="rgba(0, 181, 216, 0.1)"
			py={2.5}
			zIndex={2}
		>
			<HStack
				spacing={8}
				animation={`${tickerScroll} 30s linear infinite`}
				whiteSpace="nowrap"
				w="fit-content"
			>
				{duplicated.map((t, i) => (
					<HStack key={i} spacing={2}>
						<Text fontSize="xs" color="cyan.400" fontWeight="bold" letterSpacing="wide">
							{t.symbol}
						</Text>
						<Text fontSize="xs" color="gray.300" fontWeight="500">
							${t.price}
						</Text>
						<Text
							fontSize="xs"
							fontWeight="600"
							color={t.change.startsWith("+") ? "green.400" : "red.400"}
						>
							{t.change}
						</Text>
					</HStack>
				))}
			</HStack>
		</Box>
	);
}

// ─══════════════════════════════════════════════════════════════════════════──
// ─── MAIN LOGIN COMPONENT ───────────────────────────────────────────────────
// ─══════════════════════════════════════════════════════════════════════════──

export default function Login() {
	const toast = useToast();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [focusedField, setFocusedField] = useState<string | null>(null);

	useEffect(() => {
		if (tokens.isAuthenticated()) {
			navigate("/dashboard");
		}
	});

	const [loginData, setLoginData] = useReducer(
		(state: any, newState: any) => ({ ...state, ...newState }),
		{ username: "", password: "", showPassword: false }
	);

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		setIsLoading(true);
		accounts
			.login(loginData.username, loginData.password, "")
			.then((res) => {
				if (res === "success") {
					toast({
						title: `Welcome back! Redirecting to dashboard...`,
						status: "success",
						isClosable: true,
						duration: 2000,
					});
					navigate("/dashboard");
				} else {
					toast({
						title: `${res}`,
						status: "error",
						isClosable: true,
					});
				}
			})
			.catch((err) => {
				toast({
					title: `${err}`,
					status: "error",
					isClosable: true,
				});
			})
			.finally(() => setIsLoading(false));
	};

	// Particles
	const particles = Array.from({ length: 20 }, () => ({
		x: `${Math.random() * 100}%`,
		y: `${Math.random() * 100}%`,
		delay: Math.random() * 3,
	}));

	return (
		<Flex
			position="fixed"
			top="0"
			left="0"
			right="0"
			bottom="0"
			zIndex={1000}
			bg="#0A0E17"
			overflow="hidden"
		>
			{/* ─── LEFT PANEL: Hero / Branding ─────────────────────────────── */}
			<Box
				display={{ base: "none", lg: "flex" }}
				flexDirection="column"
				justifyContent="center"
				alignItems="center"
				w="55%"
				position="relative"
				overflow="hidden"
			>
				{/* Deep background gradient */}
				<Box
					position="absolute"
					inset="0"
					bg="linear-gradient(135deg, #0A0E17 0%, #0D1B2A 40%, #112240 70%, #0A0E17 100%)"
				/>

				{/* Radial glow */}
				<Box
					position="absolute"
					top="30%"
					left="50%"
					transform="translate(-50%, -50%)"
					w="600px"
					h="600px"
					borderRadius="full"
					bg="radial-gradient(circle, rgba(0,181,216,0.12) 0%, transparent 70%)"
					pointerEvents="none"
				/>

				{/* Floating orbs */}
				<FloatingOrb
					size="300px"
					color="rgba(0, 181, 216, 0.06)"
					top="10%"
					left="5%"
					animationName="float1"
					duration="12s"
					blur="80px"
				/>
				<FloatingOrb
					size="200px"
					color="rgba(9, 135, 160, 0.08)"
					top="60%"
					left="70%"
					animationName="float2"
					duration="15s"
					blur="60px"
				/>
				<FloatingOrb
					size="150px"
					color="rgba(0, 209, 255, 0.05)"
					top="40%"
					left="20%"
					animationName="float3"
					duration="18s"
					blur="50px"
				/>

				{/* Particles */}
				{particles.map((p, i) => (
					<ParticleDot key={i} x={p.x} y={p.y} delay={p.delay} />
				))}

				{/* Ticker Tape */}
				<TickerTape />

				{/* Chart */}
				<AnimatedStockChart />

				{/* Content */}
				<VStack
					position="relative"
					zIndex={3}
					spacing={8}
					px={12}
					textAlign="center"
					mt="-60px"
				>
					{/* Logo */}
					<MotionBox
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
					>
						<Box
							w="80px"
							h="80px"
							borderRadius="24px"
							bg="linear-gradient(135deg, #00B5D8 0%, #0987A0 100%)"
							display="flex"
							alignItems="center"
							justifyContent="center"
							boxShadow="0 8px 32px rgba(0, 181, 216, 0.3), 0 0 60px rgba(0, 181, 216, 0.1)"
							mx="auto"
						>
							<svg width="44" height="44" viewBox="0 0 128 128" fill="none">
								<path
									d="M64 0L81.5 46.5L128 64L81.5 81.5L64 128L46.5 81.5L0 64L46.5 46.5L64 0Z"
									fill="white"
								/>
							</svg>
						</Box>
					</MotionBox>

					<VStack spacing={3}>
						<MotionHeading
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.6 }}
							fontSize={{ base: "3xl", xl: "4xl" }}
							fontWeight="800"
							color="white"
							letterSpacing="-0.02em"
							lineHeight="1.2"
						>
							Master the Markets.{" "}
							<Text
								as="span"
								bgGradient="linear(to-r, cyan.400, cyan.300, teal.300)"
								bgClip="text"
							>
								Zero Risk.
							</Text>
						</MotionHeading>

						<MotionText
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5, duration: 0.6 }}
							fontSize={{ base: "md", xl: "lg" }}
							color="gray.400"
							maxW="420px"
							lineHeight="1.7"
						>
							Trade with virtual money, compete on leaderboards, and sharpen your
							investment instincts in a risk-free environment.
						</MotionText>
					</VStack>

					{/* Stats */}
					<MotionBox
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8, duration: 0.6 }}
					>
						<StatsRow />
					</MotionBox>
				</VStack>

				{/* Bottom gradient fade */}
				<Box
					position="absolute"
					bottom="0"
					left="0"
					right="0"
					h="120px"
					bg="linear-gradient(to top, #0A0E17 0%, transparent 100%)"
					zIndex={2}
				/>
			</Box>

			{/* ─── Divider Line ────────────────────────────────────────────── */}
			<Box
				display={{ base: "none", lg: "block" }}
				w="1px"
				bg="linear-gradient(to bottom, transparent 0%, rgba(0,181,216,0.3) 30%, rgba(0,181,216,0.3) 70%, transparent 100%)"
			/>

			{/* ─── RIGHT PANEL: Login Form ─────────────────────────────────── */}
			<Flex
				w={{ base: "100%", lg: "45%" }}
				alignItems="center"
				justifyContent="center"
				position="relative"
				overflow="hidden"
			>
				{/* Subtle background pattern */}
				<Box
					position="absolute"
					inset="0"
					bg="linear-gradient(160deg, #0A0E17 0%, #0F1923 50%, #0A0E17 100%)"
				/>

				{/* Soft radial background glow */}
				<Box
					position="absolute"
					top="20%"
					right="-10%"
					w="400px"
					h="400px"
					borderRadius="full"
					bg="radial-gradient(circle, rgba(0,181,216,0.06) 0%, transparent 70%)"
					pointerEvents="none"
				/>

				{/* Mobile logo - only visible on small screens */}
				<Box
					display={{ base: "block", lg: "none" }}
					position="absolute"
					top="40px"
					left="50%"
					transform="translateX(-50%)"
				>
					<HStack spacing={3}>
						<Box
							w="40px"
							h="40px"
							borderRadius="12px"
							bg="linear-gradient(135deg, #00B5D8 0%, #0987A0 100%)"
							display="flex"
							alignItems="center"
							justifyContent="center"
							boxShadow="0 4px 16px rgba(0, 181, 216, 0.3)"
						>
							<svg width="22" height="22" viewBox="0 0 128 128" fill="none">
								<path
									d="M64 0L81.5 46.5L128 64L81.5 81.5L64 128L46.5 81.5L0 64L46.5 46.5L64 0Z"
									fill="white"
								/>
							</svg>
						</Box>
						<Text fontSize="xl" fontWeight="800" color="white" letterSpacing="-0.02em">
							Stellix
						</Text>
					</HStack>
				</Box>

				{/* Login Card */}
				<MotionBox
					initial={{ opacity: 0, y: 30, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.7, type: "spring", stiffness: 80, damping: 20 }}
					position="relative"
					zIndex={3}
					w="100%"
					maxW="420px"
					mx={6}
				>
					{/* Card glass border glow */}
					<Box
						position="absolute"
						inset="-1px"
						borderRadius="28px"
						bg="linear-gradient(135deg, rgba(0,181,216,0.2) 0%, rgba(0,181,216,0.05) 30%, transparent 50%, rgba(0,181,216,0.05) 70%, rgba(0,181,216,0.15) 100%)"
						pointerEvents="none"
					/>

					<Box
						bg="rgba(15, 20, 30, 0.85)"
						backdropFilter="blur(40px)"
						borderRadius="28px"
						p={{ base: 8, md: 10 }}
						border="1px solid"
						borderColor="rgba(0, 181, 216, 0.1)"
						position="relative"
						overflow="hidden"
					>
						{/* Inner subtle glow */}
						<Box
							position="absolute"
							top="-50px"
							right="-50px"
							w="200px"
							h="200px"
							borderRadius="full"
							bg="radial-gradient(circle, rgba(0,181,216,0.06) 0%, transparent 70%)"
							pointerEvents="none"
						/>

						<VStack spacing={7} align="stretch">
							{/* Header */}
							<VStack spacing={2} align="start">
								<MotionHeading
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.2, duration: 0.5 }}
									fontSize="2xl"
									fontWeight="800"
									color="white"
									letterSpacing="-0.02em"
								>
									Welcome back
								</MotionHeading>
								<MotionText
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.3, duration: 0.5 }}
									fontSize="sm"
									color="gray.500"
								>
									Sign in to access your trading dashboard
								</MotionText>
							</VStack>

							{/* Form */}
							<form onSubmit={handleSubmit}>
								<Stack spacing={5}>
									{/* Username Field */}
									<MotionBox
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.35, duration: 0.4 }}
									>
										<FormControl id="login-username" isRequired>
											<FormLabel
												color="gray.400"
												fontWeight="600"
												fontSize="xs"
												textTransform="uppercase"
												letterSpacing="wider"
												mb={2}
											>
												Username
											</FormLabel>
											<Box position="relative">
												<Input
													type="text"
													placeholder="Enter your username"
													color="white"
													bg={
														focusedField === "username"
															? "rgba(0, 181, 216, 0.06)"
															: "rgba(255, 255, 255, 0.03)"
													}
													border="1.5px solid"
													borderColor={
														focusedField === "username"
															? "rgba(0, 181, 216, 0.4)"
															: "rgba(255, 255, 255, 0.08)"
													}
													borderRadius="14px"
													h="50px"
													fontSize="sm"
													_placeholder={{ color: "gray.600" }}
													_hover={{
														borderColor: "rgba(0, 181, 216, 0.25)",
													}}
													_focus={{
														borderColor: "cyan.500",
														boxShadow: "0 0 0 3px rgba(0, 181, 216, 0.1)",
													}}
													transition="all 0.25s ease"
													value={loginData.username}
													onChange={(e) =>
														setLoginData({ username: e.target.value })
													}
													onFocus={() => setFocusedField("username")}
													onBlur={() => setFocusedField(null)}
												/>
											</Box>
										</FormControl>
									</MotionBox>

									{/* Password Field */}
									<MotionBox
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.45, duration: 0.4 }}
									>
										<FormControl id="login-password" isRequired>
											<HStack justify="space-between" mb={2}>
												<FormLabel
													color="gray.400"
													fontWeight="600"
													fontSize="xs"
													textTransform="uppercase"
													letterSpacing="wider"
													mb={0}
												>
													Password
												</FormLabel>
												<Link
													as={RouterLink}
													to="/forgot-password"
													fontSize="xs"
													color="cyan.500"
													fontWeight="600"
													_hover={{
														color: "cyan.400",
														textDecoration: "none",
													}}
												>
													Forgot password?
												</Link>
											</HStack>
											<InputGroup>
												<Input
													type={
														loginData.showPassword ? "text" : "password"
													}
													placeholder="Enter your password"
													color="white"
													bg={
														focusedField === "password"
															? "rgba(0, 181, 216, 0.06)"
															: "rgba(255, 255, 255, 0.03)"
													}
													border="1.5px solid"
													borderColor={
														focusedField === "password"
															? "rgba(0, 181, 216, 0.4)"
															: "rgba(255, 255, 255, 0.08)"
													}
													borderRadius="14px"
													h="50px"
													fontSize="sm"
													_placeholder={{ color: "gray.600" }}
													_hover={{
														borderColor: "rgba(0, 181, 216, 0.25)",
													}}
													_focus={{
														borderColor: "cyan.500",
														boxShadow:
															"0 0 0 3px rgba(0, 181, 216, 0.1)",
													}}
													transition="all 0.25s ease"
													value={loginData.password}
													onChange={(e) =>
														setLoginData({
															password: e.target.value,
														})
													}
													onFocus={() => setFocusedField("password")}
													onBlur={() => setFocusedField(null)}
												/>
												<InputRightElement h="50px">
													<Button
														variant="ghost"
														color="gray.500"
														size="sm"
														_hover={{
															color: "cyan.400",
															bg: "transparent",
														}}
														onClick={() =>
															setLoginData({
																showPassword:
																	!loginData.showPassword,
															})
														}
													>
														{loginData.showPassword ? (
															<ViewIcon />
														) : (
															<ViewOffIcon />
														)}
													</Button>
												</InputRightElement>
											</InputGroup>
										</FormControl>
									</MotionBox>

									{/* Sign In Button */}
									<MotionBox
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.55, duration: 0.4 }}
									>
										<Button
											type="submit"
											w="100%"
											h="52px"
											bg="linear-gradient(135deg, #00B5D8 0%, #0987A0 100%)"
											color="white"
											fontWeight="700"
											fontSize="sm"
											letterSpacing="0.02em"
											borderRadius="14px"
											isLoading={isLoading}
											loadingText="Signing in..."
											_hover={{
												bg: "linear-gradient(135deg, #00C4E8 0%, #0A96AF 100%)",
												transform: "translateY(-1px)",
												boxShadow:
													"0 8px 25px rgba(0, 181, 216, 0.35), 0 0 40px rgba(0, 181, 216, 0.1)",
											}}
											_active={{
												transform: "translateY(0px)",
												boxShadow:
													"0 4px 15px rgba(0, 181, 216, 0.25)",
											}}
											transition="all 0.25s ease"
											boxShadow="0 4px 15px rgba(0, 181, 216, 0.25)"
										>
											Sign In
										</Button>
									</MotionBox>
								</Stack>
							</form>

							{/* Divider */}
							<MotionBox
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.65, duration: 0.4 }}
							>
								<HStack spacing={4}>
									<Box flex={1} h="1px" bg="rgba(255,255,255,0.06)" />
									<Text
										fontSize="xs"
										color="gray.600"
										fontWeight="500"
										textTransform="uppercase"
										letterSpacing="wider"
									>
										or
									</Text>
									<Box flex={1} h="1px" bg="rgba(255,255,255,0.06)" />
								</HStack>
							</MotionBox>

							{/* Sign Up Link */}
							<MotionBox
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.7, duration: 0.4 }}
							>
								<Button
									as={RouterLink}
									to="/signup"
									variant="outline"
									w="100%"
									h="50px"
									borderRadius="14px"
									borderColor="rgba(255, 255, 255, 0.1)"
									borderWidth="1.5px"
									color="gray.300"
									fontWeight="600"
									fontSize="sm"
									bg="transparent"
									_hover={{
										bg: "rgba(255, 255, 255, 0.04)",
										borderColor: "rgba(0, 181, 216, 0.3)",
										color: "white",
										transform: "translateY(-1px)",
									}}
									_active={{
										transform: "translateY(0px)",
									}}
									transition="all 0.25s ease"
								>
									Create a new account
								</Button>
							</MotionBox>
						</VStack>
					</Box>

					{/* Footer */}
					<MotionText
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.9, duration: 0.5 }}
						color="gray.700"
						fontSize="xs"
						textAlign="center"
						mt={6}
						letterSpacing="0.02em"
					>
						© 2025 Stellix. Trade smarter, not harder.
					</MotionText>
				</MotionBox>
			</Flex>
		</Flex>
	);
}
