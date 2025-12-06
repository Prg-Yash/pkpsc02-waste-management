"use client";

import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Truck,
  UserX,
  Map,
  Coins,
  Gift,
  BarChart3,
  Settings,
  Recycle,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "View Reports", icon: FileText },
  { href: "/dashboard/users", label: "Manage Users", icon: UserX },
  { href: "/dashboard/hotspots", label: "Hotspots Map", icon: Map },
  { href: "/dashboard/city-reports", label: "City Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

function Avatar({ className, children }) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>
      {children}
    </div>
  )
}

function AvatarImage({ src }) {
  return <img src={src} alt="Avatar" className="aspect-square h-full w-full" />
}

function AvatarFallback({ className, children }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}>
      {children}
    </div>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavClick = (href) => {
    router.push(href)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
          <Recycle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-green-600">EcoFlow</h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                handleNavClick(item.href)
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-white" />}
            </a>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-green-600/20">
            <AvatarImage src="/admin-avatar.png" />
            <AvatarFallback className="bg-green-600/10 text-green-600">AD</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-gray-700">Admin User</p>
            <p className="truncate text-xs text-gray-500">admin@ecoflow.com</p>
          </div>
          <button className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar