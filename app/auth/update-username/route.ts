import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    const { username } = await req.json();
    
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('NEXT_PUBLIC_API_URL is not defined');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/update-username`;
    console.log('Sending request to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    const data = await response.json();
    console.log('Backend response:', data);

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to update username' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Detailed error in update-username:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating username' },
      { status: 500 }
    );
  }
} 