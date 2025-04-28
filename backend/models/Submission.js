import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true }, // This will be our submissionId
  stationId: { type: String, required: true },
  stationName: { type: String, required: true },
  submittedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  voteScore: { type: Number, default: 0 },
  votes: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    value: { 
      type: Number, 
      enum: [-1, 1] 
    },
    votedAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, {
  timestamps: true
});

// Create a compound index to ensure a user can only vote once per submission
submissionSchema.index({ "_id": 1, "votes.user": 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema); 