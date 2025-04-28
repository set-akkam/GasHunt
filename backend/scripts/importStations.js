import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Station from '../models/Station.js';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Default values for required fields
const DEFAULT_VALUES = {
  opening_hours: {
    Monday: "24/7",
    Tuesday: "24/7",
    Wednesday: "24/7",
    Thursday: "24/7",
    Friday: "24/7",
    Saturday: "24/7",
    Sunday: "24/7"
  },
  phone: "Not available",
  google_maps: "Not available",
  link: "Not available",
  services: [],
  address: "Not available"
};

// Validation functions
const validateStation = (station) => {
  const errors = [];

  // Required fields
  if (!station.stationid) errors.push('Missing stationid');
  if (!station.name) errors.push('Missing station name');
  
  // Validate coordinates
  if (station.latitude) {
    const lat = parseFloat(station.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Invalid latitude value');
    }
  } else {
    errors.push('Missing latitude');
  }
  
  if (station.longitude) {
    const lng = parseFloat(station.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Invalid longitude value');
    }
  } else {
    errors.push('Missing longitude');
  }

  return errors;
};

// Add missing required fields
const addRequiredFields = (station) => {
  return {
    ...DEFAULT_VALUES,
    ...station,
    opening_hours: {
      ...DEFAULT_VALUES.opening_hours,
      ...(station.opening_hours || {})
    }
  };
};

async function importStations() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Clear existing stations
    console.log('\nClearing existing stations...');
    await Station.deleteMany({});
    console.log('Existing stations cleared');

    // Read the stations data file
    console.log('\nReading stations data file...');
    const stationsData = await fs.readFile(
      path.join(__dirname, '..', 'data', 'stations.json'),
      'utf8'
    );
    const stations = JSON.parse(stationsData);

    // Validate and prepare stations for import
    console.log('\nValidating stations...');
    const validStations = [];
    const invalidStations = [];

    for (const station of stations) {
      const errors = validateStation(station);
      if (errors.length === 0) {
        // Add required fields and coordinates
        const completeStation = addRequiredFields(station);
        validStations.push({
          ...completeStation,
          coordinates: {
            type: 'Point',
            coordinates: [parseFloat(station.longitude), parseFloat(station.latitude)]
          }
        });
      } else {
        invalidStations.push({ station, errors });
      }
    }

    if (invalidStations.length > 0) {
      console.log('\nWarning: Found invalid stations:');
      invalidStations.forEach(({ station, errors }) => {
        console.log(`- Station ${station.name || 'Unknown'}: ${errors.join(', ')}`);
      });
    }

    // Import valid stations
    console.log(`\nImporting ${validStations.length} stations...`);
    const result = await Station.insertMany(validStations);
    console.log(`Successfully imported ${result.length} stations`);

    // Verify the import
    const count = await Station.countDocuments();
    console.log(`\nVerification: ${count} stations in database`);

    // Sample verification
    const sample = await Station.findOne();
    console.log('\nSample station:', {
      stationid: sample.stationid,
      name: sample.name,
      station: sample.station,
      latitude: sample.latitude,
      longitude: sample.longitude,
      coordinates: sample.coordinates,
      opening_hours: sample.opening_hours
    });

    // Create geospatial index
    console.log('\nEnsuring geospatial index...');
    await Station.collection.createIndex({ coordinates: '2dsphere' });
    console.log('Geospatial index created/verified');

  } catch (error) {
    console.error('Error importing stations:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the import
importStations().catch(console.error); 