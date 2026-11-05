import { sb, configured } from "../lib/supabase.js";
import { mountHeader } from "../components/header.js";
import { spaceCard } from "../components/spaceCard.js";
import { getSavedIds, bindSave } from "../lib/saved.js";

const me = await mountHeader("home");
const saved = me ? await getSavedIds() : new Set();

const list = document.getElementById("spaces-list");
const input = document.getElementById("q");
const form = document.getElementById("search-form");
const count = document.getElementById("result-count");
let term = "";
let timer;

async function load() {
  if (!configured) {
    list.innerHTML = '<div class="empty"><h3>Connect Supabase to see study spaces</h3><p class="muted">Add your project URL and key in js/config.js, then reload.</p></div>';
    return;
  }
  let q = sb.from("study_spaces").select("*").order("name");
  const t = term.trim().replace(/[%,()*\\]/g, " ").trim();
  if (t) q = q.or(`name.ilike.%${t}%,type.ilike.%${t}%,location.ilike.%${t}%`);
  const { data, error } = await q;
  if (error) {
    list.innerHTML = '<div class="empty"><h3>Could not load study spaces</h3><p class="muted">Check your connection and try again.</p></div>';
    return;
  }
  count.textContent = t ? `${data.length} found` : `${data.length} spaces`;
  list.innerHTML = data.length
    ? data.map((s) => spaceCard(s, saved.has(s.id))).join("")
    : '<div class="empty"><h3>No study spaces found</h3><p class="muted">Try a different keyword, or clear the search to see every space.</p></div>';
}

bindSave(list, me, saved);
form.addEventListener("submit", (e) => { e.preventDefault(); term = input.value; load(); });
input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { term = input.value; load(); }, 250); });

load();
if (configured) {
  // Students see admin updates within seconds: realtime push plus a polling fallback.
  sb.channel("spaces-live").on("postgres_changes", { event: "*", schema: "public", table: "study_spaces" }, load).subscribe();
  setInterval(load, 15000);
}
