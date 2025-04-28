import express from "express";
import { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  handleGoogleAuth // ✅ Ensure this is imported
} from "../controllers/authController.js";
import { updateUsername, updatePassword } from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ✅ Ensure `handleGoogleAuth` exists in authController.js
router.post("/google", handleGoogleAuth);

// User update routes
router.put("/update-username", authenticateToken, updateUsername);
router.put("/update-password", authenticateToken, updatePassword);

// Get current user
router.get("/user", authenticateToken, async (req, res) => {
  try {
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

// Protected routes
router.get('/verify', authenticateToken, (req, res) => {
  // If we get here, the token is valid
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
