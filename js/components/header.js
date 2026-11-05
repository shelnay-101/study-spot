import { getProfile, signOut } from "../lib/auth.js";
import { configured } from "../lib/supabase.js";
import { esc } from "../lib/utils.js";

export async function mountHeader(active) {
  const me = await getProfile();
  const link = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  const links = [
    link("/", "Home", "home"),
    link("/#spaces", "Study spaces", "spaces"),
    me ? link("/pages/saved.html", "Saved", "saved") : "",
    me?.role === "admin" ? link("/pages/admin.html", "Admin", "admin") : "",
  ].join("");
  const account = me
    ? `<span class="who" title="${esc(me.email)}">${esc(me.email)}</span><span class="role${me.role === "admin" ? " admin" : ""}">${me.role === "admin" ? "Admin" : "Student"}</span><button class="btn btn-ghost" id="logout" type="button">Log out</button>`
    : `${link("/pages/login.html", "Log in", "login")}<a class="btn btn-gold" href="/pages/register.html">Sign up</a>`;

  document.getElementById("site-header").innerHTML = `
    <header class="site-header"><div class="container bar">
      <a class="brand" href="/"><span class="mark" aria-hidden="true"></span>StudySpot</a>
      <button class="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
      <nav id="nav" class="nav" aria-label="Main">${links}<div class="account">${account}</div></nav>
    </div></header>
    ${configured ? "" : '<div class="setup">Set your Supabase URL and key in <code>js/config.js</code> to turn on accounts and data.</div>'}`;
  document.getElementById("site-footer").innerHTML = `
    <footer class="site-footer"><div class="container"><span>StudySpot</span><span>Find a free study seat on campus.</span></div></footer>`;

  const burger = document.querySelector(".burger");
  const nav = document.getElementById("nav");
  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  burger.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  document.getElementById("logout")?.addEventListener("click", async () => {
    await signOut();
    location.href = "/";
  });
  return me;
}
