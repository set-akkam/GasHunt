"use client";

import React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "../animations/variants";
import Image from "next/image";

interface User {
  _id: string;
  name: string;
  points: number;
  rank: number;
  email?: string;  // Optional since we'll use it for avatar generation
  avatarUrl?: string;  // Optional since it's generated after fetching
}

const fetchLeaderboard = async (): Promise<User[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/leaderboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Leaderboard fetch failed:', await response.text());
      throw new Error('Failed to fetch leaderboard');
    }
    const data = await response.json();
    console.log('Raw leaderboard data:', data); // Debug log
    
    // Add avatar URLs to each user
    const usersWithAvatars = data.map((user: User) => {
      const seed = user.email || user.name;
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
      console.log(`Generated avatar for ${user.name}:`, avatarUrl); // Debug log
      return {
        ...user,
        avatarUrl
      };
    });
    
    return usersWithAvatars;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

export default function Leaderboard(): React.ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(10); // Number of users to display

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await fetchLeaderboard();
        setUsers(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLeaderboard();
    // Refresh leaderboard every 60 seconds
    const interval = setInterval(loadLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  // Function to load more users
  const loadMore = () => {
    setDisplayCount(prev => prev + 10);
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          scale: "scale-110",
          badge: "🏆",
          bgColor: "bg-gradient-to-br from-yellow-300 to-yellow-500",
          textColor: "text-black",
          borderColor: "border-yellow-600"
        };
      case 2:
        return {
          scale: "scale-105",
          badge: "🥈",
          bgColor: "bg-gradient-to-br from-gray-300 to-gray-400",
          textColor: "text-black",
          borderColor: "border-gray-500"
        };
      case 3:
        return {
          scale: "scale-100",
          badge: "🥉",
          bgColor: "bg-gradient-to-br from-amber-600 to-amber-700",
          textColor: "text-white",
          borderColor: "border-amber-800"
        };
      default:
        return {
          scale: "scale-95",
          badge: "🎯",
          bgColor: "bg-[#1c7b47]",
          textColor: "text-white",
          borderColor: "border-[#25a55f]"
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-[#1c7b47] p-8 flex items-center justify-center">
        <div className="text-white text-2xl">Loading leaderboard...</div>
      </div>
    );
  }

  // Get the users to display based on the displayCount
  const displayedUsers = users.slice(0, displayCount);
  const hasMoreUsers = users.length > displayCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-[#1c7b47] p-8">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={landingStaggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          variants={fadeInFromBottom}
          custom={0}
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">
            Leaderboard
          </h1>
          <p className="text-xl md:text-2xl text-gray-300">
            Top Contributors
          </p>
        </motion.div>

        {/* Leaderboard List */}
        <div className="space-y-4">
          {displayedUsers.map((user, index) => {
            const style = getRankStyle(user.rank);
            return (
              <motion.div
                key={user._id}
                variants={fadeInFromBottom}
                custom={index * 0.1 + 0.5}
                className={`${style.bgColor} ${style.scale} border-2 ${
                  style.borderColor
                } rounded-xl p-4 transform transition-all duration-300 hover:translate-x-2`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank and Badge */}
                  <div className={`text-2xl font-bold ${style.textColor} min-w-[2.5rem]`}>
                    <span className="mr-2">{user.rank}</span>
                    <span>{style.badge}</span>
                  </div>

                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-opacity-50" style={{ backgroundColor: '#ffffff' }}>
                    <Image
                      src={user.avatarUrl || `/default-avatar.svg`}
                      alt={`${user.name}'s avatar`}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      priority
                      unoptimized
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-grow">
                    <h3 className={`text-xl font-bold ${style.textColor}`}>
                      {user.name}
                    </h3>
                    <p className={`${style.textColor} opacity-75`}>
                      Active Contributor
                    </p>
                  </div>

                  {/* Points */}
                  <div className={`text-right ${style.textColor}`}>
                    <div className="text-2xl font-bold">{user.points}</div>
                    <div className="text-sm opacity-75">points</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Show More Button */}
        {hasMoreUsers && (
          <motion.div
            className="text-center mt-8"
            variants={fadeInFromBottom}
            custom={displayedUsers.length * 0.1 + 1}
          >
            <button
              onClick={loadMore}
              className="bg-gradient-to-r from-[#1c7b47] to-[#25a55f] hover:from-[#25a55f] hover:to-[#2bc26f] text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(37,165,95,0.5)] focus:outline-none focus:ring-2 focus:ring-[#25a55f] focus:ring-opacity-50 border-2 border-[#2bc26f] flex items-center justify-center space-x-2 group"
            >
              <span>Show More</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 transition-transform duration-300 transform group-hover:translate-y-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Footer Section */}
        <motion.div
          className="text-center mt-12"
          variants={fadeInFromBottom}
          custom={displayedUsers.length * 0.1 + (hasMoreUsers ? 2 : 1)}
        >
          <p className="text-gray-300 text-lg">
            Keep contributing to climb the ranks! 🚀
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
