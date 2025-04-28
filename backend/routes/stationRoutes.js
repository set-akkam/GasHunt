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

// Debug middleware
router.use((req, res, next) => {
  console.log('Station route accessed:', {
    method: req.method,
    path: req.path,
    auth: !!req.headers.authorization,
    userId: req.user?._id
  });
  next();
});

// Protected starred station routes
router.get('/starred', authenticateToken, getStarredStations);
router.post('/star', authenticateToken, starStation);
router.delete('/star/:stationid', authenticateToken, unstarStation);
router.get('/star/:stationid/check', authenticateToken, isStationStarred);

// Protected admin routes
router.post('/sync', authenticateToken, syncStations);

// Public station routes
router.get('/nearby', getNearbyStations);
router.get('/:stationid', getStation);

export default router; 