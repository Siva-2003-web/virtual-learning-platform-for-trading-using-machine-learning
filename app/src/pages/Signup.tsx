import {
	Flex,
	Box,
	FormControl,
	FormLabel,
	Input,
	InputGroup,
	HStack,
	InputRightElement,
	Stack,
	Button,
	Heading,
	Text,
	VStack,
	useToast,
	keyframes,
} from "@chakra-ui/react";

import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import accounts from "../services/accounts.service";
import tokens from "../services/tokens.service";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

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

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

export default function Signup() {
	const toast = useToast();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [focusedField, setFocusedField] = useState<string | null>(null);

	useEffect(() => {
		if (tokens.isAuthenticated()) {
			navigate("/dashboard");
		}
	});

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		setIsLoading(true);
		accounts
			.signup(username, password, "")
			.then((res) => {
				if (res === "success") {
					toast({
						title: `Account created! Redirecting to login...`,
						status: "success",
						isClosable: true,
						duration: 2000,
					});
					navigate("/login");
				} else {
					toast({ title: `${res}`, status: "error", isClosable: true });
				}
			})
			.catch((err) => {
				toast({ title: `${err}`, status: "error", isClosable: true });
			})
			.finally(() => setIsLoading(false));
	};

	const particles = Array.from({ length: 15 }, () => ({
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
			{/* ─── LEFT: Branding Hero ────────────────────────────────── */}
			<Box
				display={{ base: "none", lg: "flex" }}
				flexDirection="column"
				justifyContent="center"
				alignItems="center"
				w="55%"
				position="relative"
				overflow="hidden"
			>
				<Box
					position="absolute"
					inset="0"
					bg="linear-gradient(135deg, #0A0E17 0%, #0D1B2A 40%, #112240 70%, #0A0E17 100%)"
				/>
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
				<Box
					position="absolute"
					w="300px"
					h="300px"
					top="10%"
					left="5%"
					borderRadius="full"
					bg="rgba(0, 181, 216, 0.06)"
					filter="blur(80px)"
					animation={`${float1} 12s ease-in-out infinite`}
					pointerEvents="none"
				/>
				<Box
					position="absolute"
					w="200px"
					h="200px"
					top="60%"
					left="70%"
					borderRadius="full"
					bg="rgba(9, 135, 160, 0.08)"
					filter="blur(60px)"
					animation={`${float2} 15s ease-in-out infinite`}
					pointerEvents="none"
				/>
				{particles.map((p, idx) => (
					<Box
						key={idx}
						position="absolute"
						left={p.x}
						top={p.y}
						w="3px"
						h="3px"
						borderRadius="full"
						bg="cyan.400"
						animation={`${pulse} ${2 + p.delay}s ease-in-out infinite`}
						style={{ animationDelay: `${p.delay}s` }}
						pointerEvents="none"
						opacity={0.5}
					/>
				))}

				<VStack position="relative" zIndex={3} spacing={6} px={12} textAlign="center">
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
							boxShadow="0 8px 32px rgba(0, 181, 216, 0.3)"
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
							lineHeight="1.2"
						>
							Join the Trading{" "}
							<Text
								as="span"
								bgGradient="linear(to-r, cyan.400, cyan.300, teal.300)"
								bgClip="text"
							>
								Revolution.
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
							Start with $100,000 in virtual cash. Practice real strategies.
							Compete with traders worldwide.
						</MotionText>
					</VStack>

					{/* Feature highlights */}
					<MotionBox
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7, duration: 0.6 }}
					>
						<HStack spacing={6} justify="center">
							{[
								{ icon: "📊", label: "Real-Time Data" },
								{ icon: "🏆", label: "Leaderboards" },
								{ icon: "🤖", label: "AI Agent" },
							].map((feat) => (
								<VStack
									key={feat.label}
									bg="rgba(0, 181, 216, 0.08)"
									borderRadius="xl"
									px={5}
									py={4}
									border="1px solid"
									borderColor="rgba(0, 181, 216, 0.15)"
									spacing={1}
								>
									<Text fontSize="2xl">{feat.icon}</Text>
									<Text fontSize="xs" color="gray.400" fontWeight="600">
										{feat.label}
									</Text>
								</VStack>
							))}
						</HStack>
					</MotionBox>
				</VStack>
			</Box>

			{/* ─── Divider ────────────────────────────────────────────── */}
			<Box
				display={{ base: "none", lg: "block" }}
				w="1px"
				bg="linear-gradient(to bottom, transparent 0%, rgba(0,181,216,0.3) 30%, rgba(0,181,216,0.3) 70%, transparent 100%)"
			/>

			{/* ─── RIGHT: Signup Form ─────────────────────────────── */}
			<Flex
				w={{ base: "100%", lg: "45%" }}
				alignItems="center"
				justifyContent="center"
				position="relative"
				overflow="hidden"
			>
				<Box
					position="absolute"
					inset="0"
					bg="linear-gradient(160deg, #0A0E17 0%, #0F1923 50%, #0A0E17 100%)"
				/>
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

				{/* Mobile logo */}
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
						<Text fontSize="xl" fontWeight="800" color="white">
							Stellix
						</Text>
					</HStack>
				</Box>

				{/* Signup Card */}
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
							<VStack spacing={2} align="start">
								<MotionHeading
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.2, duration: 0.5 }}
									fontSize="2xl"
									fontWeight="800"
									color="white"
								>
									Create account
								</MotionHeading>
								<MotionText
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.3, duration: 0.5 }}
									fontSize="sm"
									color="gray.500"
								>
									Start your trading journey today
								</MotionText>
							</VStack>

							<form onSubmit={handleSubmit}>
								<Stack spacing={5}>
									<MotionBox
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.35, duration: 0.4 }}
									>
										<FormControl id="signup-username" isRequired>
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
											<Input
												type="text"
												placeholder="Choose a username"
												color="white"
												bg={focusedField === "username" ? "rgba(0, 181, 216, 0.06)" : "rgba(255, 255, 255, 0.03)"}
												border="1.5px solid"
												borderColor={focusedField === "username" ? "rgba(0, 181, 216, 0.4)" : "rgba(255, 255, 255, 0.08)"}
												borderRadius="14px"
												h="50px"
												fontSize="sm"
												_placeholder={{ color: "gray.600" }}
												_hover={{ borderColor: "rgba(0, 181, 216, 0.25)" }}
												_focus={{ borderColor: "cyan.500", boxShadow: "0 0 0 3px rgba(0, 181, 216, 0.1)" }}
												transition="all 0.25s ease"
												value={username}
												onChange={(e) => setUsername(e.target.value)}
												onFocus={() => setFocusedField("username")}
												onBlur={() => setFocusedField(null)}
											/>
										</FormControl>
									</MotionBox>

									<MotionBox
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.45, duration: 0.4 }}
									>
										<FormControl id="signup-password" isRequired>
											<FormLabel
												color="gray.400"
												fontWeight="600"
												fontSize="xs"
												textTransform="uppercase"
												letterSpacing="wider"
												mb={2}
											>
												Password
											</FormLabel>
											<InputGroup>
												<Input
													type={showPassword ? "text" : "password"}
													placeholder="Create a strong password"
													color="white"
													bg={focusedField === "password" ? "rgba(0, 181, 216, 0.06)" : "rgba(255, 255, 255, 0.03)"}
													border="1.5px solid"
													borderColor={focusedField === "password" ? "rgba(0, 181, 216, 0.4)" : "rgba(255, 255, 255, 0.08)"}
													borderRadius="14px"
													h="50px"
													fontSize="sm"
													_placeholder={{ color: "gray.600" }}
													_hover={{ borderColor: "rgba(0, 181, 216, 0.25)" }}
													_focus={{ borderColor: "cyan.500", boxShadow: "0 0 0 3px rgba(0, 181, 216, 0.1)" }}
													transition="all 0.25s ease"
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													onFocus={() => setFocusedField("password")}
													onBlur={() => setFocusedField(null)}
												/>
												<InputRightElement h="50px">
													<Button
														variant="ghost"
														color="gray.500"
														size="sm"
														_hover={{ color: "cyan.400", bg: "transparent" }}
														onClick={() => setShowPassword(!showPassword)}
													>
														{showPassword ? <ViewIcon /> : <ViewOffIcon />}
													</Button>
												</InputRightElement>
											</InputGroup>
										</FormControl>
									</MotionBox>

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
											loadingText="Creating account..."
											_hover={{
												bg: "linear-gradient(135deg, #00C4E8 0%, #0A96AF 100%)",
												transform: "translateY(-1px)",
												boxShadow: "0 8px 25px rgba(0, 181, 216, 0.35)",
											}}
											_active={{ transform: "translateY(0px)" }}
											transition="all 0.25s ease"
											boxShadow="0 4px 15px rgba(0, 181, 216, 0.25)"
										>
											Create Account
										</Button>
									</MotionBox>
								</Stack>
							</form>

							<MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.4 }}>
								<HStack spacing={4}>
									<Box flex={1} h="1px" bg="rgba(255,255,255,0.06)" />
									<Text fontSize="xs" color="gray.600" fontWeight="500" textTransform="uppercase" letterSpacing="wider">
										or
									</Text>
									<Box flex={1} h="1px" bg="rgba(255,255,255,0.06)" />
								</HStack>
							</MotionBox>

							<MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4 }}>
								<Button
									as={RouterLink}
									to="/login"
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
									transition="all 0.25s ease"
								>
									Already have an account? Sign in
								</Button>
							</MotionBox>
						</VStack>
					</Box>

					<MotionText
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.9, duration: 0.5 }}
						color="gray.700"
						fontSize="xs"
						textAlign="center"
						mt={6}
					>
						© 2025 Stellix. Trade smarter, not harder.
					</MotionText>
				</MotionBox>
			</Flex>
		</Flex>
	);
}
