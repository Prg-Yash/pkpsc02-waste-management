'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { LayoutDashboard, BarChart3, Trash2, Settings, MapPin, Users, Trophy } from 'lucide-react';
import { EcoFlowSidebar } from '@/components/ui/sidebar';

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
      label: 'Leaderboard',
      href: '/dashboard/leaderboard',
      icon: Trophy,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <EcoFlowSidebar links={links} user={user} />
      
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}