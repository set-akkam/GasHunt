import User from '../models/User.js';

// Award point for new submission
export const awardSubmissionPoint = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { points: 1 }
    });
  } catch (error) {
    console.error('Error awarding submission point:', error);
    throw error;
  }
};

// Award point for receiving an upvote
export const awardUpvotePoint = async (submissionId) => {
  try {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }
    await User.findByIdAndUpdate(submission.userId, {
      $inc: { points: 1 }
    });
  } catch (error) {
    console.error('Error awarding upvote point:', error);
    throw error;
  }
};

// Award point for successful downvote
export const awardDownvotePoint = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { points: 1 }
    });
  } catch (error) {
    console.error('Error awarding downvote point:', error);
    throw error;
  }
}; 