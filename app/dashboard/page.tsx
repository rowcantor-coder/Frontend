"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  HeartPulse,
  Hospital,
  LayoutGrid,
  LayoutList,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { clearTokens, getUserId } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Department {
  department_id: number;
  department_name: string;
  location: string;
  created_at?: string;
  updated_at?: string;
}

const CLINIC_PRESETS = [
  { name: "General Medicine", location: "Main Building, 1st Floor" },
  { name: "Cardiology", location: "Building A, 2nd Floor" },
  { name: "Pediatrics Clinic", location: "North Wing, Room 104" },
  { name: "Dental & Oral Care", location: "East Wing, 1st Floor" },
  { name: "Radiology & Diagnostics", location: "Diagnostic Center, Ground Floor" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [departmentName, setDepartmentName] = useState("");
  const [location, setLocation] = useState("");

  const staffId = typeof window !== "undefined" ? getUserId() : null;

  // READ ALL
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
      setError(err.message || "Failed to load clinic departments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      fetchDepartments();
    }
  }, [isChecking, fetchDepartments]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (dept) =>
        dept.department_name.toLowerCase().includes(q) ||
        dept.location.toLowerCase().includes(q) ||
        String(dept.department_id).includes(q)
    );
  }, [departments, searchQuery]);

  // Stats Metrics
  const uniqueLocationsCount = useMemo(() => {
    const locations = new Set(
      departments.map((d) => d.location.trim().toLowerCase()).filter(Boolean)
    );
    return locations.size;
  }, [departments]);

  const latestDepartment = useMemo(() => {
    if (departments.length === 0) return null;
    return [...departments].sort((a, b) => b.department_id - a.department_id)[0];
  }, [departments]);

  // READ SINGLE
  const handleViewDepartment = async (departmentId: number) => {
    setError("");
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
      setError(err.message || "Failed to fetch department details.");
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setDepartmentName("");
    setLocation("");
    setError("");
    setIsFormOpen(true);
  };

  const openEditForm = (department: Department) => {
    setEditingId(department.department_id);
    setDepartmentName(department.department_name);
    setLocation(department.location);
    setError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setDepartmentName("");
    setLocation("");
  };

  // CREATE & UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const userId = getUserId();
    if (!userId) {
      setError("Session expired. Please sign in again.");
      setSubmitting(false);
      return;
    }

    try {
      if (editingId !== null) {
        await apiClient(`${CONFIG.ENDPOINTS.DEPARTMENTS}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({
            department_name: departmentName,
            location: location,
          }),
        });
        setSuccess(`Clinical Unit #${editingId} updated successfully.`);
      } else {
        await apiClient(CONFIG.ENDPOINTS.DEPARTMENTS, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify({
            department_name: departmentName,
            location: location,
          }),
        });
        setSuccess(`"${departmentName}" added to clinic directory.`);
      }

      closeForm();
      await fetchDepartments();
    } catch (err: any) {
      setError(err.message || "Failed to save clinic department.");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await apiClient(
        `${CONFIG.ENDPOINTS.DEPARTMENTS}/${deleteTarget.department_id}`,
        {
          method: "DELETE",
          requiresAuth: true,
        }
      );

      if (selectedDepartment?.department_id === deleteTarget.department_id) {
        setSelectedDepartment(null);
      }
      setSuccess(
        `Removed "${deleteTarget.department_name}" from clinic directory.`
      );
      setDeleteTarget(null);
      await fetchDepartments();
    } catch (err: any) {
      setError(err.message || "Failed to delete department.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-teal-700 font-medium">
          <Activity className="h-5 w-5 animate-spin" />
          <span>Loading CantorCare Clinic Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100/70 text-slate-900">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 bg-gradient-to-b from-teal-950 via-teal-900 to-emerald-950 text-white shadow-xl z-30">
        {/* Clinic Brand */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-200">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block leading-none">
              CantorCare
            </span>
            <span className="text-[11px] uppercase tracking-widest text-teal-300/80 mt-1 block">
              Medical Portal
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-300/60 mb-2">
              Clinic Operations
            </p>
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/15 text-white font-medium text-sm shadow-xs border border-white/10"
              >
                <Hospital className="h-4 w-4 text-emerald-300" />
                <span>Clinic Departments</span>
                <span className="ml-auto rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                  {departments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-teal-100/80 hover:bg-white/10 hover:text-white font-medium text-sm transition-colors"
              >
                <Plus className="h-4 w-4 text-teal-300" />
                <span>Register New Unit</span>
              </button>

              <button
                type="button"
                onClick={fetchDepartments}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-teal-100/80 hover:bg-white/10 hover:text-white font-medium text-sm transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 text-teal-300 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                <span>Sync Directory</span>
              </button>
            </nav>
          </div>

          {/* Clinic Status Card */}
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              System Online
            </div>
            <p className="text-xs text-teal-100/75 leading-relaxed">
              Connected to CantorCare Clinical Database. All department changes
              sync in real time.
            </p>
          </div>
        </div>

        {/* Staff Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/15 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/30 border border-teal-300/30 text-xs font-bold text-teal-100">
              #{staffId ?? "ST"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Clinic Administrator
              </p>
              <p className="text-xs text-teal-300/80 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Staff ID #{staffId ?? "Active"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start rounded-xl text-red-200 hover:text-white hover:bg-red-500/25 border border-red-400/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-teal-950 text-white p-6 flex flex-col justify-between z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="h-6 w-6 text-emerald-400" />
                  <span className="font-bold text-lg">CantorCare</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-teal-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCreateForm();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-sm font-medium"
                >
                  <Plus className="h-4 w-4 text-emerald-300" />
                  Register New Unit
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    fetchDepartments();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4 text-teal-300" />
                  Sync Directory
                </button>
              </nav>
            </div>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 lg:pl-68 flex flex-col min-w-0">
        {/* Top Mobile/Tablet Header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Department Clinic Portal
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Staff #{staffId ?? "Active"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Welcome Clinic Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-600 p-6 sm:p-8 text-white shadow-lg shadow-teal-900/15">
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-24 -bottom-16 h-44 w-44 rounded-full bg-emerald-300/15 blur-xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-xs px-3 py-1 text-xs font-medium text-teal-50">
                  <HeartPulse className="h-3.5 w-3.5 text-emerald-300" />
                  CantorCare Medical Center • Outpatient &amp; Specialty Wings
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Clinical Departments &amp; Units
                </h1>
                <p className="text-sm text-teal-100/90 leading-relaxed">
                  Manage active medical departments, building wings, and floor
                  assignments across the clinic.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button
                  onClick={fetchDepartments}
                  disabled={loading}
                  variant="secondary"
                  className="rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={openCreateForm}
                  className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-semibold shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Clinic Unit
                </Button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center justify-between p-4 text-sm text-red-700 bg-red-50 rounded-2xl border border-red-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")}>
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center justify-between p-4 text-sm text-emerald-800 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess("")}>
                <X className="h-4 w-4 text-emerald-600" />
              </button>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
                <Hospital className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Active Departments
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {departments.length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Clinic Wings / Floors
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {uniqueLocationsCount}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Latest Registered
                </p>
                <p className="text-base font-bold text-slate-900 truncate mt-0.5">
                  {latestDepartment
                    ? latestDepartment.department_name
                    : "None yet"}
                </p>
              </div>
            </div>
          </div>

          {/* Search & View Toggle Toolbar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search department (e.g. Cardiology, Main Building)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/70 focus-visible:bg-white focus-visible:ring-teal-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-xs font-medium text-slate-500">
                {filteredDepartments.length} unit
                {filteredDepartments.length === 1 ? "" : "s"}
              </span>

              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-teal-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "table"
                      ? "bg-white text-teal-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Content Area: Loading / Empty / Grid Cards / Table */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-500">
              <RefreshCw className="h-7 w-7 animate-spin text-teal-600 mx-auto mb-3" />
              <p className="font-medium">Loading clinic units...</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
                <Hospital className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {searchQuery
                  ? "No matching clinic departments"
                  : "No clinic departments registered"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                {searchQuery
                  ? "Try clearing your search filter to see all clinical units."
                  : "Start building your clinic directory by registering your first department."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={openCreateForm}
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Clinic Unit
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* MODERN CLINIC CARDS GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.department_id}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-sm shadow-xs">
                          {dept.department_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                            UNIT #{String(dept.department_id).padStart(3, "0")}
                          </span>
                          <h3 className="font-bold text-base text-slate-900 mt-1 group-hover:text-teal-800 transition-colors">
                            {dept.department_name}
                          </h3>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Open
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
                        <span className="truncate">{dept.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          Added:{" "}
                          {dept.created_at
                            ? new Date(dept.created_at).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "Active Record"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDepartment(dept.department_id)}
                      className="h-8 px-2.5 rounded-lg text-xs font-semibold text-teal-700 hover:bg-teal-100/70"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Details
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(dept)}
                        className="h-8 px-2.5 rounded-lg text-xs font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(dept)}
                        className="h-8 px-2.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-6 w-24">ID</th>
                      <th className="py-3.5 px-6">Clinical Department</th>
                      <th className="py-3.5 px-6">Wing / Location</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredDepartments.map((dept) => (
                      <tr
                        key={dept.department_id}
                        className="hover:bg-teal-50/30 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">
                          #{String(dept.department_id).padStart(3, "0")}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {dept.department_name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            <MapPin className="h-3.5 w-3.5 text-teal-600" />
                            {dept.location}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleViewDepartment(dept.department_id)
                              }
                              className="h-8 px-2.5 rounded-lg text-teal-700 hover:bg-teal-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditForm(dept)}
                              className="h-8 px-2.5 rounded-lg text-amber-700 hover:bg-amber-50"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(dept)}
                              className="h-8 px-2.5 rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE / UPDATE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <Hospital className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {editingId !== null
                      ? `Update Clinic Unit #${editingId}`
                      : "Register New Clinic Department"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingId !== null
                      ? "Modify clinical department name or floor assignment"
                      : "Assign a new medical unit to the clinic directory"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeForm}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {editingId === null && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    <span>Quick Clinic Templates:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CLINIC_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setDepartmentName(preset.name);
                          setLocation(preset.location);
                        }}
                        className="text-xs rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 px-2.5 py-1 transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="department_name"
                  className="text-slate-700 font-medium"
                >
                  Clinical Department Name
                </Label>
                <Input
                  id="department_name"
                  placeholder="e.g. Cardiology"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-teal-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-slate-700 font-medium"
                >
                  Clinic Wing / Floor Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Building A, 2nd Floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-teal-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  {submitting
                    ? "Saving..."
                    : editingId !== null
                    ? "Save Changes"
                    : "Register Department"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="h-5 w-5 text-teal-200" />
                <h3 className="font-bold">Clinical Unit Record</h3>
              </div>
              <button
                onClick={() => setSelectedDepartment(null)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Unit ID
                </span>
                <span className="font-mono text-sm font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                  #{String(selectedDepartment.department_id).padStart(3, "0")}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Department
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedDepartment.department_name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Location
                </span>
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  {selectedDepartment.location}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Registered On
                </span>
                <span className="text-sm text-slate-600">
                  {selectedDepartment.created_at
                    ? new Date(selectedDepartment.created_at).toLocaleString()
                    : "Active Record"}
                </span>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const dept = selectedDepartment;
                    setSelectedDepartment(null);
                    openEditForm(dept);
                  }}
                  className="rounded-xl"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Unit
                </Button>
                <Button
                  onClick={() => setSelectedDepartment(null)}
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Remove Clinic Department?
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-slate-800">
                    {deleteTarget.department_name}
                  </span>{" "}
                  (#{deleteTarget.department_id}). This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl font-semibold"
              >
                {deleting ? "Removing..." : "Yes, Delete Unit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}