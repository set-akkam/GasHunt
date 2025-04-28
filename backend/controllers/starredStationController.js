import StarredStation from "../models/StarredStation.js";
import FuelPrice from "../models/FuelPrice.js";
import Station from "../models/Station.js";

// Get all starred stations for a user
export const getStarredStations = async (req, res) => {
  try {
    const userId = req.user.id;
    const starredStations = await StarredStation.find({ userId })
      .sort({ starredAt: -1 });

    // Get station IDs to fetch prices
    const stationIds = starredStations.map(s => s.stationid);
    
    // Get all stations to get their MongoDB _ids
    const stations = await Station.find({ stationid: { $in: stationIds } });
    const stationIdMap = new Map(stations.map(s => [s.stationid, s._id]));

    // Get latest prices for all stations
    const latestPrices = await FuelPrice.aggregate([
      {
        $match: {
          station: { $in: Array.from(stationIdMap.values()) }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            station: "$station",
            fuelType: "$fuelType"
          },
          price: { $first: "$price" },
          updatedAt: { $first: "$createdAt" }
        }
      }
    ]);

    // Create a map of prices by station ID
    const pricesByStation = new Map();
    latestPrices.forEach(price => {
      const station = stations.find(s => s._id.equals(price._id.station));
      if (station) {
        if (!pricesByStation.has(station.stationid)) {
          pricesByStation.set(station.stationid, {});
        }
        pricesByStation.get(station.stationid)[price._id.fuelType] = {
          price: price.price,
          updatedAt: price.updatedAt
        };
      }
    });

    // Map starred stations with their prices
    const response = starredStations.map(s => ({
      stationid: s.stationid,
      stationName: s.stationName,
      latitude: s.latitude,
      longitude: s.longitude,
      starredAt: s.starredAt,
      prices: pricesByStation.get(s.stationid) || {}
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching starred stations:', error);
    res.status(500).json({ message: 'Failed to fetch starred stations' });
  }
};

// Star a station
export const starStation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stationid, stationName, latitude, longitude } = req.body;

    // Check if user has already starred 5 stations
    const starredCount = await StarredStation.countDocuments({ userId });
    if (starredCount >= 5) {
      return res.status(400).json({ 
        message: 'You can only star up to 5 stations. Please unstar a station before adding a new one.' 
      });
    }

    // Check if station is already starred
    const existingStarred = await StarredStation.findOne({ userId, stationid });
    if (existingStarred) {
      return res.status(400).json({ message: 'Station is already starred' });
    }

    const starredStation = await StarredStation.create({
      userId,
      stationid,
      stationName,
      latitude,
      longitude,
      starredAt: new Date()
    });

    res.status(201).json(starredStation);
  } catch (error) {
    console.error('Error starring station:', error);
    res.status(500).json({ message: 'Failed to star station' });
  }
};

// Unstar a station
export const unstarStation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stationid } = req.params;

    console.log('Attempting to unstar station:', { stationid, userId });

    const result = await StarredStation.findOneAndDelete({ userId, stationid: parseInt(stationid, 10) });

    if (!result) {
      return res.status(404).json({ message: 'Station was not starred' });
    }

    res.json({ message: 'Station unstarred successfully' });
  } catch (error) {
    console.error('Error unstarring station:', error);
    res.status(500).json({ message: 'Failed to unstar station' });
  }
};

// Check if a station is starred
export const isStationStarred = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stationid } = req.params;

    console.log('Checking star status:', { stationid, userId });

    const starredStation = await StarredStation.findOne({ userId, stationid: parseInt(stationid, 10) });

    res.json({
      isStarred: !!starredStation,
      starredAt: starredStation?.starredAt,
      latitude: starredStation?.latitude,
      longitude: starredStation?.longitude
    });
  } catch (error) {
    console.error('Error checking star status:', error);
    res.status(500).json({ message: 'Failed to check star status' });
  }
}; 