/**
 * Root page component of the Fuel Price Tracker application
 * Automatically redirects visitors to the landing page
 * This ensures users always start their journey from the proper entry point
 */
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the landing page immediately when this component renders
  redirect('/landing');
  return null;
}
