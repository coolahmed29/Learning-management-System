/**
 * REDUX TOOLKIT SLICE — global client auth state. This is the one deliberate
 * exception to "avoid global state" (Rule 9) because auth identity is needed
 * across unrelated features (Navbar, Sidebar, ProtectedRoute, dashboards).
 *
 * Stores ONLY identity data (who is logged in) — never server data that belongs
 * in TanStack Query's cache (e.g. enrolled courses list), per Rule 5.
 *
 * user shape: { id, email, name, role } | null — normalized by the auth API
 * layer (authApi.mapUser) before it reaches this slice.
 */
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isLoading: true, // true until the initial session-restore check completes
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isLoading = false;
    },
    clearUser(state) {
      state.user = null;
      state.isLoading = false;
    },
    setAuthLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, clearUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;