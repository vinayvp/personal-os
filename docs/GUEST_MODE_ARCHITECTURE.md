# Guest Mode & Separate Database Architecture

This document describes the design, setup instructions, and maintenance guidelines for **Guest Mode (`/app/guest`)**.

---

## 1. Executive Summary

Guest Mode allows anyone (interviewers, reviewers, collaborators, friends) to explore all 8 sub-apps with realistic sample data without exposing your personal production data and without requiring passwords or authentication.

Key architectural goals achieved:
1. **Zero Auth**: Direct access via `/app/guest` and via the "Login as Guest" button on the `/app` login card.
2. **Data Isolation**: Guest mode queries a completely separate database (or local isolated storage) so private data is never fetched or modified.
3. **Single-Codebase Reflection**: Any UI update, bug fix, styling adjustment, or new feature added to the main app is **automatically and immediately active in Guest Mode** without maintaining duplicate code.
4. **Interactive Tutorials**: Built-in, step-by-step guides for all 8 sub-apps accessible via a single tap.

---

## 2. How Single-Codebase Reflection Works

Instead of creating duplicate components or fork pages for Guest Mode:
1. Both `/app` (Owner Mode) and `/app/guest` (Guest Mode) share the **exact same React component tree**:
   - [`src/pages/Apps.tsx`](file:///home/vinayak.pastey/Projects/portfolio_and_apps/src/pages/Apps.tsx)
   - `NotesApp`, `TrackingApp`, `TodoApp`, `LessonsApp`, `MoviesApp`, `FinancialApp`, `RevisionApp`, `JobTrackerApp`
2. At [`src/integrations/supabase/client.ts`](file:///home/vinayak.pastey/Projects/portfolio_and_apps/src/integrations/supabase/client.ts), the exported `supabase` instance is an **ES6 Dynamic Proxy**:
   - When the user visits `/app`, queries automatically route to **`mainSupabase`** (your production database).
   - When the user visits `/app/guest` (or `app_mode === 'guest'`), queries automatically route to **`guestSupabase`** (your guest database or local sample sandbox).
3. **Result for Developers**:
   - Whenever you edit any subapp in `src/components/`, **you do not need to do anything extra for guest mode**. The changes will automatically appear in both `/app` and `/app/guest`.

---

## 3. How to Set Up the Separate Guest Supabase Database

You can create your guest Supabase database at any time. Until you do, the app automatically runs in local sample data mode.

### Step 1: Create a New Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New Project** (e.g. name it `vinayak-portfolio-guest`).
3. Set your database password and choose a region close to your users.

### Step 2: Run the Turnkey SQL Script
1. In your new project dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file [`supabase/guest_db_setup.sql`](file:///home/vinayak.pastey/Projects/portfolio_and_apps/supabase/guest_db_setup.sql) from this repository, copy all its contents, and paste them into the SQL Editor.
4. Click **Run**.
5. This automatically creates all tables, enables permissive guest RLS policies, and seeds high-quality sample data across all 8 sub-apps!

### Step 3: Add Environment Variables
1. Go to **Project Settings** -> **API** in your guest Supabase dashboard.
2. Copy the **Project URL** and the **anon / public** API Key.
3. Open your project's `.env` file (in the root directory) and add:
   ```env
   VITE_GUEST_SUPABASE_URL="https://<your-guest-project-ref>.supabase.co"
   VITE_GUEST_SUPABASE_PUBLISHABLE_KEY="<your-guest-anon-key>"
   ```
4. Restart your Vite dev server (`npm run dev`) or redeploy to Netlify.

Guest mode will now read and write directly to your dedicated guest Supabase database!

---

## 4. Sub-App Tutorials System

Each subapp has an interactive guide that can be launched from:
1. The top **Guest View Banner** ("Tutorial" button).
2. The desktop header navigation ("Tutorial" button).
3. The mobile dropdown menu ("Sub-App Tutorial & Guide" button).

The tutorial modal ([`src/components/tutorials/SubappTutorialModal.tsx`](file:///home/vinayak.pastey/Projects/portfolio_and_apps/src/components/tutorials/SubappTutorialModal.tsx)) dynamically displays the guide for the currently selected subapp and includes a tab bar allowing users to browse guides for all other subapps without leaving the dialog.

All tutorial copy is defined in [`src/components/tutorials/tutorialData.ts`](file:///home/vinayak.pastey/Projects/portfolio_and_apps/src/components/tutorials/tutorialData.ts) for easy updates.

