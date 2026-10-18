# DMoney Playwright E2E Automation

End-to-end test automation for the **DMoney Portal** using **Playwright + TypeScript** and the **Page Object Model**. Covers the Agent lifecycle: registration, admin activation, system deposit, balance check, agent-to-customer transaction, password reset and Self Statement export to CSV.

## Tech Stack

- [Playwright Test](https://playwright.dev/) (`@playwright/test`)
- TypeScript
- Page Object Model
- GitHub Actions (manual trigger)

## Project Structure

```
├── .github/workflows/   # CI workflow (manual trigger)
├── pages/               # Page Objects
│   ├── HomePage.ts
│   ├── RegisterPage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── UserListPage.ts
│   └── UserDetailsPage.ts
├── tests/               # Spec files, run in order
│   ├── 01-agentRegistration.spec.ts
│   └── 02-adminActivateAgent.spec.ts
├── utils/
│   └── agentData.ts     # Random Agent generator, save/load between specs
└── playwright.config.ts
```

## Test Scenario

1. Open the DMoney Portal and navigate to the Sign Up page
2. Register a new user with the **Agent** role
3. Log in as **Admin** (`admin@dmoney.com`), find the new Agent and activate the account
4. Log out from Admin
5. Log in as **System** (`system@dmoney.com`) and deposit 2000 Tk to the Agent
6. Log in as the Agent and verify balance is 2000 Tk
7. Deposit 500 Tk from Agent to an existing Customer and verify the transaction
8. Reset the Agent password; verify the old password fails and the new one works
9. Open Self Statement, extract the table and save it as `self_statement_YYYY-MM-DD.csv`

## Test Coverage

| # | Validation | Status |
|---|---|---|
| 1 | Agent registration is successful | ✅ |
| 2 | New Agent is initially inactive | ✅ |
| 3 | Admin login is successful | ✅ |
| 4 | New Agent appears in Admin user list | ✅ |
| 5 | Admin can activate the Agent | ✅ |
| 6 | Agent remains active after page reload | ✅ |
| 7 | System login and 2000 Tk deposit to Agent | ⏳ |
| 8 | Agent login and balance is exactly 2000 Tk | ⏳ |
| 9 | Agent deposits 500 Tk to Customer | ⏳ |
| 10 | Agent password reset; old fails, new succeeds | ⏳ |
| 11 | Self Statement exported to CSV | ⏳ |

## Prerequisites

- Node.js (LTS)
- DMoney Portal running at `http://localhost:3000`

## Setup

```bash
git clone https://github.com/limon27121/dmoney-playwright-e2e-automation-B19-.git
cd dmoney-playwright-e2e-automation-B19-
npm install
npx playwright install
```

## Run Tests

```bash
npm test              # full regression suite
npm run test:headed   # headed mode
npm run test:smoke    # smoke suite (positive cases tagged @smoke)
npm run report        # open HTML report
```

## Automation Video

<!-- Upload the headed-mode recording here -->

## Regression Test Result

<!-- Add screenshot of the regression run here -->

## Smoke Test Result

<!-- Add screenshot of the smoke run here -->
