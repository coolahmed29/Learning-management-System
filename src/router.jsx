/**
 * Single centralized route definition for the entire app. All routes are registered
 * here — no feature defines its own routing logic elsewhere.
 *
 * Starts with Phase 0/1 routes only. Each route is added when its page's phase
 * begins — no pre-registering routes for non-existent pages.
 */
import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "./components/layout/PublicLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { CoursesListPage } from "./features/courses/pages/CoursesListPage";
import { DashboardPage } from "./pages/DashboardPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "courses", element: <CoursesListPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export default router;
