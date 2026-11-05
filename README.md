# StudySpot — Full Project

React + Vite campus study-space finder with optional Supabase authentication, database storage, staff authorization, and realtime availability updates.

## Included
- Responsive student campus finder
- Search by room/building
- Quiet/group, minimum seats, walking distance, Wi-Fi and power filters
- Seat counts, space details and last-updated time
- Supabase email/password sign-up and sign-in
- Staff/admin page to update seat availability
- Database RLS policies and realtime refresh
- Demo mode with sample data when Supabase is not configured

## Important scope notes
The six sample spaces and seat counts are placeholders, not verified Siam University locations or live occupancy. Replace them with approved campus data before launch. Reservations are not implemented in this version; booking duration, cancellation, no-show handling and limits should be agreed before building that feature. Staff manually update availability; the app does not automatically count occupied seats.

## 1. Run locally
Requires Node.js 20+ and npm.
```bash
npm install
npm run dev
```
Open the local Vite URL, usually http://localhost:5173. Without Supabase credentials, the finder runs in demo mode.

## 2. Configure Supabase
1. Create a project at https://supabase.com.
2. Copy the Project URL and anon/publishable key from Project Settings → API.
3. Copy `.env.example` to `.env.local` and set:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```
Never use the service_role key in this browser app. Do not commit `.env.local`.

## 3. Create database
Open Supabase SQL Editor and run `supabase/schema.sql`. It creates profiles and study_spaces, enables RLS, adds staff policies, enables realtime and inserts sample rows. If Realtime says the table is already in the publication, remove the `alter publication` line and rerun the rest.

## 4. Promote your first admin
1. Create an account in StudySpot after configuring Supabase.
2. In Supabase → Authentication → Users, copy that user's UUID.
3. Run this in SQL Editor, replacing the placeholder with the real UUID:
```sql
update public.profiles set role='admin' where id='PASTE-USER-UUID-HERE';
```
Use role `staff` for a staff account. Only a trusted project owner should run this command. Users cannot promote themselves through the app.

## 5. Add verified campus spaces
Use Supabase Table Editor or SQL. Required fields: name, building, type (`quiet` or `group`), total_seats, available_seats, distance_minutes, wifi, power_outlets, quiet_environment, description and is_active. Available seats cannot exceed total seats. Set is_active=false to hide a space. Replace the demo distance estimates with a consistent campus walking-time method.

## 6. Build and deploy
```bash
npm run build
```
Vite outputs `dist/`. For Vercel: push the project to GitHub, import the repository, choose Vite, set build command `npm run build`, output directory `dist`, add both VITE_SUPABASE environment variables, then deploy. Redeploy after changing environment variables.

## 7. Push to GitHub
```bash
git init
git add .
git commit -m "Initial StudySpot project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

## Structure
```text
studyspot-project/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── data/demoSpaces.js
│   └── lib/{spaces.js,supabase.js}
└── supabase/schema.sql
```

## Before production
Test student and staff accounts separately. Confirm students cannot update seat counts. Verify campus locations, opening hours and seat counts with the university. Add reservation workflows and an audit log as later development tasks. The app uses only the Supabase anon key; database policies enforce permissions.
