import FuelPrice from "../models/FuelPrice.js";
import Station from "../models/Station.js";
import { getOrCreateStation } from "./stationController.js";
import mongoose from "mongoose";
import { awardSubmissionPoint, awardUpvotePoint, awardDownvotePoint } from "./submissionController.js";

// Submit new fuel price
export const submitFuelPrice = async (req, res) => {
  try {
    const { stationid, stationName, location, fuelType, price } = req.body;
    
    if (!stationid || !stationName || !fuelType || !price) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    // Ensure we have a valid user ID
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get or create the station
    const station = await getOrCreateStation({
      stationid,
      name: stationName,
      latitude: location.lat,
      longitude: location.lng
    });

    const submissionId = new mongoose.Types.ObjectId();
    // Create new price update
    const newPrice = await FuelPrice.create({
      submissionId,
      station: station._id,
      fuelType,
      price: Number(price),
      submittedBy: userId,
      voteScore: 0,
      votes: []
    });

    // Populate the submitter's information and station details
    const populatedPrice = await FuelPrice.findById(newPrice._id)
      .populate('submittedBy', 'name')
      .populate('station', 'stationid name');

    res.status(201).json(populatedPrice);
  } catch (error) {
    console.error('Error submitting fuel price:', error);
    res.status(500).json({ 
      message: "Error submitting fuel price",
      error: error.message 
    });
  }
};

