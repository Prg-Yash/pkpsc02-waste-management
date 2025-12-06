"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
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
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedContainer } from "@/components/animated-container";

function StatusBadge({ status }) {
  // Map API status to UI status (only valid statuses: PENDING, IN_PROGRESS, COLLECTED)
  const statusMap = {
    PENDING: "pending",
    IN_PROGRESS: "in-progress",
    COLLECTED: "collected",
  };

  const uiStatus = statusMap[status] || status.toLowerCase() || "pending";

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
    collected: {
      icon: CheckCircle,
      label: "Collected",
      className: "border-primary bg-primary/10 text-primary",
    },
  };

  const currentConfig = config[uiStatus] || config.pending;
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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState(null);
  
  // Column widths state (in pixels, medium width ~150px)
  const [columnWidths, setColumnWidths] = useState({
    serial: 80,
    location: 200,
    wasteType: 150,
    amount: 120,
    reportedBy: 150,
    date: 120,
    status: 130,
    actions: 100,
  });
  
  const [resizingColumn, setResizingColumn] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Map API status to UI status for filtering (only valid statuses)
  const mapApiStatusToUi = (apiStatus) => {
    const statusMap = {
      PENDING: "pending",
      IN_PROGRESS: "in-progress",
      COLLECTED: "collected",
    };
    return statusMap[apiStatus] || apiStatus.toLowerCase();
  };

  // Column resize handlers
  const handleResizeStart = (column, e) => {
    e.preventDefault();
    setResizingColumn(column);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[column]);
  };

  // Add resize event listeners
  useEffect(() => {
    if (!resizingColumn) return;

    const handleResize = (e) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff); // Minimum width 50px
      
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleResizeEnd = () => {
      setResizingColumn(null);
    };

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    
    return () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/waste-reports?status=all");
        
        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }

        const data = await response.json();
        
        // Map API response to UI format, but keep full data for details
        const mappedReports = (data.wastes || []).map((waste) => {
          const wasteType = waste.aiAnalysis?.wasteType || "Unknown";
          const estimatedWeight = waste.aiAnalysis?.estimatedWeightKg || 0;
          const reporterName = waste.reporter?.name || "Unknown";
          const date = new Date(waste.createdAt).toISOString().split("T")[0];

          return {
            id: waste.id,
            location: waste.locationRaw || "Unknown Location",
            wasteType: wasteType,
            amount: `${estimatedWeight} kg`,
            reportedBy: reporterName,
            date: date,
            status: waste.status, // Keep API status for filtering
            uiStatus: mapApiStatusToUi(waste.status), // UI status for display
            image: waste.imageUrl || "",
            // Store full waste data for details dialog
            fullData: waste,
          };
        });

        setReports(mappedReports);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.wasteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status - map UI status filter to API status (only valid statuses)
    let matchesStatus = true;
    if (statusFilter !== "all") {
      const statusMap = {
        pending: "PENDING",
        "in-progress": "IN_PROGRESS",
        collected: "COLLECTED",
      };
      const apiStatusFilter = statusMap[statusFilter];
      matchesStatus = report.status === apiStatusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const handleSerialNumberClick = (reportId) => {
    setSelectedReportId(reportId);
    setIsDialogOpen(true);
  };

  const copyReportId = () => {
    if (selectedReportId) {
      navigator.clipboard.writeText(selectedReportId);
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setIsDetailsDialogOpen(true);
  };

  const handleDelete = async (reportId) => {
    if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingReportId(reportId);
      const response = await fetch(`/api/waste-reports?id=${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete report";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Remove the report from the list
      setReports((prev) => prev.filter((report) => report.id !== reportId));
      
      // Close dialogs if open
      if (isDetailsDialogOpen && selectedReport?.id === reportId) {
        setIsDetailsDialogOpen(false);
        setSelectedReport(null);
      }
      if (isDialogOpen && selectedReportId === reportId) {
        setIsDialogOpen(false);
        setSelectedReportId(null);
      }
    } catch (err) {
      console.error("Error deleting report:", err);
      alert(`Failed to delete report: ${err.message}`);
    } finally {
      setDeletingReportId(null);
    }
  };

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
                    <SelectItem value="collected">Collected</SelectItem>
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading reports...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                <p className="text-destructive font-medium">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Trash2 className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No reports found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table style={{ tableLayout: "fixed", width: "100%" }}>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: columnWidths.serial, minWidth: columnWidths.serial, position: "relative" }}>
                          S.No
                          <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 bg-transparent"
                            onMouseDown={(e) => handleResizeStart("serial", e)}
                          />
                        </TableHead>
                        <TableHead style={{ width: columnWidths.location, minWidth: columnWidths.location, position: "relative" }}>
                          Location
                          <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 bg-transparent"
                            onMouseDown={(e) => handleResizeStart("location", e)}
                          />
                        </TableHead>
                        <TableHead style={{ width: columnWidths.wasteType, minWidth: columnWidths.wasteType, position: "relative" }}>
                          Waste Type
                          <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 bg-transparent"
                            onMouseDown={(e) => handleResizeStart("wasteType", e)}
                          />
                        </TableHead>
                        <TableHead style={{ width: columnWidths.amount, minWidth: columnWidths.amount, position: "relative" }}>
                          Amount
                          <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 bg-transparent"
                            onMouseDown={(e) => handleResizeStart("amount", e)}
                          />
                        </TableHead>
                        <TableHead style={{ width: columnWidths.reportedBy, minWidth: columnWidths.reportedBy, position: "relative" }}>
                          Reported By
                          <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 bg-transparent"
                            onMouseDown={(e) => handleResizeStart("reportedBy", e)}
                          />
                        </TableHead>
                        <TableHead style={{ width: columnWidths.date, minWidth: columnWidths.date, position: "relative" }}>
                          Date
                          <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 bg-transparent"
                            onMouseDown={(e) => handleResizeStart("date", e)}
                          />
                        </TableHead>
                        <TableHead style={{ width: columnWidths.status, minWidth: columnWidths.status, position: "relative" }}>
                          Status
                          <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 bg-transparent"
                            onMouseDown={(e) => handleResizeStart("status", e)}
                          />
                        </TableHead>
                        <TableHead className="text-right" style={{ width: columnWidths.actions, minWidth: columnWidths.actions, position: "relative" }}>
                          Actions
                        </TableHead>
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
                            <TableCell className="font-medium" style={{ width: columnWidths.serial, minWidth: columnWidths.serial }}>
                              <button
                                onClick={() => handleSerialNumberClick(report.id)}
                                className="text-primary hover:underline cursor-pointer font-semibold"
                              >
                                {index + 1}
                              </button>
                            </TableCell>
                            <TableCell style={{ width: columnWidths.location, minWidth: columnWidths.location }}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">{report.location}</span>
                              </div>
                            </TableCell>
                            <TableCell style={{ width: columnWidths.wasteType, minWidth: columnWidths.wasteType }}>
                              <div className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">{report.wasteType}</span>
                              </div>
                            </TableCell>
                            <TableCell style={{ width: columnWidths.amount, minWidth: columnWidths.amount }}>
                              <div className="flex items-center gap-2">
                                <Scale className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">{report.amount}</span>
                              </div>
                            </TableCell>
                            <TableCell style={{ width: columnWidths.reportedBy, minWidth: columnWidths.reportedBy }}>
                              <span className="truncate block">{report.reportedBy}</span>
                            </TableCell>
                            <TableCell style={{ width: columnWidths.date, minWidth: columnWidths.date }}>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">{report.date}</span>
                              </div>
                            </TableCell>
                            <TableCell style={{ width: columnWidths.status, minWidth: columnWidths.status }}>
                              <StatusBadge status={report.uiStatus || report.status} />
                            </TableCell>
                            <TableCell className="text-right" style={{ width: columnWidths.actions, minWidth: columnWidths.actions }}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetails(report)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDelete(report.id)}
                                    disabled={deletingReportId === report.id}
                                  >
                                    {deletingReportId === report.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report ID</DialogTitle>
                    <DialogDescription>
                      The unique identifier for this waste report
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center gap-2 py-4">
                    <code className="flex-1 px-4 py-2 bg-muted rounded-md text-sm font-mono">
                      {selectedReportId || "N/A"}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyReportId}
                      title="Copy Report ID"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* View Details Dialog */}
              <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Report Details</DialogTitle>
                    <DialogDescription>
                      Complete information about this waste report
                    </DialogDescription>
                  </DialogHeader>
                  {selectedReport && selectedReport.fullData && (
                    <div className="space-y-6 py-4">
                      {/* Report Image */}
                      {selectedReport.fullData.imageUrl && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Report Image</h3>
                          <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                            <img
                              src={selectedReport.fullData.imageUrl}
                              alt="Waste report"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "/placeholder-image.jpg";
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Basic Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Report ID</h3>
                          <p className="text-sm text-muted-foreground font-mono">{selectedReport.id}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Status</h3>
                          <StatusBadge status={selectedReport.uiStatus || selectedReport.status} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Reported Date</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedReport.fullData.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {selectedReport.fullData.collectedAt && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Collected Date</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(selectedReport.fullData.collectedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Location Information */}
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Location</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="inline h-4 w-4 mr-1" />
                            {selectedReport.location}
                          </p>
                          {(selectedReport.fullData.city || selectedReport.fullData.state || selectedReport.fullData.country) && (
                            <div className="text-sm text-muted-foreground pl-5">
                              {selectedReport.fullData.city && <span>{selectedReport.fullData.city}, </span>}
                              {selectedReport.fullData.state && <span>{selectedReport.fullData.state}, </span>}
                              {selectedReport.fullData.country && <span>{selectedReport.fullData.country}</span>}
                            </div>
                          )}
                          {selectedReport.fullData.latitude && selectedReport.fullData.longitude && (
                            <p className="text-sm text-muted-foreground pl-5">
                              Coordinates: {selectedReport.fullData.latitude.toFixed(6)}, {selectedReport.fullData.longitude.toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Waste Information */}
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Waste Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Waste Type</p>
                            <p className="text-sm font-medium">{selectedReport.wasteType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Estimated Weight</p>
                            <p className="text-sm font-medium">{selectedReport.amount}</p>
                          </div>
                          {selectedReport.fullData.aiAnalysis?.category && (
                            <div>
                              <p className="text-sm text-muted-foreground">Category</p>
                              <p className="text-sm font-medium capitalize">{selectedReport.fullData.aiAnalysis.category}</p>
                            </div>
                          )}
                          {selectedReport.fullData.aiAnalysis?.confidence && (
                            <div>
                              <p className="text-sm text-muted-foreground">AI Confidence</p>
                              <p className="text-sm font-medium">{(selectedReport.fullData.aiAnalysis.confidence * 100).toFixed(1)}%</p>
                            </div>
                          )}
                        </div>
                        {selectedReport.fullData.aiAnalysis?.notes && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-1">AI Analysis Notes</p>
                            <p className="text-sm">{selectedReport.fullData.aiAnalysis.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Reporter Information */}
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Reporter Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="text-sm font-medium">{selectedReport.fullData.reporter?.name || "Unknown"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{selectedReport.fullData.reporter?.email || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Collector Information */}
                      {selectedReport.fullData.collector && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Collector Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Name</p>
                              <p className="text-sm font-medium">{selectedReport.fullData.collector.name || "Unknown"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="text-sm font-medium">{selectedReport.fullData.collector.email || "N/A"}</p>
                            </div>
                          </div>
                          {selectedReport.fullData.collectorImageUrl && (
                            <div className="mt-4">
                              <h3 className="text-sm font-semibold mb-2">Collection Proof Image</h3>
                              <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                                <img
                                  src={selectedReport.fullData.collectorImageUrl}
                                  alt="Collection proof"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/placeholder-image.jpg";
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setIsDetailsDialogOpen(false)}
                        >
                          Close
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setIsDetailsDialogOpen(false);
                            handleDelete(selectedReport.id);
                          }}
                          disabled={deletingReportId === selectedReport.id}
                        >
                          {deletingReportId === selectedReport.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Report
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </>
            )}
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  );
}