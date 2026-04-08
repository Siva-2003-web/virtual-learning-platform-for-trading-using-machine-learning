import React, { useEffect, useState } from "react";
import axios from "axios";
import {
	Box,
	Heading,
	Table,
	Tag,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	Text,
	VStack,
	HStack,
	Flex,
	Spinner,
} from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

interface LeaderboardUser {
	username: string;
	value: number;
}

const format = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
}).format;

function getMedalEmoji(rank: number): string {
	if (rank === 0) return "🥇";
	if (rank === 1) return "🥈";
	if (rank === 2) return "🥉";
	return "";
}

function Leaderboard() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		axios
			.get("/api/user/leaderboard")
			.then((res) => {
				const users = res.data && Array.isArray(res.data.users) ? res.data.users : [];
				setLeaderboard(users);
				setIsLoading(false);
			})
			.catch((err) => {
				console.log(err);
				setIsLoading(false);
			});
	}, []);

	if (isLoading) {
		return (
			<Flex align="center" justify="center" minH="60vh">
				<VStack spacing={4}>
					<Spinner size="xl" color="cyan.500" thickness="3px" />
					<Text color="gray.500">Loading leaderboard...</Text>
				</VStack>
			</Flex>
		);
	}

	return (
		<Box className="leaderboard">
			{/* Header */}
			<MotionBox
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				mb={6}
			>
				<HStack spacing={3} mb={1}>
					<Text fontSize="2xl">🏆</Text>
					<Heading size="lg" fontWeight="800" color="white">
						Leaderboard
					</Heading>
				</HStack>
				<Text color="gray.500" fontSize="sm">
					Top traders ranked by portfolio value
				</Text>
			</MotionBox>

			{/* Top 3 Cards */}
			{leaderboard.length >= 3 && (
				<MotionBox
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.4 }}
					mb={6}
				>
					<Flex
						gap={4}
						direction={{ base: "column", md: "row" }}
					>
						{leaderboard.slice(0, 3).map((user, index) => (
							<Box
								key={user.username}
								flex="1"
								bg="rgba(15, 20, 30, 0.85)"
								backdropFilter="blur(20px)"
								border="1px solid"
								borderColor={
									index === 0
										? "rgba(255, 215, 0, 0.2)"
										: index === 1
										? "rgba(192, 192, 192, 0.15)"
										: "rgba(205, 127, 50, 0.15)"
								}
								borderRadius="xl"
								p={5}
								textAlign="center"
								position="relative"
								overflow="hidden"
								_hover={{
									transform: "translateY(-2px)",
									boxShadow:
										index === 0
											? "0 8px 30px rgba(255, 215, 0, 0.1)"
											: "0 8px 25px rgba(0,0,0,0.3)",
								}}
								transition="all 0.25s ease"
							>
								{index === 0 && (
									<Box
										position="absolute"
										top="-50px"
										right="-50px"
										w="150px"
										h="150px"
										borderRadius="full"
										bg="radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)"
										pointerEvents="none"
									/>
								)}
								<Text fontSize="3xl" mb={2}>
									{getMedalEmoji(index)}
								</Text>
								<Heading
									size="sm"
									color="white"
									fontWeight="700"
									mb={1}
									noOfLines={1}
								>
									{user.username}
								</Heading>
								<Text
									fontSize="lg"
									fontWeight="800"
									bgGradient={
										index === 0
											? "linear(to-r, yellow.400, orange.300)"
											: "linear(to-r, cyan.400, teal.300)"
									}
									bgClip="text"
								>
									{format(user.value)}
								</Text>
							</Box>
						))}
					</Flex>
				</MotionBox>
			)}

			{/* Full Table */}
			<MotionBox
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3, duration: 0.4 }}
				bg="rgba(15, 20, 30, 0.85)"
				backdropFilter="blur(20px)"
				border="1px solid"
				borderColor="rgba(255, 255, 255, 0.06)"
				borderRadius="xl"
				overflow="hidden"
			>
				<Table variant="simple">
					<Thead>
						<Tr>
							<Th p={{ base: 3, md: 4 }}>Rank</Th>
							<Th p={{ base: 3, md: 4 }}>Trader</Th>
							<Th p={{ base: 3, md: 4 }} isNumeric>
								Portfolio Value
							</Th>
						</Tr>
					</Thead>
					<Tbody>
						{leaderboard.map((user, index) => (
							<Tr
								key={index}
								_hover={{ bg: "rgba(255,255,255,0.02)" }}
								transition="background 0.15s ease"
							>
								<Td p={{ base: 3, md: 4 }}>
									<HStack spacing={2}>
										{index < 3 && (
											<Text fontSize="lg">{getMedalEmoji(index)}</Text>
										)}
										<Tag
											size="sm"
											colorScheme={index === 0 ? "yellow" : index < 3 ? "cyan" : "gray"}
											variant="subtle"
											borderRadius="full"
											fontWeight="700"
										>
											#{index + 1}
										</Tag>
									</HStack>
								</Td>
								<Td
									p={{ base: 3, md: 4 }}
									fontWeight={index < 3 ? "700" : "500"}
									color={index < 3 ? "white" : "gray.300"}
									maxW="200px"
									overflow="hidden"
									textOverflow="ellipsis"
									whiteSpace="nowrap"
								>
									{user.username}
								</Td>
								<Td
									p={{ base: 3, md: 4 }}
									isNumeric
									fontWeight="600"
									color={index < 3 ? "cyan.400" : "gray.300"}
								>
									{format(user.value)}
								</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			</MotionBox>
		</Box>
	);
}

export default Leaderboard;
