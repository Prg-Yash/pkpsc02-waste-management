import { useState } from "react"
import { Bell, Search, Trash2, CheckCheck, MapPin, AlertTriangle, Gift, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const notifications = [
  {
    id: 1,
    type: "report",
    title: "New Waste Report",
    message: "A new report submitted at Main Street Market",
    time: "2 mins ago",
    read: false,
    icon: FileText,
  },
  {
    id: 2,
    type: "hotspot",
    title: "New Hotspot Detected",
    message: "AI detected high waste accumulation at Green Plaza",
    time: "15 mins ago",
    read: false,
    icon: MapPin,
  },
  {
    id: 3,
    type: "alert",
    title: "Fraudulent Activity",
    message: "Suspicious activity detected from user #4521",
    time: "1 hour ago",
    read: false,
    icon: AlertTriangle,
  },
  {
    id: 4,
    type: "partner",
    title: "Partner Request",
    message: "GreenMart requested to join as reward partner",
    time: "3 hours ago",
    read: true,
    icon: Gift,
  },
  {
    id: 5,
    type: "report",
    title: "Collection Completed",
    message: "Waste collection verified at Park Avenue",
    time: "5 hours ago",
    read: true,
    icon: FileText,
  },
]

export function AdminHeader({
  title,
  subtitle,
  showSearch = false,
  searchPlaceholder = "Search...",
  stats,
}) {
  const [notificationList, setNotificationList] = useState(notifications)
  const unreadCount = notificationList.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id) => {
    setNotificationList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const deleteNotification = (id) => {
    setNotificationList((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={searchPlaceholder} className="w-64 bg-card pl-10" />
          </div>
        )}

        {stats && (
          <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground">
            <span className="text-xs font-medium">{stats.label}</span>
            <span className="text-lg font-bold">{stats.value}</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative bg-card">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive p-0 text-[10px] text-destructive-foreground">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs text-primary hover:text-primary"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notificationList.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                notificationList.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex cursor-pointer items-start gap-3 p-3"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div
                      className={`mt-0.5 rounded-full p-2 ${
                        notification.type === "alert"
                          ? "bg-destructive/10 text-destructive"
                          : notification.type === "hotspot"
                            ? "bg-amber-500/10 text-amber-500"
                            : notification.type === "partner"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <notification.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/70">{notification.time}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary hover:text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}