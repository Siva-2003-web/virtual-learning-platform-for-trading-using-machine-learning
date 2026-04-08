import React, { useEffect, useState } from "react";
import accounts from "../services/accounts.service";
import {
	Text,
	useToast,
	Tabs,
	TabList,
	Tab,
	Stack,
	HStack,
	Spacer,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	Divider,
	TabPanels,
	TabPanel,
	Button,
	Center,
	VStack,
} from "@chakra-ui/react";
import { useLocation } from "react-router-dom";

const formatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

function TransactionPane(props: { symbol: string; price: number }) {
	const [shares, setShares] = useState(1);
	const [buyingPower, setBuyingPower] = useState(0);
	const [availableShares, setAvailableShares] = useState(0);
	const [isLoading, setIsLoading] = useState(false);

	const location = useLocation();
	const toast = useToast();

	const submitTransaction = (
		symbol: string,
		quantity: number,
		isBuy: boolean
	) => {
		setIsLoading(true);
		accounts
			.makeTransaction(symbol, quantity, isBuy ? "buy" : "sell")
			.then(() => {
				toast({
					title: "Transaction submitted",
					description: isBuy
						? "Bought "
						: "Sold " + quantity + " shares of " + symbol,
					status: "success",
				});
				accounts.getBuyingPower().then((value) => setBuyingPower(value));
				accounts
					.getAvailableShares(symbol)
					.then((value) => setAvailableShares(value));
				setIsLoading(false);
			})
			.catch((err) => {
				toast({
					title: "Error " + isBuy ? "buying" : "selling" + " " + symbol,
					description: err.message,
					status: "error",
				});
				setIsLoading(false);
			});
	};

	useEffect(() => {
		accounts.getBuyingPower().then((value) => setBuyingPower(value));
		accounts.getAvailableShares(props.symbol!).then((value) => {
			setAvailableShares(value);
		});
	}, [location]);

	return (
		<>
			<Tabs variant="soft-rounded" colorScheme="cyan" size="sm">
				<TabList
					bg="rgba(255,255,255,0.03)"
					borderRadius="xl"
					p={1}
				>
					<Tab
						flex="1"
						borderRadius="lg"
						fontWeight="600"
						fontSize="sm"
						_selected={{
							bg: "rgba(0, 181, 216, 0.15)",
							color: "cyan.400",
						}}
					>
						Buy {props.symbol}
					</Tab>
					<Tab
						flex="1"
						borderRadius="lg"
						fontWeight="600"
						fontSize="sm"
						_selected={{
							bg: "rgba(245, 101, 101, 0.15)",
							color: "red.400",
						}}
					>
						Sell {props.symbol}
					</Tab>
				</TabList>

				<Stack py={5} spacing={3}>
					<HStack>
						<Text fontSize="sm" color="gray.400" fontWeight="600">
							Shares
						</Text>
						<Spacer />
						<NumberInput
							defaultValue={1}
							min={1}
							width="100px"
							size="sm"
							onChange={(e) => setShares(parseInt(e))}
						>
							<NumberInputField
								borderRadius="xl"
								bg="rgba(255,255,255,0.03)"
								borderColor="rgba(255,255,255,0.08)"
								_hover={{ borderColor: "rgba(0,181,216,0.25)" }}
								_focus={{
									borderColor: "cyan.500",
									boxShadow: "0 0 0 1px rgba(0,181,216,0.2)",
								}}
							/>
							<NumberInputStepper>
								<NumberIncrementStepper borderColor="rgba(255,255,255,0.06)" />
								<NumberDecrementStepper borderColor="rgba(255,255,255,0.06)" />
							</NumberInputStepper>
						</NumberInput>
					</HStack>
					<HStack>
						<Text fontSize="sm" color="gray.400" fontWeight="600">
							Current Price
						</Text>
						<Spacer />
						<Text fontSize="sm" fontWeight="600" color="gray.200">
							{formatter.format(props.price)}
						</Text>
					</HStack>
					<Divider borderColor="rgba(255,255,255,0.06)" />
					<HStack>
						<Text fontSize="sm" fontWeight="700" color="white">
							Estimated Total
						</Text>
						<Spacer />
						<Text
							fontSize="md"
							fontWeight="800"
							bgGradient="linear(to-r, cyan.400, teal.300)"
							bgClip="text"
						>
							{formatter.format(props.price * shares)}
						</Text>
					</HStack>
				</Stack>

				<TabPanels>
					<TabPanel px={0}>
						<Button
							w="100%"
							h="46px"
							bg="linear-gradient(135deg, #48BB78 0%, #38A169 100%)"
							color="white"
							fontWeight="700"
							fontSize="sm"
							borderRadius="xl"
							onClick={() =>
								submitTransaction(props.symbol!, shares, true)
							}
							isLoading={isLoading}
							_hover={{
								transform: "translateY(-1px)",
								boxShadow: "0 6px 20px rgba(72, 187, 120, 0.3)",
							}}
							_active={{ transform: "translateY(0)" }}
							transition="all 0.2s ease"
							boxShadow="0 4px 15px rgba(72, 187, 120, 0.2)"
						>
							Buy
						</Button>
						<Center mt={3}>
							<VStack spacing={0}>
								<Text fontWeight="700" fontSize="xs" color="gray.300">
									{formatter.format(buyingPower)}
								</Text>
								<Text fontSize="xs" color="gray.500">
									Buying Power Available
								</Text>
							</VStack>
						</Center>
					</TabPanel>
					<TabPanel px={0}>
						<Button
							w="100%"
							h="46px"
							bg="linear-gradient(135deg, #F56565 0%, #E53E3E 100%)"
							color="white"
							fontWeight="700"
							fontSize="sm"
							borderRadius="xl"
							onClick={() =>
								submitTransaction(props.symbol!, shares, false)
							}
							isLoading={isLoading}
							_hover={{
								transform: "translateY(-1px)",
								boxShadow: "0 6px 20px rgba(245, 101, 101, 0.3)",
							}}
							_active={{ transform: "translateY(0)" }}
							transition="all 0.2s ease"
							boxShadow="0 4px 15px rgba(245, 101, 101, 0.2)"
						>
							Sell
						</Button>
						<Center mt={3}>
							<VStack spacing={0}>
								<Text fontWeight="700" fontSize="xs" color="gray.300">
									{availableShares} Shares
								</Text>
								<Text fontSize="xs" color="gray.500">
									Available to Sell
								</Text>
							</VStack>
						</Center>
					</TabPanel>
				</TabPanels>
			</Tabs>
		</>
	);
}

export default TransactionPane;
