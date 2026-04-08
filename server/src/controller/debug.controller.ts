import { Request, Response } from "express";
import User from "../models/user.model";

// Development-only: return raw user document by username
const getUserRaw = async (req: Request, res: Response) => {
	const username = req.params.username;
	if (!username) {
		return res.status(400).json({ message: "username param required" });
	}

	try {
		const user = await User.findOne({ username }).lean();
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		// Return the raw document from MongoDB (for debugging only)
		return res.status(200).json({ user });
	} catch (err: any) {
		return res.status(500).json({ message: err.message || err });
	}
};

export default { getUserRaw };
