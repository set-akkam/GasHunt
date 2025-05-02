/**
 * Leaderboard Routes
 * Handles endpoints for retrieving user leaderboard data
 * Currently provides a single endpoint to get the leaderboard
 */

import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';

const router = express.Router();

// Get leaderboard data - returns ranked list of users based on their contributions
router.get('/', getLeaderboard);

export default router; 