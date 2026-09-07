/**
 * Encapsulates the registration flow as a TanStack Query mutation. Same pattern
 * as useLogin.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { setUser } from "../../../store/slices/authSlice";
import * as authApi from "../api/authApi";

export function useRegister() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => authApi.registerWithPassword(values),

    onSuccess: async (result) => {
      if (result.error) {
        throw new Error(authApi.mapAuthError(result.error));
      }

      // Session may be null when email confirmation is required
      // (depends on Supabase project auth settings). Handle both cases:
      if (result.data?.session) {
        dispatch(setUser(authApi.mapUser(result.data.user)));
        queryClient.clear();
      }
      // If session is null (confirmation required), do NOT set auth state —
      // the page shows a "check your email to confirm" message instead.
    },
  });
}