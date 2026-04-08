import React from "react";
import { Button, Flex } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

export default function LandingLoginBar() {
	return (
		<Flex
			position="sticky"
			top={0}
			zIndex={100}
			justify="flex-end"
			align="center"
			px={{ base: 4, md: 6, lg: 8 }}
			py={3}
			bg="rgba(10, 14, 23, 0.75)"
			backdropFilter="blur(12px)"
			borderBottom="1px solid"
			borderColor="rgba(255, 255, 255, 0.06)"
		>
			<Button
				as={RouterLink}
				to="/login"
				size="sm"
				fontWeight="600"
				variant="outline"
				borderColor="rgba(255,255,255,0.18)"
				color="gray.100"
				_hover={{
					bg: "rgba(0, 181, 216, 0.12)",
					borderColor: "cyan.400",
					color: "white",
				}}
			>
				Log in
			</Button>
		</Flex>
	);
}
