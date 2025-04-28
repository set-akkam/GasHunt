import mongoose from "mongoose";

const starredStationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  stationid: { 
    type: Number,
    required: true,
  },
  stationName: { 
    type: String, 
    required: true 
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  starredAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  // Add collation to ensure case-insensitive comparison
  collation: { locale: 'en', strength: 2 }
});

// Drop all existing indexes except _id
starredStationSchema.indexes().forEach(async index => {
  try {
    await mongoose.connection.collection('starredstations').dropIndex(index.name);
  } catch (error) {
    console.log('Index drop error (can be ignored):', error.message);
  }
});

// Create new index with correct field name
starredStationSchema.index(
  { userId: 1, stationid: 1 }, 
  { 
    unique: true,
    name: 'userId_stationid_unique',
    background: true,
    collation: { locale: 'en', strength: 2 }
  }
);

// Index for quick retrieval
starredStationSchema.index(
  { userId: 1, starredAt: -1 },
  { name: 'userId_starredAt', background: true }
);

const StarredStation = mongoose.model('StarredStation', starredStationSchema);

// Ensure indexes are created
StarredStation.createIndexes().catch(console.error);

export default StarredStation; 