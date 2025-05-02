// NextAuth configuration for handling authentication in the application
import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// Extend the default NextAuth types to include custom user properties
declare module "next-auth" {
  interface User {
    id: string;          // Unique identifier for the user
    name?: string | null; // User's display name
    email?: string | null; // User's email address
    token?: string;      // JWT token for backend authentication
    _id?: string;        // MongoDB document ID
    provider?: string;   // Authentication provider (google/credentials)
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      token?: string;
      _id?: string;
      provider?: string;
    }
  }
}

// Main authentication configuration
export const authOptions: NextAuthOptions = {
  // Configure authentication providers
  providers: [
    // Google OAuth provider configuration
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Custom credentials provider for email/password login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // Custom authorization logic for credentials login
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Authenticate with backend API
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          // Return user object if authentication successful
          if (response.ok && data.token) {
            return {
              id: data._id,
              _id: data._id,
              name: data.name,
              email: data.email,
              token: data.token,
              provider: 'credentials'
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  // Authentication callbacks for customizing the auth flow
  callbacks: {
    // Handle Google sign-in and backend integration
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Send Google user data to backend for verification/registration
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              googleId: user.id,
            }),
          });

          if (!response.ok) {
            console.error('Failed to authenticate with backend:', await response.text());
            return false;
          }

          const data = await response.json();
          if (data.token) {
            // Update user object with backend data
            user.token = data.token;
            user._id = data._id;
            user.provider = 'google';
            user.name = data.name;
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error during Google authentication:', error);
          return false;
        }
      }
      return true;
    },
    // Customize JWT token with user data
    async jwt({ token, user, account }) {
      if (user) {
        token.token = user.token;
        token._id = user._id;
        token.name = user.name;
        token.email = user.email;
        token.provider = user.provider;
      }
      return token;
    },
    // Customize session object and fetch latest user data
    async session({ session, token }) {
      if (session.user) {
        try {
          // Fetch latest user data from our database
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
            headers: {
              'Authorization': `Bearer ${token.token}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            // Use the latest name from our database
            token.name = userData.name;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }

        // Update session with user data
        session.user.token = token.token as string;
        session.user._id = token._id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.provider = token.provider as string;

        // Dispatch custom event for client-side state management
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('authStateChange', {
            detail: {
              _id: token._id,
              name: session.user.name,
              email: session.user.email,
              token: token.token,
              provider: token.provider,
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(session.user.email || '')}`
            }
          });
          window.dispatchEvent(event);
        }
      }
      return session;
    },
  },
  // Custom pages configuration
  pages: {
    signIn: '/auth/login',
  },
  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

// Export NextAuth handler for API routes
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };