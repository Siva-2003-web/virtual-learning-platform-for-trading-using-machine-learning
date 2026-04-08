import React, { useEffect, useState } from "react";
import accounts from "../services/accounts.service";
import { Position } from "../App";
import {
	Tag,
	Text,
	Heading,
	Stack,
	Flex,
	Spinner,
	Box,
	VStack,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

const format = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
}).format;

function PositionsList() {
	const [isLoading, setIsLoading] = useState(true);
	const [positions, setPositions] = useState<Position[]>([]);

	useEffect(() => {
		accounts.getPortfolio().then(({ positions }) => {
			setPositions(positions);
			setIsLoading(false);
		});
	}, []);

	return (
		<Box
			bg="rgba(15, 20, 30, 0.85)"
			backdropFilter="blur(20px)"
			border="1px solid"
			borderColor="rgba(255, 255, 255, 0.06)"
			borderRadius="xl"
			overflow="hidden"
		>
			<Box px={5} py={4} borderBottom="1px solid" borderColor="rgba(255,255,255,0.04)">
				<Heading size="sm" fontWeight="700" color="gray.200">
					📊 My Portfolio
				</Heading>
			</Box>

			<Box px={5} py={3}>
				{isLoading ? (
					<Flex justify="center" py={6}>
						<Spinner size="md" color="cyan.500" thickness="3px" />
					</Flex>
				) : (
					<Stack spacing={0}>
						{positions.map((position) => {
							return (
								<Flex
									key={position.purchaseDate.toString()}
									as={Link}
									to={"/stocks/" + position.symbol}
									py={3}
									px={2}
									borderRadius="lg"
									_hover={{
										bg: "rgba(255,255,255,0.03)",
									}}
									transition="background 0.15s ease"
									align="center"
									justify="space-between"
									borderBottom="1px solid"
									borderColor="rgba(255,255,255,0.03)"
									_last={{ borderBottom: "none" }}
								>
									<VStack align="start" spacing={0}>
										<Text
											fontSize="sm"
											fontWeight="700"
											color="white"
											textTransform="uppercase"
										>
											{position.symbol}
										</Text>
										<Text fontSize="xs" color="gray.500">
											{position.quantity} share{position.quantity === 1 ? "" : "s"}
										</Text>
									</VStack>

									<VStack align="end" spacing={0}>
										<Text fontSize="sm" fontWeight="600" color="gray.200">
											{format(position.regularMarketPrice)}
										</Text>
										<Tag
											size="sm"
											colorScheme={position.regularMarketChangePercent > 0 ? "green" : "red"}
											variant="subtle"
											borderRadius="full"
											fontSize="xs"
											fontWeight="700"
										>
											{position.regularMarketChangePercent > 0 ? "+" : ""}
											{position.regularMarketChangePercent.toFixed(2)}%
										</Tag>
									</VStack>
								</Flex>
							);
						})}
						{positions.length === 0 && (
							<Box textAlign="center" py={6}>
								<Text fontSize="2xl" mb={2}>📈</Text>
								<Text fontSize="sm" color="gray.500">
									No positions yet. Start trading!
								</Text>
							</Box>
						)}
					</Stack>
				)}
			</Box>
		</Box>
	);
}

export default PositionsList;
