import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    token?: string;
    _id?: string;
    provider?: string;
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

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
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
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
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

        session.user.token = token.token as string;
        session.user._id = token._id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.provider = token.provider as string;

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
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };