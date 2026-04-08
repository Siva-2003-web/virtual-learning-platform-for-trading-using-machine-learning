import React from "react";
import {
	Box,
	Button,
	Container,
	Flex,
	Heading,
	HStack,
	Icon,
	SimpleGrid,
	Text,
	VStack,
	Link as ChakraLink,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
	ArrowForwardIcon,
	ChevronRightIcon,
	TimeIcon,
	StarIcon,
} from "@chakra-ui/icons";

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const fadeUp = {
	hidden: { opacity: 0, y: 24 },
	show: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: 0.08 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
	}),
};

function FeatureCard({
	icon,
	title,
	description,
	index,
}: {
	icon: React.ReactElement;
	title: string;
	description: string;
	index: number;
}) {
	return (
		<MotionBox
			custom={index}
			variants={fadeUp}
			initial="hidden"
			whileInView="show"
			viewport={{ once: true, margin: "-60px" }}
			p={{ base: 6, md: 8 }}
			borderRadius="2xl"
			bg="rgba(15, 20, 30, 0.65)"
			backdropFilter="blur(16px)"
			border="1px solid"
			borderColor="rgba(255, 255, 255, 0.07)"
			_hover={{
				borderColor: "rgba(0, 181, 216, 0.35)",
				boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 181, 216, 0.15)",
			}}
			transition="all 0.35s ease"
		>
			<VStack align="flex-start" spacing={4}>
				<Flex
					w="48px"
					h="48px"
					borderRadius="xl"
					bg="linear-gradient(135deg, rgba(0, 181, 216, 0.22) 0%, rgba(9, 135, 160, 0.12) 100%)"
					border="1px solid rgba(0, 181, 216, 0.25)"
					align="center"
					justify="center"
					color="cyan.300"
				>
					{icon}
				</Flex>
				<Heading fontSize="lg" fontWeight="700" letterSpacing="-0.02em">
					{title}
				</Heading>
				<Text color="gray.400" fontSize="sm" lineHeight="1.75">
					{description}
				</Text>
			</VStack>
		</MotionBox>
	);
}

export default function Landing() {
	return (
		<Box as="main" overflow="hidden">
			{/* Hero background */}
			<Box position="relative">
				<Box
					position="absolute"
					inset={0}
					bgGradient="radial(circle at 20% 20%, rgba(0, 181, 216, 0.14) 0%, transparent 45%)"
					pointerEvents="none"
				/>
				<Box
					position="absolute"
					inset={0}
					bgGradient="radial(circle at 85% 15%, rgba(147, 51, 234, 0.08) 0%, transparent 40%)"
					pointerEvents="none"
				/>
				<Box
					position="absolute"
					inset={0}
					opacity={0.35}
					bgImage="linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)"
					bgSize="64px 64px"
					pointerEvents="none"
				/>

				<Container maxW="container.xl" pt={{ base: 12, md: 20 }} pb={{ base: 16, md: 24 }} px={{ base: 4, md: 6 }}>
					<Flex
						direction={{ base: "column", lg: "row" }}
						align={{ base: "stretch", lg: "center" }}
						justify="space-between"
						gap={{ base: 14, lg: 8 }}
					>
						<MotionVStack
							align={{ base: "center", lg: "flex-start" }}
							textAlign={{ base: "center", lg: "left" }}
							spacing={6}
							maxW={{ lg: "xl" }}
							initial="hidden"
							animate="show"
							variants={{
								hidden: {},
								show: {
									transition: { staggerChildren: 0.1 },
								},
							}}
						>
							<MotionBox variants={fadeUp} custom={0}>
								<Text
									display="inline-flex"
									alignItems="center"
									gap={2}
									px={3}
									py={1}
									borderRadius="full"
									fontSize="xs"
									fontWeight="600"
									letterSpacing="0.08em"
									textTransform="uppercase"
									bg="rgba(0, 181, 216, 0.12)"
									color="cyan.300"
									border="1px solid rgba(0, 181, 216, 0.28)"
								>
									Paper trading, reimagined
								</Text>
							</MotionBox>

							<MotionBox variants={fadeUp} custom={1}>
								<Heading
									as="h1"
									fontSize={{ base: "4xl", sm: "5xl", md: "6xl" }}
									fontWeight="800"
									lineHeight="1.05"
									letterSpacing="-0.04em"
								>
									Build conviction.{" "}
									<Text
										as="span"
										bgGradient="linear(to-r, cyan.300, teal.300, cyan.200)"
										bgClip="text"
									>
										Trade with clarity.
									</Text>
								</Heading>
							</MotionBox>

							<MotionBox variants={fadeUp} custom={2}>
								<Text
									fontSize={{ base: "md", md: "lg" }}
									color="gray.400"
									lineHeight="1.75"
									maxW="520px"
								>
									Stellix is your command center for simulated equity trading—watchlists,
									charts, a live leaderboard, and an AI agent to help you think through moves.
								</Text>
							</MotionBox>

							<MotionBox variants={fadeUp} custom={3}>
								<HStack
									spacing={3}
									flexWrap="wrap"
									justify={{ base: "center", lg: "flex-start" }}
								>
									<Button
										as={RouterLink}
										to="/signup"
										size="lg"
										rightIcon={<ArrowForwardIcon />}
										bg="linear-gradient(135deg, #00B5D8 0%, #0987A0 100%)"
										color="white"
										fontWeight="700"
										px={8}
										_hover={{
											transform: "translateY(-2px)",
											boxShadow: "0 12px 32px rgba(0, 181, 216, 0.35)",
										}}
										_active={{ transform: "translateY(0)" }}
										transition="all 0.25s ease"
										boxShadow="0 4px 20px rgba(0, 181, 216, 0.25)"
									>
										Get started
									</Button>
									<Button
										as={RouterLink}
										to="/dashboard"
										size="lg"
										variant="outline"
										borderColor="rgba(255,255,255,0.14)"
										color="gray.200"
										fontWeight="600"
										px={6}
										_hover={{
											bg: "rgba(255,255,255,0.05)",
											borderColor: "rgba(0, 181, 216, 0.4)",
										}}
									>
										Open dashboard
									</Button>
								</HStack>
							</MotionBox>

							<MotionBox variants={fadeUp} custom={4}>
								<HStack
									spacing={6}
									color="gray.500"
									fontSize="sm"
									flexWrap="wrap"
									justify={{ base: "center", lg: "flex-start" }}
								>
									<HStack>
										<Icon as={ChevronRightIcon} color="cyan.500" />
										<Text>No credit card</Text>
									</HStack>
									<HStack>
										<Icon as={ChevronRightIcon} color="cyan.500" />
										<Text as={RouterLink} to="/login" color="gray.400" _hover={{ color: "cyan.300" }}>
											Already have an account? Sign in
										</Text>
									</HStack>
								</HStack>
							</MotionBox>
						</MotionVStack>

						<MotionBox
							flex="1"
							maxW={{ base: "100%", lg: "480px" }}
							alignSelf="center"
							initial={{ opacity: 0, scale: 0.94, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
						>
							<Box
								position="relative"
								borderRadius="2xl"
								p="1px"
								bgGradient="linear(135deg, rgba(0,181,216,0.5), rgba(255,255,255,0.08), rgba(147,92,234,0.25))"
							>
								<Box
									borderRadius="2xl"
									bg="rgba(10, 14, 23, 0.92)"
									backdropFilter="blur(20px)"
									border="1px solid rgba(255,255,255,0.06)"
									p={{ base: 6, md: 8 }}
									boxShadow="0 25px 80px rgba(0,0,0,0.45)"
								>
									<VStack align="stretch" spacing={6}>
										<Flex justify="space-between" align="center">
											<Text fontSize="xs" fontWeight="700" color="gray.500" letterSpacing="0.1em" textTransform="uppercase">
												Portfolio snapshot
											</Text>
											<Text fontSize="xs" color="cyan.400" fontWeight="600">
												Live demo
											</Text>
										</Flex>
										<Box>
											<Text fontSize="sm" color="gray.500" mb={1}>
												Total equity
											</Text>
											<Heading size="lg" fontWeight="800" letterSpacing="-0.03em">
												$128,492.06
											</Heading>
											<Text fontSize="sm" color="green.400" fontWeight="600" mt={1}>
												+2.4% today
											</Text>
										</Box>
										<Box h="2px" bg="rgba(255,255,255,0.06)" borderRadius="full" />
										<SimpleGrid columns={2} spacing={4}>
											<Box>
												<Text fontSize="xs" color="gray.500">
													Open positions
												</Text>
												<Text fontSize="md" fontWeight="700">
													14
												</Text>
											</Box>
											<Box>
												<Text fontSize="xs" color="gray.500">
													Watchlist
												</Text>
												<Text fontSize="md" fontWeight="700">
													28 symbols
												</Text>
											</Box>
										</SimpleGrid>
										<Box
											borderRadius="xl"
											bg="rgba(0, 181, 216, 0.08)"
											border="1px solid rgba(0, 181, 216, 0.18)"
											p={4}
										>
											<Text fontSize="xs" color="cyan.200" fontWeight="600" mb={1}>
												AI Agent
											</Text>
											<Text fontSize="sm" color="gray.400" lineHeight="1.65">
												“Consider trimming concentration in tech if beta to the sector exceeds your risk budget.”
											</Text>
										</Box>
									</VStack>
								</Box>
							</Box>
						</MotionBox>
					</Flex>
				</Container>
			</Box>

			{/* Stats */}
			<Container>
				<MotionBox
					maxW="container.xl"
					mx="auto"
					px={{ base: 4, md: 6 }}
					py={{ base: 12, md: 16 }}
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					<SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 6, md: 10 }}>
						{[
							{ label: "Markets", value: "US Equities" },
							{ label: "Charts", value: "Highcharts" },
							{ label: "Leaderboard", value: "Real-time" },
							{ label: "Agent", value: "Groq-powered" },
						].map((s) => (
							<VStack key={s.label} align={{ base: "center", md: "flex-start" }} spacing={1}>
								<Text fontSize="xs" color="gray.500" fontWeight="600" letterSpacing="0.08em" textTransform="uppercase">
									{s.label}
								</Text>
								<Text fontWeight="700" fontSize="md">
									{s.value}
								</Text>
							</VStack>
						))}
					</SimpleGrid>
				</MotionBox>
			</Container>

			{/* Features */}
			<Box bg="rgba(255,255,255,0.02)" borderY="1px solid" borderColor="rgba(255,255,255,0.06)">
				<Container maxW="container.xl" py={{ base: 16, md: 24 }} px={{ base: 4, md: 6 }}>
					<VStack spacing={4} mb={12} textAlign="center">
						<Text
							fontSize="xs"
							fontWeight="700"
							letterSpacing="0.12em"
							textTransform="uppercase"
							color="cyan.400"
						>
							Product
						</Text>
						<Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" letterSpacing="-0.03em">
							Everything you need to practice like a pro
						</Heading>
						<Text color="gray.400" maxW="560px" mx="auto" lineHeight="1.8">
							A cohesive surface for research, execution, and reflection—without the noise of a live broker.
						</Text>
					</VStack>

					<SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
						<FeatureCard
							index={0}
							icon={<TimeIcon boxSize={5} />}
							title="Markets & charts"
							description="Deep-dive symbols with responsive charts and the context you need to form a thesis."
						/>
						<FeatureCard
							index={1}
							icon={<StarIcon boxSize={5} />}
							title="Leaderboard"
							description="See how your simulated performance stacks up and stay motivated to refine your process."
						/>
						<FeatureCard
							index={2}
							icon={
								<Box as="span" fontSize="lg" lineHeight={1}>
									🤖
								</Box>
							}
							title="Agent copilot"
							description="Ask questions in natural language and get structured ideas—always layered on your own judgment."
						/>
					</SimpleGrid>
				</Container>
			</Box>

			{/* CTA */}
			<Container maxW="container.md" py={{ base: 16, md: 24 }} px={{ base: 4, md: 6 }}>
				<MotionBox
					borderRadius="2xl"
					p={{ base: 8, md: 12 }}
					textAlign="center"
					bgGradient="linear(135deg, rgba(0, 181, 216, 0.15) 0%, rgba(15, 20, 30, 0.9) 50%, rgba(147, 92, 234, 0.08) 100%)"
					border="1px solid rgba(0, 181, 216, 0.25)"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					<Heading fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" mb={3} letterSpacing="-0.02em">
						Start your Stellix workspace
					</Heading>
					<Text color="gray.400" mb={8} lineHeight="1.75" maxW="420px" mx="auto">
						Create an account in seconds and open the dashboard—your paper portfolio is ready when you are.
					</Text>
					<Button
						as={RouterLink}
						to="/signup"
						size="lg"
						bg="white"
						color="gray.900"
						fontWeight="700"
						px={10}
						_hover={{ bg: "cyan.50", transform: "translateY(-2px)" }}
						_active={{ transform: "translateY(0)" }}
						rightIcon={<ArrowForwardIcon />}
					>
						Create free account
					</Button>
				</MotionBox>
			</Container>

			{/* Footer */}
			<Box borderTop="1px solid" borderColor="rgba(255,255,255,0.06)" py={10}>
				<Container maxW="container.xl" px={{ base: 4, md: 6 }}>
					<Flex
						direction={{ base: "column", sm: "row" }}
						align="center"
						justify="space-between"
						gap={4}
					>
						<Text fontSize="sm" color="gray.500">
							© {new Date().getFullYear()} Stellix. Paper trading experience.
						</Text>
						<HStack spacing={6} fontSize="sm">
							<ChakraLink as={RouterLink} to="/dashboard" color="gray.400" _hover={{ color: "cyan.300" }}>
								Dashboard
							</ChakraLink>
							<ChakraLink as={RouterLink} to="/login" color="gray.400" _hover={{ color: "cyan.300" }}>
								Sign in
							</ChakraLink>
							<ChakraLink as={RouterLink} to="/leaderboard" color="gray.400" _hover={{ color: "cyan.300" }}>
								Leaderboard
							</ChakraLink>
						</HStack>
					</Flex>
				</Container>
			</Box>
		</Box>
	);
}
