"use client";

import { FaMoneyBillWave, FaTrash, FaThumbsUp, FaThumbsDown, FaInfoCircle } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import toast from 'react-hot-toast';

interface GroupedPriceUpdate {
  submissionId: string;
  submittedBy: {
    name: string;
    _id: string;
  };
  createdAt: string;
  submissionVoteScore: number;
  submissionVotes?: Array<{
    user: string;
    value: number;
  }>;
  updates: {
    _id: string;
    fuelType: string;
    price: number;
    submissionVoteScore: number;
  }[];
  isInvalidated: boolean;
}

interface RecentPriceUpdatesProps {
  groupedUpdates: GroupedPriceUpdate[];
  user: any;
  handleDeleteSubmission: (submissionId: string) => Promise<void>;
  handleVote: (submissionId: string, value: number, submittedById: string) => Promise<void>;
  userVotes: Record<string, number>;
}

export default function RecentPriceUpdates({
  groupedUpdates,
  user,
  handleDeleteSubmission,
  handleVote,
  userVotes
}: RecentPriceUpdatesProps) {
  const renderVoteButtons = (group: GroupedPriceUpdate) => {
    const isOwnSubmission = user?._id === group.submittedBy._id;
    const currentVote = userVotes[group.submissionId];
    const upvoteActive = currentVote === 1;
    const downvoteActive = currentVote === -1;
    const voteScore = group.submissionVoteScore || 0;

    return (
      <div className="flex items-center space-x-2">
        <button
          data-tooltip-id={`vote-tooltip-${group.submissionId}`}
          data-tooltip-content={isOwnSubmission ? "You cannot vote on your own submission" : "Upvote this price update"}
          onClick={() => handleVote(group.submissionId, 1, group.submittedBy._id)}
          className={`p-2 rounded-full transition-colors ${
            isOwnSubmission 
              ? 'opacity-50 cursor-not-allowed bg-gray-200' 
              : upvoteActive
                ? 'bg-green-500 text-white'
                : 'hover:bg-green-100'
          }`}
          disabled={isOwnSubmission}
        >
          <FaThumbsUp className={upvoteActive ? 'text-white' : 'text-green-600'} />
        </button>
        
        <span className="font-bold text-lg min-w-[24px] text-center">
          {voteScore}
        </span>
        
        <button
          data-tooltip-id={`vote-tooltip-${group.submissionId}`}
          data-tooltip-content={isOwnSubmission ? "You cannot vote on your own submission" : "Downvote this price update"}
          onClick={() => handleVote(group.submissionId, -1, group.submittedBy._id)}
          className={`p-2 rounded-full transition-colors ${
            isOwnSubmission 
              ? 'opacity-50 cursor-not-allowed bg-gray-200' 
              : downvoteActive
                ? 'bg-red-500 text-white'
                : 'hover:bg-red-100'
          }`}
          disabled={isOwnSubmission}
        >
          <FaThumbsDown className={downvoteActive ? 'text-white' : 'text-red-600'} />
        </button>
        
        <Tooltip id={`vote-tooltip-${group.submissionId}`} />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FaMoneyBillWave className="text-green-500" />
        Recent Price Updates
      </h2>

      <div className="space-y-4">
        {groupedUpdates.map((group) => {
          const updateTime = new Date(group.createdAt);
          const now = new Date();
          const hoursDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
          const timeStatusColor = hoursDiff > 24 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200';
          
          return (
            <div key={group.submissionId} className={`${timeStatusColor} border rounded-xl p-4 sm:p-6 shadow-md`}>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {group.updates.map((update) => {
                      const fuelTypeColors = {
                        PETROL: 'bg-green-100 text-green-800',
                        DIESEL: 'bg-blue-100 text-blue-800',
                        PETROL_PREMIUM: 'bg-green-200 text-green-900',
                        DIESEL_PREMIUM: 'bg-blue-200 text-blue-900'
                      };
                      const colorClass = fuelTypeColors[update.fuelType as keyof typeof fuelTypeColors] || 'bg-gray-100 text-gray-800';
                      
                      return (
                        <div
                          key={update._id}
                          className={`flex items-center ${colorClass} rounded-lg px-3 py-2`}
                        >
                          <span className="text-sm font-medium mr-2">
                            {update.fuelType.split('_').join(' ')}:
                          </span>
                          <span className="text-base font-bold">
                            €{update.price.toFixed(3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-sm">
                    <span className={hoursDiff > 24 ? 'text-red-600' : 'text-green-600'}>
                      Updated {hoursDiff > 24 ? `${Math.floor(hoursDiff)} hours ago` : 'recently'}
                    </span>
                    <span className="text-gray-500"> by {group.submittedBy.name} • {new Date(group.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {renderVoteButtons(group)}
                  {user?._id === group.submittedBy._id && (
                    <button
                      onClick={() => handleDeleteSubmission(group.submissionId)}
                      className="p-2 hover:bg-red-100 rounded-full transition-colors"
                      title="Delete submission"
                    >
                      <FaTrash className="text-red-500 w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              {hoursDiff > 24 && (
                <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2">
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <FaInfoCircle className="flex-shrink-0" />
                    {user?._id === group.submittedBy._id ? (
                      <span>
                        This is your submission from {Math.floor(hoursDiff)} hours ago. Please delete it if the prices have changed to help keep information up-to-date.
                      </span>
                    ) : (
                      <span>
                        This price is more than {Math.floor(hoursDiff)} hours old. If you know it's outdated, please help by downvoting.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 