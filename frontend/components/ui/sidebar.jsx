'use client';

import React, { useState } from 'react';
import { UserButton, useClerk } from '@clerk/nextjs';
import { Recycle } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function EcoFlowSidebar({ links, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [showLogout, setShowLogout] = useState(false);

  const isActiveLink = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 shadow-xl flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <Recycle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              EcoFlow
            </h1>
            <p className="text-xs text-gray-500">Waste Management</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = isActiveLink(link.href);
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-emerald-600'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className="text-sm">{link.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-emerald-50 border border-emerald-100">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowLogout(!showLogout)}
          >
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10 ring-2 ring-emerald-500 ring-offset-2"
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          
          {/* Animated Logout Button */}
          <div 
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showLogout ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
            }`}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-sm transition-all duration-300 border border-red-200 transform hover:scale-105"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
