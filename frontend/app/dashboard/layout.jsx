'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { LayoutDashboard, BarChart3, Trash2, User, MapPin, Users, Trophy, Route, Flame, BookOpen, ShoppingCart } from 'lucide-react';
import { EcoFlowSidebar } from '@/components/ui/sidebar';
import { GoogleMapsProvider } from '@/app/providers/GoogleMapsProvider';

export default function DashboardLayout({ children }) {
  const { user } = useUser();
  const [isCollector, setIsCollector] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setIsCollector(data.user?.enableCollector || false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  // Base links always visible
  const baseLinks = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
  ];

  // Collector-only links
  const collectorLinks = [
    {
      label: 'Collect Waste',
      href: '/dashboard/collect-waste',
      icon: Trash2,
    },
  ];

  // Common links
  const commonLinks = [
    {
      label: 'Report Waste',
      href: '/dashboard/report-waste',
      icon: MapPin,
    },
    {
      label: 'Marketplace',
      href: '/dashboard/marketplace',
      icon: ShoppingCart,
    },
  ];

  // Route map (collector only)
  const routeLinks = [
    {
      label: 'Route Map',
      href: '/dashboard/route-map',
      icon: Route,
    },
  ];

  // Analytics links
  const analyticsLinks = [
    {
      label: 'Heatmap',
      href: '/dashboard/heatmap',
      icon: Flame,
    },
  ];

 /*  // Blog link
  const blogLinks = [
    {
      label: 'Blog',
      href: '/dashboard/blog',
      icon: BookOpen,
    },
  ]; */

  // Bottom links
  const bottomLinks = [
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

  // Construct final links array based on collector status
  const links = [
    ...baseLinks,
    ...(isCollector ? collectorLinks : []),
    ...commonLinks,
    ...(isCollector ? routeLinks : []),
    ...analyticsLinks,
    //...blogLinks,
    ...bottomLinks,
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