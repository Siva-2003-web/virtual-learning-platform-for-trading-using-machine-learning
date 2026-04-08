import React from "react";
import Sidebar from "./components/Sidebar";
import SearchBox from "./components/SearchBox";
import LandingLoginBar from "./components/LandingLoginBar";
import { Box, Spinner, Flex } from "@chakra-ui/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from "./context/SidebarContext";

const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const StockView = lazy(() => import("./pages/StockView"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
import NotFound from "./pages/NotFound";

export type Transaction = {
	symbol: string;
	purchasePrice: number;
	quantity: number;
	date: Date;
	type: "buy" | "sell";
};

export type Position = {
	symbol: string;
	longName: string;
	purchasePrice: number;
	purchaseDate: Date;
	quantity: number;
	regularMarketPrice: number;
	regularMarketPreviousClose: number;
	regularMarketChangePercent: number;
};

const MotionBox = motion(Box);

function LoadingSpinner() {
	return (
		<Flex
			align="center"
			justify="center"
			minH="60vh"
		>
			<Spinner size="xl" color="cyan.500" thickness="3px" />
		</Flex>
	);
}

function App() {
	const location = useLocation();
	const { isCollapsed } = useSidebar();

	const isAuthPage =
		location.pathname === "/login" || location.pathname === "/signup";
	const isLanding = location.pathname === "/";
	const showSidebar = !isAuthPage && !isLanding;

	return (
		<Flex direction="column" minH="100vh">
			{isLanding && <LandingLoginBar />}
			<Flex flex="1">
				{showSidebar && <Sidebar />}
				<Box
					flex="1"
					display="flex"
					flexDirection="column"
					minH="100vh"
					ml={showSidebar ? { base: 0, lg: isCollapsed ? "100px" : "280px" } : 0}
					transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
				>
					{showSidebar && (
						<Box
							px={{ base: 4, md: 8, lg: 12 }}
							py={4}
							position="sticky"
							top={0}
							zIndex={100}
							bg="rgba(10, 14, 23, 0.7)"
							backdropFilter="blur(20px)"
							borderBottom="1px solid rgba(255,255,255,0.04)"
						>
							<Flex align="center" gap={4}>
								<Box maxW="500px" flex="1">
									<SearchBox />
								</Box>
							</Flex>
						</Box>
					)}
					<Box
						flex="1"
						maxW={isAuthPage ? "100%" : isLanding ? "100%" : "1600px"}
						mx={isAuthPage || isLanding ? "auto" : 0}
						px={isAuthPage ? 0 : isLanding ? 0 : { base: 4, md: 8, lg: 12 }}
						pt={isAuthPage ? 0 : isLanding ? 0 : 2}
						pb={isAuthPage ? 0 : isLanding ? 0 : 10}
					>
						<Suspense fallback={<LoadingSpinner />}>
							<AnimatePresence mode="wait">
								<Routes location={location} key={location.pathname}>
									<Route
										path="/"
										element={
											<MotionBox
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.3 }}
											>
												<Landing />
											</MotionBox>
										}
									/>
									<Route
										path="/dashboard"
										element={
											<MotionBox
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.3 }}
											>
												<Dashboard />
											</MotionBox>
										}
									/>
									<Route path="/login" element={<Login />} />
									<Route path="/signup" element={<Signup />} />
									<Route
										path="/leaderboard"
										element={
											<MotionBox
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.3 }}
											>
												<Leaderboard />
											</MotionBox>
										}
									/>
									<Route
										path="/agent"
										element={
											<MotionBox
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.3 }}
											>
												<AgentDashboard />
											</MotionBox>
										}
									/>
									<Route
										path="/stocks/:symbol"
										element={
											<MotionBox
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.3 }}
											>
												<StockView />
											</MotionBox>
										}
									/>
									<Route path="*" element={<NotFound />} />
								</Routes>
							</AnimatePresence>
						</Suspense>
					</Box>
				</Box>
			</Flex>
		</Flex>
	);
}

export default App;
