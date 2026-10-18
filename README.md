# DMoney Playwright E2E Automation

End-to-end test automation for the **DMoney Portal** using **Playwright + TypeScript** and the **Page Object Model**. Covers the full Agent lifecycle: registration, admin activation, system deposit, balance check, agent-to-customer transaction, password reset and Self Statement export to CSV.

## Tech Stack

- [Playwright Test](https://playwright.dev/) (`@playwright/test`) with TypeScript
- Page Object Model
- Gmail API (reads login OTP and password reset mails)
- GitHub Actions (manual trigger)

## Project Structure

```
├── .github/workflows/          # CI workflow (manual trigger)
├── pages/                      # Page Objects
│   ├── HomePage.ts
│   ├── RegisterPage.ts
│   ├── LoginPage.ts            # Login, OTP verification, forgot password link
│   ├── DashboardPage.ts        # Navigation, balance, logout
│   ├── UserListPage.ts         # Admin user search
│   ├── UserDetailsPage.ts      # Admin edit user / activate
│   ├── CashInPage.ts           # System and Agent deposits
│   ├── SelfStatementPage.ts    # Statement table extraction
│   ├── ForgotPasswordPage.ts
│   └── ResetPasswordPage.ts
├── tests/                      # Spec files, run in order (one worker)
│   ├── 01-agentRegistration.spec.ts
│   ├── 02-adminActivateAgent.spec.ts
│   ├── 03-systemDepositToAgent.spec.ts
│   ├── 04-agentLoginBalance.spec.ts
│   ├── 05-agentDepositToCustomer.spec.ts
│   ├── 06-agentPasswordReset.spec.ts
│   └── 07-agentSelfStatementCsv.spec.ts
├── utils/
│   ├── agentData.ts            # Random Agent generator, shared between specs
│   ├── gmail.ts                # Gmail API client: waits for new OTP / reset mails
│   └── csv.ts                  # CSV write/read helpers
└── playwright.config.ts
```

## Test Scenario

1. Open the DMoney Portal and navigate to the Sign Up page
2. Register a new user with the **Agent** role
3. Log in as **Admin** (`admin@dmoney.com`), find the new Agent and activate the account, then log out
4. Log in as **System** (`system@dmoney.com`), deposit 2000 Tk to the Agent, then log out
5. Log in as the Agent (OTP read from Gmail) and verify the balance is 2000 Tk
6. Deposit 500 Tk from the Agent to an existing Customer, verify the transaction, then log out
7. Reset the Agent password via the emailed link; verify the old password fails and the new one works
8. Open Self Statement, extract the full table and save it as `self_statement_YYYY-MM-DD.csv`

## Test Coverage

| # | Validation | Spec |
|---|---|---|
| 1 | Agent registration is successful | 01 |
| 2 | Newly created Agent is initially inactive | 02 |
| 3 | Admin login is successful | 02 |
| 4 | Newly created Agent appears in the Admin user list | 02 |
| 5 | Admin can activate the Agent | 02 |
| 6 | Agent remains active after page reload | 02 |
| 7 | System login is successful | 03 |
| 8 | System can deposit 2000 Tk to the Agent | 03 |
| 9 | System deposit creates the correct transaction record | 03 |
| 10 | Agent can log in after activation | 04 |
| 11 | Agent balance is exactly 2000 Tk | 04 |
| 12 | Agent can deposit 500 Tk to an existing Customer | 05 |
| 13 | Agent balance is updated correctly after the transaction | 05 |
| 14 | Customer deposit appears in the Agent's Self Statement | 05 |
| 15 | Agent logout works successfully | 05 |
| 16 | Agent password reset works successfully | 06 |
| 17 | Login with the old password fails after password reset | 06 |
| 18 | Login with the new password succeeds | 06 |
| 19 | Self Statement contains the expected transaction data | 07 |
| 20 | Self Statement data is saved into the required CSV file | 07 |

> Agent deposits earn a 2.5% commission, so after depositing 500 Tk the Agent balance is `2000 - 500 + 12.50 = 1512.50`.

## Prerequisites

- Node.js (LTS)
- DMoney Portal running at `http://localhost:3000` (API at `http://localhost:5000`)
- Gmail account receiving the Agent mails (Agent emails use `+alias` addresses of one inbox)

## Setup

```bash
git clone https://github.com/limon27121/dmoney-playwright-e2e-automation-B19-.git
cd dmoney-playwright-e2e-automation-B19-
npm install
npx playwright install
```

Create a `.env` file in the project root (it is git-ignored):

```
Gmail_client_id=xxxx.apps.googleusercontent.com
Gmail_client_secret=xxxx
Gmail_refresh_token=1//xxxx
```

With these set, a fresh Gmail access token is fetched on every run. Alternatively set only `Gmail_token=ya29...` (a short-lived access token, valid about 1 hour). The OAuth client needs the `https://www.googleapis.com/auth/gmail.readonly` scope.

## Run Tests

```bash
npm test              # full regression suite (23 tests)
npm run test:headed   # regression in headed mode
npm run test:smoke    # smoke suite: positive cases only, tagged @smoke (22 tests)
npm run report        # open the HTML report
```

Specs depend on each other (the Agent registered in spec 01 is used by all later specs), so always run the whole suite, not a single spec.

## Generated Files

| File | Purpose |
|---|---|
| `auth.json` | Session (localStorage) saved after each login and reused by later tests |
| `test-data/agent.json` | Agent created in the current run |
| `test-data/agents-history.json` | Every Agent created so far |
| `self_statement_YYYY-MM-DD.csv` | Exported Self Statement (also attached to the HTML report) |
| `test-results/` | Per-test videos and failure screenshots |

All of these are git-ignored.

## Automation Video

<!-- Upload the headed-mode recording here -->

## Regression Test Result

<!-- Add screenshot of the regression run here -->

## Smoke Test Result

<!-- Add screenshot of the smoke run here -->
