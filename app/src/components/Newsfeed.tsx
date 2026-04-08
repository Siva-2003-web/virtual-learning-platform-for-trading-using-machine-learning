import React, { useEffect, useState } from "react";
import {
	Card,
	CardBody,
	Text,
	SimpleGrid,
	Heading,
	Link,
	Spinner,
	CardFooter,
	Tag,
	HStack,
	Box,
	Flex,
	VStack,
} from "@chakra-ui/react";
import axios from "axios";

interface NewsItem {
	title: string;
	description: string;
	publishedAt: string;
	symbols: string[];
	source: string;
	sourceUrl: string;
}

function timeSince(date: string) {
	const now = Date.now();
	const seconds = Math.floor((now - new Date(date).getTime()) / 1000);
	const intervals = [
		{ name: "y", seconds: 31536000 },
		{ name: "mo", seconds: 2592000 },
		{ name: "d", seconds: 86400 },
		{ name: "h", seconds: 3600 },
		{ name: "m", seconds: 60 },
		{ name: "s", seconds: 1 },
	];

	for (const interval of intervals) {
		const value = Math.floor(seconds / interval.seconds);
		if (value >= 1) {
			return `${value}${interval.name} ago`;
		}
	}

	return "Just now";
}

function Newsfeed(props: { symbol: string }) {
	const [isLoading, setIsLoading] = useState(true);
	const [news, setNews] = useState<NewsItem[]>([]);

	useEffect(() => {
		axios
			.get("/api/news/" + (props.symbol || ""))
			.then((res) => {
				const data = Array.isArray(res.data) ? res.data : [];
				setNews(data.slice(0, 9));
				setIsLoading(false);
			})
			.catch(() => {
				setNews([]);
				setIsLoading(false);
			});
	}, []);

	if (isLoading) {
		return (
			<Flex align="center" justify="center" h="200px">
				<Spinner size="lg" color="cyan.500" thickness="3px" />
			</Flex>
		);
	}

	if (news.length === 0) {
		return (
			<Box
				bg="rgba(15, 20, 30, 0.85)"
				backdropFilter="blur(20px)"
				border="1px solid"
				borderColor="rgba(255, 255, 255, 0.06)"
				borderRadius="xl"
				p={8}
				textAlign="center"
			>
				<Text fontSize="3xl" mb={3}>📰</Text>
				<Text color="gray.500" fontSize="sm">
					News is temporarily unavailable. Please try again later.
				</Text>
			</Box>
		);
	}

	return (
		<SimpleGrid
			spacing={4}
			templateColumns="repeat(auto-fill, minmax(280px, 1fr))"
		>
			{news.map((item) => (
				<Card
					key={item.title}
					maxW="sm"
					h="100%"
					bg="rgba(15, 20, 30, 0.85)"
					backdropFilter="blur(20px)"
					border="1px solid"
					borderColor="rgba(255, 255, 255, 0.06)"
					borderRadius="xl"
					overflow="hidden"
					_hover={{
						borderColor: "rgba(0, 181, 216, 0.2)",
						transform: "translateY(-2px)",
						boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
					}}
					transition="all 0.25s ease"
				>
					<Box px={5} pt={4} pb={2}>
						<HStack fontSize="xs" spacing={2}>
							<Text color="gray.500" whiteSpace="nowrap">
								{timeSince(item.publishedAt)}
							</Text>
							<Text>·</Text>
							<Text
								color="cyan.400"
								fontWeight="600"
								textOverflow="ellipsis"
								overflow="hidden"
								whiteSpace="nowrap"
							>
								{item.source}
							</Text>
						</HStack>
					</Box>

					<Link
						href={item.sourceUrl}
						color="inherit"
						isExternal
						_hover={{ textDecoration: "none" }}
					>
						<CardBody pt={1} pb={4} px={5}>
							<VStack align="start" spacing={2}>
								<Heading
									size="sm"
									fontWeight="700"
									color="gray.100"
									lineHeight="1.4"
									noOfLines={3}
								>
									{item.title}
								</Heading>
								<Text
									fontSize="xs"
									color="gray.500"
									lineHeight="1.6"
									noOfLines={3}
								>
									{item.description}
								</Text>
							</VStack>
						</CardBody>
					</Link>

					{item.symbols.length > 0 && (
						<CardFooter
							pt={0}
							pb={4}
							px={5}
							borderTop="1px solid"
							borderColor="rgba(255,255,255,0.04)"
						>
							<HStack flexWrap="wrap" spacing={1.5}>
								{item.symbols.map((symbol) => (
									<Tag
										as={Link}
										href={"/stocks/" + symbol}
										key={symbol}
										size="sm"
										colorScheme="cyan"
										variant="subtle"
										borderRadius="full"
										fontSize="xs"
										fontWeight="700"
									>
										{symbol}
									</Tag>
								))}
							</HStack>
						</CardFooter>
					)}
				</Card>
			))}
		</SimpleGrid>
	);
}

export default Newsfeed;
