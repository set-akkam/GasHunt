/**
 * Main server file for the Fuel Price Tracker backend
 * This file sets up the Express server, middleware, routes, and error handling
 */

// Import required dependencies
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; // Import database connection
import authRoutes from "./routes/authRoutes.js"; // Authentication routes
import fuelRoutes from "./routes/fuelRoutes.js"; // Fuel price related routes
import stationRoutes from "./routes/stationRoutes.js"; // Gas station related routes
import priceHistoryRoutes from './routes/priceHistory.js'; // Price history tracking routes
import leaderboardRoutes from './routes/leaderboard.js'; // User leaderboard routes

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Configure middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log('\n🔍 Request:', {
    method: req.method,
    path: req.originalUrl,
    auth: req.headers.authorization ? 'Present' : 'None'
  });
  next();
});

// Token debug middleware specifically for protected station routes
app.use('/api/stations/*', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('🔐 Token debug:', {
    hasAuth: !!req.headers.authorization,
    token: token ? `${token.substring(0, 20)}...` : 'None',
    secret: process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 10)}...` : 'Not set'
  });
  next();
});

// Mount all route handlers
app.use("/api/auth", authRoutes); // Authentication endpoints
app.use("/api/fuel", fuelRoutes); // Fuel price endpoints
app.use("/api/stations", stationRoutes); // Gas station endpoints
app.use('/api/price-history', priceHistoryRoutes); // Price history endpoints
app.use('/api/leaderboard', leaderboardRoutes); // Leaderboard endpoints

// Debug endpoint to check server status and available routes
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'Server is running',
    routes: {
      auth: ['/api/auth/login', '/api/auth/register'],
      stations: [
        '/api/stations/nearby',
        '/api/stations/starred',
        '/api/stations/star',
        '/api/stations/star/:stationId'
      ],
      fuel: ['/api/fuel/prices'],
      leaderboard: ['/api/leaderboard']
    }
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connect to the database
connectDB();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log('\nAvailable routes:');
  console.log('  GET    /api/auth/verify     - Verify token');
  console.log('  GET    /api/stations/starred - Get starred stations');
  console.log('  POST   /api/stations/star    - Star a station');
  console.log('  DELETE /api/stations/star/:id - Unstar a station');
  console.log('  GET    /api/stations/nearby  - Get nearby stations');
  console.log('  GET    /api/leaderboard     - Get user leaderboard');
});
