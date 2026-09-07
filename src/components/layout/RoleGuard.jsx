/**
 * Stricter version of ProtectedRoute — checks the user's role matches one of
 * the allowed roles. CLIENT-SIDE guard only (UX), not a security boundary —
 * real authorization is enforced server-side via Supabase RLS.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { LoadingState } from "../feedback/LoadingState";

const DEFAULT_DASHBOARDS = {
  student: "/dashboard",
  instructor: "/instructor/dashboard",
  admin: "/admin/dashboard",
};

export function RoleGuard({ allow = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={DEFAULT_DASHBOARDS[user.role] ?? "/dashboard"} replace />;
  }

  return <Outlet />;
}
