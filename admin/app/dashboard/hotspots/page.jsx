"use client";

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, TrendingUp, Trash2, Calendar, Eye, Zap, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedContainer, StaggerContainer, StaggerItem, HoverScale } from "@/components/animated-container"

const hotspots = [
  {
    id: 1,
    location: "Industrial Zone B",
    coords: { lat: 28.6139, lng: 77.209 },
    severity: "critical",
    wasteType: "Hazardous Waste",
    reports: 45,
    trend: "increasing",
    lastUpdated: "2024-12-06",
  },
  {
    id: 2,
    location: "Main Street Market",
    coords: { lat: 28.6315, lng: 77.2167 },
    severity: "high",
    wasteType: "Organic Waste",
    reports: 32,
    trend: "stable",
    lastUpdated: "2024-12-05",
  },
  {
    id: 3,
    location: "Riverside District",
    coords: { lat: 28.6508, lng: 77.2293 },
    severity: "medium",
    wasteType: "Plastic Waste",
    reports: 28,
    trend: "decreasing",
    lastUpdated: "2024-12-05",
  },
  {
    id: 4,
    location: "Downtown Square",
    coords: { lat: 28.6279, lng: 77.2189 },
    severity: "high",
    wasteType: "Mixed Waste",
    reports: 38,
    trend: "increasing",
    lastUpdated: "2024-12-04",
  },
  {
    id: 5,
    location: "Green Park Area",
    coords: { lat: 28.5903, lng: 77.2031 },
    severity: "low",
    wasteType: "E-Waste",
    reports: 12,
    trend: "stable",
    lastUpdated: "2024-12-04",
  },
]

function SeverityBadge({ severity }) {
  const config = {
    critical: "bg-destructive text-destructive-foreground",
    high: "bg-destructive/80 text-destructive-foreground",
    medium: "bg-warning text-warning-foreground",
    low: "bg-primary text-primary-foreground",
  }

  return (
    <motion.div whileHover={{ scale: 1.1 }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
      <Badge className={`${config[severity]}`}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</Badge>
    </motion.div>
  )
}

function TrendIndicator({ trend }) {
  const config = {
    increasing: { icon: "↑", color: "text-destructive", label: "Increasing" },
    stable: { icon: "→", color: "text-warning-foreground", label: "Stable" },
    decreasing: { icon: "↓", color: "text-primary", label: "Decreasing" },
  }

  const { icon, color, label } = config[trend] || config.stable

  return (
    <motion.span
      className={`flex items-center gap-1 text-sm font-medium ${color}`}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <motion.span
        animate={{ y: trend === "increasing" ? [-2, 2, -2] : trend === "decreasing" ? [2, -2, 2] : [0, 0, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {icon}
      </motion.span>
      {label}
    </motion.span>
  )
}

export default function HotspotsPage() {
  const [timeRange, setTimeRange] = useState("7d")
  const [severityFilter, setSeverityFilter] = useState("all")

  const filteredHotspots = hotspots.filter((hotspot) => severityFilter === "all" || hotspot.severity === severityFilter)

  return (
    <div className="space-y-6">
      <AnimatedContainer>
        <AdminHeader
          title="Hotspots Map"
          subtitle="AI-powered waste accumulation hotspot detection and analysis"
          stats={{ label: "Active Hotspots", value: hotspots.length }}
        />
      </AnimatedContainer>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.1}>
        {[
          { icon: AlertTriangle, label: "Critical Zones", value: "3", color: "bg-destructive/10 text-destructive" },
          { icon: MapPin, label: "High Risk Areas", value: "8", color: "bg-warning/10 text-warning-foreground" },
          { icon: TrendingUp, label: "Improving Areas", value: "12", color: "bg-primary/10 text-primary" },
          { icon: Zap, label: "AI Predictions", value: "5 New", color: "bg-primary/10 text-primary" },
        ].map((stat, index) => (
          <StaggerItem key={stat.label}>
            <HoverScale>
              <Card className="border-none shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <motion.div
                    className={`rounded-lg p-3 ${stat.color.split(" ")[0]}`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color.split(" ")[1]}`} />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <motion.p
                      className="text-2xl font-bold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                </CardContent>
              </Card>
            </HoverScale>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid gap-6 lg:grid-cols-3">
        <AnimatedContainer delay={0.2} className="lg:col-span-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Hotspot Map</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <MapPin className="mx-auto h-16 w-16 text-primary/30" />
                    </motion.div>
                    <p className="mt-4 text-lg font-medium text-muted-foreground">Interactive Map View</p>
                    <p className="text-sm text-muted-foreground">AI-powered hotspot detection enabled</p>
                  </motion.div>
                </div>
                <motion.div
                  className="absolute left-[20%] top-[30%] flex h-8 w-8 items-center justify-center rounded-full bg-destructive/80"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <span className="text-xs font-bold text-destructive-foreground">!</span>
                </motion.div>
                <motion.div
                  className="absolute left-[45%] top-[50%] flex h-6 w-6 items-center justify-center rounded-full bg-warning/80"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                >
                  <span className="text-xs font-bold text-warning-foreground">!</span>
                </motion.div>
                <motion.div
                  className="absolute left-[70%] top-[25%] flex h-6 w-6 items-center justify-center rounded-full bg-warning/80"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
                >
                  <span className="text-xs font-bold text-warning-foreground">!</span>
                </motion.div>
                <motion.div
                  className="absolute left-[60%] top-[65%] flex h-5 w-5 items-center justify-center rounded-full bg-primary/80"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.9 }}
                >
                  <span className="text-xs font-bold text-primary-foreground">!</span>
                </motion.div>
                <motion.div
                  className="absolute left-[35%] top-[70%] flex h-5 w-5 items-center justify-center rounded-full bg-primary/80"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1.2 }}
                >
                  <span className="text-xs font-bold text-primary-foreground">!</span>
                </motion.div>
              </div>
              <motion.div
                className="mt-4 flex flex-wrap items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-sm text-muted-foreground">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">Medium/Low</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.3}>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Hotspot List</CardTitle>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <StaggerContainer className="space-y-3" delay={0.4}>
                {filteredHotspots.map((hotspot) => (
                  <StaggerItem key={hotspot.id}>
                    <motion.div
                      className="rounded-lg border border-border bg-muted/30 p-3 transition-colors"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{hotspot.location}</span>
                        </div>
                        <SeverityBadge severity={hotspot.severity} />
                      </div>
                      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />
                          {hotspot.wasteType}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {hotspot.reports} reports
                          </span>
                          <TrendIndicator trend={hotspot.trend} />
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Updated: {hotspot.lastUpdated}
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" size="sm" className="mt-2 w-full text-xs bg-transparent">
                          <Eye className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
                      </motion.div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </div>
  )
}