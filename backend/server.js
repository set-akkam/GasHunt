import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; // Import database connection
import authRoutes from "./routes/authRoutes.js"; // Ensure default export
import fuelRoutes from "./routes/fuelRoutes.js"; // Ensure default export
import stationRoutes from "./routes/stationRoutes.js";
import priceHistoryRoutes from './routes/priceHistory.js';
import leaderboardRoutes from './routes/leaderboard.js';
dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('\n🔍 Request:', {
    method: req.method,
    path: req.originalUrl,
    auth: req.headers.authorization ? 'Present' : 'None'
  });
  next();
});

// Token debug middleware for protected routes
app.use('/api/stations/*', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('🔐 Token debug:', {
    hasAuth: !!req.headers.authorization,
    token: token ? `${token.substring(0, 20)}...` : 'None',
    secret: process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 10)}...` : 'Not set'
  });
  next();
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/stations", stationRoutes);
app.use('/api/price-history', priceHistoryRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Debug endpoint to check if server is running
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connect Database
connectDB();

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
