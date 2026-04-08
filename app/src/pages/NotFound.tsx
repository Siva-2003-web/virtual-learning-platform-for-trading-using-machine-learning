import { Box, Heading, Text, Button, VStack, keyframes } from "@chakra-ui/react";
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

export default function NotFound() {
	return (
		<VStack
			textAlign="center"
			py={{ base: 16, md: 24 }}
			px={6}
			minH="70vh"
			justify="center"
		>
			<MotionBox
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, type: "spring" }}
			>
				<Text
					fontSize="8xl"
					animation={`${float} 3s ease-in-out infinite`}
					mb={2}
				>
					🔍
				</Text>
			</MotionBox>

			<MotionBox
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2, duration: 0.5 }}
			>
				<Heading
					fontSize="6xl"
					fontWeight="900"
					bgGradient="linear(to-r, cyan.400, cyan.300, teal.300)"
					bgClip="text"
					letterSpacing="-0.03em"
				>
					404
				</Heading>
			</MotionBox>

			<MotionBox
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3, duration: 0.5 }}
			>
				<Heading fontSize="xl" color="gray.200" fontWeight="700" mb={1}>
					Page Not Found
				</Heading>
				<Text color="gray.500" fontSize="sm" maxW="350px" lineHeight="1.7">
					The page you're looking for doesn't exist or has been moved.
					Let's get you back on track.
				</Text>
			</MotionBox>

			<MotionBox
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5, duration: 0.5 }}
				mt={4}
			>
				<Button
					as={Link}
					to="/dashboard"
					bg="linear-gradient(135deg, #00B5D8 0%, #0987A0 100%)"
					color="white"
					fontWeight="700"
					size="lg"
					borderRadius="xl"
					px={8}
					_hover={{
						transform: "translateY(-2px)",
						boxShadow: "0 8px 25px rgba(0, 181, 216, 0.35)",
					}}
					_active={{ transform: "translateY(0px)" }}
					transition="all 0.25s ease"
					boxShadow="0 4px 15px rgba(0, 181, 216, 0.25)"
				>
					Go to Dashboard
				</Button>
			</MotionBox>
		</VStack>
	);
}
