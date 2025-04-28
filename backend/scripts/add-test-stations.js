import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

const TEST_STATIONS = [
  {
    stationId: "test1",
    name: "Test Station Dublin City",
    location: {
      lat: 53.349805,
      lng: -6.26031
    },
    address: "O'Connell Street, Dublin",
    prices: {
      diesel: { price: 1.89, updatedAt: new Date() },
      petrol: { price: 1.99, updatedAt: new Date() }
    },
    services: ["shop", "car_wash", "air"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    stationId: "test2",
    name: "Test Station Phoenix Park",
    location: {
      lat: 53.3568,
      lng: -6.3185
    },
    address: "Phoenix Park, Dublin",
    prices: {
      diesel: { price: 1.85, updatedAt: new Date() },
      petrol: { price: 1.95, updatedAt: new Date() }
    },
    services: ["shop", "ev_charging"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    stationId: "test3",
    name: "Test Station Dublin Airport",
    location: {
      lat: 53.4213,
      lng: -6.2700
    },
    address: "Dublin Airport, Co. Dublin",
    prices: {
      diesel: { price: 1.92, updatedAt: new Date() },
      petrol: { price: 2.02, updatedAt: new Date() }
    },
    services: ["shop", "food", "atm"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function addTestStations() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const stations = db.collection('stations');

    // Create geospatial index if it doesn't exist
    await stations.createIndex({ "location": "2dsphere" });

    // Insert test stations
    for (const station of TEST_STATIONS) {
      // Create GeoJSON location for indexing
      const geoJsonLocation = {
        type: "Point",
        coordinates: [station.location.lng, station.location.lat]
      };

      // Use upsert to avoid duplicates
      await stations.updateOne(
        { stationId: station.stationId },
        { 
          $set: {
            ...station,
            location: station.location, // Store as lat/lng for the schema
            coordinates: geoJsonLocation // Add GeoJSON for geospatial queries
          }
        },
        { upsert: true }
      );
      console.log(`Upserted station: ${station.name}`);
    }

    console.log('All test stations have been added successfully');

    // Verify the stations were added
    const count = await stations.countDocuments({
      stationId: { $in: TEST_STATIONS.map(s => s.stationId) }
    });
    console.log(`Verified ${count} test stations in database`);

    // Test a geospatial query
    const nearbyStations = await stations.find({
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [-6.26031, 53.349805] // Dublin City center
          },
          $maxDistance: 5000
        }
      }
    }).toArray();
    
    console.log(`Found ${nearbyStations.length} stations within 5km of Dublin City center`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

addTestStations(); 