/**
 * Gas Station Routes
 * Handles all gas station related endpoints including:
 * - Getting station information
 * - Finding nearby stations
 * - Managing starred/favorite stations
 * - Admin station synchronization
 */

import express from 'express';
import { getStation, getNearbyStations, syncStations } from '../controllers/stationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { 
  starStation, 
  unstarStation, 
  getStarredStations, 
  isStationStarred 
} from '../controllers/starredStationController.js';

const router = express.Router();

// Debug middleware to log station route access
router.use((req, res, next) => {
  console.log('Station route accessed:', {
    method: req.method,
    path: req.path,
    auth: !!req.headers.authorization,
    userId: req.user?._id
  });
  next();
});

// Protected routes for managing starred/favorite stations
router.get('/starred', authenticateToken, getStarredStations); // Get user's starred stations
router.post('/star', authenticateToken, starStation); // Star a station
router.delete('/star/:stationid', authenticateToken, unstarStation); // Unstar a station
router.get('/star/:stationid/check', authenticateToken, isStationStarred); // Check if station is starred

// Protected admin route for station synchronization
router.post('/sync', authenticateToken, syncStations); // Sync station data (admin only)

// Public routes for station information
router.get('/nearby', getNearbyStations); // Get nearby stations
router.get('/:stationid', getStation); // Get specific station details

export default router; 