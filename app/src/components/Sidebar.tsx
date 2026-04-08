import React, { useEffect } from "react";
import {
	VStack,
	Text,
	IconButton,
	useColorMode,
	Flex,
	Box,
	Drawer,
	DrawerBody,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerContent,
	DrawerCloseButton,
	useDisclosure,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Tooltip,
	useBreakpointValue,
	HStack,
} from "@chakra-ui/react";

import { Link, useLocation, NavLink } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon, HamburgerIcon, MoonIcon, StarIcon, SunIcon } from "@chakra-ui/icons";
import AccountMenu from "./AccountMenu";
import { useSidebar } from "../context/SidebarContext";

export default function Sidebar() {
	const { toggleColorMode, colorMode } = useColorMode();
	const { isCollapsed, toggleSidebar } = useSidebar();
	const location = useLocation();

	const { isOpen, onOpen, onClose } = useDisclosure();

	const isMobile = useBreakpointValue({ base: true, lg: false });

	useEffect(() => {
		if (isOpen) {
			onClose();
		}
	}, [location]);

	const navLinkStyles = (isActive: boolean) => ({
		display: "flex",
		alignItems: "center",
		gap: isCollapsed ? "0px" : "14px",
		padding: isCollapsed ? "14px" : "14px 18px",
		borderRadius: "14px",
		background: isActive ? "linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(0, 229, 255, 0.05) 100%)" : "transparent",
		color: isActive ? "#00E5FF" : "rgba(255, 255, 255, 0.6)",
		fontWeight: isActive ? "800" : "500",
		transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
		width: "100%",
        border: isActive ? "1px solid rgba(0, 229, 255, 0.2)" : "1px solid transparent",
        boxShadow: isActive ? "0 4px 20px rgba(0, 229, 255, 0.1)" : "none",
        justifyContent: isCollapsed ? "center" : "flex-start",
	});

	const NavItems = () => (
		<VStack align={isCollapsed ? "center" : "start"} spacing={3} w="100%">
			<Tooltip label="Dashboard" isDisabled={!isCollapsed} placement="right">
                <NavLink to="/dashboard" style={({ isActive }) => navLinkStyles(isActive)}>
                    <Text fontSize="xl" filter={location.pathname === "/dashboard" ? "none" : "grayscale(1) opacity(0.7)"}>📊</Text>
                    {!isCollapsed && <Text fontSize="sm" letterSpacing="0.02em">Dashboard</Text>}
                </NavLink>
            </Tooltip>
			<Tooltip label="Leaderboard" isDisabled={!isCollapsed} placement="right">
                <NavLink to="/leaderboard" style={({ isActive }) => navLinkStyles(isActive)}>
                    <Text fontSize="xl" filter={location.pathname === "/leaderboard" ? "none" : "grayscale(1) opacity(0.7)"}>🏆</Text>
                    {!isCollapsed && <Text fontSize="sm" letterSpacing="0.02em">Leaderboard</Text>}
                </NavLink>
            </Tooltip>
			<Tooltip label="Stellix AI" isDisabled={!isCollapsed} placement="right">
                <NavLink to="/agent" style={({ isActive }) => navLinkStyles(isActive)}>
                    <Text fontSize="xl" filter={location.pathname === "/agent" ? "none" : "grayscale(1) opacity(0.7)"}>🤖</Text>
                    {!isCollapsed && <Text fontSize="sm" letterSpacing="0.02em">Stellix AI</Text>}
                </NavLink>
            </Tooltip>
		</VStack>
	);

	// Desktop Sidebar
	if (!isMobile) {
		return (
			<Box
				position="fixed"
				left="0"
				top="0"
				h="100vh"
				w={isCollapsed ? "100px" : "280px"}
				bg="#0A0E17"
                backgroundImage="radial-gradient(circle at 0% 0%, rgba(0, 229, 255, 0.03) 0%, transparent 50%)"
				backdropFilter="blur(40px)"
				borderRight="1px solid"
				borderColor="rgba(255, 255, 255, 0.04)"
				p={isCollapsed ? 4 : 8}
				display="flex"
				flexDirection="column"
				zIndex={200}
                boxShadow="10px 0 30px rgba(0,0,0,0.3)"
                transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
			>
                {/* Collapse Toggle */}
                <IconButton
                    aria-label="Toggle Sidebar"
                    icon={isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    size="xs"
                    position="absolute"
                    right="-12px"
                    top="40px"
                    borderRadius="full"
                    bg="cyan.500"
                    color="white"
                    onClick={toggleSidebar}
                    _hover={{ bg: "cyan.400", transform: "scale(1.1)" }}
                    boxShadow="0 2px 10px rgba(0, 181, 216, 0.4)"
                    zIndex={10}
                />

				{/* Logo Section */}
				<Link to="/">
					<Flex align="center" gap={4} mb={10} justify={isCollapsed ? "center" : "flex-start"} _hover={{ opacity: 0.85 }} transition="0.2s">
						<Box
							w={isCollapsed ? "44px" : "44px"}
							h="44px"
							borderRadius="14px"
							bg="linear-gradient(135deg, #00B5D8 0%, #0987A0 100%)"
							display="flex"
							alignItems="center"
							justifyContent="center"
							boxShadow="0 8px 25px rgba(0, 181, 216, 0.35)"
                            position="relative"
                            flexShrink={0}
						>
                            <Box position="absolute" top="-1px" left="-1px" right="-1px" bottom="-1px" borderRadius="14px" border="1px solid rgba(255,255,255,0.2)" pointerEvents="none" />
							<svg width="24" height="24" viewBox="0 0 128 128" fill="none">
								<path
									d="M64 0L81.5 46.5L128 64L81.5 81.5L64 128L46.5 81.5L0 64L46.5 46.5L64 0Z"
									fill="white"
								/>
							</svg>
						</Box>
						{!isCollapsed && (
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="900" fontSize="xl" color="white" letterSpacing="-0.03em" lineHeight="1">
                                    STELLIX
                                </Text>
                                <Text fontSize="10px" color="cyan.500" fontWeight="800" textTransform="uppercase" letterSpacing="2px" mt={1}>
                                    QUANTUM
                                </Text>
                            </VStack>
                        )}
					</Flex>
				</Link>

				<Box flex="1">
                    {!isCollapsed && (
                        <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="2px" mb={4} ml={2}>
                            Main Menu
                        </Text>
                    )}
                    <NavItems />
                </Box>

				<Box pt={6} borderTop="1px solid rgba(255,255,255,0.05)">
					<Flex direction="column" gap={5}>
						<HStack w="100%" justify={isCollapsed ? "center" : "space-between"} px={2}>
							<HStack spacing={2} direction={isCollapsed ? "column" : "row"}>
                                <Tooltip label="Theme" placement="right">
                                    <IconButton
                                        variant="ghost"
                                        size="sm"
                                        icon={colorMode === "light" ? <SunIcon /> : <MoonIcon />}
                                        onClick={toggleColorMode}
                                        aria-label="Toggle dark mode"
                                        color="gray.400"
                                        _hover={{ color: "white", bg: "rgba(255,255,255,0.06)" }}
                                        borderRadius="10px"
                                    />
                                </Tooltip>
                                {!isCollapsed && (
                                    <Menu>
                                        <Tooltip label="Accent Color">
                                            <MenuButton
                                                as={IconButton}
                                                icon={<StarIcon />}
                                                variant="ghost"
                                                size="sm"
                                                color="gray.400"
                                                _hover={{ color: "white", bg: "rgba(255,255,255,0.06)" }}
                                                borderRadius="10px"
                                            />
                                        </Tooltip>
                                        <MenuList
                                            bg="rgba(15, 20, 30, 0.98)"
                                            backdropFilter="blur(30px)"
                                            border="1px solid"
                                            borderColor="rgba(255, 255, 255, 0.08)"
                                            borderRadius="2xl"
                                            p={3}
                                            display="grid"
                                            gridTemplateColumns="repeat(3, 1fr)"
                                            gap={3}
                                            boxShadow="0 15px 40px rgba(0,0,0,0.4)"
                                        >
                                            {["red", "orange", "yellow", "green", "blue", "teal", "cyan", "purple", "pink"].map((color) => (
                                                <MenuItem
                                                    key={color}
                                                    display="flex"
                                                    justifyContent="center"
                                                    alignItems="center"
                                                    as={IconButton}
                                                    icon={<Box boxSize="14px" borderRadius="full" bg={`${color}.500`} boxShadow={`0 0 10px var(--chakra-colors-${color}-500)`} />}
                                                    variant="ghost"
                                                    borderRadius="full"
                                                    onClick={() => {
                                                        localStorage.setItem("accentColor", color);
                                                        window.location.reload();
                                                    }}
                                                    _hover={{ transform: "scale(1.2)", bg: "rgba(255,255,255,0.05)" }}
                                                />
                                            ))}
                                        </MenuList>
                                    </Menu>
                                )}
                            </HStack>
						</HStack>
						<Box p={1} borderRadius={isCollapsed ? "full" : "16px"} bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.03)">
                            <AccountMenu />
                        </Box>
					</Flex>
				</Box>
			</Box>
		);
	}

	// Mobile Navbar
	return (
		<Flex
			h="72px"
			w="100%"
			bg="rgba(10, 14, 23, 0.85)"
			backdropFilter="blur(25px)"
			borderBottom="1px solid"
			borderColor="rgba(255, 255, 255, 0.05)"
			px={5}
			align="center"
			justify="space-between"
			position="sticky"
			top={0}
			zIndex={200}
		>
			<IconButton
				aria-label="Open menu"
				icon={<HamburgerIcon boxSize={5} />}
				onClick={onOpen}
				variant="ghost"
				color="gray.400"
                _hover={{ color: "white", bg: "rgba(255,255,255,0.05)" }}
                borderRadius="12px"
			/>
			
			<Link to="/">
				<HStack spacing={2}>
                    <Box boxSize="8px" borderRadius="full" bg="cyan.400" boxShadow="0 0 10px var(--chakra-colors-cyan-400)" />
                    <Text fontWeight="900" letterSpacing="2px" color="white" fontSize="lg">
                        STELLIX
                    </Text>
                </HStack>
			</Link>
			
			<AccountMenu />

			<Drawer isOpen={isOpen} placement="left" onClose={onClose}>
				<DrawerOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(10px)" />
				<DrawerContent bg="#0A0E17" borderRight="1px solid rgba(0,229,255,0.1)">
					<DrawerCloseButton color="gray.400" top={4} right={4} />
					<DrawerHeader pt={8} pb={6}>
						<Flex align="center" gap={3}>
                            <Box boxSize="32px" borderRadius="10px" bg="cyan.500" />
                            <Text fontWeight="800" color="white" fontSize="xl" letterSpacing="-1px">Stellix App</Text>
                        </Flex>
					</DrawerHeader>
					<DrawerBody px={4}>
						<NavItems />
					</DrawerBody>
					<DrawerFooter borderTopWidth="1px" borderColor="rgba(255,255,255,0.06)" p={6}>
						<HStack w="100%" justify="space-between">
							<IconButton
								variant="outline"
                                borderColor="rgba(255,255,255,0.1)"
								icon={colorMode === "light" ? <SunIcon /> : <MoonIcon />}
								onClick={toggleColorMode}
								aria-label="Toggle dark mode"
                                color="gray.400"
                                borderRadius="12px"
							/>
                            <Text fontSize="xs" color="gray.600" fontWeight="600">v1.0.0 Stable</Text>
						</HStack>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</Flex>
	);
}
