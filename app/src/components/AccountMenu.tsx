import React, { useState, useEffect } from "react";
import tokens from "../services/tokens.service";
import { ChevronDownIcon, UnlockIcon } from "@chakra-ui/icons";
import { Button, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";

function AccountMenu() {
	const location = useLocation();

	const [username, setUsername] = useState(tokens.getUsername());

	useEffect(() => {
		// Update username when auth.username changes
		setUsername(tokens.getUsername());
	}, [location.pathname]);

	return (
		<>
			{username ? (
				<Menu>
					<MenuButton
						as={Button}
						width={{ base: "100%", md: "auto" }}
						rightIcon={<ChevronDownIcon />}
					>
						{username}
					</MenuButton>
					<MenuList minWidth="fit-content">
						<MenuItem
							icon={<UnlockIcon />}
							color="red.400"
							fontWeight="700"
							_hover={{ bg: "rgba(255, 0, 0, 0.1)" }}
							onClick={() => {
								tokens.clearToken();
								window.location.href = "/";
							}}
						>
							Logout
						</MenuItem>
					</MenuList>
				</Menu>
			) : (
				<Button
					as={Link}
					to="/login"
					variant="outline"
					width={{ base: "100%", md: "auto" }}
				>
					Login
				</Button>
			)}
		</>
	);
}

export default AccountMenu;
