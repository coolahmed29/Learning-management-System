/**
 * Encapsulates the login flow as a TanStack Query mutation. On success stores
 * the normalized user identity in Redux via setUser.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { setUser } from "../../../store/slices/authSlice";
import * as authApi from "../api/authApi";

export function useLogin() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => authApi.loginWithPassword(credentials),

    onSuccess: async (result) => {
      if (result.error) {
        throw new Error(authApi.mapAuthError(result.error));
      }

      dispatch(setUser(authApi.mapUser(result.data.user)));
      queryClient.clear();
    },
  });
}