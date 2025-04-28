import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

// ✅ Setup Nodemailer Transporter (Using .env SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Generate JWT Token - Standardized for all auth methods
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      _id: user._id, // Include both for compatibility
      email: user.email,
      name: user.name
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: "30d" }
  );
};

// ✅ User Registration
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Error registering user" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.generatePasswordResetToken();
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${user.resetToken}`;

    await transporter.sendMail({
      from: `"Fuel Tracker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.json({ message: "Password reset email sent!" });
  } catch (error) {
    res.status(500).json({ message: "Error sending reset email" });
  }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
  
    try {
      // ✅ Find user by reset token and check if it's still valid
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
      });
  
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
  
      // Set the new password (it will be hashed by the pre-save middleware)
      user.password = newPassword;
  
      // ✅ Remove reset token after successful reset
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
  
      res.json({ message: "Password reset successful!" });
    } catch (error) {
      res.status(500).json({ message: "Error resetting password" });
    }
  };

// ✅ Google Authentication
export const handleGoogleAuth = async (req, res) => {
  const { name, email, googleId } = req.body;
  
  try {
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        name,
        email,
        googleId,
        password: crypto.randomBytes(32).toString('hex')
      });
      await user.save();
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};
  