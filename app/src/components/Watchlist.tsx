import React, { useEffect, useState } from "react";
import accounts from "../services/accounts.service";
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

interface WatchlistItem {
	symbol: string;
	longName: string;
	regularMarketPrice: number;
	regularMarketPreviousClose: number;
	regularMarketChangePercent: number;
}

function Watchlist() {
	const [isLoading, setIsLoading] = useState(true);
	const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

	useEffect(() => {
		accounts.getWatchlist(false).then((watchlist) => {
			setWatchlist(watchlist as WatchlistItem[]);
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
					👁️ Watchlist
				</Heading>
			</Box>

			<Box px={5} py={3}>
				{isLoading ? (
					<Flex justify="center" py={6}>
						<Spinner size="md" color="cyan.500" thickness="3px" />
					</Flex>
				) : (
					<Stack spacing={0}>
						{watchlist.map((stock, i) => (
							<Flex
								gap={3}
								key={i}
								as={Link}
								to={"/stocks/" + stock.symbol}
								py={3}
								px={2}
								borderRadius="lg"
								_hover={{ bg: "rgba(255,255,255,0.03)" }}
								transition="background 0.15s ease"
								align="center"
								justify="space-between"
								borderBottom="1px solid"
								borderColor="rgba(255,255,255,0.03)"
								_last={{ borderBottom: "none" }}
							>
								<VStack align="start" spacing={0} flex="1" minW={0}>
									<Text
										fontSize="sm"
										fontWeight="700"
										color="white"
										textTransform="uppercase"
									>
										{stock.symbol}
									</Text>
									<Text
										fontSize="xs"
										color="gray.500"
										whiteSpace="nowrap"
										overflow="hidden"
										textOverflow="ellipsis"
										maxW="140px"
									>
										{stock.longName}
									</Text>
								</VStack>

								<VStack align="end" spacing={0} flexShrink={0}>
									<Text fontSize="sm" fontWeight="600" color="gray.200">
										{format(stock.regularMarketPrice)}
									</Text>
									<Tag
										size="sm"
										colorScheme={stock.regularMarketChangePercent > 0 ? "green" : "red"}
										variant="subtle"
										borderRadius="full"
										fontSize="xs"
										fontWeight="700"
									>
										{stock.regularMarketChangePercent > 0 ? "+" : ""}
										{stock.regularMarketChangePercent.toFixed(2)}%
									</Tag>
								</VStack>
							</Flex>
						))}
						{watchlist.length === 0 && (
							<Box textAlign="center" py={6}>
								<Text fontSize="2xl" mb={2}>⭐</Text>
								<Text fontSize="sm" color="gray.500">
									No watchlist items. Search stocks and add them!
								</Text>
							</Box>
						)}
					</Stack>
				)}
			</Box>
		</Box>
	);
}

export default Watchlist;
