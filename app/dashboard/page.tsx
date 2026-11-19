"use client";

import { clearTokens, getUserId } from "@/lib/auth";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
// import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Position {
  position_id: number;
  position_code: string;
  position_name: string;
  id?: number;
  created_at?: string;
  updated_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  // Data states
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states (shared for Create and Update)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [positionCode, setPositionCode] = useState("");
  const [positionName, setPositionName] = useState("");

  // READ (All Positions)
  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<Position[]>(CONFIG.ENDPOINTS.POSITIONS, {
        method: "GET",
        requiresAuth: true,
      });
      setPositions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch positions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      fetchPositions();
    }
  }, [isChecking, fetchPositions]);

  // READ (Single Position)
  const handleViewPosition = async (positionId: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<Position>(
        `${CONFIG.ENDPOINTS.POSITIONS}/${positionId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );
      setSelectedPosition(data);
    } catch (err: any) {
      setError(err.message || "Failed to load position details.");
    }
  };

  // Open Form for CREATE
  const openCreateForm = () => {
    setEditingId(null);
    setPositionCode("");
    setPositionName("");
    setSelectedPosition(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // Open Form for UPDATE
  const openEditForm = (position: Position) => {
    setEditingId(position.position_id);
    setPositionCode(position.position_code);
    setPositionName(position.position_name);
    setSelectedPosition(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setPositionCode("");
    setPositionName("");
  };

  // CREATE & UPDATE Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const userId = getUserId();
    if (!userId) {
      setError("Unable to determine user ID from token. Please log in again.");
      setSubmitting(false);
      return;
    }

    try {
      if (editingId !== null) {
        // UPDATE (PUT /positions/:id)
        await apiClient(`${CONFIG.ENDPOINTS.POSITIONS}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({
            position_code: positionCode,
            position_name: positionName,
            id: userId,
          }),
        });
        setSuccess(`Position #${editingId} updated successfully.`);
      } else {
        // CREATE (POST /positions)
        await apiClient(CONFIG.ENDPOINTS.POSITIONS, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify({
            position_code: positionCode,
            position_name: positionName,
            id: userId,
          }),
        });
        setSuccess("New position created successfully.");
      }

      closeForm();
      await fetchPositions();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE (DELETE /positions/:id)
  const handleDelete = async (positionId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Position #${positionId}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await apiClient(`${CONFIG.ENDPOINTS.POSITIONS}/${positionId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      if (selectedPosition?.position_id === positionId) {
        setSelectedPosition(null);
      }
      setSuccess(`Position #${positionId} deleted successfully.`);
      await fetchPositions();
    } catch (err: any) {
      setError(err.message || "Failed to delete position.");
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navbar */}
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage organization positions
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>

        {/* Status Notifications */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 rounded-md border border-emerald-200 dark:border-emerald-900">
            {success}
          </div>
        )}

        {/* CREATE / UPDATE Form Card */}
        {isFormOpen && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>
                  {editingId !== null
                    ? `Update Position #${editingId}`
                    : "Create New Position"}
                </CardTitle>
                <CardDescription>
                  {editingId !== null
                    ? "Modify the position code and name below."
                    : "Fill in the details to add a new position."}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position_code">Position Code</Label>
                    <Input
                      id="position_code"
                      placeholder="e.g. Pres"
                      value={positionCode}
                      onChange={(e) => setPositionCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position_name">Position Name</Label>
                    <Input
                      id="position_name"
                      placeholder="e.g. President"
                      value={positionName}
                      onChange={(e) => setPositionName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? "Saving..."
                      : editingId !== null
                      ? "Save Changes"
                      : "Create Position"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* READ Single Item Details Card */}
        {selectedPosition && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>
                  Position Details (#{selectedPosition.position_id})
                </CardTitle>
                <CardDescription>
                  Fetched directly from GET /positions/
                  {selectedPosition.position_id}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPosition(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Position ID</span>
                <span className="font-medium">
                  {selectedPosition.position_id}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Code</span>
                <span className="font-medium">
                  {selectedPosition.position_code}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Name</span>
                <span className="font-medium">
                  {selectedPosition.position_name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Created At</span>
                <span className="font-medium">
                  {selectedPosition.created_at
                    ? new Date(selectedPosition.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Positions Table Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Positions</CardTitle>
              <CardDescription>
                A list of all positions stored in the backend.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchPositions}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Read / Refresh
              </Button>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Position
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">ID</TableHead>
                    <TableHead>Position Code</TableHead>
                    <TableHead>Position Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Loading positions...
                      </TableCell>
                    </TableRow>
                  ) : positions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No positions found. Click &quot;Create Position&quot; to
                        add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    positions.map((pos) => (
                      <TableRow key={pos.position_id}>
                        <TableCell className="font-medium">
                          {pos.position_id}
                        </TableCell>
                        <TableCell>{pos.position_code}</TableCell>
                        <TableCell>{pos.position_name}</TableCell>
                        <TableCell>
                          {pos.created_at
                            ? new Date(pos.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewPosition(pos.position_id)
                              }
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Read
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditForm(pos)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(pos.position_id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