export const getFuelPrices = async (req, res) => {
  try {
    const { stationid } = req.query;
    
    if (!stationid) {
      return res.status(400).json({ message: "stationid is required" });
    }

    // First get the station
    let existingStation = await Station.findOne({ stationid: parseInt(stationid) });
    if (!existingStation) {
      return res.json([]); // Return empty array if station not found
    }

    const prices = await FuelPrice.aggregate([
      {
        $match: { 
          station: existingStation._id,
          isInvalidated: { $ne: true } // Exclude invalidated submissions
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$submissionId",
          submittedBy: { $first: "$submittedBy" },
          createdAt: { $first: "$createdAt" },
          submissionVoteScore: { $first: "$submissionVoteScore" },
          submissionVotes: { $first: "$submissionVotes" },
          isInvalidated: { $first: "$isInvalidated" },
          updates: { 
            $push: {
              _id: "$_id",
              fuelType: "$fuelType",
              price: "$price",
              submissionVoteScore: "$submissionVoteScore"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          submissionId: "$_id",
          submittedBy: 1,
          createdAt: 1,
          updates: 1,
          submissionVoteScore: 1,
          submissionVotes: 1,
          isInvalidated: 1
        }
      }
    ]);

    // If no prices found, return empty array instead of error
    if (!prices || prices.length === 0) {
      return res.json([]);
    }

    // Populate submitter information
    const populatedPrices = await FuelPrice.populate(prices, {
      path: 'submittedBy',
      select: 'name'
    });

    res.json(populatedPrices);
  } catch (error) {
    console.error('Error fetching fuel prices:', error);
    res.status(500).json({ message: "Error retrieving fuel prices" });
  }
};

// Vote on a price update
export const votePriceUpdate = async (req, res) => {
  try {
    const { priceId } = req.params;
    const { value } = req.body; // 1 for upvote, -1 for downvote
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (![-1, 1].includes(value)) {
      return res.status(400).json({ message: "Invalid vote value" });
    }

    const priceUpdate = await FuelPrice.findById(priceId);
    if (!priceUpdate) {
      return res.status(404).json({ message: "Price update not found" });
    }

    // Remove existing vote if any
    const existingVoteIndex = priceUpdate.votes.findIndex(
      vote => vote.user.toString() === userId.toString()
    );

    if (existingVoteIndex > -1) {
      // Update existing vote
      priceUpdate.voteScore -= priceUpdate.votes[existingVoteIndex].value;
      priceUpdate.votes[existingVoteIndex].value = value;
    } else {
      // Add new vote
      priceUpdate.votes.push({ user: userId, value });
    }

    // Update vote score
    priceUpdate.voteScore += value;
    await priceUpdate.save();

    res.json(priceUpdate);
  } catch (error) {
    console.error('Error voting on price update:', error);
    res.status(500).json({ message: "Error processing vote" });
  }
};

export const submitFuelPrices = async (req, res) => {
  try {
    const { stationid, stationName, location, updates } = req.body;
    const submissionId = new mongoose.Types.ObjectId();
    
    if (!stationid || !stationName || !updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure we have a valid user ID
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate updates array
    const validUpdates = updates.every(update => 
      update.fuelType && 
      typeof update.price === 'number' && 
      !isNaN(update.price)
    );

    if (!validUpdates) {
      return res.status(400).json({ message: 'Invalid updates data' });
    }

    // Get or create the station
    const station = await getOrCreateStation({
      stationid,
      name: stationName,
      latitude: location.lat,
      longitude: location.lng
    });

    // Create price updates
    const priceUpdates = await Promise.all(updates.map(update => 
      FuelPrice.create({
        submissionId,
        station: station._id,
        fuelType: update.fuelType,
        price: update.price,
        submittedBy: userId,
        voteScore: 0,
        votes: []
      })
    ));

    // Award point for submission
    await awardSubmissionPoint(userId);

    // Populate the submitter's information and station details
    const populatedUpdates = await FuelPrice.find({ submissionId })
      .populate('submittedBy', 'name')
      .populate('station', 'stationid name');

    res.status(201).json(populatedUpdates);
  } catch (error) {
    console.error('Error submitting fuel prices:', error);
    res.status(500).json({ 
      message: "Error submitting fuel prices",
      error: error.message 
    });
  }
};

// Vote on a submission (all prices submitted together)
export const voteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { value } = req.body; // 1 for upvote, -1 for downvote
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (![-1, 1].includes(value)) {
      return res.status(400).json({ message: "Invalid vote value" });
    }

    // Find all price updates in this submission
    const priceUpdates = await FuelPrice.find({ 
      submissionId: new mongoose.Types.ObjectId(submissionId) 
    });

    if (!priceUpdates || priceUpdates.length === 0) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Prevent voting on own submission
    if (priceUpdates[0].submittedBy.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot vote on your own submission" });
    }

    // Check if user has already voted on this submission
    const existingVote = priceUpdates[0].submissionVotes?.find(
      vote => vote.user.toString() === userId.toString()
    );

    if (existingVote) {
      // Update existing vote
      await FuelPrice.updateMany(
        { submissionId: new mongoose.Types.ObjectId(submissionId) },
        {
          $inc: { submissionVoteScore: value - existingVote.value },
          $set: { "submissionVotes.$[vote].value": value }
        },
        {
          arrayFilters: [{ "vote.user": new mongoose.Types.ObjectId(userId) }]
        }
      );
    } else {
      // Add new vote
      await FuelPrice.updateMany(
        { submissionId: new mongoose.Types.ObjectId(submissionId) },
        {
          $inc: { submissionVoteScore: value },
          $push: { 
            submissionVotes: { 
              user: new mongoose.Types.ObjectId(userId), 
              value,
              votedAt: new Date()
            } 
          }
        }
      );

      // Award point for upvote to submission creator
      if (value === 1) {
        await awardUpvotePoint(submissionId);
      }
      
      // If downvote leads to removal (threshold reached), award point to voter
      const updatedSubmission = await FuelPrice.findOne({ 
        submissionId: new mongoose.Types.ObjectId(submissionId) 
      });

      if (value === -1 && updatedSubmission.submissionVoteScore <= -3) {
        await awardDownvotePoint(userId);
        // Mark submission as invalidated
        await FuelPrice.updateMany(
          { submissionId: new mongoose.Types.ObjectId(submissionId) },
          { 
            $set: { 
              isInvalidated: true,
              invalidatedAt: new Date()
            } 
          }
        );
      }
    }

    const updatedPrices = await FuelPrice.find({ 
      submissionId: new mongoose.Types.ObjectId(submissionId) 
    }).populate('submittedBy', 'name');

    res.json(updatedPrices);
  } catch (error) {
    console.error('Error voting on submission:', error);
    res.status(500).json({ 
      message: "Error processing vote",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteFuelPriceSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find all prices with this submissionId
    const prices = await FuelPrice.find({ submissionId });

    // Check if any prices exist
    if (!prices || prices.length === 0) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Check if the user is the one who submitted these prices
    if (prices[0].submittedBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this submission" });
    }

    // Delete all prices with this submissionId
    await FuelPrice.deleteMany({ submissionId });

    res.json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error('Error deleting fuel price submission:', error);
    res.status(500).json({ 
      message: "Error deleting submission",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getRecentFuelPrices = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // Default to 10 updates
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const prices = await FuelPrice.aggregate([
      {
        $match: {
          submittedBy: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$submissionId",
          submittedBy: { $first: "$submittedBy" },
          createdAt: { $first: "$createdAt" },
          stationId: { $first: "$station" },
          submissionVoteScore: { $first: "$submissionVoteScore" },
          submissionVotes: { $first: "$submissionVotes" },
          updates: { 
            $push: {
              _id: "$_id",
              fuelType: "$fuelType",
              price: "$price",
              submissionVoteScore: "$submissionVoteScore"
            }
          }
        }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: "stations",
          localField: "stationId",
          foreignField: "_id",
          as: "station"
        }
      },
      {
        $unwind: "$station"
      },
      {
        $project: {
          _id: 0,
          submissionId: "$_id",
          submittedBy: 1,
          createdAt: 1,
          station: {
            _id: "$station._id",
            name: "$station.name",
            stationid: "$station.stationid"
          },
          updates: 1,
          submissionVoteScore: 1,
          submissionVotes: 1
        }
      }
    ]);

    // If no prices found, return empty array instead of error
    if (!prices || prices.length === 0) {
      return res.json([]);
    }

    // Populate submitter information
    const populatedPrices = await FuelPrice.populate(prices, {
      path: 'submittedBy',
      select: 'name'
    });

    res.json(populatedPrices);
  } catch (error) {
    console.error('Error fetching recent fuel prices:', error);
    res.status(500).json({ message: "Error retrieving recent fuel prices" });
  }
};
  