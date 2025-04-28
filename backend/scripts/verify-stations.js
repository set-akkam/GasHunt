import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

async function verifyStations() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const stations = db.collection('stations');

    // Get total count
    const totalCount = await stations.countDocuments();
    console.log(`Total stations in database: ${totalCount}`);

    // Check indexes
    const indexes = await stations.indexes();
    console.log('\nIndexes:', JSON.stringify(indexes, null, 2));

    // Get all stations
    const allStations = await stations.find({}).toArray();
    console.log('\nAll stations:', JSON.stringify(allStations, null, 2));

    // Test geospatial query
    const dublinCenter = [-6.26031, 53.349805]; // [longitude, latitude]
    const nearbyStations = await stations.find({
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: dublinCenter
          },
          $maxDistance: 5000
        }
      }
    }).toArray();

    console.log('\nStations near Dublin center:', nearbyStations.length);
    console.log('Nearby stations:', JSON.stringify(nearbyStations, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyStations(); 