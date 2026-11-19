"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Stethoscope,
  User,
  UserPlus,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isChecking) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(CONFIG.ROUTES.LOGIN);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-50/50 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 block leading-none">
              CantorCare Clinic
            </span>
            <span className="text-xs text-teal-700 font-medium">
              Staff Onboarding Portal
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Register Clinic Staff
            </h1>
            <p className="text-sm text-slate-500">
              Create your credentials to access the Department Clinic system.
            </p>
          </div>

          {error && (
            <div className="p-3.5 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 text-sm text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Account created! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. nurse_ana or admin01"
                  className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-teal-600"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-teal-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-slate-700 font-medium"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-teal-600"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/20"
            >
              {loading ? (
                "Creating Account..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register Staff Account
                </span>
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href={CONFIG.ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-teal-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Staff Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}