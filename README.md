<div align="center">
  <img src="logo.png" alt="Personal OS Logo" width="140" />

  # Personal OS

  <p><code>"$ sudo organise my-life"</code></p>

  <p><strong>A modern, private, and extensible all-in-one personal operating system and life management dashboard.</strong><br />
  Built with <strong>React 18</strong>, <strong>TypeScript</strong>, <strong>Tailwind CSS</strong>, <strong>shadcn/ui</strong>, <strong>Supabase</strong>, and <strong>Capacitor</strong> for native Android support.</p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18-blue.svg?logo=react" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.5-blue.svg?logo=typescript" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.4-purple.svg?logo=vite" alt="Vite" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database%20%26%20Edge%20Functions-3ECF8E.svg?logo=supabase" alt="Supabase" /></a>
    <a href="https://capacitorjs.com/"><img src="https://img.shields.io/badge/Capacitor-8.0%20(Android)-119EFF.svg?logo=capacitor" alt="Capacitor" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  </p>

  <p>
    🚀 <strong>Live Demo:</strong> Experience Personal OS in Guest Mode directly at <strong><a href="https://vinayvp.netlify.app/app/guest">vinayvp.netlify.app/app/guest</a></strong>
  </p>
</div>

---

## 📖 Overview

**Personal OS** centralizes your daily productivity, financial tracking, habits, career search, and personal knowledge management into a unified, lightning-fast dashboard. Designed for privacy, cross-device accessibility, and keyboard-first navigation, it functions both as a desktop/mobile web application and as a native Android app with biometric authentication and system share-sheet integration.

