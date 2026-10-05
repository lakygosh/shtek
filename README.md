# Shtek: Personal Finance Planner

A web app for planning personal finances: track daily spending, keep a monthly budget, set savings goals, and work out the income your ideal lifestyle would need. It is built for people in Serbia, so you can log spending in both EUR and RSD.

**Live app:** [lifefintracker.vercel.app](https://lifefintracker.vercel.app)

![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Deno](https://img.shields.io/badge/Deno_Edge_Functions-000000?style=flat-square&logo=deno&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude_API-D97757?style=flat-square&logo=anthropic&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

<!-- TODO: add screenshot -->

## Overview

Most budgeting apps only look backward at what you already spent. Shtek also helps you plan ahead. Next to a daily expense log and a recurring budget, it has calculators for savings goals (mortgage, car loan, retirement and more) and an "Ideal Life" view. In that view you list the costs of the life you want, and the app works out the gross salary you would need to pay for it.

Users sign in with Google. Each user's data is stored in Supabase Postgres and protected by row-level security. An AI-assisted importer can map almost any CSV or Excel spreadsheet onto the app's data model.

## Key Features

- **Overview dashboard**: enter gross income and tax rate to see net income, monthly expenses, surplus and savings rate, with a warning when expenses exceed income.
- **Daily expense log**: record purchases in RSD or EUR (converted to EUR when saved), edit them inline, and see spending broken down by category.
- **Per-category budget tracking**: compares this month's spending with the budget for each category and flags overspending and unbudgeted categories.
- **Monthly budget**: recurring expenses with priority (Essential / Important / Nice-to-Have) and frequency (daily to yearly), normalized to monthly and annual totals.
- **Savings goals with 10 templates**: Simple, Home/Flat, Car, Vacation, Education, Emergency Fund, Wedding, Retirement, Debt Payoff and Business. Each template has its own calculator, such as amortized mortgage payment, car loan cost, compound retirement projection, or an emergency fund sized in months of expenses.
- **Ideal Life calculator**: list your target lifestyle costs to see the gross monthly and yearly income they require, the gap to your current income, and the growth needed to close it.
- **AI spreadsheet import**: upload a CSV/XLSX file and go through Upload, Mapping, Preview and Import. The app detects which table the data belongs to and maps its columns automatically.
- **Custom categories**: add, recolor or hide categories.
- **Onboarding**: new accounts are seeded with sample data, and an in-app tutorial walks through each tab.
- **Feedback loop**: users submit bugs and suggestions and can see their status. An admin-only Reports tab is used to triage them.
- **Responsive layout**: tab navigation at the top on desktop and at the bottom on mobile.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite 8, plain CSS with inline styles, hand-written SVG charts |
| Backend / data | Supabase (Postgres, Auth with Google OAuth, Row Level Security) |
| Serverless | Supabase Edge Function (Deno, TypeScript) |
| AI | Anthropic Claude API (Claude Haiku 4.5) for spreadsheet column mapping |
| File parsing | PapaParse (CSV), SheetJS `xlsx` (Excel) |
| Tooling / hosting | ESLint 9, Vercel |

## Technical Highlights

- **No custom backend server.** The React client talks directly to Supabase. Data isolation is enforced in the database with row-level security policies (`auth.uid() = user_id`), not in application code. A Postgres trigger creates each user's settings row at signup.
- **AI-assisted import with a deterministic pipeline.** Only the headers and up to 15 sample rows are sent to an authenticated Edge Function. The function asks Claude (temperature 0) for a strict JSON mapping: target table, column-to-field mapping, a transform per column, and warnings. The mapping is then applied to every row in the browser by a local parser that normalizes dates, numbers, category synonyms, priorities and frequencies. It can also detect RSD amounts and convert them.
- **Server-side API key handling.** The Anthropic key exists only as an Edge Function secret. The function checks the caller's Supabase JWT before it makes any AI call.
- **Goal templates as data plus pure functions.** Each template declares its extra fields with defaults and a `calculate(goal)` function (amortization, compound growth, and so on). Template-specific inputs are stored in a `jsonb` column, so the UI and the schema stay generic.
- **Debounced sync.** Budget edits update the UI immediately and are written to Supabase after an 800 ms debounce, so typing does not trigger a request per keystroke.
- **No chart library.** The donut and bar charts are small hand-written SVG/CSS components, which keeps the bundle small.

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A Supabase project (only needed if you want to run against your own backend)
- An Anthropic API key (only needed for the AI import feature)

### Install and run

```bash
git clone https://github.com/lakygosh/shtek.git
cd shtek
npm install
npm run dev       # start the Vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # run ESLint
```

### Using your own Supabase project

1. In the Supabase SQL editor, run `supabase-schema.sql`, then `supabase-migration-001.sql` through `supabase-migration-004.sql` in order. In migration 004, replace the admin email in the feedback policies with your own.
2. Turn on the Google provider under Supabase Auth.
3. Replace the project URL and anon key in `src/lib/supabase.js`, and the functions URL in `src/lib/importApi.js`. They are currently hardcoded, not read from env vars.
4. Change `ADMIN_EMAIL` in `src/App.jsx`.
5. Deploy the import function and set its secret:

   ```bash
   supabase functions deploy ai-import-mapper
   supabase secrets set ANTHROPIC_API_KEY=<your-key>
   ```

   The function also reads `SUPABASE_URL` and `SUPABASE_ANON_KEY`, which Supabase provides automatically.

## Project Structure

```
src/
  App.jsx                 # App shell, tab routing, dashboard
  components/             # DailyLog, ExpenseTable, GoalsTab, ImportModal, charts, etc.
  data/                   # Default categories, seed data, goal templates and calculators
  hooks/                  # useAuth, useSupabaseData (settings, expenses, goals, entries, feedback)
  lib/                    # Supabase client, import API client, spreadsheet parser/mapper
supabase/functions/
  ai-import-mapper/       # Deno Edge Function that calls the Claude API
supabase-schema.sql       # Base schema, RLS policies, signup trigger
supabase-migration-*.sql  # Incremental migrations (categories, goals, feedback)
```

## Author

Lazar Gošić, GitHub [@lakygosh](https://github.com/lakygosh)
