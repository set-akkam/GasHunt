import express from 'express';
import PriceHistory from '../models/PriceHistory.js';
import FuelPrice from '../models/FuelPrice.js';
import Station from '../models/Station.js';

const router = express.Router();

// Record current prices for all stations
router.post('/record', async (req, res) => {
  try {
    console.log('Starting price history recording...');
    
    // Get all current fuel prices with station details
    const currentPrices = await FuelPrice.aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $lookup: {
          from: 'stations',
          localField: 'station',
          foreignField: '_id',
          as: 'stationDetails'
        }
      },
      {
        $unwind: '$stationDetails'
      },
      {
        $group: {
          _id: {
            station: '$stationDetails.stationid', // Use the numeric stationid
            fuelType: '$fuelType'
          },
          price: { $first: '$price' }
        }
      }
    ]);

    console.log('Current prices fetched:', currentPrices);

    if (!currentPrices || currentPrices.length === 0) {
      console.log('No current prices found');
      return res.status(200).json({ message: 'No prices to record' });
    }

    // Create price history records
    const priceHistoryRecords = currentPrices.map(price => ({
      stationId: price._id.station, // This is now the numeric stationid
      fuelType: price._id.fuelType,
      price: price.price,
      recordedAt: new Date()
    }));

    console.log('Creating price history records:', priceHistoryRecords);

    await PriceHistory.insertMany(priceHistoryRecords);
    console.log('Price history records created successfully');

    res.status(200).json({ 
      message: 'Price history recorded successfully',
      count: priceHistoryRecords.length
    });
  } catch (error) {
    console.error('Error in price history recording:', error);
    res.status(500).json({ 
      error: 'Failed to record price history',
      details: error.message
    });
  }
});

// Get price history for a station
router.get('/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const priceHistory = await PriceHistory.find({
      stationId: parseInt(stationId),
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: 1 });

    res.status(200).json(priceHistory);
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch price history',
      details: error.message
    });
  }
});

export default router; 