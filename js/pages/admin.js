import { sb } from "../lib/supabase.js";
import { mountHeader } from "../components/header.js";
import { esc, timeAgo } from "../lib/utils.js";

const me = await mountHeader("admin");
const root = document.getElementById("admin-root");

const blank = { name: "", location: "", type: "quiet", total_seats: "", open_seats: "", has_wifi: true, has_outlets: true };

function formHtml(s, adding) {
  return `<form class="edit" ${adding ? 'id="add-form"' : `data-id="${s.id}"`} novalidate>
    <div class="edit-grid">
      <label>Name<input name="name" value="${esc(s.name)}" required></label>
      <label>Location<input name="location" value="${esc(s.location)}" required></label>
      <label>Type<select name="type"><option value="quiet"${s.type === "quiet" ? " selected" : ""}>Quiet</option><option value="group"${s.type === "group" ? " selected" : ""}>Group</option></select></label>
      <label>Total seats<input type="number" name="total" min="1" step="1" value="${s.total_seats}" required></label>
      <label>Open seats<input type="number" name="open" min="0" step="1" value="${s.open_seats}" required></label>
      <label class="check"><input type="checkbox" name="wifi"${s.has_wifi ? " checked" : ""}> Wi-Fi</label>
      <label class="check"><input type="checkbox" name="outlets"${s.has_outlets ? " checked" : ""}> Power outlets</label>
    </div>
    <div class="edit-actions">
      <button class="btn btn-gold" type="submit">${adding ? "Add study space" : "Save changes"}</button>
      ${adding ? "" : '<button class="btn btn-ghost" type="button" data-del>Delete</button>'}
      <span class="msg" role="status">${adding ? "" : "Updated " + timeAgo(s.last_updated)}</span>
    </div></form>`;
}

function read(f) {
  const name = f.name.value.trim(), location = f.location.value.trim();
  const total = Number(f.total.value), open = Number(f.open.value);
  if (!name || !location) return { error: "Name and location are required." };
  if (f.total.value.trim() === "" || !Number.isInteger(total) || total < 1) return { error: "Total seats must be a whole number of 1 or more." };
  if (f.open.value.trim() === "" || !Number.isInteger(open) || open < 0 || open > total) return { error: `Open seats must be a whole number from 0 to ${total}.` };
  return { values: { name, location, type: f.type.value, total_seats: total, open_seats: open, has_wifi: f.wifi.checked, has_outlets: f.outlets.checked } };
}

const say = (f, text, kind) => { const m = f.querySelector(".msg"); m.className = "msg " + kind; m.textContent = text; };

if (!me) {
  location.replace("/pages/login.html");
} else if (me.role !== "admin") {
  root.innerHTML = `<div class="empty"><h3>Administrators only</h3><p class="muted">Signed in as ${esc(me.email)} (role: ${esc(me.role)}). Only accounts with the admin role can change study-space information.</p><p style="margin:1rem auto 0"><a class="btn btn-gold" href="/">Back to home</a></p></div>`;
} else {
  const { data, error } = await sb.from("study_spaces").select("*").order("name");
  if (error) {
    root.innerHTML = '<div class="alert alert-error">Could not load study spaces.</div>';
  } else {
    root.innerHTML = `<div class="panel"><h3>Add a study space</h3>${formHtml(blank, true)}</div>
      <h3 style="margin-bottom:1rem">Existing spaces</h3><div class="admin-list" id="list">${data.map((s) => formHtml(s, false)).join("")}</div>`;
    const listEl = document.getElementById("list");

    root.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const r = read(f);
      if (r.error) return say(f, r.error, "err");
      const btn = f.querySelector("button[type=submit]");
      btn.disabled = true;
      if (f.id === "add-form") {
        const { data: row, error: err } = await sb.from("study_spaces").insert(r.values).select().single();
        btn.disabled = false;
        if (err || !row) return say(f, err ? "Could not add: " + err.message : "Could not add the space.", "err");
        listEl.insertAdjacentHTML("afterbegin", formHtml(row, false));
        f.reset();
        say(f, "Study space added.", "ok");
      } else {
        const { data: rows, error: err } = await sb.from("study_spaces").update(r.values).eq("id", f.dataset.id).select();
        btn.disabled = false;
        if (err || !rows?.length) return say(f, err ? "Could not save: " + err.message : `Refused: this account (role: ${me.role}) is not allowed to edit. Run supabase/03_fix_admin.sql.`, "err");
        say(f, "Saved. Students will see the change within seconds.", "ok");
      }
    });

    root.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-del]");
      if (!b) return;
      const f = b.closest("form");
      if (!confirm("Delete this study space? Students will no longer see it.")) return;
      const { data: rows, error: err } = await sb.from("study_spaces").delete().eq("id", f.dataset.id).select();
      if (err || !rows?.length) return say(f, err ? "Could not delete: " + err.message : "Refused: this account is not allowed to delete.", "err");
      f.remove();
    });
  }
}
