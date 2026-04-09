import axios from "axios";
import tokens from "./tokens.service";

// In production (Vercel), call the Render backend directly.
// In development, use the local Vite proxy at /api.
const API_BASE = import.meta.env.PROD
	? "https://s-stellix-backend.onrender.com/api"
	: "/api";

const instance = axios.create({
	baseURL: API_BASE,
	headers: {
		"Content-Type": "application/json",
	},
});

instance.interceptors.request.use(
	(config) => {
		const token = tokens.getToken();
		if (token) {
			config.headers["Authorization"] = "Bearer " + token;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

export default instance;
