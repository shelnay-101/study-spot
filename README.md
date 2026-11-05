# StudySpot

Find a free study seat on campus. Plain HTML, CSS and JavaScript with Supabase for accounts and data, ready for GitHub and Vercel. No build step.

Covers the Done cards on the Trello board:

| Card | What it does |
|------|--------------|
| US-01 Account and login | Register with email and password, log in, wrong-password error, duplicate email blocked, logged-in state, log out |
| US-02 Search study spaces | Keyword search over name, type and location; full list when empty; "No study spaces found" message |
| US-11 Update availability | Admin sets open seats (0 to total); students see it within seconds; student access refused by database rules |
| Demo extras | Sign up logs you straight in; students save spaces to a Saved page; admin adds, edits (all details) and deletes spaces |

## Folder structure

```
studyspot/
  index.html              Home: hero, search, study spaces
  pages/                  login.html, register.html, saved.html, admin.html
  css/                    base.css (tokens, forms, buttons), layout.css (header, pages)
  js/
    config.js             Supabase URL, key, optional email domain
    lib/                  supabase.js, auth.js, saved.js, utils.js
    components/           header.js (hamburger nav + footer), spaceCard.js
    pages/                one script per page
  assets/                 favicon.svg
  supabase/               schema.sql (tables, rules, seed data), 02_demo_features.sql
  vercel.json
```

## Setup

1. **Supabase:** create a project. In SQL Editor run `supabase/schema.sql`, then `supabase/02_demo_features.sql` (both can be re-run safely; always keep that order).
2. **Keys:** Project Settings > API. Copy the Project URL and anon key into `js/config.js`.
3. **No email confirmation:** Authentication > Providers > Email > turn "Confirm email" off. (`02_demo_features.sql` also auto-confirms new accounts as a backup.)
4. **Roles:** every sign-up is a **student**. Only SQL can make an admin: run `supabase/04_separate_roles.sql` after editing your admin email in it. The header shows a Student or Admin badge so you always know which account you are in.
5. **If admin cannot edit:** run `supabase/03_fix_admin.sql`, then log out and back in.
6. **Run locally:** `npx serve .` then open the printed address.
6. **GitHub:** `git init`, commit, push to a new repository.
7. **Vercel:** Add New > Project > import the repository. Framework preset "Other", no build command. Deploy.
8. **Supabase URL settings:** Authentication > URL Configuration. Set Site URL to your Vercel address.

## Test checklist

- Register (you land logged in, no email step), log in, wrong password shows an error, same email twice is blocked, log out works.
- Search "library", search "xyz" (shows the empty message), clear the box (shows all).
- As a student, press Save on a space; it appears on the Saved page and stays after logging out and back in.
- As admin, add a space, edit its details, delete it. Set open seats above the total (rejected), then a valid number. Open the home page in another tab and watch it change.
- As a student, the Admin link is hidden and `/pages/admin.html` shows "Administrators only".
- Resize below 860px: the hamburger menu appears.
