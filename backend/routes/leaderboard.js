import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';

const router = express.Router();

// Get leaderboard data
router.get('/', getLeaderboard);

export default router; 