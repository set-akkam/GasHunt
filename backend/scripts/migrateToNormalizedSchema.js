import mongoose from 'mongoose';
import FuelPrice from '../models/FuelPrice.js';
import Station from '../models/Station.js';
import StarredStation from '../models/StarredStation.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all unique stations from fuel prices
    const uniqueStations = await FuelPrice.aggregate([
      {
        $group: {
          _id: "$stationId",
          name: { $first: "$stationName" },
          location: { $first: "$location" }
        }
      }
    ]);

    console.log(`Found ${uniqueStations.length} unique stations to migrate`);

    // Create stations and build a mapping of old stationId to new _id
    const stationMapping = {};
    for (const station of uniqueStations) {
      const newStation = await Station.create({
        stationId: station._id,
        name: station.name,
        location: station.location || { lat: 0, lng: 0 }
      });
      stationMapping[station._id] = newStation._id;
      console.log(`Migrated station: ${station.name}`);
    }

    // Update all fuel prices to reference the new station IDs
    const fuelPrices = await FuelPrice.find({});
    console.log(`Found ${fuelPrices.length} fuel prices to update`);

    for (const price of fuelPrices) {
      await FuelPrice.updateOne(
        { _id: price._id },
        { 
          $set: { station: stationMapping[price.stationId] },
          $unset: { stationId: "", stationName: "", location: "" }
        }
      );
    }

    // Update starred stations
    const starredStations = await StarredStation.find({});
    console.log(`Found ${starredStations.length} starred stations to update`);

    for (const starred of starredStations) {
      await StarredStation.updateOne(
        { _id: starred._id },
        {
          $set: { station: stationMapping[starred.stationId] },
          $unset: { stationId: "", stationName: "" }
        }
      );
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

migrateData(); 