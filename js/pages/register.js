import { mountHeader } from "../components/header.js";
import { signUp } from "../lib/auth.js";
import { showMsg } from "../lib/utils.js";

const me = await mountHeader("register");
if (me) location.replace("/");

const form = document.getElementById("register-form");
const msg = document.getElementById("msg");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  showMsg(msg, "");
  if (form.password.value.length < 6) return showMsg(msg, "Password must be at least 6 characters.");
  if (form.password.value !== form.confirm.value) return showMsg(msg, "Passwords do not match.");
  btn.disabled = true;
  const res = await signUp(form.email.value, form.password.value);
  if (res.error) { showMsg(msg, res.error); btn.disabled = false; return; }
  if (res.loggedIn) { location.href = "/"; return; }
  showMsg(msg, "Account created. Check your email to confirm it, then log in.", "ok");
  form.reset();
  btn.disabled = false;
});
