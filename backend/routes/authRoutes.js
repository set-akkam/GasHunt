/**
 * Authentication Routes
 * Handles all user authentication related endpoints including:
 * - User registration
 * - Login
 * - Password reset
 * - Google authentication
 * - User profile updates
 */

import express from "express";
import { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  handleGoogleAuth
} from "../controllers/authController.js";
import { updateUsername, updatePassword } from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Public authentication routes
router.post("/register", registerUser); // Register new user
router.post("/login", loginUser); // User login
router.post("/forgot-password", forgotPassword); // Request password reset
router.post("/reset-password/:token", resetPassword); // Reset password with token
router.post("/google", handleGoogleAuth); // Google OAuth authentication

// Protected user update routes (require authentication)
router.put("/update-username", authenticateToken, updateUsername); // Update username
router.put("/update-password", authenticateToken, updatePassword); // Update password

// Get current authenticated user's profile
router.get("/user", authenticateToken, async (req, res) => {
  try {
    // Find user by ID and exclude password from response
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Token verification endpoint
router.get('/verify', authenticateToken, (req, res) => {
  // If we reach here, the token is valid
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

export default router;
