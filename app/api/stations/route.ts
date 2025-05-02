/**
 * API Route for fetching fuel stations
 * 
 * This endpoint handles:
 * 1. Station data retrieval with optional filtering
 * 2. Error handling and response formatting
 * 3. Data transformation for frontend consumption
 * 
 * Error Handling Strategy:
 * - 400: Invalid request parameters
 * - 404: No stations found
 * - 500: Server/internal errors
 * - 503: Service unavailable (e.g., database connection issues)
 */
import { NextResponse } from 'next/server';
import { getStations } from '@/app/utils/api';
import { transformStationData } from '@/app/utils/transformers';

/**
 * GET handler for /api/stations
 * 
 * Query Parameters:
 * - lat: Latitude for center point
 * - lng: Longitude for center point
 * - radius: Search radius in meters
 * - bounds: Viewport bounds as comma-separated string (swLat,swLng,neLat,neLng)
 * 
 * Response Format:
 * {
 *   stations: StationWithPrices[],
 *   metadata: {
 *     total: number,
 *     filtered: number,
 *     bounds: LatLngBounds
 *   }
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate coordinates
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseInt(searchParams.get('radius') || '5000');
    
    // Parse viewport bounds if provided
    const boundsParam = searchParams.get('bounds');
    let bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | undefined;
    if (boundsParam) {
      const [swLat, swLng, neLat, neLng] = boundsParam.split(',').map(Number);
      if (!isNaN(swLat) && !isNaN(swLng) && !isNaN(neLat) && !isNaN(neLng)) {
        bounds = { sw: { lat: swLat, lng: swLng }, ne: { lat: neLat, lng: neLng } };
      }
    }

    // Validate required parameters
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided' },
        { status: 400 }
      );
    }

    // Fetch stations from database
    const stations = await getStations({
      lat,
      lng,
      radius,
      bounds
    });

    // Transform data for frontend consumption
    const transformedStations = stations.map(transformStationData);

    return NextResponse.json({
      stations: transformedStations,
      metadata: {
        total: stations.length,
        filtered: transformedStations.length,
        bounds: bounds || { sw: { lat, lng }, ne: { lat, lng } }
      }
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 