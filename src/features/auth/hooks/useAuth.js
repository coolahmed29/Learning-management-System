/**
 * The hook every feature uses to read "who is logged in" and to log out —
 * abstracts whether data comes from Redux, Supabase session, or both.
 */
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { clearUser } from "../../../store/slices/authSlice";
import * as authApi from "../api/authApi";

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = useSelector((state) => state.auth.user);
  const isLoading = useSelector((state) => state.auth.isLoading);

  const logout = useCallback(async () => {
    await authApi.logout();
    dispatch(clearUser());
    queryClient.clear();
    navigate("/");
  }, [dispatch, navigate, queryClient]);

  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    logout,
  };
}
