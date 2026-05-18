# MYGoals Portal — Comprehensive Testing Playbook

This playbook provides a detailed, step-by-step testing guide to verify **every single feature** of the MYGoals Setting & Tracking Portal. It also contains instructions for running our custom automated validation test suite.

---

## 1. What does the "110% weightage used" in your screenshot mean?

Under the core system specifications, **an employee's goal sheet must sum up to exactly 100% weightage** to be eligible for submission to their manager. 
* Previously, your employee (`emp1@atomberg.com`) had exactly **5 goals** totaling **100%** weightage (e.g. 25% + 20% + 20% + 15% + 20% = 100%).
* When the manager pushed a new **Shared Goal (Departmental KPI)** to this employee with a default weight of **10%**, the employee's sheet weightage instantly became **110%**.
* Since 110% exceeds the mandatory 100% threshold, the portal's validation engine highlighted the total in **red** with a warning: *"Total must equal 100% to submit"*.
* **To resolve this:** The employee simply clicks the **Edit (pencil)** icon on their custom goals and reduces their weights (e.g. reducing a 20% weight to 10%) until the total sum at the top returns to exactly **100%**.

---

## 2. Mock Accounts for Testing
Use `password` as the password for all of these accounts:
| Role | Email | Name | Context |
|---|---|---|---|
| **Admin** | `admin@atomberg.com` | HR Admin | Accesses org analytics, audit trails, cycle lock dates, and CSV export. |
| **Manager 1** | `manager1@atomberg.com` | Rohan Sharma | Approves goalsheets, pushes shared goals, adds check-in comments. |
| **Manager 2** | `manager2@atomberg.com` | Priya Patel | Second-level manager for approvals. |
| **Employee 1** | `emp1@atomberg.com` | Backend Dev | Reports to Manager 1. Logs check-ins and edits weights. |
| **Employee 2** | `emp2@atomberg.com` | Frontend Dev | Reports to Manager 1. |
| **Employee 3** | `emp3@atomberg.com` | Sales Exec | Reports to Manager 2. |

---

## 3. Automated API & Integration Test Suite
To automatically check database integrity, role access, math formulas, and Shared Goal cascade triggers, run the following command in your terminal inside the `atomquest-portal` folder:

```bash
npx tsx scripts/verify-all.ts
```

### Expected Output:
```text
==================================================
   MYGOALS SYSTEM INTEGRITY & VALIDATION SUITE   
==================================================

• Test Stage 1: Database Connectivity & Models Check
  ✔ PASS: Successfully connected to SQLite database. Found 6 registered users.
  ...
• Test Stage 2: Progress Score Formula & UoM Math Verification
  ✔ PASS: UoM MIN (Higher is better) verified. Target: 100, Achieved: 75 => Score: 75%
  ...
• Test Stage 3: Shared Goals & Cascade Synchronization Simulation
  ✔ PASS: SUCCESS: Cascade Sync Engine successfully synchronized actual progress from primary owner's sheet down to employee sheet!

==================================================
                  TEST RESULTS REPORT             
==================================================
  Total Passed: 13
  Total Failed: 0

  ✔ STATUS: SYSTEM FULLY HEALTHY & INTEGRAL!
```

---

## 4. Step-by-Step Manual Testing Checklist

### Scenario A: Employee Goal Creation & Submission
1. Log in to `http://localhost:3000/login` as **Employee 1** (`emp1@atomberg.com`).
2. Go to **My Goals** in the sidebar.
3. Click the blue **+ Add Goal** button.
4. Try adding a goal with **5% weightage**. Click Save.
   * *Expected Result:* The validation system blocks submission: *"Minimum weightage per goal is 10%"*.
5. Edit the weightage to **15%** or more. Save.
6. Verify that if the total weightage is **not exactly 100%**, the submit button at the top remains disabled/red.
7. Adjust the weights of your goals so the sum is exactly 100%. 
   * *Expected Result:* The status bar turns blue/green, and a **Submit Goalsheet** button becomes active.
8. Click **Submit Goalsheet**. The status shifts to `SUBMITTED`.

### Scenario B: Manager Goal Review & Inline Edits
1. Log out of Employee 1 and log in as **Manager 1** (`manager1@atomberg.com`).
2. Navigate to **Approvals** in the sidebar.
3. You will see Employee 1's goal sheet listed as `SUBMITTED`. Click **Review Goals**.
4. In the goal review page, you can:
   * View all goals, their weights, and their UoMs.
   * Edit weightage or target values directly in the inline inputs.
   * Type in custom manager feedback remarks.
5. Click **Approve Goalsheet** or **Reject Goalsheet**.
   * *Expected Result:* If approved, the status changes to `APPROVED`. If rejected, it returns to `DRAFT` for the employee.

### Scenario C: Shared Goals (Cascading KPIs)
1. Logged in as **Manager 1** (`manager1@atomberg.com`), go to **Shared Goals** in the sidebar.
2. Under **Define Shared Goal Details**, fill in:
   * **Goal Title**: `Boost Q3 API Availability to 99.9%`
   * **Thrust Area**: `Engineering`
   * **UOM**: `MIN`
   * **Target**: `99.9`
3. On the right-hand **Select Recipients** panel, tick `emp1@atomberg.com` (Employee 1).
4. Click **Push Shared Goal (1)**.
5. Log out and log back in as **Employee 1** (`emp1@atomberg.com`).
6. Navigate to **My Goals**.
   * *Expected Result:* The pushed shared goal `Boost Q3 API Availability to 99.9%` is present with status `APPROVED`.
   * *Security Check:* Try to edit this goal. The title, target, thrust area, and UoM are disabled/read-only. You can *only* adjust its weightage.

### Scenario D: Logging Quarterly Check-ins & Cascades
1. Log in as **Employee 1** (`emp1@atomberg.com`).
2. Go to **Check-ins** in the sidebar.
3. Select a goal (e.g. `Improve API response time`), select **Q1**, enter actual achievement `150` (Target was 200), set status to `ON_TRACK`, add a comment, and save.
   * *Expected Result:* The progress score is calculated dynamically based on UoM:
     * For **MIN** (Higher is better): `(Achievement / Target) * 100` => `(150 / 200) * 100` = `75%`.
     * The score bar renders a color-coded percentage status (Green >= 80%, Yellow >= 50%, Red < 50%).
4. **Primary Owner Cascade Test:** If you log a check-in on a **Shared Goal** that you own, verify that all recipient employees who were pushed this goal instantly receive the same check-in actuals and status on their goal sheet!

### Scenario E: Admin Settings & Audits
1. Log in as **Admin** (`admin@atomberg.com`).
2. Navigate to **Analytics**:
   * *Expected Result:* Beautiful glassmorphic dashboards render completion rates, QoQ achievement trends, department heatmaps, and thrust area distributions.
3. Go to **Settings**:
   * Change the goal setting cycles or quarterly check-in submission lock dates.
4. Go to **Audit Log**:
   * *Expected Result:* A complete history of actions (goal creation, submission, approval, check-ins) is logged with the user, action type, old value, and new value.
5. Click **Export Org Report** at the top right of the Admin Dashboard.
   * *Expected Result:* An organizational achievements report downloads in standard `.csv` format instantly.
