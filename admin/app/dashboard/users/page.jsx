"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Filter,
  Users,
  UserX,
  Shield,
  Coins,
} from "lucide-react";

function StatusBadge({ status }) {
  const config = {
    active: {
      icon: CheckCircle,
      label: "Active",
      className: "border-primary bg-primary/10 text-primary",
    },
    flagged: {
      icon: AlertTriangle,
      label: "Flagged",
      className: "border-warning bg-warning/10 text-warning-foreground",
    },
    banned: {
      icon: Ban,
      label: "Banned",
      className: "border-destructive bg-destructive/10 text-destructive",
    },
  };

  const currentConfig = config[status] || config.active;
  const Icon = currentConfig.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${currentConfig.className}`}>
      <Icon className="h-3 w-3" />
      {currentConfig.label}
    </span>
  );
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from API (using Next.js API route to avoid CORS/auth issues)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching users from /api/users');
        const response = await fetch("/api/users");
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();
        console.log('Users data received:', data);
        
        // Map API response to UI format (matching backend response structure)
        // Store full user data for profile view
        const mappedUsers = (data.users || []).map((user) => {
          // Map backend status: "incomplete" -> "active", keep others as is
          let displayStatus = user.status || "active";
          if (displayStatus === "incomplete") {
            displayStatus = "active";
          }
          
          return {
            id: user.id,
            name: user.name || 'Unknown User',
            email: user.email,
            avatar: null, // No avatar in API response
            reports: user.reportCount || 0, // Backend returns 'reportCount'
            tokens: user.globalPoints || 0,
            status: displayStatus, // Only active, flagged, or banned
            flags: 0, // Not available in current schema
            joinDate: user.joinedAt ? new Date(user.joinedAt).toISOString().split('T')[0] : 'N/A', // Backend returns 'joinedAt'
            // Store full user data for profile dialog
            fullData: user,
          };
        });
        
        console.log('Mapped users:', mappedUsers);
        setUsers(mappedUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setProfileDialogOpen(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedUser) return;
    
    try {
      // Call API to update status in database
      const response = await fetch(`/api/users/${selectedUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Update the user's status in the users array
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, status: newStatus, fullData: { ...u.fullData, status: newStatus } }
          : u
      ));
      
      // Update the selected user's status
      setSelectedUser({
        ...selectedUser,
        status: newStatus,
        fullData: { ...selectedUser.fullData, status: newStatus }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  // Calculate stats from real data
  const stats = [
    { 
      icon: Users, 
      label: "Total Users", 
      value: users.length.toLocaleString(), 
      color: "bg-primary/10 text-primary" 
    },
    { 
      icon: Shield, 
      label: "Active Users", 
      value: users.filter(u => u.status === "active").length.toLocaleString(), 
      color: "bg-primary/10 text-primary" 
    },
    { 
      icon: AlertTriangle, 
      label: "Flagged Users", 
      value: users.filter(u => u.status === "flagged").length.toLocaleString(), 
      color: "bg-warning/10 text-warning-foreground" 
    },
    { 
      icon: UserX, 
      label: "Banned Users", 
      value: users.filter(u => u.status === "banned").length.toLocaleString(), 
      color: "bg-destructive/10 text-destructive" 
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
            <p className="text-destructive">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground">View and manage user accounts, ban fraudulent users</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-lg p-3 ${stat.color.split(" ")[0]}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color.split(" ")[1]}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
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
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="transition-colors hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {user.avatar && <AvatarImage src={user.avatar} />}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.reports}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-primary" />
                          {user.tokens}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${user.flags > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {user.flags}
                        </span>
                      </TableCell>
                      <TableCell>{user.joinDate}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Profile Dialog */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                User Profile
              </DialogTitle>
              <DialogDescription>
                Detailed information about {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser?.fullData && (
              <div className="space-y-6 py-4">
                {/* User Header */}
                <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
                  <Avatar className="h-16 w-16">
                    {selectedUser?.avatar && <AvatarImage src={selectedUser?.avatar} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedUser?.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold break-words">{selectedUser?.name}</h3>
                    <p className="text-sm text-muted-foreground break-words">{selectedUser?.email}</p>
                    <div className="mt-2">
                      <StatusBadge status={selectedUser?.status} />
                    </div>
                  </div>
                </div>

                {/* Status Change Section */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Change Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm">Status:</Label>
                      <Select 
                        value={selectedUser?.status || "active"} 
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="flagged">Flagged</SelectItem>
                          <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* User Information Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="text-sm font-medium break-words">{selectedUser?.fullData.email || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p className="text-sm font-medium break-words">{selectedUser?.fullData.phone || 'Not provided'}</p>
                      </div>
                      {selectedUser?.fullData.phoneVerified !== undefined && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Phone Verified</Label>
                          <p className="text-sm font-medium">
                            {selectedUser?.fullData.phoneVerified ? (
                              <span className="text-green-600">✓ Verified</span>
                            ) : (
                              <span className="text-gray-500">Not verified</span>
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedUser?.fullData.address ? (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">City</Label>
                            <p className="text-sm font-medium break-words">{selectedUser?.fullData.address.city || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">State</Label>
                            <p className="text-sm font-medium break-words">{selectedUser?.fullData.address.state || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Country</Label>
                            <p className="text-sm font-medium break-words">{selectedUser?.fullData.address.country || 'N/A'}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No address provided</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Activity Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Reports Created</Label>
                        <p className="text-sm font-medium">{selectedUser?.fullData.reportCount || 0}</p>
                      </div>
                      {selectedUser?.fullData.enableCollector && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Collections</Label>
                          <p className="text-sm font-medium">{selectedUser?.fullData.collectionCount || 0}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">Join Date</Label>
                        <p className="text-sm font-medium">
                          {selectedUser?.fullData.joinedAt 
                            ? new Date(selectedUser.fullData.joinedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Points & Rewards</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Reporter Points</Label>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Coins className="h-4 w-4 text-primary" />
                          {selectedUser?.fullData.reporterPoints || 0}
                        </p>
                      </div>
                      {selectedUser?.fullData.enableCollector && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Collector Points</Label>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Coins className="h-4 w-4 text-primary" />
                            {selectedUser?.fullData.collectorPoints || 0}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Points</Label>
                        <p className="text-lg font-bold flex items-center gap-1 text-primary">
                          <Coins className="h-5 w-5" />
                          {selectedUser?.fullData.globalPoints || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Collector Status */}
                {selectedUser?.fullData.enableCollector && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">Collector Mode Enabled</p>
                          <p className="text-sm text-muted-foreground">
                            This user can collect waste reports from their area
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}