"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-teal-700 font-medium">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Initializing Clinic Portal...</span>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiClient<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setTokens(data.accessToken, data.refreshToken);
      router.push(CONFIG.ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || "Invalid staff credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50">
      {/* Left Clinical Branding Hero Panel */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white p-12 flex-col justify-between">
        {/* Decorative Background Rings */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
            <Stethoscope className="h-6 w-6 text-teal-200" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block">
              CantorCare Clinic
            </span>
            <span className="text-xs text-teal-200/80 uppercase tracking-widest">
              Department Operations System
            </span>
          </div>
        </div>

        {/* Center Value Proposition */}
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-950/60 border border-teal-400/30 px-4 py-1.5 text-xs font-medium text-teal-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Authorized Clinical Personnel Only
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Streamlined Clinic &amp; Department Management.
          </h1>

          <p className="text-base text-teal-100/85 leading-relaxed">
            Coordinate outpatient units, specialty wards, diagnostic wings, and
            clinic floor assignments in one unified medical administration
            workspace.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
              <Building2 className="h-5 w-5 text-emerald-300 mb-2" />
              <div className="font-semibold text-sm">Unit Directory</div>
              <p className="text-xs text-teal-100/75 mt-1">
                Real-time tracking of clinical departments and wing locations.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
              <Lock className="h-5 w-5 text-emerald-300 mb-2" />
              <div className="font-semibold text-sm">Role-Protected Access</div>
              <p className="text-xs text-teal-100/75 mt-1">
                Encrypted JWT session authentication for clinic administrators.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 flex items-center justify-between text-xs text-teal-200/70 border-t border-white/10 pt-6">
          <span>CantorCare Medical Network • v2.0</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Clinic Server Connected
          </span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              CantorCare Clinic
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Staff Sign In
              </h2>
              <p className="text-sm text-slate-500">
                Enter your clinic credentials to manage departments.
              </p>
            </div>

            {error && (
              <div className="p-3.5 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2.5">
                <span className="font-semibold">Error:</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-slate-700 font-medium"
                >
                  Staff Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-teal-600"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-slate-700 font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-teal-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/20 transition-all"
              >
                {loading ? (
                  "Authenticating..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In to Clinic Portal
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                New clinic staff member?{" "}
                <Link
                  href={CONFIG.ROUTES.REGISTER}
                  className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}