import User from '../models/User.js';

// Get leaderboard data
export const getLeaderboard = async (req, res) => {
  try {
    console.log('📊 Fetching leaderboard data...');
    
    const leaderboard = await User
      .find({})
      .select('name points email')
      .sort({ points: -1 })
      .limit(50);
    
    console.log(`Found ${leaderboard.length} users for leaderboard`);
    
    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));
    
    console.log('Leaderboard data prepared successfully');
    res.status(200).json(rankedLeaderboard);
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ 
      message: 'Error fetching leaderboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 