import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema({
  stationId: { 
    type: Number,
    required: true,
    index: true
  },
  fuelType: { 
    type: String, 
    required: true,
    index: true
  },
  price: { 
    type: Number, 
    required: true 
  },
  recordedAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
});

// Create compound index for efficient querying
priceHistorySchema.index({ stationId: 1, fuelType: 1, recordedAt: -1 });

export default mongoose.model("PriceHistory", priceHistorySchema); 