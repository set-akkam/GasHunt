import mongoose from "mongoose";

const fuelPriceSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  station: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Station', 
    required: true 
  },
  fuelType: { type: String, required: true },
  price: { type: Number, required: true },
  submittedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  submissionVoteScore: { type: Number, default: 0 },
  submissionVotes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: { type: Number, enum: [1, -1] },
    votedAt: { type: Date, default: Date.now }
  }],
  isInvalidated: { type: Boolean, default: false },
  invalidatedAt: { type: Date },
  voteScore: { type: Number, default: 0 },
  votes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: { type: Number, enum: [1, -1] },
    votedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Create indexes for faster queries
fuelPriceSchema.index({ station: 1, createdAt: -1 });
fuelPriceSchema.index({ submissionId: 1 });
fuelPriceSchema.index({ isInvalidated: 1 });

const FuelPrice = mongoose.model('FuelPrice', fuelPriceSchema);

export default FuelPrice;
