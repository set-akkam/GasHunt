import User from '../models/User.js';
import Submission from '../models/Submission.js';

const POINTS_CONFIG = {
  UPVOTE_RECEIVED: 1,
  REMOVAL_PARTICIPATION: 1,
  SUBMISSION_CREATED: 2
};

// Update points when user receives an upvote
export const handleUpvotePoints = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        points: POINTS_CONFIG.UPVOTE_RECEIVED,
        'stats.upvotesReceived': 1
      }
    });
  } catch (error) {
    console.error('Error updating upvote points:', error);
    throw error;
  }
};

// Update points when user participates in removal
export const handleRemovalPoints = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        points: POINTS_CONFIG.REMOVAL_PARTICIPATION,
        'stats.removalParticipations': 1
      }
    });
  } catch (error) {
    console.error('Error updating removal points:', error);
    throw error;
  }
};

// Update points when user creates a submission
export const handleSubmissionPoints = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        points: POINTS_CONFIG.SUBMISSION_CREATED,
        'stats.submissionsCount': 1
      }
    });
  } catch (error) {
    console.error('Error updating submission points:', error);
    throw error;
  }
};

// Get user's current points and stats
export const getUserPoints = async (userId) => {
  try {
    const user = await User.findById(userId).select('points stats');
    return user;
  } catch (error) {
    console.error('Error fetching user points:', error);
    throw error;
  }
}; 