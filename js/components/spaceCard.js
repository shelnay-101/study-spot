import { esc, timeAgo } from "../lib/utils.js";

export function spaceCard(s, saved = false) {
  const amenities = [s.has_wifi && "Wi-Fi", s.has_outlets && "Power outlets"].filter(Boolean);
  return `<article class="card" data-card="${s.id}">
    <header><div><h3>${esc(s.name)}</h3><p class="muted">${esc(s.location)}</p></div><span class="badge">${s.type === "quiet" ? "Quiet" : "Group"}</span></header>
    <div class="chips">${amenities.map((a) => `<span>${a}</span>`).join("") || "<span>No extras listed</span>"}</div>
    <div class="seats${s.open_seats === 0 ? " none" : ""}"><strong>${s.open_seats}</strong><span>of ${s.total_seats} seats open</span></div>
    <div class="card-foot"><span class="updated">Updated ${timeAgo(s.last_updated)}</span>
      <button class="save-btn${saved ? " on" : ""}" type="button" data-id="${s.id}" aria-pressed="${saved}">${saved ? "Saved" : "Save"}</button></div>
  </article>`;
}
