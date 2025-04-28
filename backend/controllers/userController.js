import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Middleware to get user from token
const getUserFromToken = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Not authenticated');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

// Update username
export const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id; // This comes from the authenticateToken middleware

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ name: username });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Update user's username
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = username;
    await user.save();

    res.json({
      message: 'Username updated successfully',
      user: {
        name: user.name,
      }
    });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ message: 'Error updating username' });
  }
};

// Update password
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id; // This comes from the JWT token
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Set new password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
}; 