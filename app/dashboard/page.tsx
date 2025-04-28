'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { useSession } from 'next-auth/react';
import Loading from '@/app/components/Loading';
import { getRecentFuelPrices, deleteFuelPriceSubmission, getStarredStations, unstarStation } from '../utils/api';
import Link from 'next/link';
import { FaGasPump, FaChevronDown, FaChevronUp, FaTrash, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import OnboardingTour from '../components/OnboardingTour';

interface PriceUpdate {
  submissionId: string;
  submittedBy: {
    name: string;
    _id: string;
  };
  createdAt: string;
  station: {
    _id: string;
    name: string;
    stationid: number;
  };
  updates: {
    _id: string;
    fuelType: string;
    price: number;
    submissionVoteScore: number;
  }[];
  submissionVoteScore: number;
}

interface StarredStation {
  _id: string;
  stationid: number;
  stationName: string;
  latitude: number;
  longitude: number;
  starredAt: string;
  prices?: {
    [fuelType: string]: {
      price: number;
      updatedAt: string;
    };
  };
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [recentUpdates, setRecentUpdates] = useState<PriceUpdate[]>([]);
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starredStations, setStarredStations] = useState<StarredStation[]>([]);
  const [starredLoading, setStarredLoading] = useState(true);
  const [unstarringId, setUnstarringId] = useState<number | null>(null);

  useEffect(() => {
    // Only redirect if both auth states are loaded and user is not authenticated
    if (!authLoading && sessionStatus !== 'loading' && (!user || !session)) {
      router.push('/auth/login');
    }
  }, [user, authLoading, session, sessionStatus, router]);

  useEffect(() => {
    if (!authLoading && user?.token) {
      fetchRecentUpdates();
      fetchStarredStations();
    }
  }, [authLoading, user]);

  const fetchRecentUpdates = async () => {
    try {
      const data = await getRecentFuelPrices(5, user?.token); // Pass user token to get user-specific updates
      setRecentUpdates(data);
    } catch (error) {
      console.error('Error fetching recent updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStarredStations = async () => {
    if (!user?.token) return;
    try {
      setStarredLoading(true);
      const stations = await getStarredStations(user.token);
      setStarredStations(stations);
    } catch (error) {
      console.error('Error fetching starred stations:', error);
    } finally {
      setStarredLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!user?.token) {
      router.push('/auth/login');
      return;
    }

    // Show confirmation toast
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <span className="font-medium">Delete Submission</span>
          <span className="text-sm text-gray-600">Are you sure you want to delete this submission? This action cannot be undone.</span>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const deletePromise = (async () => {
                  await deleteFuelPriceSubmission(submissionId, user.token);
                  await fetchRecentUpdates();
                  return 'Submission deleted successfully!';
                })();

                toast.promise(deletePromise, {
                  loading: 'Deleting submission...',
                  success: (message) => message,
                  error: (err) => err.message
                });
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleUnstar = async (stationid: number) => {
    if (!user?.token) {
      toast.error('Please sign in to unstar stations');
      return;
    }

    try {
      setUnstarringId(stationid);
      await unstarStation(stationid, user.token);
      await fetchStarredStations();
    } catch (error) {
      console.error('Error unstarring station:', error);
      toast.error('Failed to unstar station');
    } finally {
      setUnstarringId(null);
    }
  };

  // Show loading state while either auth state is loading
  if (authLoading || sessionStatus === 'loading') {
    return <Loading fullScreen />;
  }

  // Don't render anything if not authenticated
  if (!user || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OnboardingTour />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.name}!
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Track and manage your fuel expenses efficiently.
            </p>
          </div>

          {/* Starred Stations Stats */}
          <div 
            data-tour="starred-stations"
            className="bg-yellow-50 dark:bg-yellow-900 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <FaStar className="text-yellow-500" />
                  Starred Stations
                </h3>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {starredStations.length}/5
                </p>
              </div>
              <Link
                href="/map"
                className="mt-2 sm:mt-0 text-yellow-600 hover:text-yellow-700 dark:text-yellow-300 dark:hover:text-yellow-200 font-medium"
              >
                Find Stations
              </Link>
            </div>

            {starredLoading ? (
              <div className="text-center py-4">Loading starred stations...</div>
            ) : starredStations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {starredStations.map((station) => (
                  <div key={station.stationid} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <Link
                        href={`/station?id=${station.stationid}&name=${encodeURIComponent(station.stationName)}&lat=${station.latitude}&lng=${station.longitude}`}
                        className="flex-1 min-w-0"
                      >
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">{station.stationName}</h3>
                        {station.prices && Object.entries(station.prices).length > 0 ? (
                          <div className="mt-2 space-y-1.5">
                            {Object.entries(station.prices).map(([type, data]) => (
                              <div key={type} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className={`px-2 py-0.5 rounded text-xs sm:text-sm ${
                                  type.toLowerCase().includes('diesel') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {type.split('_').join(' ')}
                                </span>
                                <span className="text-gray-900 font-medium text-sm sm:text-base">€{data.price.toFixed(3)}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(data.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">No recent prices available</p>
                        )}
                      </Link>
                      <button
                        onClick={() => handleUnstar(station.stationid)}
                        className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
                        disabled={unstarringId === station.stationid}
                      >
                        {unstarringId === station.stationid ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <FaStar className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                No starred stations yet. Star your favorite stations to track them here!
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div 
            data-tour="recent-updates"
            className="mt-6 sm:mt-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Recent Price Updates
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
              {loading ? (
                <div className="text-center py-6 sm:py-8">Loading recent updates...</div>
              ) : recentUpdates.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {recentUpdates.map((update) => (
                    <div key={update.submissionId} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow">
                      <div className="cursor-pointer" onClick={() => setExpandedUpdate(expandedUpdate === update.submissionId ? null : update.submissionId)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                              {update.station.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Updated by {update.submittedBy.name} • {new Date(update.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {user && user._id === update.submittedBy._id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubmission(update.submissionId);
                                }}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Delete submission"
                              >
                                <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            )}
                            {expandedUpdate === update.submissionId ? <FaChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <FaChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </div>
                        </div>

                        {expandedUpdate === update.submissionId && (
                          <>
                            <div className="mt-3 sm:mt-4 space-y-2">
                              {update.updates.map((price) => (
                                <div key={price._id} className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs sm:text-sm ${
                                    price.fuelType.toLowerCase().includes('diesel') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {price.fuelType.split('_').join(' ')}
                                  </span>
                                  <span className="font-medium text-sm sm:text-base">€{price.price.toFixed(3)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 sm:mt-4 pl-3 sm:pl-4 border-l-2 border-gray-200">
                              <Link
                                href={`/station?id=${update.station.stationid}&name=${encodeURIComponent(update.station.name)}`}
                                className="text-blue-500 hover:text-blue-600 flex items-center gap-2 text-xs sm:text-sm"
                              >
                                <FaGasPump className="w-3 h-3 sm:w-4 sm:h-4" />
                                View Station Details
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <div className="text-gray-500">
                    <FaGasPump className="inline-block text-3xl sm:text-4xl mb-2" />
                    <p className="text-sm sm:text-base">No recent price updates available.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div 
            data-tour="quick-actions"
            className="mt-6 sm:mt-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                href="/map"
                className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-150 ease-in-out text-center text-sm sm:text-base"
              >
                Find Stations
              </Link>
              <Link
                href="/nearby"
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-150 ease-in-out text-center text-sm sm:text-base"
              >
                Nearby Stations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 