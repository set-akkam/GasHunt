/**
 * Fuel Price Routes
 * Handles all fuel price related endpoints including:
 * - Submitting fuel prices
 * - Retrieving fuel prices
 * - Voting on price updates
 * - Managing price submissions
 */

import express from "express";
import { 
  submitFuelPrices,
  getFuelPrices, 
  votePriceUpdate,
  voteSubmission,
  deleteFuelPriceSubmission,
  getRecentFuelPrices
} from "../controllers/fuelController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route - Get all fuel prices
router.get("/prices", getFuelPrices);

// Protected routes (require authentication)
router.get("/recent", authenticateToken, getRecentFuelPrices); // Get recent fuel prices
router.post("/prices", authenticateToken, submitFuelPrices); // Submit new fuel prices
router.post("/vote/:priceId", authenticateToken, votePriceUpdate); // Vote on a price update
router.post("/vote/submission/:submissionId", authenticateToken, voteSubmission); // Vote on a price submission
router.delete("/prices/:submissionId", authenticateToken, deleteFuelPriceSubmission); // Delete a price submission

export default router;