> 🎮 **Live Interactive Demo:** Want to see how it looks and works right away? Head over to **[https://vinayvp.netlify.app/app/guest](https://vinayvp.netlify.app/app/guest)** to immediately explore all 9 sub-applications with realistic sample data without signing in!

---

## ✨ Features & Sub-Applications

Personal OS consists of 9 integrated sub-applications sharing a cohesive design language:

| Sub-App | Description | Key Capabilities |
| :--- | :--- | :--- |
| 📊 **Daily Tracker** | Habit & routine tracker | Daily completion tracking, streaks, visual progress analytics, and custom metrics. |
| 💰 **Financial Suite** | Personal wealth & investment tracker | Net worth tracking, multi-currency conversion (FastForex), SIP automation, and live crypto pricing. |
| 💼 **Job Tracker** | Career pipeline & application CRM | Kanban stages, status updates, notes, and **instant URL ingestion** from LinkedIn, Indeed, Glassdoor, etc. |
| 🎬 **Movies & Shows** | Media watchlist & rating tracker | IMDb metadata auto-fetching, genre tags, personal ratings, and watch status. |
| 🔒 **Private Journal** | Protected personal journaling | PIN/Biometric lock, daily prompts, mood tags, and secure encrypted storage. |
| 📝 **Notes** | Fast markdown scratchpad | Markdown rendering, syntax highlighting, search, and category filtering. |
| ✅ **Todos** | Task & sprint management | Priority levels, due dates, categorizations, and completion history. |
| 💡 **Life Lessons** | Personal insights & principles | Categorized life lessons, mental models, quotes, and wisdom repository. |
| 🧠 **Revision** | Active recall & flashcards | Spaced repetition system for continuous learning and interview prep. |

---

## 🚀 Key Architecture Highlights

### 📱 1. Deep Android Integration (Capacitor)
- **Native Android App**: Packaged via Capacitor with native performance and responsive layouts tailored for mobile.
- **Android Share Target**: Share links directly from Chrome, LinkedIn, IMDb, or any other app via Android's native **Share Sheet**. Personal OS classifies the URL and routes it automatically (e.g. IMDb links open directly in the Movies app; job board URLs open in Job Tracker).
- **Biometric Authentication**: Fingerprint and Face Unlock support via `capacitor-native-biometric`.

### 🛡️ 2. Zero-Leak "Guest Mode" Architecture
Personal OS features an isolated **Guest Mode** (`/guest` or `/app/guest`):
- **Dynamic Supabase Proxy**: Uses an ES6 Proxy (`src/integrations/supabase/appClient.ts`) to dynamically route queries:
  - **Owner Mode (`/app`)**: Reads/writes to your private production database.
  - **Guest Mode (`/guest`)**: Routes to a separate guest database or an in-memory mock client.
- **Zero Configuration Fallback**: If no guest database credentials are supplied, the app automatically runs against realistic local mock data, allowing anyone cloning the repository to experience the full UI immediately.
- **Interactive Walkthroughs**: Built-in step-by-step interactive tutorial modals for each sub-app (`src/components/tutorials/`).

---

## 🛠️ Tech Stack

- **Frontend Core**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Animations & Interaction**: [Framer Motion](https://www.framer.com/motion/), [Sonner Toasts](https://sonner.emilkowal.ski/), [Cmdk](https://cmdk.paco.me/)
- **State & Data Fetching**: [TanStack Query (React Query) v5](https://tanstack.com/query/latest)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Deno Edge Functions)
- **Mobile**: [Capacitor 8](https://capacitorjs.com/) (`@capacitor/android`, `@capacitor/core`)
- **Package Manager**: [Bun](https://bun.sh/) or [npm](https://www.npmjs.com/)

---

## 🏁 Getting Started

### Prerequisites
- **Node.js** (v18 or later) or **Bun** (v1.0+)
- **Git**
- *(Optional)* **Supabase CLI** for local database functions
- *(Optional)* **Android Studio** for Android builds

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/personal-os.git
cd personal-os
```

### 2. Install Dependencies
```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
# Main Production Supabase Database
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"

# External APIs
VITE_FASTFOREX_API_KEY="your-fastforex-api-key"

# Optional: Dedicated Guest Database (Leave blank to use built-in local mock mode)
VITE_GUEST_SUPABASE_URL="https://your-guest-project-id.supabase.co"
VITE_GUEST_SUPABASE_PUBLISHABLE_KEY="your-guest-supabase-publishable-key"
```

> **Note:** If you do not configure Supabase credentials right away, you can visit `/guest` in your browser to test the application using the built-in offline mock data.

### 4. Run Development Server
```bash
npm run dev
# Or with bun:
bun dev
```
Open [http://localhost:8080](http://localhost:8080) (or the port displayed in your terminal) to explore the app.

---

## 🗄️ Database Setup (Supabase)

1. Create a new project at [Supabase](https://supabase.com/).
2. Run database migrations located in `supabase/migrations/` via the Supabase Dashboard SQL Editor or Supabase CLI:
   ```bash
   supabase db push
   ```
3. To seed realistic sample data for guest mode or demo instances, execute [`supabase/guest_db_setup.sql`](supabase/guest_db_setup.sql) in your SQL editor.
4. *(Optional)* Deploy the Supabase Edge Functions:
   ```bash
   supabase functions deploy check-app-password
   supabase functions deploy check-journal-pin
   supabase functions deploy execute-sips
   supabase functions deploy get-crypto-price
   supabase functions deploy search-movie
   ```

---

## 📱 Building for Android

Personal OS is ready for Android compilation using Capacitor:

```bash
# 1. Build the web application
npm run build

# 2. Sync web assets with the native Android project
npx cap sync android

# 3. Open in Android Studio to build APK / AAB
npx cap open android
```

From Android Studio, you can run the app on an emulator, install it via USB debugging, or generate a release APK/Bundle.

---

## 📂 Project Structure

```text
personal-os/
├── android/                   # Native Android Capacitor wrapper project
├── docs/                      # Architectural design specifications
│   └── GUEST_MODE_ARCHITECTURE.md
├── public/                    # Static public assets
├── src/
│   ├── components/            # UI components and sub-apps
│   │   ├── common/            # Error boundaries, shared helpers
│   │   ├── financial/         # Financial suite components
│   │   ├── tutorials/         # Interactive onboarding & tutorial guides
│   │   ├── ui/                # shadcn/ui primitive library
│   │   ├── FinancialApp.tsx   # Wealth & investments
│   │   ├── JobTrackerApp.tsx  # Job application tracker
│   │   ├── JournalApp.tsx     # Secure journal
│   │   ├── LessonsApp.tsx     # Life lessons
│   │   ├── MoviesApp.tsx      # Media watchlist
│   │   ├── NotesApp.tsx       # Markdown notes
│   │   ├── RevisionApp.tsx    # Flashcards & revision
│   │   ├── TodoApp.tsx        # Task manager
│   │   └── TrackingApp.tsx    # Daily habit tracker
│   ├── integrations/          # Supabase client, dynamic proxy, mock state
│   ├── pages/                 # Route entrypoints (Apps.tsx, NotFound.tsx)
│   ├── App.tsx                # App router and provider hierarchy
│   └── main.tsx               # Application bootstrap
├── supabase/                  # Supabase functions, migrations & seed scripts
├── capacitor.config.ts        # Capacitor mobile configuration
└── vite.config.ts             # Vite build configuration
```

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: PostgreSQL tables are protected by strict RLS policies.
- **PIN & Biometric Locking**: Sensitive modules (e.g. Journal) require PIN validation or biometric authentication.
- **Zero Leak Architecture**: Owner credentials and private database endpoints are never queried when running in guest mode.

---

## 🤝 Contributing

Contributions, feedback, and feature requests are welcome!
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to adapt and self-host for your personal productivity workflows.
