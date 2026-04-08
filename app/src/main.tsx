import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import {
	ChakraProvider,
	extendTheme,
	withDefaultColorScheme,
	type ThemeConfig,
} from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";

import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";

const accentColor = localStorage.getItem("accentColor") || "cyan";

const config: ThemeConfig = {
	initialColorMode: "dark",
	useSystemColorMode: false,
};

const customTheme = extendTheme(
	withDefaultColorScheme({ colorScheme: accentColor }),
	{
		config,
		styles: {
			global: {
				"html, body": {
					bg: "#0A0E17",
					color: "gray.100",
					minHeight: "100vh",
				},
				"*::selection": {
					bg: accentColor + ".500",
					color: "white",
				},
				"::-webkit-scrollbar": {
					width: "6px",
					height: "6px",
				},
				"::-webkit-scrollbar-track": {
					bg: "rgba(255,255,255,0.02)",
				},
				"::-webkit-scrollbar-thumb": {
					bg: "rgba(255,255,255,0.1)",
					borderRadius: "3px",
				},
				"::-webkit-scrollbar-thumb:hover": {
					bg: "rgba(255,255,255,0.2)",
				},
			},
		},
		fonts: {
			heading: `'Manrope Variable', sans-serif`,
			body: `'Inter Variable', sans-serif`,
		},
		colors: {
			brand: {
				bg: "#0A0E17",
				card: "rgba(15, 20, 30, 0.85)",
				cardSolid: "#0F141E",
				border: "rgba(255, 255, 255, 0.06)",
				borderAccent: "rgba(0, 181, 216, 0.15)",
			},
		},
		components: {
			Spinner: {
				baseStyle: {
					color: accentColor + ".500",
					borderWidth: "3px",
				},
				defaultProps: {
					size: "xl",
				},
			},
			Link: {
				baseStyle: {
					color: accentColor + ".500",
					_hover: {
						textDecoration: "none",
						color: accentColor + ".400",
					},
				},
			},
			Card: {
				baseStyle: {
					container: {
						bg: "rgba(15, 20, 30, 0.85)",
						backdropFilter: "blur(20px)",
						border: "1px solid",
						borderColor: "rgba(255, 255, 255, 0.06)",
						borderRadius: "xl",
						overflow: "hidden",
					},
				},
			},
			Button: {
				baseStyle: {
					fontWeight: "600",
					borderRadius: "xl",
				},
			},
			Input: {
				baseStyle: {
					field: {
						borderRadius: "xl",
					},
				},
				defaultProps: {
					focusBorderColor: accentColor + ".500",
				},
			},
			Table: {
				variants: {
					simple: {
						th: {
							borderColor: "rgba(255, 255, 255, 0.06)",
							color: "gray.500",
							fontSize: "xs",
							fontWeight: "700",
							textTransform: "uppercase",
							letterSpacing: "wider",
						},
						td: {
							borderColor: "rgba(255, 255, 255, 0.04)",
						},
					},
				},
			},
			Tabs: {
				variants: {
					enclosed: {
						tab: {
							borderColor: "rgba(255, 255, 255, 0.06)",
							_selected: {
								bg: "rgba(0, 181, 216, 0.1)",
								borderColor: "rgba(0, 181, 216, 0.3)",
								borderBottomColor: "transparent",
								color: "cyan.400",
							},
						},
						tabpanel: {
							borderColor: "rgba(255, 255, 255, 0.06)",
						},
					},
				},
			},
			Heading: {
				baseStyle: {
					letterSpacing: "-0.02em",
				},
			},
			Tag: {
				baseStyle: {
					container: {
						borderRadius: "full",
					},
				},
			},
		},
	},
);

import { SidebarProvider } from "./context/SidebarContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<BrowserRouter>
		<SidebarProvider>
			<ChakraProvider theme={customTheme}>
				<App />
			</ChakraProvider>
		</SidebarProvider>
	</BrowserRouter>,
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.then((reg) => console.log('Service Worker registered', reg))
			.catch((err) => console.error('Service Worker registration failed', err));
	});
}
