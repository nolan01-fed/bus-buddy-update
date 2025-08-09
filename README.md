# Campus Bus Tracker

Crowdsourced live bus tracking for campuses. Students check in when they board; everyone sees instant updates.

## Features
- Student login (mocked for MVP) and profile-ready architecture
- Preloaded stops and routes (editable in Admin)
- One-tap “Boarded” check-in updates bus position
- Realtime UI via browser storage events (Supabase-ready)
- Admin dashboard: view check-ins, manage stops, override bus position, export CSV

## Tech Stack
- React + Vite + TypeScript + Tailwind (shadcn components)
- LocalStorage mock data layer for MVP
- Supabase recommended for auth, database, and realtime (see below)

## Getting Started
1. npm install
2. npm run dev

## Project Structure
- src/state/mockStore.ts — temporary local storage data layer
- src/pages/Index.tsx — student view
- src/pages/AdminDashboard.tsx — admin dashboard
- src/pages/Login.tsx — mock login

## Going Full-Stack (Recommended)
To enable real authentication, persistent database, and realtime updates across users, connect Supabase in Lovable:
- Click the green Supabase button (top-right) in your Lovable project and connect a project.
- I will then add tables (students, stops, routes, check-ins) with RLS and wire up realtime.

Once connected, I’ll migrate the mockStore to Supabase and implement OTP or University ID login.

<lov-actions>
<lov-link url="https://docs.lovable.dev/integrations/supabase/">Supabase integration docs</lov-link>
</lov-actions>

## Deploy
- Frontend: Vercel/Netlify
- Backend: Supabase provides DB + Realtime; (no separate server needed for MVP)
