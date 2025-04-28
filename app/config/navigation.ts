export interface NavItem {
  path: string;
  label: string;
  requiresAuth?: boolean;
}

export const mainNavItems: NavItem[] = [
  {
    path: '/leaderboard',
    label: 'nav.leaderboard',
  },
  {
    path: '/nearby',
    label: 'nav.nearbyStations',
  },
  {
    path: '/dashboard',
    label: 'nav.dashboard',
    requiresAuth: true,
  },
  {
    path: '/map',
    label: 'nav.liveMap',
  },
];

export const userMenuItems: NavItem[] = [
  {
    path: '/settings',
    label: 'nav.settings',
  },
]; 