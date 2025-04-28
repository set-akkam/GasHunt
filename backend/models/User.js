import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function () { return !this.googleId; } }, // Required only if not using Google Auth
    googleId: { type: String, sparse: true, unique: true }, // Google Authentication Field
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    points: { type: Number, default: 0 },
    submissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission'
    }]
  },
  { timestamps: true }
);

// Hash password before saving (only if password is provided)
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Generate password reset token
UserSchema.methods.generatePasswordResetToken = function () {
  this.resetToken = crypto.randomBytes(20).toString("hex");
  this.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
};

export default mongoose.model("User", UserSchema);
