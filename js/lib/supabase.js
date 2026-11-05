import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

export const configured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR-ANON");
export const sb = window.supabase.createClient(
  configured ? SUPABASE_URL : "https://placeholder.supabase.co",
  configured ? SUPABASE_ANON_KEY : "placeholder"
);
