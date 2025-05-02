/**
 * Root Providers Component
 * 
 * This component sets up all the necessary providers for the application:
 * 1. NextAuth Session Provider - Handles authentication state
 * 2. Theme Provider - Manages light/dark mode
 * 3. Toast Provider - Handles notifications
 * 4. Station Context - Manages station data and selection
 * 
 * Integration Points:
 * - NextAuth integrates with the backend auth system
 * - Theme provider syncs with system preferences
 * - Station context connects with the map and list views
 * 
 * Provider Order:
 * 1. SessionProvider (outermost) - Auth state needed by all other providers
 * 2. ThemeProvider - Theme needed for consistent styling
 * 3. ToastProvider - Toast notifications used throughout
 * 4. StationProvider (innermost) - Station data used by specific components
 */
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/toast';
import { StationProvider } from '@/contexts/StationContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ToastProvider>
          <StationProvider>
            {children}
          </StationProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 