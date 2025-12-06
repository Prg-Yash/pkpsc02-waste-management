"use client";

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Trash2,
  Coins,
  MapPin,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedContainer, StaggerContainer, StaggerItem, HoverScale } from "@/components/animated-container"

const cityStats = [
  { city: "New Delhi", totalWaste: 4250, recycled: 3150, users: 12500, tokens: 45000, trend: "up", change: 12 },
  { city: "Mumbai", totalWaste: 5800, recycled: 4060, users: 18200, tokens: 62000, trend: "up", change: 8 },
  { city: "Bangalore", totalWaste: 3200, recycled: 2560, users: 9800, tokens: 38000, trend: "up", change: 15 },
  { city: "Chennai", totalWaste: 2800, recycled: 1960, users: 7500, tokens: 28000, trend: "down", change: 3 },
  { city: "Hyderabad", totalWaste: 2400, recycled: 1920, users: 6200, tokens: 24000, trend: "up", change: 10 },
  { city: "Pune", totalWaste: 1800, recycled: 1440, users: 4800, tokens: 18000, trend: "up", change: 18 },
]

const monthlyData = [
  { month: "Jul", waste: 15200, recycled: 11400, tokens: 125000 },
  { month: "Aug", waste: 16800, recycled: 12600, tokens: 138000 },
  { month: "Sep", waste: 17500, recycled: 13125, tokens: 145000 },
  { month: "Oct", waste: 18200, recycled: 14560, tokens: 156000 },
  { month: "Nov", waste: 19100, recycled: 15280, tokens: 168000 },
  { month: "Dec", waste: 20250, recycled: 16200, tokens: 182000 },
]

export default function CityReportsPage() {
  const [selectedCity, setSelectedCity] = useState("all")
  const [timeRange, setTimeRange] = useState("6m")
  const [reportType, setReportType] = useState("overview")

  const totalWaste = cityStats.reduce((sum, city) => sum + city.totalWaste, 0)
  const totalRecycled = cityStats.reduce((sum, city) => sum + city.recycled, 0)
  const totalUsers = cityStats.reduce((sum, city) => sum + city.users, 0)
  const totalTokens = cityStats.reduce((sum, city) => sum + city.tokens, 0)

  return (
    <div className="space-y-6">
      <AnimatedContainer>
        <AdminHeader title="City-Level Reports" subtitle="Generate and analyze waste management reports by city" />
      </AnimatedContainer>

      <AnimatedContainer delay={0.1}>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cityStats.map((city) => (
                      <SelectItem key={city.city} value={city.city.toLowerCase()}>
                        {city.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">Last Month</SelectItem>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="waste">Waste Analysis</SelectItem>
                    <SelectItem value="users">User Activity</SelectItem>
                    <SelectItem value="tokens">Token Economy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="bg-transparent">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate PDF
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.15}>
        {[
          {
            icon: Trash2,
            label: "Total Waste Collected",
            value: `${(totalWaste / 1000).toFixed(1)} tons`,
            change: "+12% from last period",
          },
          {
            icon: TrendingUp,
            label: "Recycling Rate",
            value: `${((totalRecycled / totalWaste) * 100).toFixed(1)}%`,
            change: "+5% improvement",
          },
          {
            icon: Users,
            label: "Active Users",
            value: `${(totalUsers / 1000).toFixed(1)}K`,
            change: "+2.5K new users",
          },
          {
            icon: Coins,
            label: "Tokens Distributed",
            value: `${(totalTokens / 1000).toFixed(0)}K`,
            change: "+18% this month",
          },
        ].map((stat, index) => (
          <StaggerItem key={stat.label}>
            <HoverScale>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <motion.p
                        className="mt-2 text-2xl font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                        <ArrowUpRight className="h-3 w-3" />
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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedContainer delay={0.25}>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Monthly Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <motion.div
                    key={data.month}
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{data.month}</span>
                      <span className="text-muted-foreground">{data.waste} kg collected</span>
                    </div>
                    <div className="flex gap-1 h-3">
                      <motion.div
                        className="rounded-l bg-primary/30"
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.waste / 25000) * 100}%` }}
                        transition={{ delay: 0.4 + index * 0.08, duration: 0.5 }}
                      />
                      <motion.div
                        className="rounded-r bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.recycled / 25000) * 100}%` }}
                        transition={{ delay: 0.5 + index * 0.08, duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="mt-4 flex items-center gap-4 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-primary/30" />
                  <span className="text-muted-foreground">Total Waste</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-primary" />
                  <span className="text-muted-foreground">Recycled</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer delay={0.3}>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                City Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cityStats.slice(0, 5).map((city, index) => (
                  <motion.div
                    key={city.city}
                    className="space-y-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.08 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{city.city}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {((city.recycled / city.totalWaste) * 100).toFixed(0)}%
                        </span>
                        {city.trend === "up" ? (
                          <motion.span
                            className="flex items-center text-xs text-primary"
                            animate={{ y: [-1, 1, -1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowUpRight className="h-3 w-3" />
                            {city.change}%
                          </motion.span>
                        ) : (
                          <motion.span
                            className="flex items-center text-xs text-destructive"
                            animate={{ y: [1, -1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowDownRight className="h-3 w-3" />
                            {city.change}%
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.4 + index * 0.08, duration: 0.5 }}
                      style={{ originX: 0 }}
                    >
                      <Progress value={(city.recycled / city.totalWaste) * 100} className="h-2" />
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>

      <AnimatedContainer delay={0.4}>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">City-wise Breakdown</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last updated: Dec 6, 2024
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Total Waste (kg)</TableHead>
                  <TableHead>Recycled (kg)</TableHead>
                  <TableHead>Recycling Rate</TableHead>
                  <TableHead>Active Users</TableHead>
                  <TableHead>Tokens Issued</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cityStats.map((city, index) => (
                  <motion.tr
                    key={city.city}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + index * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                    whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {city.city}
                      </div>
                    </TableCell>
                    <TableCell>{city.totalWaste.toLocaleString()}</TableCell>
                    <TableCell>{city.recycled.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                          style={{ originX: 0 }}
                        >
                          <Progress value={(city.recycled / city.totalWaste) * 100} className="h-2 w-20" />
                        </motion.div>
                        <span className="text-sm">{((city.recycled / city.totalWaste) * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{city.users.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-primary" />
                        {city.tokens.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {city.trend === "up" ? (
                        <motion.span
                          className="flex items-center gap-1 text-sm font-medium text-primary"
                          animate={{ y: [-1, 1, -1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <TrendingUp className="h-4 w-4" />+{city.change}%
                        </motion.span>
                      ) : (
                        <motion.span
                          className="flex items-center gap-1 text-sm font-medium text-destructive"
                          animate={{ y: [1, -1, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <TrendingDown className="h-4 w-4" />-{city.change}%
                        </motion.span>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  )
}