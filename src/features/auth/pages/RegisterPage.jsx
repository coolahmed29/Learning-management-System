/**
 * Route-level page for /register — mirrors LoginPage. If registration succeeds
 * WITHOUT an immediate session (email confirmation flow), does NOT redirect —
 * RegisterForm shows the confirmation message inline (redirect only fires when
 * `user` is actually set).
 */
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../../../providers/ThemeProvider";
import { RegisterForm } from "../components/RegisterForm";
import {
  pageVariants,
  pageVariantsReduced,
  getMotionProps,
} from "../../../animations";

const DASHBOARDS = {
  student: "/dashboard",
  instructor: "/instructor/dashboard",
  admin: "/admin/dashboard",
};

export function RegisterPage() {
  const { user } = useAuth();
  const { prefersReducedMotion } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(DASHBOARDS[user.role] ?? "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <motion.div
      variants={getMotionProps(pageVariants, pageVariantsReduced, prefersReducedMotion)}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
        <h1 className="text-heading font-semibold text-carbon">Create your account</h1>
        <p className="mt-2 mb-8 text-body text-ash">
          Join as a student or an instructor.
        </p>
        <RegisterForm />
        <p className="mt-6 text-body-sm text-ash">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-link-blue hover:underline">
            Log in
          </Link>
        </p>
      </section>
    </motion.div>
  );
}
