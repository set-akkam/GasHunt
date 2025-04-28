import mongoose from "mongoose";

const stationSchema = new mongoose.Schema({
  stationid: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  station: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: { type: String, required: true },
  link: { type: String, default: '' },
  phone: { type: String, default: '' },
  google_maps: { type: String, default: '' },
  opening_hours: {
    type: {
      Monday: { type: String, required: true },
      Tuesday: { type: String, required: true },
      Wednesday: { type: String, required: true },
      Thursday: { type: String, required: true },
      Friday: { type: String, required: true },
      Saturday: { type: String, required: true },
      Sunday: { type: String, required: true }
    },
    required: true,
    default: {
      Monday: '24 hours',
      Tuesday: '24 hours',
      Wednesday: '24 hours',
      Thursday: '24 hours',
      Friday: '24 hours',
      Saturday: '24 hours',
      Sunday: '24 hours'
    }
  },
  services: { 
    type: [String], 
    required: true,
    default: []
  }
}, { timestamps: true });

// Create indexes for faster queries
stationSchema.index({ stationid: 1 });
stationSchema.index({ coordinates: '2dsphere' });

// Pre-save middleware to ensure coordinates are set from latitude/longitude
stationSchema.pre('save', function(next) {
  if (this.latitude && this.longitude) {
    this.coordinates = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  next();
});

export default mongoose.model("Station", stationSchema); 