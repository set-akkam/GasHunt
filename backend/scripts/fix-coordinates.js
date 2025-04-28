import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

async function fixCoordinates() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const stations = db.collection('stations');

    // Get all stations
    const allStations = await stations.find({}).toArray();
    console.log(`Found ${allStations.length} stations to process`);

    // Update each station
    for (const station of allStations) {
      if (station.location && station.location.lat && station.location.lng) {
        const coordinates = {
          type: "Point",
          coordinates: [station.location.lng, station.location.lat]
        };

        await stations.updateOne(
          { _id: station._id },
          { 
            $set: { coordinates }
          }
        );
        console.log(`Updated coordinates for station: ${station.name}`);
      } else {
        console.log(`Skipping station ${station.name} - missing location data`);
      }
    }

    // Ensure the correct index exists
    await stations.dropIndex("location_2dsphere");
    await stations.createIndex({ coordinates: "2dsphere" });
    console.log('Updated geospatial index');

    // Verify the updates
    const verifyStations = await stations.find({
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [-6.26031, 53.349805] // Dublin center
          },
          $maxDistance: 5000
        }
      }
    }).toArray();

    console.log(`\nFound ${verifyStations.length} stations near Dublin center`);
    console.log('Stations:', verifyStations.map(s => ({
      name: s.name,
      coordinates: s.coordinates,
      location: s.location
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixCoordinates(); 