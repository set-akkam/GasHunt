// This is a Next.js API route handler for updating a user's username
// It handles PUT requests to /auth/update-username
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    // Extract the new username from the request body
    const { username } = await req.json();
    
    // Extract the JWT token from the Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];

    // Check if user is authenticated (token exists)
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Verify that the API URL environment variable is set
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('NEXT_PUBLIC_API_URL is not defined');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Construct the backend API endpoint URL
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/update-username`;
    console.log('Sending request to:', backendUrl);

    // Forward the request to the backend API
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    // Parse the backend response
    const data = await response.json();
    console.log('Backend response:', data);

    // Handle error responses from the backend
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to update username' },
        { status: response.status }
      );
    }

    // Return successful response
    return NextResponse.json(data);
  } catch (error) {
    // Handle any unexpected errors during the process
    console.error('Detailed error in update-username:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating username' },
      { status: 500 }
    );
  }
} 