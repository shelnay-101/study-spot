import { mountHeader } from "../components/header.js";
import { signIn } from "../lib/auth.js";
import { showMsg } from "../lib/utils.js";

const me = await mountHeader("login");
if (me) location.replace("/");

const form = document.getElementById("login-form");
const msg = document.getElementById("msg");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  showMsg(msg, "");
  const { error } = await signIn(form.email.value, form.password.value);
  if (error) { showMsg(msg, error); btn.disabled = false; return; }
  location.href = "/";
});
