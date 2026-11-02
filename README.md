# Hunar Card 🪪

A simple, honest web app where blue-collar and grey-collar workers (electricians, plumbers, masons, drivers, technicians, delivery staff, and machine operators) build a shareable skill card from simple choices and real work photos, and employers find them.

Built for a 6-hour hackathon with a soft pastel look, plain words, and no password/resume hassles.

---

## What It Is

- **Worker-first**: No email, password, phone number, Aadhaar or ID required. A worker picks a card name (a nickname is fine).
- **Privacy by design**: Location is only a town or area (never an exact address). Contact notes are stored only if the worker turns on the privacy switch.
- **Real proof**: Up to 3 work photos with short captions so craft speaks louder than words.
- **Community trust**: Anyone can vouch for a worker in 140 characters (Customer, Colleague, or Employer).
- **Instant sharing**: Every card gets a unique public link and QR code ready for WhatsApp and printing.
- **Public worker discovery**: Employers can search and filter by trade and area without signing in.

---

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Plain CSS (no Tailwind, custom soft pastel palette with dark mode support)
- **Routing**: `react-router-dom`
- **QR Codes**: `qrcode.react`
- **Backend & Database**: Supabase (PostgreSQL, Storage, Row-Level Security, and Anonymous Authentication)
- **No separate Node.js server needed**

---

## Quick Install & Local Setup

### 1. Install Dependencies
Open your terminal in this directory and run:
```bash
npm.cmd install
```

### 2. Configure Environment Variables
Create your local environment file:
```bash
copy .env.example .env.local
```
Open `.env.local` and paste your Supabase Project URL and Anon/Publishable Key:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key-here
```
*(Note: Never use or paste a service_role key here)*

### 3. Start the Development Server
```bash
npm.cmd run dev
```
Open your browser at `http://localhost:5173`.

---

## Supabase Setup (Step-by-Step)

Follow these simple steps in your Supabase dashboard:

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and log in.
2. Click **New Project**, choose an organization and name it (e.g. `hunar-card`).
3. Set a database password and select your closest region.

### Step 2: Turn on Anonymous Sign-Ins
1. In your project dashboard, click **Authentication** in the left sidebar.
2. Go to **Providers** and expand **Anonymous Sign-Ins**.
3. Toggle **Enable Anonymous Sign-Ins** to **ON** and click **Save**.

### Step 3: Run Database Schema
1. Click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/schema.sql` from this repository, copy all the SQL code, and paste it into the editor.
4. Click **Run**.
   - This creates `skill_cards`, `work_photos`, and `vouches` tables.
   - It turns on Row Level Security (RLS) and sets up all owner and public policies.
   - It creates the `work-photos` storage bucket with folder-level upload permissions.

### Step 4: Confirm the Storage Bucket
1. Click **Storage** in the left sidebar.
2. Check that a bucket named `work-photos` is present and marked as **Public**.
3. If not already public, click the three dots next to `work-photos` -> **Edit bucket** -> toggle **Public bucket** to **ON**.

### Step 5: Get your API Keys
1. Click **Project Settings** (gear icon) -> **API**.
2. Copy the **Project URL** and paste it as `VITE_SUPABASE_URL` in `.env.local`.
3. Copy the **anon / public** key and paste it as `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

---

## Building the App

To create an optimized production build:
```bash
npm.cmd run build
```
This produces ready-to-serve static assets in the `dist/` directory.

To preview the production build locally:
```bash
npm.cmd run preview
```

---

## Render Deployment Guide

You can deploy Hunar Card to **Render** in 3 minutes as a Static Site:

1. Push your repository to GitHub or GitLab.
2. Go to [render.com](https://render.com) and sign in.
3. Click **New +** -> **Static Site**.
4. Connect your GitHub repository.
5. Set the build settings:
   - **Name**: `hunarcard` (or any name you prefer)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
6. Under **Advanced** -> **Add Environment Variable**:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key
7. Under **Redirects/Rewrites**:
   - Click **Add Rule**
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite` (This ensures React Router routes work when refreshed)
8. Click **Create Static Site**.

---

## Honest Note

Skills are self-reported and vouched by people. Hunar Card does not verify skills or guarantee jobs.
