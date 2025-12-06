"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin-header"
import { FileText, Users, Truck, MapPin, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedContainer, StaggerContainer, StaggerItem, HoverScale } from "@/components/animated-container"

export default function AdminDashboard() {
  const [stats, setStats] = useState([])
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalTokens, setTotalTokens] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all waste reports
      const wasteResponse = await fetch('/api/waste-reports')
      const wasteData = await wasteResponse.json()
      const allWastes = wasteData.wastes || []

      // Fetch all users
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      const allUsers = usersData.users || []

      // Calculate stats
      const totalReports = allWastes.length
      const collectedWastes = allWastes.filter(w => w.status === 'COLLECTED')
      const pendingWastes = allWastes.filter(w => w.status === 'PENDING')
      const inProgressWastes = allWastes.filter(w => w.status === 'IN_PROGRESS')

      // Calculate total weight collected
      const totalWeightKg = collectedWastes.reduce((sum, waste) => {
        const weight = waste.aiAnalysis?.estimatedWeightKg || 0
        return sum + weight
      }, 0)

      // Calculate hotspots (areas with 3+ wastes within 500m)
      const hotspots = calculateHotspots(allWastes)

      // Calculate total tokens from all users
      const totalTokensSum = allUsers.reduce((sum, user) => sum + (user.globalPoints || 0), 0)

      // Get recent reports (last 10)
      const recent = allWastes
        .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt))
        .slice(0, 10)
        .map(waste => ({
          id: waste.id,
          location: waste.locationRaw || `${waste.city || 'Unknown'}, ${waste.state || ''}`,
          type: waste.aiAnalysis?.wasteType || waste.wasteType || 'Mixed Waste',
          status: waste.status.toLowerCase().replace('_', '-'),
          date: new Date(waste.reportedAt).toISOString().split('T')[0],
          city: waste.city,
          reporter: waste.reporter?.name || 'Unknown',
        }))

      // Update stats
      setStats([
        {
          title: "Total Reports",
          value: totalReports.toLocaleString(),
          change: `${pendingWastes.length} pending`,
          icon: FileText,
          trend: "up",
        },
        {
          title: "Active Users",
          value: allUsers.length.toLocaleString(),
          change: `${allUsers.filter(u => u.enableCollector).length} collectors`,
          icon: Users,
          trend: "up",
        },
        {
          title: "Waste Collected",
          value: totalWeightKg >= 1000 
            ? `${(totalWeightKg / 1000).toFixed(1)} tons`
            : `${totalWeightKg.toFixed(1)} kg`,
          change: `${collectedWastes.length} collections`,
          icon: Truck,
          trend: "up",
        },
        {
          title: "Hotspots Identified",
          value: hotspots.toString(),
          change: `${inProgressWastes.length} in progress`,
          icon: MapPin,
          trend: hotspots > 0 ? "up" : "down",
        },
      ])

      setRecentReports(recent)
      setTotalTokens(totalTokensSum)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateHotspots = (wastes) => {
    if (!wastes || wastes.length === 0) return 0

    const validWastes = wastes.filter(w => {
      const lat = parseFloat(w.latitude)
      const lng = parseFloat(w.longitude)
      return !isNaN(lat) && !isNaN(lng)
    })

    let hotspots = 0
    const processed = new Set()

    validWastes.forEach((waste, index) => {
      if (processed.has(index)) return

      let nearby = 0
      for (let i = index + 1; i < validWastes.length; i++) {
        if (processed.has(i)) continue

        const other = validWastes[i]
        const distance = getDistance(
          waste.latitude, waste.longitude,
          other.latitude, other.longitude
        )

        if (distance <= 0.5) { // 500m radius
          nearby++
          processed.add(i)
        }
      }

      if (nearby >= 2) {
        hotspots++
      }
      processed.add(index)
    })

    return hotspots
  }

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <AnimatedContainer>
        <AdminHeader
          title="Admin Dashboard"
          subtitle="Overview of waste management operations"
          stats={{ label: "Total Tokens", value: totalTokens.toLocaleString() }}
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
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {stat.change}
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
      className: "border-yellow-500 bg-yellow-500/10 text-yellow-700",
    },
    "in-progress": {
      icon: AlertTriangle,
      label: "In Progress",
      className: "border-blue-500 bg-blue-500/10 text-blue-700",
    },
    collected: {
      icon: CheckCircle,
      label: "Collected",
      className: "border-green-500 bg-green-500/10 text-green-700",
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
