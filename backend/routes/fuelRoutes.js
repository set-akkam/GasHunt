// Updated fuelRoutes.js
import express from "express";
import { 
  submitFuelPrices,  // Changed from submitFuelPrice
  getFuelPrices, 
  votePriceUpdate,
  voteSubmission,
  deleteFuelPriceSubmission,
  getRecentFuelPrices
} from "../controllers/fuelController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.get("/prices", getFuelPrices);  // Changed from "/"

// Protected routes
router.get("/recent", authenticateToken, getRecentFuelPrices);
router.post("/prices", authenticateToken, submitFuelPrices); // Changed from submitFuelPrice
router.post("/vote/:priceId", authenticateToken, votePriceUpdate);
router.post("/vote/submission/:submissionId", authenticateToken, voteSubmission);
router.delete("/prices/:submissionId", authenticateToken, deleteFuelPriceSubmission);

export default router;