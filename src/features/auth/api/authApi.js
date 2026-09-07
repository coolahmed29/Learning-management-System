/**
 * Raw Supabase Auth calls — the ONLY file that talks to supabase.auth.*
 * directly. Hooks call these; these never contain React logic.
 */
import { supabase } from "../../../services/apiClient";

export async function loginWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function registerWithPassword({ name, email, password, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (!error && data?.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      name,
      email,
      role,
    });

    if (profileError) {
      return { data: null, error: profileError };
    }
  }

  return { data, error };
}

export async function logout() {
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) =>
    callback(event, session)
  );
}

export async function getProfile(userId) {
  return supabase.from("profiles").select("*").eq("id", userId).single();
}

export function mapUser(user) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    name: meta.name ?? (user.email ?? ""),
    role: meta.role ?? "student",
  };
}

export function mapAuthError(error) {
  const message = error?.message || "An unexpected error occurred";
  if (message.includes("Invalid login credentials")) {
    return "Incorrect email or password";
  }
  if (/\balready\b.*\bregistered\b/i.test(message)) {
    return "An account with this email already exists";
  }
  return message;
}
