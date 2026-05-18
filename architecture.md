# MYGoals — Enterprise System Architecture & Design

This document details the complete, production-grade system architecture, database models, request lifecycles, and backend synchronization engines powering the **MYGoals** Enterprise Goal Setting & Tracking Portal. These blueprints are tailored to highlight the portal's enterprise capability, strict data validation, and real-time cascaded syncing features.

---

## 🗺️ Table of Contents
1. [Tech Stack Overview](#1-tech-stack-overview)
2. [Database Entity-Relationship Diagram (ERD)](#2-database-entity-relationship-diagram-erd)
3. [Network & Deployment Topology](#3-network--deployment-topology)
4. [Shared Goal Sync Engine Flowchart](#4-shared-goal-sync-engine-flowchart)
5. [Request Flow Lifecycles](#5-request-flow-lifecycles)
6. [Role-Based Access Control (RBAC)](#6-role-based-access-control-rbac)
7. [Component Architecture Map](#7-component-architecture-map)
8. [Goal Lifecycle State Machine](#8-goal-lifecycle-state-machine)

---

## 1. Tech Stack Overview

The Tech Stack Overview illustrates how the client interfaces with the server routing layer, standard API routes, ORM middleware, Neon PostgreSQL database, and NVIDIA NIM LLM.

```mermaid
graph TB
    subgraph CLIENT["🌐 Client Layer (Browser)"]
        direction LR
        EMP["👤 Employee Dashboard"]
        MGR["👔 Manager Dashboard"]
        ADM["🔑 Admin Dashboard"]
    end

    subgraph NEXTJS["⚡ Next.js App Router (Vercel Node.js Platform)"]
        direction TB
        MIDW["🔒 NextAuth.js Middleware<br/>(Edge Session Verification)"]
        APP["📦 App Router Pages<br/>(employee, manager, admin)"]
        API["📡 Serverless API Routes<br/>(POST / PATCH / GET)"]
    end

    subgraph API_ROUTES["🔌 API Endpoint Layer"]
        direction TB
        R_AUTH["🔑 /api/auth<br/>(NextAuth handler)"]
        R_GOALS["📋 /api/goals & /api/goals/[id]<br/>(CRUD & Progress updates)"]
        R_SMART["🤖 /api/goals/smart<br/>(NVIDIA NIM LLM assistant)"]
        R_NOTIF["🔔 /api/notifications<br/>(Real-time server polling)"]
        R_CHKIN["📝 /api/checkins<br/>(Planned vs Actuals)"]
        R_EXPORT["📥 /api/export<br/>(Org CSV reporting)"]
    end

    subgraph DB_LAYER["🗄️ Database & ORM Layer"]
        PRISMA["🔌 Prisma Client ORM v7<br/>(Type-safe queries)"]
        NEON["🐘 Neon Serverless PostgreSQL<br/>(Data storage)"]
    end

    subgraph EXTERNAL["🔌 External Cloud Services"]
        NVIDIA["🤖 NVIDIA NIM API<br/>(mistral-large-3-675b)"]
        VERCEL["▲ Vercel Platform<br/>(Global Hosting)"]
    end

    %% Client Interactions
    CLIENT -->|"HTTPS requests"| MIDW
    MIDW -->|"Protected session context"| APP
    APP -->|"Fetch/Mutate payloads"| API
    
    %% API to routes
    API --> R_AUTH
    API --> R_GOALS
    API --> R_SMART
    API --> R_NOTIF
    API --> R_CHKIN
    API --> R_EXPORT

    %% API to Prisma / NVIDIA
    R_GOALS & R_NOTIF & R_CHKIN & R_EXPORT & R_AUTH --> PRISMA
    R_SMART -->|"REST API Call"| NVIDIA
    PRISMA -->|"Neon Serverless connection"| NEON
    NEXTJS -->|"Deploys on"| VERCEL
```

---

## 2. Database Entity-Relationship Diagram (ERD)

The following diagram maps the structural relationships between each database model declared in the Prisma schema file.

```mermaid
erDiagram
    User ||--o{ Goal : "creates (UserGoals)"
    User ||--o{ Notification : "receives (userId)"
    User ||--o{ User : "manages (self-relation ManagerToEmployee)"
    Goal ||--o{ Checkin : "has checkins (goalId)"
    
    User {
        String id PK "cuid()"
        String name "Full Name"
        String email UK "Unique Email Address"
        String password "Hashed Password"
        String role "EMPLOYEE | MANAGER | ADMIN"
        String managerId FK "Self-referential manager relation"
        DateTime createdAt "Record creation date"
        DateTime updatedAt "Last record update"
    }
    
    Goal {
        String id PK "cuid()"
        String employeeId FK "References User.id"
        String title "Goal title/name"
        String description "Details/alignment text"
        String thrustArea "Strategic department area"
        String uom "MIN | MAX | TIMELINE | ZERO"
        Float target "Target numeric/percentage score"
        Float weightage "Goal score weightage (10%-80%)"
        Float progress "Actual progress score (0-100%)"
        String status "DRAFT | SUBMITTED | APPROVED | REJECTED | LOCKED"
        DateTime createdAt "Record creation date"
        DateTime updatedAt "Last record update"
    }

    Checkin {
        String id PK "cuid()"
        String goalId FK "References Goal.id"
        String quarter "Q1 | Q2 | Q3 | Q4"
        Float achievement "Reported numeric achievement"
        String status "NOT_STARTED | ON_TRACK | COMPLETED"
        String comment "Employee progress notes"
        String managerComment "Manager feedback comment"
        DateTime createdAt "Record creation date"
        DateTime updatedAt "Last record update"
    }

    SharedGoal {
        String id PK "cuid()"
        String masterGoalId "References Manager/Admin's Goal.id"
        String employeeGoalId "References Employee's Goal.id"
        String primaryOwnerId "References User.id of goal sheet master"
        DateTime createdAt "Record creation date"
    }

    Notification {
        String id PK "cuid()"
        String userId FK "References User.id"
        String message "Notification alert content"
        Boolean read "Read status flag (default false)"
        String link "Optional dashboard redirect URL"
        DateTime createdAt "Record creation date"
    }

    AuditLog {
        String id PK "cuid()"
        String entityType "Goal | Checkin"
        String entityId "References target table ID"
        String changedBy "User email who executed operation"
        String oldValue "JSON representation before change"
        String newValue "JSON representation after change"
        DateTime timestamp "Immutable audit timestamp"
    }
```

---

## 3. Network & Deployment Topology

The infrastructure schema illustrates the physical hosting configuration, secure database networking, and connection pooler settings of MYGoals on Vercel.

```mermaid
graph TB
    subgraph CLIENT_ZONE["🌐 Client Zone (Public Internet)"]
        BROWSER["🖥️ Web Browser<br/>(Desktop & Mobile Responsive View)"]
    end

    subgraph CDN_EDGE["▲ Vercel Edge Global CDN"]
        EDGE_ROUTING["⚡ Smart DNS Routing & SSL Termination"]
        NEXT_AUTH_MID["🔒 Edge Middleware Check<br/>(NextAuth Session Cookie)"]
    end

    subgraph APP_CONTAINER["⚡ Serverless Runtime (Vercel Lambda Environments)"]
        APP_ROUTER["📦 Next.js App Router Page Handlers"]
        API_HANDLERS["📡 REST Serverless API Endpoints"]
        SYNC_ENGINE["⚙️ Goal Cascading Sync Engine"]
    end

    subgraph SECURE_DB_ZONE["🛡️ Database & AI Services (Private/Secure Cloud Network)"]
        NEON_POOL["🔌 Neon Connection Pooler<br/>(PgBouncer Serverless Endpoint)"]
        NEON_DB["🗄️ Neon PostgreSQL Database<br/>(Multi-Tenant Serverless Database)"]
        NVIDIA_AI["🤖 NVIDIA NIM API Endpoint<br/>(mistral-large-3-675b on NVIDIA NIM Serverless)"]
    end

    %% Routing Flow
    BROWSER -->|"HTTPS Session (WSS notifications)"| EDGE_ROUTING
    EDGE_ROUTING --> NEXT_AUTH_MID
    NEXT_AUTH_MID -->|"Forward authenticated session"| APP_ROUTER
    APP_ROUTER --> API_HANDLERS
    API_HANDLERS --> SYNC_ENGINE
    
    %% Storage & Service Networking
    SYNC_ENGINE -->|"SQL transactions over TCP/WebSockets (Prisma Client)"| NEON_POOL
    NEON_POOL --> NEON_DB
    API_HANDLERS -->|"Secure HTTPS REST Call"| NVIDIA_AI
```

---

## 4. Shared Goal Sync Engine Flowchart

When managers push corporate/departmental KPIs down to reportees, the synchronization engine guarantees read-only target compliance and auto-updates employee achievements in real time whenever the master goal changes.

```mermaid
graph TD
    START(["🟢 Manager Pushes Shared Goal"]) --> DEFINE["Define Master Goal Details<br/>(Title, Thrust Area, Target, UoM)"]
    DEFINE --> SELECT_USERS["Select Target Employees<br/>(Team members / Department list)"]
    SELECT_USERS --> TX_START{"⚡ Start Database Transaction"}

    %% Database Transaction Process
    TX_START --> CREATE_MASTER["1. Create Master Goal Sheet Entry<br/>(Assigned to Primary Owner / Manager)"]
    CREATE_MASTER --> LOOP_USERS["2. Loop Through Selected Employees"]
    
    LOOP_USERS --> CREATE_SUB["3. Create Sub-Goal Sheet Entry<br/>(Title & Target Locked, Status: LOCKED)"]
    CREATE_SUB --> LINK_SHARED["4. Record Link in SharedGoal Table<br/>(Link MasterGoalId to EmployeeGoalId)"]
    
    LINK_SHARED --> ALL_DONE{"All Employees Processed?"}
    ALL_DONE --"No"--> LOOP_USERS
    ALL_DONE --"Yes"--> COMMIT_TX["5. Commit Transaction"]

    %% Propagation Logic
    COMMIT_TX --> SYNC_READY(["🔄 Sync Engine Armed & Listening"])

    %% Achievement Tracking and Propagation Flow
    SYNC_READY --> EMP_UPDATE["👤 Primary Owner logs check-in / updates progress"]
    EMP_UPDATE --> GET_LINKS["🔍 Query SharedGoal records where masterGoalId = updatedGoalId"]
    GET_LINKS --> PROPAGATE_START{"⚡ Cascade Progress Update"}
    
    PROPAGATE_START --> UPDATE_SUB["Update progress & achievement value on all linked Employee Goals"]
    UPDATE_SUB --> CREATE_AUDIT["Write Immutable Audit Logs for all changes"]
    CREATE_AUDIT --> NOTIFY_EMPS["Send Web Notifications to all affected Employees"]
    NOTIFY_EMPS --> DONE(["🏁 Sync Complete & UI Real-Time Updated"])
```

---

## 5. Request Flow Lifecycles

This sequence diagram details the end-to-end network communications and operations triggered during user authentication, goal progress submissions, and AI SMART suggestions.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser Client
    participant NA as NextAuth Middleware
    participant API as Serverless API Endpoint
    participant P as Prisma ORM
    participant DB as Neon PostgreSQL
    participant AI as NVIDIA NIM

    %% Authentication Flow
    Note over B, DB: User Session Authentication
    B->>NA: Login (Credentials email + password)
    NA->>P: Find unique user by email
    P->>DB: SQL SELECT User
    DB-->>P: User row (hashed password)
    NA->>NA: Validate Bcrypt hash
    NA-->>B: JWT Session Cookie (HttpOnly, secure)

    %% Goal Mutate / Submit Flow
    Note over B, DB: Goal Progress Submission Workflow
    B->>API: PATCH /api/goals/[id] { action: "update-progress", progress: 65 }
    API->>NA: Check getServerSession() cookie
    NA-->>API: Validated Session { user.id, role: "EMPLOYEE" }
    
    API->>P: Fetch Goal metadata & current status
    P->>DB: SQL SELECT Goal
    DB-->>P: Goal Status (APPROVED / LOCKED)
    
    API->>API: Verify validation rules (Status must be APPROVED or LOCKED)
    
    API->>P: Write AuditLog record & Update Goal progress
    P->>DB: SQL INSERT AuditLog & UPDATE Goal SET progress = 65
    DB-->>P: Success response
    
    API->>P: Create Notification for L1 Manager
    P->>DB: SQL INSERT Notification
    DB-->>P: Success response
    API-->>B: 200 OK Response (JSON Payload)

    %% AI SMART Goals Flow
    Note over B, AI: NVIDIA NIM AI SMART Goal Enhancement
    B->>API: POST /api/goals/smart { title: "Improve sales", target: 50, uom: "MIN" }
    API->>NA: Check getServerSession() cookie
    NA-->>API: Validated Session
    
    API->>AI: POST /v1/chat/completions (Bearer NVIDIA_API_KEY)
    Note right of AI: Mistral-Large-3 parses draft<br/>and applies SMART taxonomy
    AI-->>API: Refined structured JSON goal details
    API-->>B: 200 OK Response { title: "Increase sales revenue...", description: "...", target: 50, uom: "MIN" }
```

---

## 6. Role-Based Access Control (RBAC)

MYGoals strictly isolates user capabilities based on roles. A user’s role determines dashboard visualization, write privileges, and data routing paths.

```mermaid
graph LR
    subgraph ROLES["User Roles"]
        E["👤 EMPLOYEE"]
        M["👔 MANAGER"]
        A["🔑 ADMIN"]
    end

    subgraph EMP_PERMS["Employee Capabilities"]
        E1["Create / Edit DRAFT Goals"]
        E2["Submit Goal Sheets for review (Must equal 100%)"]
        E3["Refine text with AI SMART assistant"]
        E4["Update progress (0-100%) on APPROVED/LOCKED goals"]
        E5["View personal notifications"]
        E6["Record quarterly check-in achievements"]
    end

    subgraph MGR_PERMS["Manager Capabilities"]
        M1["View reportee goal lists (Team dashboards)"]
        M2["Approve / Reject employee goals"]
        M3["Inline edit employee targets / weightages pre-approval"]
        M4["Provide quarterly feedback reviews & check-in comments"]
        M5["Analyze team-wide progress via Recharts charts"]
    end

    subgraph ADM_PERMS["HR Admin Capabilities"]
        A1["Lock / Unlock goal sheets for out-of-cycle edits"]
        A2["Manage user records & organization hierarchy"]
        A3["Review immutable system-wide Audit Trail logs"]
        A4["Download org-wide Planned vs Actuals CSV report"]
        A5["Track org completion heatmap and delayed submissions"]
    end

    E --> EMP_PERMS
    M --> MGR_PERMS
    A --> ADM_PERMS
```

---

## 7. Component Architecture Map

This diagram details the directory organization and the relationship between Server Pages, Client Views, Shared UI layout units, and utility functions in the Next.js framework.

```mermaid
graph TD
    subgraph PAGES["Pages & Routes (Server Components)"]
        PG1["employee/dashboard<br/>/app/(dashboard)/employee/dashboard/page.tsx"]
        PG2["employee/goals<br/>/app/(dashboard)/employee/goals/page.tsx"]
        PG3["employee/checkins<br/>/app/(dashboard)/employee/checkins/page.tsx"]
        PG4["manager/dashboard<br/>/app/(dashboard)/manager/dashboard/page.tsx"]
        PG5["manager/approvals<br/>/app/(dashboard)/manager/approvals/page.tsx"]
        PG6["admin/dashboard<br/>/app/(dashboard)/admin/dashboard/page.tsx"]
        PG7["admin/analytics<br/>/app/(dashboard)/admin/analytics/page.tsx"]
    end

    subgraph VIEWS["View Components (Client-Side Interactive)"]
        V1["EmployeeDashboardView<br/>(Recharts: PieChart, RadialBar)"]
        V2["ManagerDashboardView<br/>(Recharts: BarChart, Team heatmaps)"]
        V3["AdminDashboardView<br/>(Recharts: BarChart, Org analytics)"]
    end

    subgraph SHARED["Shared Interface Components"]
        S1["Sidebar Layout Component<br/>(Collapsible & Mobile Responsive)"]
        S2["NotificationsBell Component<br/>(Auto-polling alerts)"]
        S3["UI Controls<br/>(StatCard, TrackedCard, PrimaryButton)"]
        S4["Animations & Motion<br/>(Framer Motion transitions)"]
    end

    subgraph LIBS["Lib & Core System Utility modules"]
        L1["auth.ts<br/>(NextAuth handler)"]
        L2["db.ts<br/>(Prisma Client singleton)"]
        L3["audit.ts<br/>(logAudit transaction helper)"]
        L4["cycle.ts<br/>(Enforces phase schedule gates)"]
        L5["goal-utils.ts<br/>(Progress calculations & scoring)"]
    end

    %% Dependency Connections
    PAGES --> VIEWS
    PAGES --> SHARED
    VIEWS --> SHARED
    PAGES & VIEWS --> LIBS
```

---

## 8. Goal Lifecycle State Machine

Goals migrate strictly across the following state lifecycles to guarantee security and audit readiness. Edits are restricted once a goal advances out of the `DRAFT` state unless unlocked by an Admin.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Employee Creates Goal
    DRAFT --> SUBMITTED : Employee Submits Sheet (Weightage Total = 100%)
    SUBMITTED --> LOCKED : Manager Approves (Sheet Locked)
    SUBMITTED --> REJECTED : Manager Rejects (Rework Required)
    REJECTED --> SUBMITTED : Employee Re-Submits Sheet
    LOCKED --> APPROVED : HR Admin Unlocks (Out-of-cycle Edit Allowed)
    APPROVED --> LOCKED : HR Admin Locks Sheet
    LOCKED --> LOCKED : Employee Updates Progress / logs check-in
    APPROVED --> APPROVED : Employee Updates Progress / logs check-in
```
