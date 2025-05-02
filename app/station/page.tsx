"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { 
  FaGasPump, FaMapMarkerAlt, FaInfoCircle, 
  FaThumbsUp, FaThumbsDown, FaChevronDown, FaChevronUp, 
  FaCamera, FaTrash, FaStar, FaPhone, FaExternalLinkAlt,
  FaClock, FaCog, FaStore, FaCar, FaMoneyBillWave,
  FaHamburger, FaCoffee, FaChargingStation, FaWind,
  FaBroom, FaSignInAlt
} from 'react-icons/fa';
import { getFuelPrices, votePriceUpdate, submitFuelPrice, deleteFuelPriceSubmission, starStation, unstarStation, getStarredStations, verifyToken, getStation, type StationDetails } from '../utils/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import PriceHistoryGraph from '../components/PriceHistoryGraph';
import { Tooltip } from 'react-tooltip';
import ImageCapture from '../components/ImageCapture';
import RecentPriceUpdates from '../components/RecentPriceUpdates';

// Price validation constants for Ireland
const PRICE_VALIDATION = {
  PETROL: {
    MIN: 70.0,
    MAX: 300.0,
  },
  PETROL_PREMIUM: {
    MIN: 70.0,
    MAX: 300.0,
  },
  DIESEL: {
    MIN: 70.0,
    MAX: 300.0,
  },
  DIESEL_PREMIUM: {
    MIN: 70.0,
    MAX: 300.0,
  }
};

interface PriceUpdate {
  _id: string;
  fuelType: string;
  price: number;
  submittedBy: {
    name: string;
    _id: string;
  };
  createdAt: string;
  submissionVoteScore: number;
  submissionId: string;
  submissionVotes?: Array<{
    user: string;
    value: number;
  }>;
}

interface FuelPriceInput {
  fuelType: string;
  price: string;
}

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

interface StationWithPrices {
  latitude: number;
  longitude: number;
  opening_hours: Record<string, string>;
  services: string[];
  google_maps: string;
  link: string;
}

interface StarredStation {
  stationid: number;
}

interface OCRFuelPrice {
  type: string;
  price: string;
}

interface OCRResponse {
  success: boolean;
  text: string;
  fuelPrices: OCRFuelPrice[];
  error?: string;
}

