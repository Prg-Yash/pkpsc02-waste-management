'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { LayoutDashboard, BarChart3, Trash2, User, MapPin, Users, Trophy, Route } from 'lucide-react';
import { EcoFlowSidebar } from '@/components/ui/sidebar';
import { GoogleMapsProvider } from '@/app/providers/GoogleMapsProvider';

export default function DashboardLayout({ children }) {
  const { user } = useUser();

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Collect Waste',
      href: '/dashboard/collect-waste',
      icon: Trash2,
    },
    {
      label: 'Report Waste',
      href: '/dashboard/report-waste',
      icon: MapPin,
    },
    {
      label: 'Route Map',
      href: '/dashboard/route-map',
      icon: Route,
    },
    {
      label: 'Leaderboard',
      href: '/dashboard/leaderboard',
      icon: Trophy,
    },
    {
      label: 'Profile',
      href: '/dashboard/settings',
      icon: User,
    },
  ];

  return (
    <GoogleMapsProvider>
      <div className="flex h-screen w-full overflow-hidden bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
        <EcoFlowSidebar links={links} user={user} />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </GoogleMapsProvider>
  );
}