import React, { KeyboardEvent as KE, RefObject, useRef, useState } from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	PopoverBody,
	useDisclosure,
	Input,
	List,
	ListItem,
	Text,
	Flex,
	InputLeftElement,
	InputGroup,
	Box,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { SearchIcon } from "@chakra-ui/icons";

interface SearchResult {
	symbol: string;
	longname: string;
}

function SearchBox() {
	const initialFocusRef =
		useRef<HTMLInputElement>() as RefObject<HTMLInputElement>;
	const navigate = useNavigate();

	const { isOpen, onToggle, onClose } = useDisclosure();
	const [selectedIndex, setSelectedIndex] = useState<number>(0);

	const [query, setQuery] = useState<string>("");
	const [results, setResults] = useState<[SearchResult] | null>(null);

	const onKeyDown = (e: KE<HTMLInputElement>) => {
		if (results == null || results.length < 1) return;

		if (e.key === "Enter") {
			navigate(`/stocks/${results![selectedIndex]!.symbol}`);
			let input: HTMLInputElement = e.target! as HTMLInputElement;
			input.blur();
		} else if (e.key === "ArrowUp") {
			setSelectedIndex((selectedIndex - 1) % results!.length);
			if (selectedIndex === 0) setSelectedIndex(results!.length - 1);
		} else if (e.key === "ArrowDown") {
			setSelectedIndex((selectedIndex + 1) % results!.length);
		}
	};

	React.useEffect(() => {
		if (query === "") {
			setResults(null);
			return;
		}

		setSelectedIndex(0);

		const searchForStock = setTimeout(() => {
			axios
				.get(`/api/stocks/search/${query!}`)
				.then((res: { data: [SearchResult] }) => {
					setResults(res.data);
				})
				.catch(() => {
					setResults(null);
				});
		}, 300);

		return () => clearTimeout(searchForStock);
	}, [query]);

	const location = useLocation();
	React.useEffect(() => {
		const path = location.pathname;
		if (path.startsWith("/stocks/")) {
			const stockSymbol = path.split("/")[2];
			initialFocusRef.current!.value = stockSymbol!;
		} else {
			initialFocusRef.current!.value = "";
		}
	}, [location]);

	return (
		<Popover
			initialFocusRef={initialFocusRef}
			closeOnBlur={false}
			isOpen={isOpen}
			returnFocusOnClose={false}
		>
			<PopoverTrigger>
				<InputGroup w="100%">
					<InputLeftElement>
						<SearchIcon color="gray.500" boxSize="3.5" />
					</InputLeftElement>
					<Input
						placeholder="Search stocks..."
						ref={initialFocusRef}
						onBlur={onToggle}
						onFocus={onToggle}
						onKeyDown={onKeyDown}
						onChange={(e) => setQuery(e.target.value)}
						size="sm"
						bg="rgba(255, 255, 255, 0.03)"
						border="1px solid"
						borderColor="rgba(255, 255, 255, 0.08)"
						borderRadius="xl"
						color="gray.200"
						fontSize="sm"
						h="36px"
						_placeholder={{ color: "gray.600" }}
						_hover={{ borderColor: "rgba(0, 181, 216, 0.2)" }}
						_focus={{
							borderColor: "cyan.500",
							boxShadow: "0 0 0 2px rgba(0, 181, 216, 0.1)",
							bg: "rgba(0, 181, 216, 0.04)",
						}}
						transition="all 0.2s ease"
					/>
				</InputGroup>
			</PopoverTrigger>
			{results != null && (
				<PopoverContent
					w="sm"
					bg="rgba(15, 20, 30, 0.95)"
					backdropFilter="blur(20px)"
					border="1px solid"
					borderColor="rgba(255, 255, 255, 0.08)"
					borderRadius="xl"
					boxShadow="0 20px 60px rgba(0,0,0,0.5)"
					overflow="hidden"
					_focus={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
				>
					<PopoverBody p={2}>
						{results.length > 0 ? (
							<List spacing={0}>
								{Array.isArray(results) && results.map((stock, i) => {
									return (
										<ListItem
											key={stock.symbol}
											width="100%"
											height="auto"
											color={selectedIndex === i ? "white" : "gray.300"}
											bg={
												selectedIndex === i
													? "rgba(0, 181, 216, 0.15)"
													: "transparent"
											}
											onMouseOver={() => setSelectedIndex(i)}
											borderRadius="lg"
											p={2.5}
											style={{ cursor: "pointer" }}
											onClick={() => {
												navigate(`/stocks/${stock.symbol}`);
												onClose();
											}}
											transition="all 0.1s ease"
										>
											<Flex gap={2} align="center">
												<Text
													fontWeight="700"
													fontSize="sm"
													color={
														selectedIndex === i ? "cyan.400" : "gray.200"
													}
													minW="60px"
												>
													{stock.symbol}
												</Text>
												<Text
													fontSize="xs"
													color="gray.500"
													overflow="hidden"
													textOverflow="ellipsis"
													whiteSpace="nowrap"
												>
													{stock.longname}
												</Text>
											</Flex>
										</ListItem>
									);
								})}
							</List>
						) : (
							<Box p={4} textAlign="center">
								<Text color="gray.500" fontSize="sm">
									No results found
								</Text>
							</Box>
						)}
					</PopoverBody>
				</PopoverContent>
			)}
		</Popover>
	);
}

export default SearchBox;