// Add this new function to improve OCR text processing
const processFuelPricesFromOCRText = (text: string): OCRFuelPrice[] => {
  console.log("Processing raw OCR text:", text);
  const extractedPrices: OCRFuelPrice[] = [];
  
  // Looking for patterns like:
  // D followed by price (Diesel)
  // D with milesPLUS followed by price (Diesel Premium)
  // U followed by price (Petrol/Unleaded)
  // U with milesPLUS followed by price (Petrol Premium/Unleaded Premium)
  
  // Get all numbers in the text, including those with trailing decimal points
  // Use a more permissive regex that captures numbers like "203." as well as "195.9"
  const allNumbersRegex = /\d+\.?\d*/g;
  const allNumbers = text.match(allNumbersRegex) || [];
  
  // Normalize the numbers - ensure trailing decimals have a zero
  const normalizedNumbers = allNumbers.map(num => {
    // If number ends with a decimal point, add a zero
    if (num.endsWith('.')) {
      return num + '0';
    }
    return num;
  });
  
  console.log("All normalized numbers found:", normalizedNumbers);
  
  // First, try to find diesel prices with their labels
  const dieselRegex = /D\.?\s*(\d+\.?\d*)/i;
  const dieselMatch = text.match(dieselRegex);
  if (dieselMatch && dieselMatch[1]) {
    // Normalize the price if it ends with a decimal point
    let price = dieselMatch[1];
    if (price.endsWith('.')) {
      price = price + '0';
    }
    extractedPrices.push({ type: 'diesel', price });
    console.log("Found diesel price:", price);
  }
  
  // Find diesel premium prices
  const dieselPremiumRegex = /D.*milesPLUS.*?(\d+\.?\d*)/i;
  const dieselPremiumMatch = text.match(dieselPremiumRegex);
  if (dieselPremiumMatch && dieselPremiumMatch[1]) {
    // Normalize the price if it ends with a decimal point
    let price = dieselPremiumMatch[1];
    if (price.endsWith('.')) {
      price = price + '0';
    }
    extractedPrices.push({ type: 'diesel_premium', price });
    console.log("Found diesel premium price:", price);
  }
  
  // Find unleaded/petrol prices
  // First pattern: Look for U followed by number without milesPLUS between them
  const petrolRegex = /U\s*(?!.*?milesPLUS).*?(\d+\.?\d*)/i;
  const petrolMatch = text.match(petrolRegex);
  
  // Second approach: If U is found alone and there are stray numbers
  const unleadedLabel = /\bU\b/i.test(text);
  
  if (petrolMatch && petrolMatch[1]) {
    // Normalize the price if it ends with a decimal point
    let price = petrolMatch[1];
    if (price.endsWith('.')) {
      price = price + '0';
    }
    extractedPrices.push({ type: 'petrol', price });
    console.log("Found petrol price with U label:", price);
  } else if (unleadedLabel && normalizedNumbers.length >= 3 && !extractedPrices.some(p => p.type === 'petrol')) {
    // If we have a U label but couldn't match it directly with a price,
    // and we have at least 3 numbers, assume the 3rd number is petrol
    extractedPrices.push({ type: 'petrol', price: normalizedNumbers[2] });
    console.log("Assigned petrol price from sequence:", normalizedNumbers[2]);
  }
  
  // Find petrol premium prices
  const petrolPremiumRegex = /U.*milesPLUS.*?(\d+\.?\d*)/i;
  const petrolPremiumMatch = text.match(petrolPremiumRegex);
  
  if (petrolPremiumMatch && petrolPremiumMatch[1]) {
    // Normalize the price if it ends with a decimal point
    let price = petrolPremiumMatch[1];
    if (price.endsWith('.')) {
      price = price + '0';
    }
    extractedPrices.push({ type: 'petrol_premium', price });
    console.log("Found petrol premium price with UmilesPLUS label:", price);
  } else if (unleadedLabel && normalizedNumbers.length >= 4 && !extractedPrices.some(p => p.type === 'petrol_premium')) {
    // If we have a U label but couldn't match premium directly,
    // and we have at least 4 numbers, assume the 4th number is petrol premium
    extractedPrices.push({ type: 'petrol_premium', price: normalizedNumbers[3] });
    console.log("Assigned petrol premium price from sequence:", normalizedNumbers[3]);
  }
  
  // If we still don't have all 4 prices but have enough numbers, try to fill in the gaps
  if (extractedPrices.length < 4 && normalizedNumbers.length >= 4) {
    const fuelTypes = ['diesel', 'diesel_premium', 'petrol', 'petrol_premium'];
    const extractedTypes = extractedPrices.map(p => p.type);
    
    // Look for missing fuel types
    fuelTypes.forEach((type, index) => {
      if (!extractedTypes.includes(type) && normalizedNumbers[index]) {
        extractedPrices.push({ type, price: normalizedNumbers[index] });
        console.log(`Assigned ${type} price by position: ${normalizedNumbers[index]}`);
      }
    });
  }
  
  // Final fallback: If we still don't have all fuel types but have enough numbers,
  // just assign them in order regardless of labels
  if (extractedPrices.length === 0 && normalizedNumbers.length >= 4) {
    console.log("No fuel types detected by labels, assigning by position only");
    
    // Assign fuel prices based on fixed positions in the sign:
    // 1. Diesel
    // 2. Diesel Premium
    // 3. Petrol
    // 4. Petrol Premium
    extractedPrices.push({ type: 'diesel', price: normalizedNumbers[0] });
    extractedPrices.push({ type: 'diesel_premium', price: normalizedNumbers[1] });
    extractedPrices.push({ type: 'petrol', price: normalizedNumbers[2] });
    extractedPrices.push({ type: 'petrol_premium', price: normalizedNumbers[3] });
  }
  
  // Convert to proper format for API
  return extractedPrices.map(item => {
    // Convert diesel_premium to diesel with premium flag
    if (item.type === 'diesel_premium') {
      return { type: 'diesel premium', price: item.price };
    }
    // Convert petrol_premium to petrol with premium flag
    if (item.type === 'petrol_premium') {
      return { type: 'petrol premium', price: item.price };
    }
    return item;
  });
};

