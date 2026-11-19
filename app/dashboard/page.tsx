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

interface Department {
  department_id: number;
  department_name: string;
  location: string;
  id?: number;
  created_at?: string;
  updated_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states (shared for Create and Update)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [departmentName, setDepartmentName] = useState("");
  const [location, setLocation] = useState("");

  // READ (All Departments)
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<Department[]>(CONFIG.ENDPOINTS.DEPARTMENTS, {
        method: "GET",
        requiresAuth: true,
      });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch departments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      fetchDepartments();
    }
  }, [isChecking, fetchDepartments]);

  // READ (Single Department)
  const handleViewDepartment = async (departmentId: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<Department>(
        `${CONFIG.ENDPOINTS.DEPARTMENTS}/${departmentId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );
      setSelectedDepartment(data);
    } catch (err: any) {
      setError(err.message || "Failed to load department details.");
    }
  };

  // Open Form for CREATE
  const openCreateForm = () => {
    setEditingId(null);
    setDepartmentName("");
    setLocation("");
    setSelectedDepartment(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // Open Form for UPDATE
  const openEditForm = (department: Department) => {
    setEditingId(department.department_id);
    setDepartmentName(department.department_name);
    setLocation(department.location);
    setSelectedDepartment(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setDepartmentName("");
    setLocation("");
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
        // UPDATE (PUT /departments/:id)
        await apiClient(`${CONFIG.ENDPOINTS.DEPARTMENTS}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({
            department_name: departmentName,
            location: location,
            id: userId,
          }),
        });
        setSuccess(`Department #${editingId} updated successfully.`);
      } else {
        // CREATE (POST /departments)
        await apiClient(CONFIG.ENDPOINTS.DEPARTMENTS, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify({
            department_name: departmentName,
            location: location,
            id: userId,
          }),
        });
        setSuccess("New department created successfully.");
      }

      closeForm();
      await fetchDepartments();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE (DELETE /departments/:id)
  const handleDelete = async (departmentId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Department #${departmentId}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await apiClient(`${CONFIG.ENDPOINTS.DEPARTMENTS}/${departmentId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      if (selectedDepartment?.department_id === departmentId) {
        setSelectedDepartment(null);
      }
      setSuccess(`Department #${departmentId} deleted successfully.`);
      await fetchDepartments();
    } catch (err: any) {
      setError(err.message || "Failed to delete department.");
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
              Manage organization departments
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
                    ? `Update Department #${editingId}`
                    : "Create New Department"}
                </CardTitle>
                <CardDescription>
                  {editingId !== null
                    ? "Modify the department name and location below."
                    : "Fill in the details to add a new department."}
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
                    <Label htmlFor="department_name">Department Name</Label>
                    <Input
                      id="department_name"
                      placeholder="e.g. Cardiology"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Building A, 2nd Floor"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
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
                      : "Create Department"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* READ Single Item Details Card */}
        {selectedDepartment && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>
                  Department Details (#{selectedDepartment.department_id})
                </CardTitle>
                <CardDescription>
                  Fetched directly from GET /departments/
                  {selectedDepartment.department_id}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDepartment(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">
                  Department ID
                </span>
                <span className="font-medium">
                  {selectedDepartment.department_id}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Name</span>
                <span className="font-medium">
                  {selectedDepartment.department_name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Location</span>
                <span className="font-medium">
                  {selectedDepartment.location}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Created At</span>
                <span className="font-medium">
                  {selectedDepartment.created_at
                    ? new Date(
                        selectedDepartment.created_at
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Departments Table Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                A list of all departments stored in the backend.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchDepartments}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Read / Refresh
              </Button>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Department
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">ID</TableHead>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Location</TableHead>
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
                        Loading departments...
                      </TableCell>
                    </TableRow>
                  ) : departments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No departments found. Click &quot;Create
                        Department&quot; to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.department_id}>
                        <TableCell className="font-medium">
                          {dept.department_id}
                        </TableCell>
                        <TableCell>{dept.department_name}</TableCell>
                        <TableCell>{dept.location}</TableCell>
                        <TableCell>
                          {dept.created_at
                            ? new Date(dept.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewDepartment(dept.department_id)
                              }
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Read
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditForm(dept)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(dept.department_id)}
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