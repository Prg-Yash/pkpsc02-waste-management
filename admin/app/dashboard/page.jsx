"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin-header"
import { FileText, Users, Truck, MapPin, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedContainer, StaggerContainer, StaggerItem, HoverScale } from "@/components/animated-container"

const stats = [
  {
    title: "Total Reports",
    value: "1,284",
    change: "+12%",
    icon: FileText,
    trend: "up",
  },
  {
    title: "Active Users",
    value: "8,432",
    change: "+8%",
    icon: Users,
    trend: "up",
  },
  {
    title: "Waste Collected",
    value: "42.5 tons",
    change: "+15%",
    icon: Truck,
    trend: "up",
  },
  {
    title: "Hotspots Identified",
    value: "23",
    change: "-5%",
    icon: MapPin,
    trend: "down",
  },
]

const recentReports = [
  {
    id: 1,
    location: "Park Avenue, Zone A",
    type: "Plastic Waste",
    status: "pending",
    date: "2024-12-06",
  },
  {
    id: 2,
    location: "Main Street Market",
    type: "Organic Waste",
    status: "in-progress",
    date: "2024-12-06",
  },
  {
    id: 3,
    location: "Green Plaza",
    type: "E-Waste",
    status: "completed",
    date: "2024-12-05",
  },
  {
    id: 4,
    location: "Industrial Zone B",
    type: "Hazardous Waste",
    status: "pending",
    date: "2024-12-05",
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <AnimatedContainer>
        <AdminHeader
          title="Admin Dashboard"
          subtitle="Overview of waste management operations"
          stats={{ label: "Total Tokens", value: "125,840" }}
        />
      </AnimatedContainer>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.1}>
        {stats.map((stat, index) => (
          <StaggerItem key={stat.title}>
            <HoverScale>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <motion.p
                        className="mt-2 text-2xl font-bold text-card-foreground"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p
                        className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                          stat.trend === "up" ? "text-primary" : "text-destructive"
                        }`}
                      >
                        <TrendingUp className={`h-3 w-3 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                        {stat.change} from last month
                      </p>
                    </div>
                    <motion.div
                      className="rounded-lg bg-primary/10 p-3"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <stat.icon className="h-5 w-5 text-primary" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </HoverScale>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <AnimatedContainer delay={0.3}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <StaggerContainer className="space-y-4" delay={0.4} staggerDelay={0.08}>
              {recentReports.map((report) => (
                <StaggerItem key={report.id}>
                  <motion.div
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                    whileHover={{ x: 4, backgroundColor: "rgba(var(--muted), 0.5)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                        whileHover={{ scale: 1.1 }}
                      >
                        <MapPin className="h-5 w-5 text-primary" />
                      </motion.div>
                      <div>
                        <p className="font-medium text-card-foreground">{report.location}</p>
                        <p className="text-sm text-muted-foreground">{report.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{report.date}</span>
                      <StatusBadge status={report.status} />
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    pending: {
      icon: Clock,
      label: "Pending",
      className: "border-warning bg-warning/10 text-warning-foreground",
    },
    "in-progress": {
      icon: AlertTriangle,
      label: "In Progress",
      className: "border-primary bg-primary/10 text-primary",
    },
    completed: {
      icon: CheckCircle,
      label: "Completed",
      className: "border-primary bg-primary/10 text-primary",
    },
  }[status] || {
    icon: Clock,
    label: status,
    className: "border-muted bg-muted text-muted-foreground",
  }

  const Icon = config.icon

  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.className}`}
      whileHover={{ scale: 1.05 }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </motion.span>
  )
}
