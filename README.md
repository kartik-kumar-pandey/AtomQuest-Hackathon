# AtomQuest — Enterprise Goal Setting & Tracking Portal

AtomQuest is a comprehensive, production-ready enterprise goal management system built for the Atomberg Hackathon. It enables organizations to streamline their performance management processes by offering robust role-based goal setting, cascading Shared Goals (Departmental KPIs), and quarterly tracking with dynamic scoring algorithms based on Units of Measure (UoM).

## 🌟 Key Features

* **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for Employees, Managers, and HR Admins.
* **Intelligent Goal Validation:** The system strictly enforces organizational rules, such as requiring an employee's total goal sheet weightage to equal exactly 100% before submission.
* **Shared Cascading Goals:** Managers can define departmental goals and instantly "push" them down to specific team members. Any progress logged on the master goal cascades to all sub-goals seamlessly.
* **Dynamic Progress Scoring:** Supports multiple calculation algorithms based on UoM (e.g., `MIN`, `MAX`, `TIMELINE`, `ZERO`).
* **Quarterly Check-in Cycles:** Built-in time windows for Q1, Q2, Q3, and Q4 performance tracking.
* **Admin Analytics & Auditing:** Beautiful glassmorphic dashboards for tracking completion rates, thrust area distributions, and an immutable audit trail of all systemic changes.
* **Instant Export:** One-click CSV exports of the entire organization's goal status and achievements.

## 💻 Tech Stack

* **Frontend:** Next.js 14 (App Router), React 19, Tailwind CSS 4, Shadcn UI, Framer Motion
* **Backend:** Next.js Server Actions & API Routes, NextAuth.js
* **Database:** Prisma ORM, Neon Serverless PostgreSQL
* **Deployment:** Vercel

## 🚀 Live Demo

[https://mygoals-tracking.vercel.app/](https://mygoals-tracking.vercel.app/)

### Mock Accounts for Testing
*(Password for all accounts: `password`)*

| Role | Email | Description |
|---|---|---|
| **Admin** | `admin@atomberg.com` | Access org analytics, audits, and settings. |
| **Manager** | `manager1@atomberg.com` | Approves goals, pushes shared goals. |
| **Employee** | `emp1@atomberg.com` | Creates goals, logs quarterly check-ins. |

## 🛠️ Local Development

### 1. Clone & Install
```bash
git clone https://github.com/kartik-kumar-pandey/AtomQuest-Hackathon.git
cd AtomQuest-Hackathon
npm install
```

### 2. Environment Variables
Create a `.env.local` file with your Neon PostgreSQL URL and Auth Secret:
```env
NEXTAUTH_SECRET=your_super_secret_string
DATABASE_URL=your_neon_postgres_url
```

### 3. Database Setup
```bash
# Push the Prisma schema to the database
npm run db:push

# Seed the database with mock users and hierarchy
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing & Validation

This project includes a custom automated system integrity suite to verify complex math algorithms and database models.
```bash
# Run the validation suite
npx tsx scripts/verify-all.ts
```

*Note: For testing purposes, the strict Quarterly Cycle Enforcement has been disabled by default so goals and check-ins can be created at any time of the year.*
