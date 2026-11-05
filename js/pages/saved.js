import { sb } from "../lib/supabase.js";
import { mountHeader } from "../components/header.js";
import { spaceCard } from "../components/spaceCard.js";
import { getSavedIds, bindSave } from "../lib/saved.js";

const me = await mountHeader("saved");
if (!me) location.replace("/pages/login.html");

const list = document.getElementById("saved-list");
const saved = await getSavedIds();
const emptyHtml = '<div class="empty"><h3>Nothing saved yet</h3><p class="muted">Press Save on any study space and it will be kept here.</p><p style="margin:1rem auto 0"><a class="btn btn-gold" href="/#spaces">Browse study spaces</a></p></div>';

if (!saved.size) {
  list.innerHTML = emptyHtml;
} else {
  const { data, error } = await sb.from("study_spaces").select("*").in("id", [...saved]).order("name");
  list.innerHTML = error ? '<div class="alert alert-error">Could not load your saved spaces.</div>' : data.map((s) => spaceCard(s, true)).join("");
}

bindSave(list, me, saved, (id, on) => {
  if (on) return;
  list.querySelector(`[data-card="${id}"]`)?.remove();
  if (!list.children.length) list.innerHTML = emptyHtml;
});
