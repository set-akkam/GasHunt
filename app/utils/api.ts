/**
 * API Utility Module
 * Provides type definitions and functions for interacting with the backend API.
 * Handles authentication, fuel price submissions, station management, and error handling.
 */

/**
 * Interface for submitting new fuel prices
 */
export interface FuelPriceSubmission {
  stationid: number;           // Unique identifier for the station
  stationName: string;         // Name of the station
  location: { lat: number; lng: number };  // Geographic coordinates
  updates: { fuelType: string; price: number }[];  // Array of price updates
}

/**
 * Interface for individual fuel price updates
 * Includes voting system for price verification
 */
export interface FuelPriceUpdate {
  _id: string;                 // Unique identifier for the update
  fuelType: string;            // Type of fuel (e.g., diesel, petrol)
  price: number;               // Price per unit
  submissionVoteScore: number; // Aggregate vote score
  submissionVotes?: Array<{    // Individual votes
    user: string;              // User who voted
    value: number;             // Vote value (+1/-1)
    votedAt: string;           // Timestamp of vote
  }>;
}

/**
 * Interface for fuel price submission responses
 * Includes submission metadata and voting information
 */
export interface FuelPriceResponse {
  submissionId: string;        // Unique identifier for the submission
  submittedBy: {              // User who submitted the price
    name: string;
    _id: string;
  };
  createdAt: string;          // Submission timestamp
  station: {                  // Station information
    _id: string;
    name: string;
    stationid: number;
  };
  updates: {                  // Array of price updates
    _id: string;
    fuelType: string;
    price: number;
    submissionVoteScore: number;
  }[];
  submissionVoteScore: number;  // Overall submission score
  submissionVotes?: Array<{     // Individual votes on submission
    user: string;
    value: number;
    votedAt: string;
  }>;
  isInvalidated: boolean;       // Whether submission has been marked invalid
  invalidatedAt?: string;       // When it was invalidated, if applicable
}

/**
 * Interface for starring (favoriting) a station
 */
export interface StarStationRequest {
  stationid: number;           // Station identifier
  stationName: string;         // Station name
  latitude: number;            // Geographic location
  longitude: number;
}

/**
 * Interface for starred station responses
 */
export interface StarredStation {
  _id: string;                // Unique identifier
  stationid: number;          // Station identifier
  stationName: string;        // Station name
  latitude: number;           // Geographic location
  longitude: number;
  starredAt: string;         // When the station was starred
}

/**
 * Interface for detailed station information
 */
export interface StationDetails {
  _id: string;               // Unique identifier
  stationid: number;         // Station identifier
  name: string;              // Station name
  station: string;           // Station brand/company
  latitude: number;          // Geographic location
  longitude: number;
  address: string;           // Physical address
  link: string;              // Website URL
  phone: string;             // Contact number
  google_maps: string;       // Google Maps link
  opening_hours: Record<string, string>;  // Operating hours by day
  services: string[];        // Available services
  prices: Record<string, {   // Current fuel prices
    price: number;
    updatedAt: string;
  }>;
  createdAt: string;        // Station record creation date
  updatedAt: string;        // Last update timestamp
}

/**
 * Interface for API error responses
 */
interface ApiError {
  message: string;          // Error message
  error?: string;          // Optional error details
  status?: number;         // HTTP status code
}

/**
 * Handles API responses and error cases
 * Includes authentication error handling and JSON parsing
 */
export const handleApiResponse = async (response: Response) => {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  
  if (!response.ok) {
    const errorData: { message: string; details?: any } = { 
      message: 'An error occurred' 
    };
    
    try {
      if (isJson) {
        const data = await response.json();
        errorData.message = data.message || data.error || 'Unknown error occurred';
        errorData.details = data.details;
        
        // Handle authentication errors
        if (response.status === 403 && errorData.message.includes('Invalid or expired token')) {
          console.log('Token expired or invalid, redirecting to login...');
          // Clear auth state
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          // Redirect to login
          window.location.href = '/login';
          return null;
        }
      } else {
        const textData = await response.text();
        errorData.message = textData || 'Unknown error occurred';
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
    }

    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint: response.url,
      error: errorData
    });

    throw new Error(errorData.message);
  }

  return isJson ? response.json() : response.text();
};

/**
 * Verifies the validity of an authentication token
 * Clears local storage if token is invalid
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Clear auth state if token is invalid
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return false;
    }

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
};

/**
 * Retrieves fuel prices for a specific station
 */
export const getFuelPrices = async (stationid: number): Promise<FuelPriceResponse[]> => {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/fuel/prices`);
  url.searchParams.append('stationid', stationid.toString());
  const response = await fetch(url.toString());
  return handleApiResponse(response);
};

/**
 * Submits new fuel prices for a station
 * Requires authentication token
 */
export const submitFuelPrice = async (data: FuelPriceSubmission, token: string): Promise<FuelPriceResponse> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fuel/prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('Error submitting fuel price:', error);
    throw error;
  }
};

/**
 * Submits a vote on a fuel price submission
 * Requires authentication token
 */
export const votePriceUpdate = async (submissionId: string, value: number, token: string): Promise<FuelPriceResponse> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fuel/vote/submission/${submissionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ value })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to process vote' }));
      throw new Error(errorData.message || 'Failed to process vote');
    }

    const data = await response.json();
    
    // If the response is an array (multiple price updates), take the first one
    // as they all have the same submission data
    const priceUpdate = Array.isArray(data) ? data[0] : data;

    if (!priceUpdate) {
      throw new Error('Invalid response from server');
    }

    return {
      submissionId: priceUpdate.submissionId,
      submittedBy: priceUpdate.submittedBy,
      createdAt: priceUpdate.createdAt,
      station: priceUpdate.station,
      updates: priceUpdate.updates || [],
      submissionVoteScore: priceUpdate.submissionVoteScore,
      submissionVotes: priceUpdate.submissionVotes,
      isInvalidated: priceUpdate.isInvalidated || false,
      invalidatedAt: priceUpdate.invalidatedAt
    };
  } catch (error) {
    console.error('Error voting on submission:', error);
    throw error;
  }
};

export const deleteFuelPriceSubmission = async (submissionId: string, token: string): Promise<void> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fuel/prices/${submissionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete submission');
    }
  } catch (error) {
    console.error('Error deleting fuel price submission:', error);
    throw error;
  }
};

export const starStation = async (
  stationid: number,
  stationName: string,
  latitude: number,
  longitude: number,
  token: string
): Promise<StarredStation> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stations/star`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      stationid, 
      stationName, 
      latitude, 
      longitude 
    })
  });
  return handleApiResponse(response);
};

export const unstarStation = async (stationid: number, token: string): Promise<void> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stations/star/${stationid}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  await handleApiResponse(response);
};

export const getStarredStations = async (token: string): Promise<StarredStation[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stations/starred`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('Error fetching starred stations:', error);
    return [];
  }
};

export const getStation = async (stationid: number): Promise<StationDetails> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stations/${stationid}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error fetching station:', error);
    throw error;
  }
};

export const getRecentFuelPrices = async (limit?: number, token?: string): Promise<FuelPriceResponse[]> => {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/fuel/recent`);
    if (limit) {
      url.searchParams.append('limit', limit.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: response.url
      });
      return [];
    }

    return handleApiResponse(response);
  } catch (error) {
    console.error('Error fetching recent fuel prices:', error);
    return [];
  }
};