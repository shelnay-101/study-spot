import { sb, configured } from "./supabase.js";

export async function getSavedIds() {
  if (!configured) return new Set();
  const { data } = await sb.from("saved_spaces").select("space_id");
  return new Set((data || []).map((r) => r.space_id));
}

async function setSaved(id, on) {
  const { error } = on
    ? await sb.from("saved_spaces").insert({ space_id: id })
    : await sb.from("saved_spaces").delete().eq("space_id", id);
  return !error || error.code === "23505";
}

// One click handler for every Save button inside `container`.
export function bindSave(container, me, saved, onToggle) {
  container.addEventListener("click", async (e) => {
    const b = e.target.closest(".save-btn");
    if (!b) return;
    if (!me) { location.href = "/pages/login.html"; return; }
    const id = b.dataset.id;
    const on = !saved.has(id);
    b.disabled = true;
    const ok = await setSaved(id, on);
    b.disabled = false;
    if (!ok) return;
    on ? saved.add(id) : saved.delete(id);
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
    b.textContent = on ? "Saved" : "Save";
    onToggle?.(id, on);
  });
}
