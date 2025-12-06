"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Trash2,
  Scale,
  Calendar,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedContainer } from "@/components/animated-container";

const reports = [
  {
    id: "RPT-001",
    location: "Park Avenue, Zone A",
    wasteType: "Plastic Bottles",
    amount: "15 kg",
    reportedBy: "John Doe",
    date: "2024-12-06",
    status: "pending",
    image: "/waste-plastic-bottles.jpg",
  },
  {
    id: "RPT-002",
    location: "Main Street Market",
    wasteType: "Organic Waste",
    amount: "25 kg",
    reportedBy: "Jane Smith",
    date: "2024-12-06",
    status: "in-progress",
    image: "/organic-waste-compost.jpg",
  },
  {
    id: "RPT-003",
    location: "Green Plaza",
    wasteType: "Paper & Cardboard",
    amount: "12 kg",
    reportedBy: "Mike Johnson",
    date: "2024-12-05",
    status: "completed",
    image: "/paper-cardboard-recycling.jpg",
  },
  {
    id: "RPT-004",
    location: "Industrial Zone B",
    wasteType: "E-Waste",
    amount: "8 kg",
    reportedBy: "Sarah Wilson",
    date: "2024-12-05",
    status: "pending",
    image: "/electronic-waste.jpg",
  },
  {
    id: "RPT-005",
    location: "Riverside District",
    wasteType: "Metal Scrap",
    amount: "30 kg",
    reportedBy: "Tom Brown",
    date: "2024-12-04",
    status: "verified",
    image: "/metal-scrap-recycling.jpg",
  },
  {
    id: "RPT-006",
    location: "Downtown Square",
    wasteType: "Glass Bottles",
    amount: "18 kg",
    reportedBy: "Emily Davis",
    date: "2024-12-04",
    status: "rejected",
    image: "/glass-bottles-waste.jpg",
  },
];

function StatusBadge({ status }) {
  const config = {
    pending: {
      icon: Clock,
      label: "Pending",
      className: "border-warning bg-warning/10 text-warning-foreground",
    },
    "in-progress": {
      icon: Clock,
      label: "In Progress",
      className: "border-primary bg-primary/10 text-primary",
    },
    completed: {
      icon: CheckCircle,
      label: "Completed",
      className: "border-primary bg-primary/10 text-primary",
    },
    verified: {
      icon: CheckCircle,
      label: "Verified",
      className: "border-primary bg-primary/10 text-primary",
    },
    rejected: {
      icon: XCircle,
      label: "Rejected",
      className: "border-destructive bg-destructive/10 text-destructive",
    },
  };

  const currentConfig = config[status] || config.pending;
  const Icon = currentConfig.icon;

  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${currentConfig.className}`}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Icon className="h-3 w-3" />
      {currentConfig.label}
    </motion.span>
  );
}

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.wasteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <AnimatedContainer>
        <AdminHeader title="All Reports" subtitle="View and manage waste collection reports" />
      </AnimatedContainer>

      <AnimatedContainer delay={0.1}>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by location, waste type, or reporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Export</Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      <AnimatedContainer delay={0.2}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <motion.div key={filteredReports.length} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <CardTitle className="text-lg font-semibold">Reports ({filteredReports.length})</CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Waste Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredReports.map((report, index) => (
                    <motion.tr
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50"
                      whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                    >
                      <TableCell className="font-medium text-primary">{report.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {report.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                          {report.wasteType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-muted-foreground" />
                          {report.amount}
                        </div>
                      </TableCell>
                      <TableCell>{report.reportedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {report.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  );
}