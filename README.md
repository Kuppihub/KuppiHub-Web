# KuppiHub

> A student learning management platform for sharing and discovering academic resources — kuppi videos, module resources, and more.

---

## Table of Contents

- [What is KuppiHub?](#what-is-kuppihub)
- [Tech Stack](#tech-stack)
- [Quick Start (Developers)](#quick-start-developers)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database](#database)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## What is KuppiHub?

**KuppiHub** is a web platform built for university students to share and discover *kuppi* — supplementary learning content created by peers. This includes:

- 🎥 **Kuppi videos** – Student-recorded YouTube video explanations per module
- 📚 **Module resources** – Study notes, PDFs, and links organized in folders per module
- 🔍 **Module search** – Search and add modules to your personal dashboard
- 📝 **Reviews & comments** – Rate and comment on kuppi content
- 👤 **Authentication** – Firebase Auth with Google sign-in

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) |
| Styling | Vanilla CSS + CSS Modules |
| Auth | [Firebase Auth](https://firebase.google.com/products/auth) (Google sign-in) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Document DB | [MongoDB Atlas](https://cloud.mongodb.com) (kuppi video metadata) |
| Bot protection | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |
| Deployment | [Vercel](https://vercel.com) |

---

## Quick Start (Developers)

### Prerequisites

- **Node.js >= 20** — [nodejs.org](https://nodejs.org)
- **npm >= 10** — bundled with Node.js
- A code editor (VS Code recommended)

### 1. Clone the repository

```bash
git clone <repository-url>
cd KuppiHub-Advanced
```

### 2. Run the setup script

**Linux / macOS:**
```bash
bash setup.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

> **Windows alternative**: If you have [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) installed, you can also just run `bash setup.sh` inside a WSL terminal.

The script will:
- Check your Node.js version
- Copy `env.example` → `.env` (if `.env` does not exist yet)
- Install all `npm` dependencies

### 3. Fill in your `.env`

Open the `.env` file and fill in your credentials. See the [Environment Variables](#environment-variables) section below for where to get each key.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running with Docker

> Use this if you want to run the app in a container — for production or consistent environment testing.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or Docker Engine (Linux)
- A filled-in `.env` file (run setup script first)

### Why two types of env vars?

Next.js has two kinds of environment variables:

| Type | Example | When resolved | Exposed to browser? |
|------|---------|--------------|-------------------|
| **Public** (`NEXT_PUBLIC_*`) | Firebase client key, Turnstile site key | **Build time** (baked into JS bundle) | ✅ Yes (by design) |
| **Secret** (no prefix) | Supabase service role key, Firebase private key | **Runtime** | ❌ No (server only) |

This means `NEXT_PUBLIC_*` vars must be available when the Docker image is **built**. The `docker-compose.yml` handles this automatically by reading them from your `.env`.

### Start the container

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

To stop:
```bash
docker compose down
```

### Rebuild after code changes

```bash
docker compose up --build
```

---


## Environment Variables

After running `bash setup.sh`, a `.env` file is created. Fill in the following:

### Firebase (Authentication)

Go to [Firebase Console](https://console.firebase.google.com) → Your project → **Project Settings → General → Your apps → Web app config**:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

For **server-side admin** (Firebase Admin SDK):  
Go to **Project Settings → Service Accounts → Generate new private key** and download the JSON.

```env
FIREBASE_PROJECT_ID=          # Same as above
FIREBASE_CLIENT_EMAIL=        # "client_email" from the JSON
FIREBASE_PRIVATE_KEY=         # "private_key" from the JSON (keep the \n characters)
```

### Supabase (Database)

Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your project → **Project Settings → API**:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=       # "service_role secret" key (keep private!)
```

### Cloudflare Turnstile (Bot Protection)

Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Turnstile → Add site**:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=   # Site key (public)
TURNSTILE_SECRET_KEY=             # Secret key (private)
```

> **For local testing**: Use the always-passing test keys:
> - Site key: `1x00000000000000000000AA`
> - Secret key: `1x0000000000000000000000000000000AA`

### MongoDB

Go to [MongoDB Atlas](https://cloud.mongodb.com) → Your cluster → **Connect → Drivers**:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?appName=cluster0
MONGODB_DB=cluster0
```

---

## Project Structure

```
KuppiHub-Advanced/
├── src/
│   ├── app/
│   │   ├── api/                  # All Next.js API routes (server-side)
│   │   │   ├── add-kuppi/        # POST: Create a new kuppi video
│   │   │   ├── comments/         # GET/POST/DELETE: Kuppi comments & voting
│   │   │   ├── contact/          # POST: Contact form
│   │   │   ├── dashboard-modules/# GET: User's personal module list
│   │   │   ├── hierarchy/        # GET: Faculty→Dept→Semester→Module tree
│   │   │   ├── kuppi/            # GET: Kuppi video detail + reviews
│   │   │   ├── kuppis/           # GET: List kuppis for a module
│   │   │   ├── module-resources/ # GET/POST: Module folder/resource management
│   │   │   │   ├── folders/      # Folder CRUD
│   │   │   │   ├── sync-github/  # GitHub webhook sync
│   │   │   │   └── upload/       # Link submission (Turnstile protected)
│   │   │   ├── modules/          # GET: Module by code
│   │   │   ├── modules-by-ids/   # GET: Bulk module fetch
│   │   │   ├── my-kuppis/        # GET: Authenticated user's kuppis
│   │   │   ├── notifications/    # Push notification management
│   │   │   ├── releases/         # GET: Latest GitHub release info
│   │   │   ├── search/           # GET: Full-text kuppi search
│   │   │   ├── search-modules/   # GET: Module search
│   │   │   ├── tutors/           # GET: Tutor listings
│   │   │   ├── user-dashboard/   # GET/POST: User module sync
│   │   │   └── users/            # POST: Upsert user record
│   │   │
│   │   ├── components/           # Shared UI components (Header, Search, etc.)
│   │   ├── dashboard/            # /dashboard – Personal module dashboard
│   │   ├── module-kuppi/         # /module-kuppi/[moduleId] – Module kuppi page
│   │   ├── module/               # /module/[moduleCode] – Module detail
│   │   ├── modules/              # /modules – Browse all modules
│   │   ├── login/                # /login – Sign-in page
│   │   ├── add-kuppi/            # /add-kuppi – Submit a kuppi video
│   │   ├── my-kuppis/            # /my-kuppis – Manage own kuppis
│   │   └── ...                   # Other pages (about, faq, contact, etc.)
│   │
│   ├── contexts/                 # React context providers (Auth, etc.)
│   ├── lib/                      # Shared server/client utilities
│   │   ├── firebase.ts           # Firebase client init
│   │   ├── firebase-admin.ts     # Firebase Admin SDK init
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── supabase-admin.ts     # Supabase admin (service role) client
│   │   ├── mongodb.ts            # MongoDB connection
│   │   ├── auth-fetch.ts         # Authenticated fetch wrapper (adds Firebase token)
│   │   ├── auth-utils.ts         # Server-side Firebase token verification
│   │   ├── validation.ts         # Input validation helpers
│   │   ├── rate-limit.ts         # API rate limiting
│   │   └── cache-utils.ts        # Cache helpers
│   ├── types/                    # Shared TypeScript types
│   └── data/                     # Static data files
│
├── supabase_migrations/          # All Supabase SQL migration files (source of truth)
├── scripts/
│   └── supabase-sync-migrations.sh  # Helper: copies migrations → supabase/migrations/
├── public/                       # Static assets
├── env.example                   # Environment variable template
├── setup.sh                      # Developer bootstrap script (run this first!)
├── package.json
└── next.config.ts
```

---

## API Reference

All API routes live under `src/app/api/`. They are standard Next.js App Router route handlers.

### Authentication Pattern

Protected routes verify the Firebase ID token passed in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

Client code uses `authFetch()` from `src/lib/auth-fetch.ts` which automatically attaches the current user's token.

### Key Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/hierarchy` | No | Full faculty→dept→semester→module tree |
| `GET` | `/api/kuppis?moduleId=` | No | Kuppi videos for a module |
| `POST` | `/api/add-kuppi` | Yes | Submit a new kuppi video |
| `GET` | `/api/module-resources?moduleId=` | No | Folders and resources for a module |
| `POST` | `/api/module-resources/upload` | Yes | Submit a resource link (Turnstile required) |
| `GET` | `/api/search?q=` | No | Full-text kuppi search |
| `GET` | `/api/search-modules?q=` | No | Module search |
| `GET` | `/api/dashboard-modules` | Yes | User's personal module list |
| `POST` | `/api/users` | Yes | Create/update user record |
| `GET` | `/api/releases/latest` | No | Latest GitHub release |

---

## Database

### Supabase (PostgreSQL)

All SQL schema and migrations live in `supabase_migrations/`. They must be applied to your Supabase project in chronological order.

**Apply migrations to your Supabase project:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your project → **SQL Editor**
2. Open each `.sql` file from `supabase_migrations/` in order and run them

**Migration files (in order):**

| File | Purpose |
|------|---------|
| `databse.sql` | Core schema: faculties, departments, semesters, modules, students, videos |
| `add_domain_access_control.sql` | Domain allowlist for resource uploads |
| `20260311_security_*.sql` | RLS policies and security hardening |
| `20260329_video_approval_email_webhook.sql` | DB trigger for email on video approval |
| `20260401_enable_rls_for_public_tables.sql` | Enable Row Level Security |
| `20260527_add_approved_to_students.sql` | Student approval flag |
| `20260527_module_resource_library.sql` | Module resource folders & files table |
| `20260529_add_unique_constraint_to_resources.sql` | Prevent duplicate resource submissions |

### MongoDB Atlas

Used to store kuppi video metadata (titles, YouTube links, Telegram links, review data). Connection is managed by `src/lib/mongodb.ts`.

---

## Authentication

KuppiHub uses **Firebase Authentication** with Google sign-in.

- **Client-side**: `src/lib/firebase.ts` — `getAuth()`, `signInWithPopup()`
- **Server-side**: `src/lib/firebase-admin.ts` — verifies ID tokens using `verifyIdToken()`
- **Auth context**: `src/contexts/` — `useAuth()` hook for components

The auth flow:
1. User clicks "Sign in with Google"
2. Firebase returns an ID token
3. ID token is sent in `Authorization: Bearer <token>` headers
4. API routes call `verifyFirebaseToken()` from `src/lib/auth-utils.ts`

---

## Deployment

The project is deployed on **Vercel** (recommended).

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Set all environment variables from `.env` in the Vercel dashboard (**Settings → Environment Variables**)
4. Deploy — Vercel auto-deploys on every push to `main`

### Manual production build (to test locally)

```bash
npm run build
npm start
```

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Build production bundle |
| `npm start` | Start production server (after build) |
| `npm run lint` | Run ESLint |

---

## Contributing

1. Fork the repository
2. Run `bash setup.sh` to set up your local environment
3. Fill in your `.env`
4. Create a feature branch: `git checkout -b feature/my-feature`
5. Make your changes
6. Test locally: `npm run dev`
7. Run a build to confirm no errors: `npm run build`
8. Open a pull request

---

*Built with ❤️ for the student community*