export default function FuelPrices() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const stationid = parseInt(searchParams.get('id') || '0', 10);
  const stationName = searchParams.get('name');
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fuelPrices, setFuelPrices] = useState<FuelPriceInput[]>([
    { fuelType: "PETROL", price: "" },
    { fuelType: "DIESEL", price: "" },
    { fuelType: "PETROL_PREMIUM", price: "" },
    { fuelType: "DIESEL_PREMIUM", price: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);
  const [groupedUpdates, setGroupedUpdates] = useState<GroupedPriceUpdate[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [isStarred, setIsStarred] = useState(false);
  const [starredCount, setStarredCount] = useState(0);
  const [isStarring, setIsStarring] = useState(false);
  const [stationData, setStationData] = useState<StationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [hasShownOldPriceNotification, setHasShownOldPriceNotification] = useState(false);

  // Create the return URL for login redirects
  const returnUrl = `${pathname}?${searchParams.toString()}`;
  const loginUrl = `/auth/login?return_url=${encodeURIComponent(returnUrl)}`;

  // Refetch when user changes or when stationid changes
  useEffect(() => {
    if (stationid) {
      fetchPriceUpdates();
    }
  }, [stationid, user?._id]); // Use _id from user object

  // Add token verification
  useEffect(() => {
    const verifyAuth = async () => {
      if (user?.token) {
        const isValid = await verifyToken(user.token);
        if (!isValid) {
          // Token is invalid, clear user state
          window.location.href = '/login';
        }
      }
    };

    verifyAuth();
  }, [user]);

  // Check if station is starred and get starred count
  useEffect(() => {
    const checkStarred = async () => {
      if (user?.token && stationid) {
        try {
          // Get all starred stations to update count and check if current station is starred
          const starredStations = await getStarredStations(user.token);
          setStarredCount(starredStations.length);
          const isCurrentStarred = starredStations.some((s: StarredStation) => s.stationid === stationid);
          setIsStarred(isCurrentStarred);
          console.log('Star status:', { isCurrentStarred, totalStarred: starredStations.length });
        } catch (error) {
          console.error('Error checking star status:', error);
        }
      } else {
        setIsStarred(false);
        setStarredCount(0);
      }
    };

    checkStarred();
  }, [user, stationid]);

  // Fetch station data when component mounts
  useEffect(() => {
    const fetchStationData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getStation(stationid);
        setStationData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load station data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (stationid) {
      fetchStationData();
    }
  }, [stationid]);

  // Add this new useEffect for localStorage handling
  useEffect(() => {
    // This runs only on client side
    const checkLastNotification = () => {
      try {
        const lastNotification = window.localStorage.getItem('lastOldPriceNotification');
        if (lastNotification) {
          const lastTime = parseInt(lastNotification, 10);
          const now = Date.now();
          // Set to true if it's been less than 24 hours since last notification
          setHasShownOldPriceNotification((now - lastTime) < (24 * 60 * 60 * 1000));
        }
      } catch (error) {
        console.warn('Failed to access localStorage:', error);
      }
    };

    checkLastNotification();
  }, []); // Empty dependency array means this runs once on mount

  // Modify the notification useEffect
  useEffect(() => {
    // Check for old prices and show notification
    const checkOldPrices = () => {
      // Only proceed if we haven't shown a notification in the last 24 hours
      if (!hasShownOldPriceNotification && groupedUpdates.length > 0) {
        const now = new Date();
        const oldUpdates = groupedUpdates.filter(group => {
          const updateTime = new Date(group.createdAt);
          const hoursDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
          return hoursDiff > 24;
        });

        // Only show toast if there are multiple old prices
        if (oldUpdates.length > 2) {
          toast((t) => (
            <div className="flex items-start gap-3 p-2">
              <div className="text-red-500 mt-1">
                <FaInfoCircle />
              </div>
              <div>
                <p className="text-sm text-gray-800">
                  Multiple prices are more than 24 hours old. You can help by downvoting outdated prices.
                </p>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    // Store the current time when user acknowledges
                    try {
                      window.localStorage.setItem('lastOldPriceNotification', Date.now().toString());
                    } catch (error) {
                      console.warn('Failed to save to localStorage:', error);
                    }
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Got it
                </button>
              </div>
            </div>
          ), {
            duration: 8000,
            position: 'bottom-center',
          });
          setHasShownOldPriceNotification(true);
        }
      }
    };

    checkOldPrices();
  }, [groupedUpdates, hasShownOldPriceNotification]);

  const fetchPriceUpdates = async () => {
    try {
      setLoading(true);
      const data = await getFuelPrices(stationid);
      
      // Initialize user votes from server data if user is logged in
      if (user?._id) {
        const userVotesFromServer: Record<string, number> = {};
        data.forEach(item => {
          const userVote = item.submissionVotes?.find(
            vote => vote.user === user._id
          );
          if (userVote) {
            userVotesFromServer[item.submissionId] = userVote.value;
          }
        });
        setUserVotes(userVotesFromServer);
      } else {
        // Clear votes if user is not logged in
        setUserVotes({});
      }

      // Group the updates and include submissionVotes in the grouped data
      // Filter out invalidated submissions and sort by creation date
      const grouped = data
        .filter(item => !item.isInvalidated)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .reduce((acc: Record<string, GroupedPriceUpdate>, item) => {
          acc[item.submissionId] = {
            submissionId: item.submissionId,
            submittedBy: item.submittedBy,
            createdAt: item.createdAt,
            submissionVoteScore: item.submissionVoteScore,
            submissionVotes: item.submissionVotes,
            updates: item.updates,
            isInvalidated: item.isInvalidated || false
          };
          return acc;
        }, {});

      setGroupedUpdates(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching price updates:', error);
      // Don't show alert, just set empty updates
      setGroupedUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (submissionId: string, value: number, submittedById: string) => {
    if (!user?.token) {
      window.location.href = loginUrl;
      return;
    }

    // Prevent voting on own submission
    if (user._id === submittedById) {
      toast.error("You cannot vote on your own submission");
      return;
    }

    try {
      // Store the previous vote value before making the request
      const previousVote = userVotes[submissionId] || 0;
      
      // Calculate vote score change
      let scoreChange = value;
      if (previousVote !== 0) {
        // If changing from upvote to downvote or vice versa, multiply by 2
        if (previousVote !== value) {
          scoreChange = value * 2;
        } else {
          // If clicking the same vote button, we're removing the vote
          scoreChange = -previousVote;
        }
      }

      // Optimistically update the UI
      setGroupedUpdates(prevUpdates => 
        prevUpdates.map(group => {
          if (group.submissionId === submissionId) {
            const newVoteValue = previousVote === value ? 0 : value;
            const newScore = group.submissionVoteScore + scoreChange;
            return {
              ...group,
              submissionVoteScore: newScore,
              updates: group.updates.map(update => ({
                ...update,
                submissionVoteScore: newScore
              }))
            };
          }
          return group;
        })
      );

      // Optimistically update user votes
      setUserVotes(prev => ({
        ...prev,
        [submissionId]: previousVote === value ? 0 : value
      }));

      const response = await votePriceUpdate(submissionId, value, user.token);
      
      if (response) {
        if (response.isInvalidated) {
          setGroupedUpdates(prevUpdates => 
            prevUpdates.filter(group => group.submissionId !== submissionId)
          );
          toast.success('Price update has been invalidated due to community feedback');
        } else {
          setGroupedUpdates(prevUpdates => 
            prevUpdates.map(group => {
              if (group.submissionId === submissionId) {
                return {
                  ...group,
                  submissionVoteScore: response.submissionVoteScore,
                  submissionVotes: response.submissionVotes,
                  updates: group.updates.map(update => ({
                    ...update,
                    submissionVoteScore: response.submissionVoteScore
                  }))
                };
              }
              return group;
            })
          );
        }
      }
    } catch (error) {
      // Revert optimistic updates on error
      await fetchPriceUpdates();
      
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to process vote';
      toast.error(errorMessage);
      console.error('Error voting:', error);
    }
  };

  const handlePriceSubmit = async () => {
    if (!user?.token || !stationid || !stationName) {
      toast.error('Please sign in to submit prices');
      window.location.href = loginUrl;
      return;
    }

    // Validate that all prices are filled
    const emptyPrices = fuelPrices.filter(price => !price.price);
    if (emptyPrices.length > 0) {
      toast.error('Please fill in all fuel prices before submitting');
      return;
    }

    // Validate price ranges
    const invalidPrices = fuelPrices.filter(price => {
      const numPrice = parseFloat(price.price);
      const validation = PRICE_VALIDATION[price.fuelType as keyof typeof PRICE_VALIDATION];
      return numPrice < validation.MIN || numPrice > validation.MAX;
    });

    if (invalidPrices.length > 0) {
      const invalidTypes = invalidPrices.map(price => {
        const type = price.fuelType.replace('_', ' ').toLowerCase();
        const validation = PRICE_VALIDATION[price.fuelType as keyof typeof PRICE_VALIDATION];
        return `${type} (€${validation.MIN.toFixed(2)} - €${validation.MAX.toFixed(2)})`;
      });
      toast.error(`Invalid price ranges for: ${invalidTypes.join(', ')}`);
      return;
    }

    const submitPromise = (async () => {
      try {
        setIsSubmitting(true);
        
        let location = { lat: 0, lng: 0 };
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
        } catch (locError) {
          console.warn('Could not get location:', locError);
        }

        const submitData = {
          stationid: stationid,
          stationName,
          location,
          updates: fuelPrices.map(price => ({
            fuelType: price.fuelType,
            price: parseFloat(price.price)
          }))
        };

        await submitFuelPrice(submitData, user.token);
        setFuelPrices(prev => prev.map(p => ({ ...p, price: "" })));
        setShowPriceForm(false);
        await fetchPriceUpdates();
        return 'Prices submitted successfully!';
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to submit prices');
      } finally {
        setIsSubmitting(false);
      }
    })();

    toast.promise(submitPromise, {
      loading: 'Submitting prices...',
      success: (message) => message,
      error: (err) => err.message
    });
  };

  const handlePriceChange = (index: number, value: string) => {
    setFuelPrices(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], price: value };
      return updated;
    });
  };

  // Update the getCurrentPrices function to only use valid submissions
  const getCurrentPrices = () => {
    // Sort by votes and timestamp
    const submissionsByVotes = groupedUpdates.sort((a, b) => {
      const aVoteScore = a.submissionVoteScore || 0;
      const bVoteScore = b.submissionVoteScore || 0;
      if (bVoteScore !== aVoteScore) {
        return bVoteScore - aVoteScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Get the highest voted submission's prices
    const highestVotedSubmission = submissionsByVotes[0];
    if (!highestVotedSubmission) {
      return [
        {
          type: "Diesel",
          price: '0.000',
          premiumPrice: '0.000',
          color: "bg-blue-100",
          border: "border-blue-300"
        },
        {
          type: "Petrol",
          price: '0.000',
          premiumPrice: '0.000',
          color: "bg-green-100",
          border: "border-green-300"
        },
      ];
    }

    const pricesByType = highestVotedSubmission.updates.reduce((acc, update) => {
      acc[update.fuelType] = update.price;
      return acc;
    }, {} as Record<string, number>);

    return [
      {
        type: "Diesel",
        price: (pricesByType['DIESEL'] || 0).toFixed(3),
        premiumPrice: (pricesByType['DIESEL_PREMIUM'] || 0).toFixed(3),
        color: "bg-blue-100",
        border: "border-blue-300"
      },
      {
        type: "Petrol",
        price: (pricesByType['PETROL'] || 0).toFixed(3),
        premiumPrice: (pricesByType['PETROL_PREMIUM'] || 0).toFixed(3),
        color: "bg-green-100",
        border: "border-green-300"
      },
    ];
  };

  // Updated rendering to use correct price values
  const fuels = getCurrentPrices().map(fuel => ({
    ...fuel,
    price: `€${fuel.price}`,
    premiumPrice: `€${fuel.premiumPrice}`
  }));

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!user?.token) {
      window.location.href = loginUrl;
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
                try {
                  await deleteFuelPriceSubmission(submissionId, user.token);
                  await fetchPriceUpdates();
                  toast.success('Submission deleted successfully!');
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : 'Failed to delete submission';
                  toast.error(`Error: ${errorMessage}`);
                }
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

  const handleStarToggle = async () => {
    if (!user?.token || !stationid || !stationName) {
      toast.error('Please sign in to star stations');
      window.location.href = loginUrl;
      return;
    }

    const starPromise = (async () => {
      try {
        setIsStarring(true);
        
        if (isStarred) {
          await unstarStation(stationid, user.token);
          setIsStarred(false);
          setStarredCount(prev => Math.max(0, prev - 1));
        } else {
          // Check star limit
          const starredStations = await getStarredStations(user.token);
          if (starredStations.length >= 5) {
            throw new Error('You can only star up to 5 stations. Please unstar a station before adding a new one.');
          }

          await starStation(
            stationid,
            stationName,
            stationData?.latitude || 0,
            stationData?.longitude || 0,
            user.token
          );
          setIsStarred(true);
          setStarredCount(prev => prev + 1);
        }
        return isStarred ? 'Station unstarred' : 'Station starred';
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to update star status');
      } finally {
        setIsStarring(false);
      }
    })();

    toast.promise(starPromise, {
      loading: isStarred ? 'Unstarring...' : 'Starring...',
      success: (message) => message,
      error: (err) => err.message
    });
  };

  const handleImageCapture = async (imageData: string | null, file: File | null) => {
    if (!file) {
      console.log('No file provided to handleImageCapture');
      return;
    }

    console.log('Starting image capture process', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    try {
      setProcessingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      // Show guidance toast for best results
      toast(
        <div className="space-y-2">
          <p className="font-medium">Tips for best OCR results:</p>
          <ul className="text-sm list-disc pl-4">
            <li>Ensure good lighting and no glare</li>
            <li>Hold camera steady and perpendicular to sign</li>
            <li>Make sure price digits are clearly visible</li>
            <li>Avoid reflections and shadows</li>
          </ul>
        </div>,
        { duration: 5000 }
      );

      console.log('Sending OCR request to server...');
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      console.log('OCR response status:', response.status);
      const data: OCRResponse = await response.json();
      console.log('OCR raw response:', data);

      if (data.success) {
        // Apply our improved text processing to extract prices
        const improvedPrices = processFuelPricesFromOCRText(data.text);
        console.log("Improved extraction found prices:", improvedPrices);
        
        // If we found prices with our improved method, use those
        // Otherwise fall back to the server-provided prices
        const fuelPricesToUse = improvedPrices.length > 0 ? improvedPrices : data.fuelPrices;
        
        if (fuelPricesToUse.length > 0) {
          console.log('Processing extracted fuel prices:', fuelPricesToUse);
          // Update the fuel prices form with extracted values
          const newFuelPrices = [...fuelPrices];
          
          // Track which fuel types were found by OCR
          const detectedFuelTypes = new Set<string>();
          
          fuelPricesToUse.forEach((fuelPrice: OCRFuelPrice) => {
            const { type, price } = fuelPrice;
            console.log('Processing fuel price:', { type, price });
            
            // Validate price is within allowed range before setting
            const numPrice = parseFloat(price);
            if (!isNaN(numPrice)) {
              let fuelType = '';
              let index = -1;
              
              if (type.includes('diesel')) {
                fuelType = type.includes('premium') ? 'DIESEL_PREMIUM' : 'DIESEL';
                index = type.includes('premium') ? 3 : 1;
              } else if (type.includes('petrol') || type.includes('unleaded')) {
                fuelType = type.includes('premium') ? 'PETROL_PREMIUM' : 'PETROL';
                index = type.includes('premium') ? 2 : 0;
              }
              
              if (index >= 0) {
                // Check if price is within valid range
                const validation = PRICE_VALIDATION[fuelType as keyof typeof PRICE_VALIDATION];
                if (numPrice >= validation.MIN && numPrice <= validation.MAX) {
                  console.log(`Setting ${fuelType} price at index:`, index);
                  newFuelPrices[index].price = price;
                  detectedFuelTypes.add(newFuelPrices[index].fuelType);
                } else {
                  console.warn(`Price ${price} for ${fuelType} is outside valid range (${validation.MIN}-${validation.MAX})`);
                }
              }
            }
            
            // Handle unknown type but valid price
            if (type === 'unknown' && price) {
              const numPrice = parseFloat(price);
              if (!isNaN(numPrice)) {
                // For unknown types, try to find an empty slot
                for (let i = 0; i < newFuelPrices.length; i++) {
                  if (!newFuelPrices[i].price) {
                    // Check if price is within valid range
                    const fuelType = newFuelPrices[i].fuelType;
                    const validation = PRICE_VALIDATION[fuelType as keyof typeof PRICE_VALIDATION];
                    if (numPrice >= validation.MIN && numPrice <= validation.MAX) {
                      newFuelPrices[i].price = price;
                      detectedFuelTypes.add(fuelType);
                      break;
                    }
                  }
                }
              }
            }
          });

          console.log('Updated fuel prices:', newFuelPrices);
          setFuelPrices(newFuelPrices);
          
          // Skip the confirmation dialog and directly show the price form
          setShowPriceForm(true);
          setShowImageCapture(false);
          toast.success(`Extracted ${detectedFuelTypes.size} fuel prices. You can edit any values before submitting.`);
        } else {
          console.log('No fuel prices found in OCR result');
          toast.error('No fuel prices found in the image. Please try taking a clearer picture.');
        }
      } else {
        console.error('OCR processing failed:', data);
        toast.error('Failed to process image: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in handleImageCapture:', error);
      toast.error('Failed to process image');
    }
    setProcessingImage(false);
  };

  // Update the camera button click handler
  const handleCameraClick = () => {
    if (!user?.token) {
      window.location.href = loginUrl;
      return;
    }
    setShowImageCapture(true);
  };

  const renderPriceSubmissionForm = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
        onClick={() => setShowPriceForm(false)}
      ></div>

      {/* Modal panel */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative transform overflow-hidden bg-white rounded-xl shadow-xl transition-all w-full max-w-2xl">
          <div className="absolute right-4 top-4">
            <button
              onClick={() => setShowPriceForm(false)}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Update Fuel Prices</h3>
            <p className="text-sm text-gray-600 mb-4">All fuel prices are required. Please fill in all fields before submitting.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fuelPrices.map((price, index) => (
                  <div key={price.fuelType} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {price.fuelType === 'PETROL' ? 'Petrol' :
                        price.fuelType === 'PETROL_PREMIUM' ? 'Premium Petrol' :
                        price.fuelType === 'DIESEL' ? 'Diesel' :
                        'Premium Diesel'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        step="0.0001"
                        min={PRICE_VALIDATION[price.fuelType as keyof typeof PRICE_VALIDATION].MIN}
                        max={PRICE_VALIDATION[price.fuelType as keyof typeof PRICE_VALIDATION].MAX}
                        value={price.price}
                        onChange={(e) => {
                          // Only allow numbers and decimal point
                          const value = e.target.value.replace(/[^\d.]/g, '');
                          // Ensure only one decimal point
                          const parts = value.split('.');
                          if (parts.length > 2) return;
                          // Limit to 4 decimal places
                          if (parts[1] && parts[1].length > 4) return;
                          handlePriceChange(index, value);
                        }}
                        onKeyDown={(e) => {
                          // Allow: backspace, delete, tab, escape, enter, decimal point
                          if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
                              // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                              (e.ctrlKey === true && [65, 67, 86, 88].includes(e.keyCode)) ||
                              // Allow: home, end, left, right
                              (e.keyCode >= 35 && e.keyCode <= 39)) {
                            return;
                          }
                          // Block any key that isn't a number
                          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
                              (e.keyCode < 96 || e.keyCode > 105)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="0.0000"
                        className={`w-full pl-8 p-3 border rounded-md ${
                          !price.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        required
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        Valid range: €{PRICE_VALIDATION[price.fuelType as keyof typeof PRICE_VALIDATION].MIN.toFixed(2)} - 
                        €{PRICE_VALIDATION[price.fuelType as keyof typeof PRICE_VALIDATION].MAX.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handlePriceSubmit}
                disabled={isSubmitting || fuelPrices.some(price => !price.price)}
                className={`w-full ${
                  isSubmitting || fuelPrices.some(price => !price.price)
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white py-3 px-4 rounded-md transition-colors mt-4 text-base sm:text-lg font-medium`}
              >
                {isSubmitting ? 'Submitting...' : 'Update Prices'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getServiceIcon = (service: string) => {
    const iconClass = "text-xl";
    switch (service.toLowerCase()) {
      case 'shop':
        return <FaStore className={`${iconClass} text-blue-500`} />;
      case 'car_wash':
        return <FaCar className={`${iconClass} text-blue-500`} />;
      case 'atm':
        return <FaMoneyBillWave className={`${iconClass} text-green-500`} />;
      case 'food':
        return <FaHamburger className={`${iconClass} text-orange-500`} />;
      case 'coffee':
        return <FaCoffee className={`${iconClass} text-brown-500`} />;
      case 'ev_charging':
        return <FaChargingStation className={`${iconClass} text-green-500`} />;
      case 'air':
        return <FaWind className={`${iconClass} text-blue-500`} />;
      case 'vacuum':
        return <FaBroom className={`${iconClass} text-purple-500`} />;
      default:
        return <FaCog className={`${iconClass} text-gray-500`} />;
    }
  };

  const renderVoteButtons = (group: GroupedPriceUpdate) => {
    const isOwnSubmission = user?._id === group.submittedBy._id;
    const currentVote = userVotes[group.submissionId];
    const upvoteActive = currentVote === 1;
    const downvoteActive = currentVote === -1;
    const voteScore = group.submissionVoteScore || 0; // Ensure we have a default value of 0

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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error || !stationData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600">{error || 'Station data not available'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 1. Header with station info */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3 break-words">
                <FaGasPump className="text-orange-500 flex-shrink-0" />
                <span className="break-words">{stationName}</span>
              </h1>
              <div className="text-gray-600 flex items-start gap-2">
                <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" />
                <span className="break-words">{stationData.address || 'Address not available'}</span>
              </div>
              {stationData.phone && (
                <div className="text-gray-600 flex items-center gap-2">
                  <FaPhone className="text-gray-400 flex-shrink-0" />
                  <span>{stationData.phone}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => setShowPriceForm(!showPriceForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto justify-center"
                  >
                    <FaGasPump className="text-white" />
                    <span className="text-sm font-medium">Update Prices</span>
                  </button>
                  <button
                    onClick={handleCameraClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto justify-center"
                    disabled={processingImage}
                  >
                    <FaCamera className="text-white" />
                    <span className="text-sm font-medium">
                      {processingImage ? 'Processing...' : 'Take Picture'}
                    </span>
                  </button>
                  <button
                    onClick={handleStarToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center ${
                      isStarred
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isStarred ? 'Remove from starred stations' : 'Add to starred stations'}
                  >
                    <FaStar className={isStarred ? 'text-yellow-500' : 'text-gray-400'} />
                    <span className="text-sm font-medium">
                      {isStarred ? 'Starred' : 'Star'}
                    </span>
                  </button>
                </>
              ) : (
                <a
                  href={loginUrl}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto justify-center"
                >
                  <FaSignInAlt className="text-white" />
                  <span className="text-sm font-medium">Log in to update prices</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Price Submission Form */}
        {showPriceForm && renderPriceSubmissionForm()}

        {/* 2. Price Grid - Diesel and Unleaded boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {fuels.map((fuel, index) => (
            <div key={index} className={`${fuel.color} rounded-xl p-6 shadow-md`}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{fuel.type}</h2>
                <span className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                  Standard
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Regular</span>
                  <div className="text-3xl font-bold text-gray-800">
                    {fuel.price}
                  </div>
                </div>

                <div className={`border-t ${fuel.border} pt-4`}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      Premium
                      <FaInfoCircle className="text-gray-400 text-sm" />
                    </span>
                    <div className="text-2xl font-bold text-gray-800">
                      {fuel.premiumPrice}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Last Updated Info */}
        {groupedUpdates.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <span className="text-green-700">Last updated by </span>
            <span className="font-medium text-green-800">{groupedUpdates[0].submittedBy.name}</span>
            <span className="text-green-700"> • </span>
            <span className="text-green-700">{new Date(groupedUpdates[0].createdAt).toLocaleString()}</span>
          </div>
        )}

        {/* 4. Recent Price Updates and Price History */}
        <RecentPriceUpdates
          groupedUpdates={groupedUpdates}
          user={user}
          handleDeleteSubmission={handleDeleteSubmission}
          handleVote={handleVote}
          userVotes={userVotes}
        />

        {/* 5. Opening Hours and Services */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Opening Hours */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaClock className="text-blue-500" />
              Opening Hours
            </h3>
            <div className="space-y-2">
              {(() => {
                try {
                  const hours = stationData?.opening_hours || {};
                  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  return Object.entries(hours)
                    .filter(([day]) => validDays.includes(day))
                    .map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{day}</span>
                        <span className="text-gray-600">{String(hours)}</span>
                      </div>
                    ));
                } catch (e) {
                  return <p className="text-gray-500">Opening hours not available</p>;
                }
              })()}
            </div>
          </div>

          {/* Available Services */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaCog className="text-green-500" />
              Available Services
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                try {
                  const services = stationData?.services || [];
                  return services.map((service) => (
                    <div key={service} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                      {getServiceIcon(service)}
                      <span className="text-gray-700 capitalize">
                        {service.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                  ));
                } catch (e) {
                  return <p className="text-gray-500">Services not available</p>;
                }
              })()}
            </div>
          </div>
        </div>

        {/* 6. Quick Actions - Google Maps and Official Website */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <a 
            href={stationData?.google_maps || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white hover:bg-gray-50 p-4 rounded-xl shadow-sm flex items-center gap-3 transition-all"
          >
            <FaMapMarkerAlt className="text-blue-500 text-xl" />
            <div className="text-left">
              <h3 className="font-semibold">Open in Google Maps</h3>
              <p className="text-sm text-gray-600">Get directions to this station</p>
            </div>
          </a>

          <a 
            href={stationData?.link || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white hover:bg-gray-50 p-4 rounded-xl shadow-sm flex items-center gap-3 transition-all"
          >
            <FaExternalLinkAlt className="text-green-500 text-xl" />
            <div className="text-left">
              <h3 className="font-semibold">Official Website</h3>
              <p className="text-sm text-gray-600">Visit station's website</p>
            </div>
          </a>
        </div>

        {/* Price History Graph */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Price History
          </h2>
          {stationid ? (
            <PriceHistoryGraph stationId={stationid} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Station ID not available
            </div>
          )}
        </div>

        {/* Add the ImageCapture component */}
        {showImageCapture && (
          <ImageCapture
            onClose={() => setShowImageCapture(false)}
            onImageCapture={handleImageCapture}
          />
        )}
      </div>
    </div>
  );
}
