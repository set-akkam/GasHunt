import Station from "../models/Station.js";
import FuelPrice from "../models/FuelPrice.js";
import mongoose from "mongoose";

// Get or create a station
export const getOrCreateStation = async (stationData) => {
  try {
    let station = await Station.findOne({ stationid: stationData.stationid });
    
    if (!station) {
      station = await Station.create({
        stationid: stationData.stationid,
        name: stationData.name,
        latitude: stationData.latitude,
        longitude: stationData.longitude,
        address: stationData.address,
        services: stationData.services,
        opening_hours: stationData.opening_hours,
        link: stationData.link,
        phone: stationData.phone,
        google_maps: stationData.google_maps
      });
    }
    
    return station;
  } catch (error) {
    console.error('Error in getOrCreateStation:', error);
    throw error;
  }
};

// Get station by ID with latest prices
export const getStation = async (req, res) => {
  try {
    const { stationid } = req.params;
    
    // Validate stationid
    if (!stationid || isNaN(parseInt(stationid, 10))) {
      return res.status(400).json({ message: "Invalid station ID" });
    }

    const station = await Station.findOne({ stationid: parseInt(stationid, 10) });
    
    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    // Get latest prices for each fuel type
    const latestPrices = await FuelPrice.aggregate([
      { $match: { station: station._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$fuelType",
          price: { $first: "$price" },
          updatedAt: { $first: "$createdAt" }
        }
      }
    ]);

    // Format response to match frontend expectations
    const response = {
      _id: station._id,
      stationid: station.stationid,
      name: station.name,
      station: station.station || '',
      latitude: station.latitude,
      longitude: station.longitude,
      coordinates: station.coordinates,
      address: station.address,
      link: station.link || '',
      phone: station.phone || '',
      google_maps: station.google_maps || '',
      opening_hours: station.opening_hours || {},
      services: station.services || [],
      prices: Object.fromEntries(
        latestPrices.map(({ _id, price, updatedAt }) => [
          _id,
          { price, updatedAt }
        ])
      ),
      createdAt: station.createdAt,
      updatedAt: station.updatedAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ message: "Error retrieving station" });
  }
};

// Get stations near a location
export const getNearbyStations = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, bounds } = req.query; // radius in meters, default 5km
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    console.log('\n=== Nearby Stations Request ===');
    console.log('Query parameters:', { lat, lng, radius, bounds });

    // First, let's check if we have any stations in the database
    const totalStations = await Station.countDocuments();
    console.log('Total stations in database:', totalStations);

    // Parse bounds if provided
    let boundingBox = null;
    if (bounds) {
      try {
        // Format: north,east,south,west
        const [north, east, south, west] = bounds.split(',').map(parseFloat);
        boundingBox = {
          north, east, south, west
        };
        console.log('Using viewport bounds:', boundingBox);
      } catch (error) {
        console.warn('Invalid bounds format, ignoring:', bounds);
      }
    }

    // Construct the geoNear stage
    const geoNearStage = {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        distanceField: "distance",
        maxDistance: parseInt(radius),
        spherical: true,
        key: "coordinates"
      }
    };

    // Add additional filter for viewport bounds if provided
    let matchStage = null;
    if (boundingBox) {
      matchStage = {
        $match: {
          "coordinates.0": { $gte: boundingBox.west, $lte: boundingBox.east },
          "coordinates.1": { $gte: boundingBox.south, $lte: boundingBox.north }
        }
      };
    }

    // Construct the aggregation pipeline
    const pipeline = [
      geoNearStage,
      ...(matchStage ? [matchStage] : []),
      {
        $lookup: {
          from: "fuelprices",
          let: { stationId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$station", "$$stationId"] }
              }
            },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: "$fuelType",
                price: { $first: "$price" },
                updatedAt: { $first: "$createdAt" }
              }
            }
          ],
          as: "prices"
        }
      },
      {
        $addFields: {
          prices: {
            $arrayToObject: {
              $map: {
                input: "$prices",
                as: "price",
                in: {
                  k: "$$price._id",
                  v: {
                    price: "$$price.price",
                    updatedAt: "$$price.updatedAt"
                  }
                }
              }
            }
          }
        }
      }
    ];

    console.log('\nExecuting aggregation pipeline...');
    const stations = await Station.aggregate(pipeline);
    
    console.log(`\nFound ${stations.length} stations`);
    if (stations.length === 0) {
      console.log('No stations found within', radius, 'meters of', { lat, lng });
      
      // Let's find the closest station to help debug
      const closestStation = await Station.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            distanceField: "distance",
            spherical: true,
            key: "coordinates"
          }
        },
        { $limit: 1 }
      ]);
      
      if (closestStation.length > 0) {
        console.log('\nClosest station:', {
          name: closestStation[0].name,
          distance: closestStation[0].distance,
          location: closestStation[0].location,
          coordinates: closestStation[0].coordinates
        });
      }
    } else {
      console.log('\nFirst station found:', {
        name: stations[0].name,
        distance: stations[0].distance,
        location: stations[0].location,
        coordinates: stations[0].coordinates
      });
    }

    res.json(stations);
  } catch (error) {
    console.error('\nError in getNearbyStations:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: "Error retrieving nearby stations",
      error: error.message 
    });
  }
};

// Sync stations from external source
export const syncStations = async (req, res) => {
  try {
    const { stations } = req.body;

    if (!Array.isArray(stations)) {
      return res.status(400).json({ message: 'stations must be an array' });
    }

    const operations = stations.map(station => ({
      updateOne: {
        filter: { stationid: station.stationid },
        update: {
          $set: {
            stationid: station.stationid,
            name: station.name,
            latitude: station.latitude,
            longitude: station.longitude,
            address: station.address,
            services: station.services,
            opening_hours: station.opening_hours,
            link: station.link,
            phone: station.phone,
            google_maps: station.google_maps
          }
        },
        upsert: true
      }
    }));

    const result = await Station.bulkWrite(operations);
    res.status(200).json({
      message: 'Stations synchronized successfully',
      modified: result.modifiedCount,
      upserted: result.upsertedCount
    });
  } catch (error) {
    console.error('Error syncing stations:', error);
    res.status(500).json({ message: 'Failed to sync stations' });
  }
}; 