"use client";

import { useState, useEffect } from "react"
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
  Loader2,
} from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedContainer, StaggerContainer, StaggerItem, HoverScale } from "@/components/animated-container"
import { generateCityReportPDF } from "@/lib/pdfGenerator"

export default function CityReportsPage() {
  const [selectedCity, setSelectedCity] = useState("all")
  const [timeRange, setTimeRange] = useState("6m")
  const [reportType, setReportType] = useState("overview")
  const [cityStats, setCityStats] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [totals, setTotals] = useState({
    totalWaste: 0,
    totalRecycled: 0,
    totalUsers: 0,
    totalTokens: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Handle PDF generation
  const handleGeneratePDF = () => {
    try {
      setGeneratingPDF(true)
      generateCityReportPDF({
        cityStats,
        monthlyData,
        totals,
        timeRange,
        selectedCity,
      })
    } catch (err) {
      console.error("Error generating PDF:", err)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setGeneratingPDF(false)
    }
  }

  // Fetch city reports data
  useEffect(() => {
    const fetchCityReports = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          timeRange,
          city: selectedCity,
        })
        
        const response = await fetch(`/api/city-reports?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch city reports")
        }
        
        const data = await response.json()
        setCityStats(data.cityStats || [])
        setMonthlyData(data.monthlyData || [])
        setTotals(data.totals || {
          totalWaste: 0,
          totalRecycled: 0,
          totalUsers: 0,
          totalTokens: 0,
        })
      } catch (err) {
        console.error("Error fetching city reports:", err)
        setError(err.message || "Failed to load city reports")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCityReports()
  }, [timeRange, selectedCity])

  const { totalWaste, totalRecycled, totalUsers, totalTokens } = totals

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading city reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AnimatedContainer>
          <AdminHeader title="City-Level Reports" subtitle="Generate and analyze waste management reports by city" />
        </AnimatedContainer>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get unique cities for dropdown (from all data, not filtered)
  const allCities = Array.from(new Set(cityStats.map(c => c.city))).sort()

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
                    {allCities.map((city) => (
                      <SelectItem key={city} value={city.toLowerCase()}>
                        {city}
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
                  <Button 
                    variant="outline" 
                    className="bg-transparent"
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF || loading}
                  >
                    {generatingPDF ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate PDF
                      </>
                    )}
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
            value: totalWaste >= 1000 
              ? `${(totalWaste / 1000).toFixed(1)} tons`
              : `${totalWaste} kg`,
            change: totalWaste > 0 ? "Real-time data" : "No data available",
          },
          {
            icon: TrendingUp,
            label: "Recycling Rate",
            value: totalWaste > 0
              ? `${((totalRecycled / totalWaste) * 100).toFixed(1)}%`
              : "0%",
            change: totalWaste > 0 
              ? `${totalRecycled.toLocaleString()} kg recycled`
              : "No data available",
          },
          {
            icon: Users,
            label: "Active Users",
            value: totalUsers >= 1000
              ? `${(totalUsers / 1000).toFixed(1)}K`
              : `${totalUsers}`,
            change: `${totalUsers} total users`,
          },
          {
            icon: Coins,
            label: "Tokens Distributed",
            value: totalTokens >= 1000
              ? `${(totalTokens / 1000).toFixed(0)}K`
              : `${totalTokens}`,
            change: `${totalTokens.toLocaleString()} total tokens`,
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
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p>No monthly data available for the selected period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlyData.map((data, index) => {
                    const maxWaste = Math.max(...monthlyData.map(d => d.waste), 1)
                    return (
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
                        animate={{ width: `${(data.waste / maxWaste) * 100}%` }}
                        transition={{ delay: 0.4 + index * 0.08, duration: 0.5 }}
                      />
                      <motion.div
                        className="rounded-r bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.recycled / maxWaste) * 100}%` }}
                        transition={{ delay: 0.5 + index * 0.08, duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                    )
                  })}
                </div>
              )}
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
              {cityStats.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p>No city data available for the selected period</p>
                </div>
              ) : (
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
                      <Progress 
                        value={city.totalWaste > 0 ? (city.recycled / city.totalWaste) * 100 : 0} 
                        className="h-2" 
                      />
                    </motion.div>
                  </motion.div>
                  ))}
                </div>
              )}
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
              Last updated: {new Date().toLocaleDateString()}
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
                {cityStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No city data available for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  cityStats.map((city, index) => (
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
                          <Progress 
                            value={city.totalWaste > 0 ? (city.recycled / city.totalWaste) * 100 : 0} 
                            className="h-2 w-20" 
                          />
                        </motion.div>
                        <span className="text-sm">
                          {city.totalWaste > 0 
                            ? `${((city.recycled / city.totalWaste) * 100).toFixed(0)}%`
                            : "0%"}
                        </span>
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  )
}