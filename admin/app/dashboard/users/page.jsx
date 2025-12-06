"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
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

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@email.com",
    avatar: "/thoughtful-man-portrait.png",
    reports: 45,
    tokens: 1250,
    status: "active",
    flags: 0,
    joinDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@email.com",
    avatar: "/woman-portrait-1.png",
    reports: 32,
    tokens: 890,
    status: "active",
    flags: 1,
    joinDate: "2024-02-20",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.j@email.com",
    avatar: "/thoughtful-man-portrait.png",
    reports: 78,
    tokens: 2100,
    status: "active",
    flags: 0,
    joinDate: "2023-11-10",
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.w@email.com",
    avatar: "/woman-portrait-2.png",
    reports: 15,
    tokens: 320,
    status: "flagged",
    flags: 3,
    joinDate: "2024-03-05",
  },
  {
    id: 5,
    name: "Tom Brown",
    email: "tom.brown@email.com",
    avatar: "/man-portrait-3.png",
    reports: 5,
    tokens: 0,
    status: "banned",
    flags: 5,
    joinDate: "2024-04-12",
  },
  {
    id: 6,
    name: "Emily Davis",
    email: "emily.d@email.com",
    avatar: "/woman-portrait-3.png",
    reports: 62,
    tokens: 1680,
    status: "active",
    flags: 0,
    joinDate: "2023-12-01",
  },
];

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
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState("");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBanUser = (user) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const stats = [
    { icon: Users, label: "Total Users", value: "8,432", color: "bg-primary/10 text-primary" },
    { icon: Shield, label: "Active Users", value: "7,891", color: "bg-primary/10 text-primary" },
    { icon: AlertTriangle, label: "Flagged Users", value: "48", color: "bg-warning/10 text-warning-foreground" },
    { icon: UserX, label: "Banned Users", value: "23", color: "bg-destructive/10 text-destructive" },
  ];

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
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name.split(" ").map((n) => n[0]).join("")}
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            {user.status === "banned" ? (
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleBanUser(user)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Ban User
                                </DropdownMenuItem>
                              </>
                            )}
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

        {/* Ban Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                Ban User
              </DialogTitle>
              <DialogDescription>
                You are about to ban {selectedUser?.name}. This action will prevent them from using the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Avatar>
                  <AvatarImage src={selectedUser?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedUser?.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason for Ban</Label>
                <Textarea
                  placeholder="Enter the reason for banning this user..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive">Confirm Ban</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}