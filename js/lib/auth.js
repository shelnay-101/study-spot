import { sb, configured } from "./supabase.js";
import { ALLOWED_EMAIL_DOMAIN } from "../config.js";

export async function getSession() {
  if (!configured) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getProfile() {
  try {
    const session = await getSession();
    if (!session) return null;
    const { data } = await sb.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
    return { id: session.user.id, email: session.user.email, role: data?.role ?? "student" };
  } catch {
    return null;
  }
}

export async function signUp(email, password) {
  if (!configured) return { error: "Supabase is not configured yet. See README.md." };
  email = email.trim().toLowerCase();
  if (ALLOWED_EMAIL_DOMAIN && !email.endsWith("@" + ALLOWED_EMAIL_DOMAIN))
    return { error: `Use your university email (@${ALLOWED_EMAIL_DOMAIN}).` };
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) {
    if (/already|registered/i.test(error.message)) return { error: "This email is already registered. Log in instead." };
    return { error: error.message };
  }
  // With email confirmation on, Supabase hides duplicates by returning a user with no identities.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
    return { error: "This email is already registered. Log in instead." };
  if (data.session) return { loggedIn: true };
  // Project still asks for email confirmation: try an immediate login (works once auto-confirm is on).
  const login = await sb.auth.signInWithPassword({ email, password });
  return { loggedIn: !login.error };
}

export async function signIn(email, password) {
  if (!configured) return { error: "Supabase is not configured yet. See README.md." };
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (!error) return {};
  if (/confirm/i.test(error.message)) return { error: "Confirm your email first, then log in." };
  return { error: "Incorrect email or password." };
}

export async function signOut() {
  await sb.auth.signOut();
}
