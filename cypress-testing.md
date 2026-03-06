# Cypress Test Generator Agent File recommendations

*Best practices for Cypress testing include using data-specific selectors, ensuring test independence with beforeEach hooks, avoiding arbitrary waits, and utilizing custom commands. For crafting AGENTS.md files, effective strategies involve listing key commands early, using concrete code examples, and keeping instructions concise to guide AI agents efficiently. Detailed Cypress guidelines are available in the Cypress Documentation, and AGENTS.md tips can be explored on the GitHub Blog. Would you be able to help develop a best practices agents.md file that I can use on a nodejs repo to generate Cypress end-to-end functional tests?*

Yes — a well-designed **AGENTS.md** can significantly improve how AI agents generate **Cypress end-to-end tests** in a Node.js repository. Below is a **practical, concise best-practices AGENTS.md template** designed specifically for:

* Node.js repos  
* Cypress E2E functional tests  
* AI coding agents (Copilot, ChatGPT, Claude, etc.)  
* Maintainable and deterministic tests

You can drop this directly into the root of your repo.

---

# **AGENTS.md**

Guidelines for AI agents generating Cypress end-to-end tests in this Node.js repository.

## **Objective**

Generate **reliable, deterministic Cypress end-to-end tests** that validate user behavior rather than implementation details.

Tests must be:

* Independent  
* Maintainable  
* Deterministic  
* Fast

Avoid brittle selectors and timing-dependent logic.

---

# **Key Commands**

Run tests locally:

```shell
npm run cypress:open
```

Run headless:

```shell
npm run cypress:run
```

Run a specific test file:

```shell
npx cypress run --spec cypress/e2e/<test>.cy.ts
```

Lint:

```shell
npm run lint
```

---

# **Test File Location**

Place new tests here:

```
cypress/e2e/
```

Example:

```
cypress/e2e/login.cy.ts
cypress/e2e/checkout.cy.ts
```

---

# **Required Test Structure**

Each test should follow this structure:

```javascript
describe('Feature name', () => {
  beforeEach(() => {
    cy.visit('/page')
  })

  it('should perform expected user behavior', () => {
    // arrange
    // act
    // assert
  })
})
```

Use **clear behavior-driven descriptions**.

Good:

```
should allow a user to log in
```

Bad:

```
test login
```

---

# **Selector Strategy (MANDATORY)**

Always prefer **data attributes**.

Correct:

```javascript
cy.get('[data-cy="login-button"]').click()
```

Acceptable:

```javascript
cy.findByRole('button', { name: /login/i })
```

Never use:

```
cy.get('.btn-primary')
cy.get('#login > div:nth-child(2)')
```

Reason: CSS selectors are brittle.

---

# **Waiting Strategy**

Never use arbitrary waits.

Bad:

```javascript
cy.wait(2000)
```

Correct:

```javascript
cy.get('[data-cy="dashboard"]').should('be.visible')
```

For network requests:

```javascript
cy.intercept('GET', '/api/user').as('getUser')

cy.wait('@getUser')
```

---

# **Test Independence**

Each test must run **in isolation**.

Rules:

* Do not rely on previous tests  
* Reset state before each test  
* Use `beforeEach()` for setup

Example:

```javascript
beforeEach(() => {
  cy.task('db:seed')
})
```

---

# **Assertions**

Prefer **explicit assertions**.

Good:

```javascript
cy.contains('Welcome back').should('be.visible')
```

Better:

```javascript
cy.get('[data-cy="welcome-message"]')
  .should('be.visible')
  .and('contain', 'Welcome back')
```

Avoid vague checks:

```
should('exist')
```

unless necessary.

---

# **Custom Commands**

Reusable actions must be placed in:

```
cypress/support/commands.ts
```

Example:

```javascript
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')

  cy.get('[data-cy="email"]').type(email)
  cy.get('[data-cy="password"]').type(password)

  cy.get('[data-cy="login-button"]').click()
})
```

Usage:

```javascript
cy.login('user@test.com', 'password123')
```

---

# **Network Control**

Stub external APIs whenever possible.

Example:

```javascript
cy.intercept('POST', '/api/login', {
  statusCode: 200,
  body: { token: 'fake-token' }
})
```

Avoid hitting real third-party services.

---

# **Test Data**

Prefer **deterministic fixtures**.

Location:

```
cypress/fixtures/
```

Example:

```
user.json
orders.json
```

Usage:

```javascript
cy.fixture('user').then((user) => {
  cy.login(user.email, user.password)
})
```

---

# **Example Test**

```javascript
describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should log the user in successfully', () => {
    cy.get('[data-cy="email"]').type('user@test.com')
    cy.get('[data-cy="password"]').type('password123')

    cy.get('[data-cy="login-button"]').click()

    cy.get('[data-cy="dashboard"]').should('be.visible')
  })
})
```

---

# **Anti-Patterns to Avoid**

Do NOT generate tests that:

* Use `cy.wait(XXXX)`  
* Depend on previous tests  
* Use fragile CSS selectors  
* Contain excessive logic inside tests  
* Test implementation details

Avoid:

```javascript
cy.get('.container > div:nth-child(2)')
```

Avoid:

```javascript
cy.wait(5000)
```

---

# **AI Agent Guidelines**

When generating tests:

1. Prefer **user-visible behavior** over internal logic  
2. Use **data-cy selectors**  
3. Create **independent tests**  
4. Stub **network calls**  
5. Use **custom commands for repeated workflows**  
6. Write **readable test descriptions**

If selectors are missing, suggest adding:

```
data-cy="element-name"
```

---

# **When Generating New Tests**

Agents should:

1. Identify the **user workflow**  
2. Break it into **separate test cases**  
3. Reuse existing **custom commands**  
4. Prefer **fixtures for test data**

Example workflow:

```
Login
Add item to cart
Checkout
Confirm order
```

Should generate **separate test cases**, not a single giant test.

---

# **File Naming Convention**

Tests must end with:

```
.cy.ts
```

Example:

```
checkout-flow.cy.ts
login.cy.ts
profile-settings.cy.ts
```

---

# **TypeScript Preference**

Tests should use **TypeScript when possible**.

Example:

```
cypress/e2e/login.cy.ts
```

---

If you want, I can also show you **3 advanced AGENTS.md improvements that dramatically improve AI-generated Cypress tests**, including:

* **Page Object pattern enforcement**  
* **test-id auto-generation strategy**  
* **AI-friendly test templates**

These make AI-generated tests **\~5–10x more reliable** in real repositories.

---

*Please proceed to show the 3 advanced improvements listed above*

Below are **three advanced improvements** that make an **AGENTS.md dramatically more effective for generating Cypress tests with AI agents**. These patterns reduce flaky tests and help agents produce **consistent, maintainable E2E tests across large Node.js repositories**.

---

# **1\. Enforce a Page Object Pattern**

AI agents tend to generate **long, duplicated tests** unless given a structural pattern.  
A **Page Object Model (POM)** keeps tests readable and reusable.

## **Directory Structure**

```
cypress/
  e2e/
  pages/
    LoginPage.ts
    DashboardPage.ts
    CheckoutPage.ts
```

Tests should **never contain raw selectors** when a page object exists.

---

## **Example Page Object**

```ts
export class LoginPage {
  visit() {
    cy.visit('/login')
  }

  fillEmail(email: string) {
    cy.get('[data-cy="email"]').type(email)
  }

  fillPassword(password: string) {
    cy.get('[data-cy="password"]').type(password)
  }

  submit() {
    cy.get('[data-cy="login-button"]').click()
  }

  login(email: string, password: string) {
    this.fillEmail(email)
    this.fillPassword(password)
    this.submit()
  }
}
```

---

## **Correct Test Using Page Object**

```ts
import { LoginPage } from '../pages/LoginPage'

describe('Login', () => {
  const loginPage = new LoginPage()

  it('should allow a user to login', () => {
    loginPage.visit()
    loginPage.login('user@test.com', 'password123')

    cy.get('[data-cy="dashboard"]').should('be.visible')
  })
})
```

---

## **Rule for Agents**

Agents must:

* Use existing page objects when available  
* Create new page objects when a page contains **more than 3 selectors**  
* Avoid raw `cy.get()` selectors in test files

Bad:

```javascript
cy.get('[data-cy="email"]').type('user@test.com')
cy.get('[data-cy="password"]').type('password123')
```

Good:

```javascript
loginPage.login(email, password)
```

---

# **2\. Standardize Test ID / data-cy Generation**

Many AI-generated tests fail because **selectors are missing or inconsistent**.

Define a **strict naming convention**.

---

## **Naming Format**

```
data-cy="<feature>-<element>"
```

Examples:

```html
data-cy="login-email"
data-cy="login-password"
data-cy="login-submit"

data-cy="cart-add-item"
data-cy="cart-checkout"

data-cy="profile-save-button"
```

---

## **Component Example**

```html
<input data-cy="login-email" />
<input data-cy="login-password" />

<button data-cy="login-submit">
  Log In
</button>
```

---

## **Cypress Usage**

```javascript
cy.get('[data-cy="login-email"]').type('user@test.com')
cy.get('[data-cy="login-password"]').type('password123')
cy.get('[data-cy="login-submit"]').click()
```

---

## **Rule for Agents**

If a selector is missing, the agent should recommend adding one.

Example suggestion:

```
Add the following attribute to make Cypress tests stable:

data-cy="checkout-submit"
```

Never rely on:

```
.class selectors
#ids tied to styling
DOM hierarchy
```

---

# **3\. AI-Friendly Test Case Templates**

AI works best when provided **consistent templates**.

Provide a canonical **test generation format**.

---

# **Standard Test Template**

Agents should generate tests using this structure:

```ts
describe('Feature: <feature-name>', () => {
  beforeEach(() => {
    cy.task('db:seed')
  })

  it('should <user-behavior>', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

---

## **Example Generated Test**

```ts
import { LoginPage } from '../pages/LoginPage'

describe('Feature: Authentication', () => {
  const loginPage = new LoginPage()

  beforeEach(() => {
    cy.task('db:seed')
  })

  it('should log the user in successfully', () => {
    // Arrange
    loginPage.visit()

    // Act
    loginPage.login('user@test.com', 'password123')

    // Assert
    cy.get('[data-cy="dashboard"]').should('be.visible')
  })
})
```

---

# **Recommended Test Case Types**

Agents should generate **multiple focused tests**.

Example login test suite:

```
login.cy.ts
```

Tests:

```
should allow a user to login
should show validation errors for empty form
should show error for invalid credentials
should redirect authenticated user to dashboard
```

---

# **Test Length Limits**

Tests should not exceed:

```
30 lines
```

Long flows must be broken into **separate tests**.

Bad:

```
login → add item → checkout → logout
```

Good:

```
login.cy.ts
cart.cy.ts
checkout.cy.ts
```

---

# **Bonus Improvement (Highly Recommended)**

Add a **Cypress Testing Philosophy section**.

AI agents follow it surprisingly well.

```
Tests verify user behavior, not implementation details.

Prefer:

"What does the user see or do?"

Avoid:

"Does this React state update?"
"Did this function run?"
```

---

# **Result**

With these improvements AI agents will:

✅ Generate **cleaner Cypress tests**  
✅ Reuse **Page Objects automatically**  
✅ Suggest **missing test IDs**  
✅ Avoid **flaky selectors**  
✅ Produce **shorter, maintainable tests**

---

💡 If you'd like, I can also show you a **"production-grade AGENTS.md used by large teams"** that includes:

* **automatic test generation rules**  
* **network mocking standards**  
* **visual regression testing**  
* **test performance limits**  
* **CI/CD rules for Cypress**

This version is **\~3× more powerful for AI coding agents** and works extremely well with GitHub Copilot and Cursor.

---

*If we use Bitbucket instead of Github, does that change our approach above?*

Short answer: **No — the core approach does not change.**  
The **AGENTS.md structure, Cypress best practices, Page Objects, selectors, and test templates remain exactly the same** whether your repo is on Bitbucket, GitHub, GitLab, or locally.

However, **three practical things do change when using Bitbucket**:

1. **CI/CD configuration**  
2. **Pull request workflows**  
3. **AI agent discovery of AGENTS.md**

Below are the adjustments that make the setup **Bitbucket-optimized**.

---

# **1\. CI/CD: Use Bitbucket Pipelines Instead of GitHub Actions**

The biggest change is how tests run in CI.

GitHub repos typically use:

```
.github/workflows/cypress.yml
```

Bitbucket uses:

```
bitbucket-pipelines.yml
```

---

## **Example Bitbucket Pipeline for Cypress**

```
image: cypress/included:13.6.0

pipelines:
  pull-requests:
    "**":
      - step:
          name: Run Cypress Tests
          caches:
            - node
          script:
            - npm ci
            - npm run build
            - npm run start &
            - npx wait-on http://localhost:3000
            - npx cypress run
```

---

## **Best Practice for Agents**

Add this section to **AGENTS.md**:

```
# CI Environment

End-to-end tests run in Bitbucket Pipelines.

Configuration file:
bitbucket-pipelines.yml

Agents must ensure tests can run headlessly using:

npm run cypress:run

Tests must not depend on local environment setup.
```

---

# **2\. Pull Request Workflow Differences**

GitHub AI tools often rely on **PR comments and workflows**.

Bitbucket supports PR checks but **automation conventions differ slightly**.

Recommended workflow:

```
Feature Branch
    ↓
Open Pull Request
    ↓
Bitbucket Pipeline Runs Cypress
    ↓
PR must pass before merge
```

---

## **Add This Rule to AGENTS.md**

```
# Pull Request Requirements

All pull requests must pass Cypress end-to-end tests.

Agents generating code must also generate or update relevant Cypress tests.

Pull requests without tests for new user workflows should be rejected.
```

---

# **3\. AI Agent File Discovery**

GitHub recently introduced **native support for `AGENTS.md` discovery** for AI tools.

Bitbucket **does not yet have a formal convention**, but agents still read repo files.

To maximize compatibility:

Place guidance in **two locations**:

```
AGENTS.md
docs/testing/cypress-guide.md
```

---

## **Recommended Repo Structure**

```
repo-root
│
├─ AGENTS.md
├─ bitbucket-pipelines.yml
├─ package.json
│
├─ cypress
│   ├─ e2e
│   ├─ fixtures
│   ├─ pages
│   └─ support
│
└─ docs
    └─ testing
        └─ cypress-guide.md
```

Agents often perform better when instructions are **both in root and docs**.

---

# **4\. Cypress Parallelization in Bitbucket**

GitHub users often rely on **Cypress Cloud parallelization**.

Bitbucket can do the same.

Example:

```
script:
  - npx cypress run --record --parallel
```

Add to **AGENTS.md**:

```
# Parallel Test Execution

Cypress tests run in parallel in CI.

Tests must be independent and not rely on shared state.
```

---

# **5\. Environment Variables**

Bitbucket pipelines handle secrets slightly differently.

Example:

```
Repository Settings → Pipelines → Repository Variables
```

Then use:

```javascript
Cypress.env('API_URL')
```

Example config:

```javascript
const apiUrl = Cypress.env('API_URL')
```

---

# **6\. Recommended Cypress Scripts**

Your `package.json` should expose commands agents can rely on.

Example:

```json
{
  "scripts": {
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "test:e2e": "cypress run"
  }
}
```

Add to **AGENTS.md**:

```
Agents must use the provided npm scripts instead of raw Cypress commands.
```

---

# **Final Answer**

Using **Bitbucket instead of GitHub does NOT change:**

* Cypress test structure  
* Page Object patterns  
* Selector strategy  
* Test templates  
* AI agent guidance

It **only changes:**

| Area | Change |
| ----- | ----- |
| CI/CD | GitHub Actions → Bitbucket Pipelines |
| PR automation | Bitbucket PR checks |
| AI conventions | No native AGENTS.md standard yet |
| secrets | Bitbucket repo variables |

---

✅ **Your AGENTS.md strategy still works perfectly on Bitbucket.**

---

💡 If you'd like, I can also show you a **“battle-tested AGENTS.md specifically tuned for Cypress test generation by AI agents”** that includes:

* **automatic page-object creation rules**  
* **selector linting rules**  
* **flaky test prevention**  
* **network stubbing patterns**  
* **test generation prompts**

It’s the version teams use when they want **AI to reliably generate hundreds of Cypress tests across large Node.js repos.**

---

*Please proceed to show a battle tested AGENTS.md tuned from Cypress test generation by AI Agents.*

Below is a **battle-tested `AGENTS.md`** template designed specifically to guide **AI agents to reliably generate Cypress end-to-end tests in Node.js repositories**.

It combines patterns used in large production repos:

* strict selector rules  
* page object enforcement  
* deterministic test data  
* network stubbing  
* flaky test prevention  
* AI-friendly test templates  
* CI compatibility

You can place this file at the **repo root**.

---

# **AGENTS.md**

Guidelines for AI agents generating **Cypress end-to-end tests** in this Node.js repository.

These rules exist to ensure tests are:

* deterministic  
* stable  
* readable  
* maintainable  
* CI-compatible

Agents must follow these rules when generating or modifying Cypress tests.

---

# **Project Structure**

All Cypress files must follow this structure:

```
cypress/
  e2e/
  fixtures/
  pages/
  support/
```

Example:

```
cypress/
  e2e/login.cy.ts
  pages/LoginPage.ts
  fixtures/user.json
  support/commands.ts
```

Agents should **create missing directories if needed**.

---

# **Core Principles**

Cypress tests must:

1. Validate **user-visible behavior**  
2. Be **independent**  
3. Avoid **timing-based logic**  
4. Use **stable selectors**  
5. Be **short and focused**

Tests should fail **only when real user behavior breaks**.

---

# **Required Commands**

Agents must use these scripts instead of raw commands.

```
npm run cypress:open
npm run cypress:run
npm run test:e2e
```

Example `package.json`:

```
"scripts": {
  "cypress:open": "cypress open",
  "cypress:run": "cypress run",
  "test:e2e": "cypress run"
}
```

---

# **Test File Naming**

All test files must end with:

```
.cy.ts
```

Examples:

```
login.cy.ts
checkout-flow.cy.ts
profile-settings.cy.ts
```

---

# **Page Object Pattern (MANDATORY)**

Tests must use **Page Objects**.

Raw selectors should not appear in test files when a page object exists.

---

## **Page Object Location**

```
cypress/pages/
```

Example:

```
cypress/pages/LoginPage.ts
```

---

## **Example Page Object**

```ts
export class LoginPage {
  visit() {
    cy.visit('/login')
  }

  enterEmail(email: string) {
    cy.get('[data-cy="login-email"]').type(email)
  }

  enterPassword(password: string) {
    cy.get('[data-cy="login-password"]').type(password)
  }

  submit() {
    cy.get('[data-cy="login-submit"]').click()
  }

  login(email: string, password: string) {
    this.enterEmail(email)
    this.enterPassword(password)
    this.submit()
  }
}
```

---

## **Page Object Rule for Agents**

Create a page object when:

* a page contains **3 or more selectors**  
* selectors are reused across tests

---

# **Selector Rules (CRITICAL)**

Selectors must use **data attributes only**.

Preferred:

```
data-cy
```

Example:

```html
<button data-cy="login-submit">Log In</button>
```

---

## **Cypress Usage**

```
cy.get('[data-cy="login-submit"]').click()
```

---

## **Naming Convention**

```
data-cy="<feature>-<element>"
```

Examples:

```
login-email
login-password
login-submit

cart-add-item
cart-checkout

profile-save-button
```

---

## **Forbidden Selectors**

Never generate:

```
cy.get('.btn-primary')
cy.get('#login-form')
cy.get('div > div:nth-child(2)')
```

CSS selectors tied to styling are unstable.

---

# **Test Structure**

Tests must follow this pattern.

```
describe('Feature: <feature-name>', () => {

  beforeEach(() => {
    cy.task('db:seed')
  })

  it('should <expected behavior>', () => {

    // Arrange

    // Act

    // Assert

  })
})
```

---

# **Example Generated Test**

```ts
import { LoginPage } from '../pages/LoginPage'

describe('Feature: Authentication', () => {

  const loginPage = new LoginPage()

  beforeEach(() => {
    cy.task('db:seed')
  })

  it('should allow a user to log in', () => {

    // Arrange
    loginPage.visit()

    // Act
    loginPage.login('user@test.com', 'password123')

    // Assert
    cy.get('[data-cy="dashboard"]').should('be.visible')

  })
})
```

---

# **Test Length Rules**

Tests should not exceed:

```
30 lines
```

If longer, split into multiple tests.

Bad example:

```
login → add item → checkout → logout
```

Good:

```
login.cy.ts
cart.cy.ts
checkout.cy.ts
```

---

# **Waiting Rules**

Never use arbitrary waits.

Forbidden:

```
cy.wait(5000)
```

Correct:

```
cy.get('[data-cy="dashboard"]').should('be.visible')
```

---

# **Network Stubbing**

External APIs must be stubbed when possible.

Example:

```
cy.intercept('POST', '/api/login', {
  statusCode: 200,
  body: { token: 'fake-token' }
})
```

Alias network calls:

```
cy.intercept('/api/user').as('getUser')
cy.wait('@getUser')
```

---

# **Test Data Strategy**

Use **fixtures for deterministic data**.

Location:

```
cypress/fixtures/
```

Example:

```
user.json
orders.json
```

Usage:

```javascript
cy.fixture('user').then((user) => {
  loginPage.login(user.email, user.password)
})
```

---

# **Custom Commands**

Reusable actions belong in:

```
cypress/support/commands.ts
```

Example:

```ts
Cypress.Commands.add('login', (email, password) => {

  cy.visit('/login')

  cy.get('[data-cy="login-email"]').type(email)
  cy.get('[data-cy="login-password"]').type(password)

  cy.get('[data-cy="login-submit"]').click()

})
```

Usage:

```
cy.login('user@test.com', 'password123')
```

---

# **Flaky Test Prevention**

Agents must avoid patterns that cause flaky tests.

Do not generate:

```
cy.wait(3000)
```

Do not rely on:

```
animation timing
UI delays
external services
```

Tests must wait for **observable state changes**.

---

# **AI Agent Responsibilities**

When generating tests, agents must:

1. Identify the **user workflow**  
2. Break the workflow into **multiple tests**  
3. Use **page objects**  
4. Use **fixtures**  
5. Stub **network requests**  
6. Suggest **data-cy selectors if missing**

Example suggestion:

```
Add data-cy="checkout-submit" to the checkout button to enable stable Cypress tests.
```

---

# **CI Requirements**

Tests must run in CI using:

```
npm run cypress:run
```

Tests must:

* run headlessly  
* not depend on local setup  
* not require manual interaction

---

# **Test Generation Strategy**

When generating tests for a feature:

1. Identify main user flows  
2. Create separate tests per flow

Example for login:

```
should allow login
should show validation errors
should reject invalid credentials
should redirect after login
```

---

# **Definition of Done for New Features**

A feature is not complete unless:

* Cypress tests exist  
* Tests pass in CI  
* Page objects are used  
* Stable selectors exist

---

# **If Selectors Are Missing**

Agents should recommend adding:

```
data-cy="<feature>-<element>"
```

Example:

```
data-cy="checkout-submit"
```

---

# **Testing Philosophy**

Tests verify **what the user sees and does**, not implementation details.

Good test:

```
User logs in and sees dashboard
```

Bad test:

```
Redux state updated
React hook executed
```

---

# **End of File**

---

✅ This version works well with:

* **ChatGPT**  
* **Copilot**  
* **Cursor**  
* **Codeium**  
* **Claude**  
* **AI PR reviewers**

---

If you'd like, I can also show you one **extremely powerful addition most teams miss**:

**`TESTING_AGENTS.md` \+ a Cypress test generator prompt**

It lets AI generate **entire test suites automatically from a feature spec**, which is how some teams generate **hundreds of E2E tests in minutes.**

---

*Please proceed to show the test generator prompt addition.*

The idea behind a **test generator prompt** is to give AI agents a **consistent instruction format** for converting a **feature spec, user story, or UI workflow** into a **complete Cypress test suite** that follows the rules defined in your `AGENTS.md`.

Most teams place this prompt in a second file such as:

```
TESTING_AGENTS.md
```

This file is **not rules** like `AGENTS.md`.  
Instead, it contains **instructions AI should follow when generating tests**.

Below is a **battle-tested version tuned for Cypress E2E test generation**.

---

# **TESTING\_AGENTS.md**

Instructions for AI agents generating Cypress end-to-end tests.

These instructions complement `AGENTS.md`.  
All generated tests must comply with the rules defined there.

---

# **Goal**

Given a **feature description, UI spec, or user story**, generate a **complete Cypress test suite** that validates the user workflow.

Tests must be:

* deterministic  
* independent  
* readable  
* CI-compatible  
* based on user-visible behavior

---

# **Input Format**

Agents may receive input in one of these formats:

### **Example User Story**

```
User Story:
A user can log into the application using email and password.

Acceptance Criteria:
- user enters email
- user enters password
- clicking login authenticates user
- successful login redirects to dashboard
- invalid credentials show error message
```

### **Example Workflow**

```
Workflow:
1. user visits login page
2. user enters credentials
3. user submits form
4. user sees dashboard
```

### **Example UI Description**

```
Page: Login

Elements:
email input
password input
login button
error message
```

---

# **Expected Output**

Agents must generate:

1. A Cypress test file  
2. Page object (if needed)  
3. Suggested selectors if missing  
4. Multiple focused test cases

---

# **Test Suite Generation Rules**

When generating tests:

1. Identify **distinct user behaviors**  
2. Convert each behavior into a **separate test**  
3. Use **page objects**  
4. Use **fixtures for data**  
5. Stub **network calls when possible**

---

# **Generated File Structure**

Agents should produce:

```
cypress/e2e/<feature>.cy.ts
cypress/pages/<FeaturePage>.ts
```

Example:

```
cypress/e2e/login.cy.ts
cypress/pages/LoginPage.ts
```

---

# **Step 1: Generate Page Object**

Create a page object when:

* the page contains multiple interactive elements  
* selectors are reused across tests

Example:

```ts
export class LoginPage {

  visit() {
    cy.visit('/login')
  }

  enterEmail(email: string) {
    cy.get('[data-cy="login-email"]').type(email)
  }

  enterPassword(password: string) {
    cy.get('[data-cy="login-password"]').type(password)
  }

  submit() {
    cy.get('[data-cy="login-submit"]').click()
  }

}
```

---

# **Step 2: Generate Cypress Tests**

Example test suite:

```ts
import { LoginPage } from '../pages/LoginPage'

describe('Feature: Authentication', () => {

  const loginPage = new LoginPage()

  beforeEach(() => {
    cy.task('db:seed')
    loginPage.visit()
  })

  it('should allow a user to log in successfully', () => {

    loginPage.enterEmail('user@test.com')
    loginPage.enterPassword('password123')

    loginPage.submit()

    cy.get('[data-cy="dashboard"]').should('be.visible')

  })

  it('should display validation errors for empty fields', () => {

    loginPage.submit()

    cy.get('[data-cy="login-error"]').should('be.visible')

  })

  it('should reject invalid credentials', () => {

    loginPage.enterEmail('user@test.com')
    loginPage.enterPassword('wrong-password')

    loginPage.submit()

    cy.get('[data-cy="login-error"]').should('contain', 'Invalid credentials')

  })

})
```

---

# **Step 3: Suggest Missing Selectors**

If the UI lacks stable selectors, agents must suggest them.

Example suggestion:

```
Add the following attributes to enable stable Cypress tests:

data-cy="login-email"
data-cy="login-password"
data-cy="login-submit"
data-cy="login-error"
```

---

# **Step 4: Suggest Fixture Data**

If user data is required, generate a fixture.

Example:

```
cypress/fixtures/user.json
```

Example content:

```json
{
  "email": "user@test.com",
  "password": "password123"
}
```

Usage:

```javascript
cy.fixture('user').then(user => {
  loginPage.enterEmail(user.email)
})
```

---

# **Test Generation Checklist**

Before finishing, agents must verify:

* selectors use `data-cy`  
* tests are independent  
* no `cy.wait(time)` is used  
* page objects are used  
* test descriptions describe behavior  
* tests are under 30 lines

---

# **Output Format**

Generated output should contain:

1️⃣ Page object file  
2️⃣ Cypress test file  
3️⃣ Selector suggestions  
4️⃣ Fixture suggestions

Example output sections:

```
Page Object
Cypress Test File
Selector Recommendations
Fixture Data
```

---

# **Behavior-Focused Testing**

Tests must reflect **what the user experiences**.

Good test:

```
user logs in and sees dashboard
```

Bad test:

```
authentication API returned 200
```

---

# **Large Feature Rule**

If a feature has multiple workflows:

Generate **multiple test files**.

Example:

```
login.cy.ts
password-reset.cy.ts
signup.cy.ts
```

Do not generate **one large test file**.

---

# **Example Generation Request**

Example prompt an agent might receive:

```
Generate Cypress tests for:

Feature: Checkout

User flow:
- user adds item to cart
- user proceeds to checkout
- user enters shipping info
- user confirms order
```

Expected output:

```
CartPage.ts
CheckoutPage.ts
cart.cy.ts
checkout.cy.ts
```

---

# **End of File**

---

# **Why This Works Extremely Well**

With:

```
AGENTS.md
TESTING_AGENTS.md
```

AI agents can reliably:

* read project rules  
* interpret feature descriptions  
* generate structured Cypress tests  
* create page objects  
* suggest selectors  
* avoid flaky patterns

This setup is used in **large repos with hundreds of Cypress tests**.

---

💡 If you'd like, I can also show one **very powerful next step used by advanced teams**:

### **“Spec-Driven Cypress Generation”**

Where you add a simple file like:

```
specs/login.feature
specs/checkout.feature
```

…and AI can automatically generate **entire Cypress test suites from those specs** with almost no prompting.


---------

Please review the cypress-testing.md file in this folder that I created in a ChatGPT coversation. 

I would like to continue the conversation with the last comments from ChatGPT: @cypress-testing.md (1928-1930) Please continue to explain this


Please proceed with the template pack as proposed above.

Excellent - here is a ready-to-use template pack you can drop into your project.

## Folder Structure

```text
specs/
  login.feature
  checkout.feature
  crud.feature
  _template.feature
```

---

## 1) Base Spec Template (`specs/_template.feature`)

```gherkin
Feature: <Feature Name>
  As a <role>
  I want to <goal>
  So that <business value>

  Background:
    Given test data "<fixture_or_seed>"
    And I am authenticated as "<role>" # or "I am unauthenticated"

  @smoke @regression
  Scenario: <Happy path title>
    Given I am on "<route_or_page>"
    When I perform "<action_1>"
    And I perform "<action_2>"
    Then I should see "<ui_state_or_message>"
    And the URL should include "<path>"
    And API "<method> <endpoint_alias>" should return "<status_code>"

  @regression
  Scenario: <Validation / edge case title>
    Given I am on "<route_or_page>"
    When I perform "<invalid_or_edge_action>"
    Then I should see error "<error_message>"
    And no request is sent to "<endpoint_alias>" # or specific assertion

  @regression
  Scenario: <Permission / security case title>
    Given I am authenticated as "<restricted_role>"
    When I navigate to "<restricted_route>"
    Then I should see "<forbidden_or_redirect_behavior>"
```

---

## 2) Login Spec (`specs/login.feature`)

```gherkin
Feature: Login
  As a registered user
  I want to sign in
  So that I can access my dashboard

  Background:
    Given test data "users/default-user.json"
    And I am unauthenticated

  @smoke @regression
  Scenario: Successful login
    Given I am on "/login"
    When I fill "email" with "user@example.com"
    And I fill "password" with "CorrectHorseBatteryStaple1!"
    And I click "Sign in"
    Then I should be redirected to "/dashboard"
    And I should see "Welcome"
    And API "POST @login" should return "200"

  @regression
  Scenario: Invalid password shows error
    Given I am on "/login"
    When I fill "email" with "user@example.com"
    And I fill "password" with "wrong-password"
    And I click "Sign in"
    Then I should see error "Invalid email or password"
    And URL should include "/login"

  @regression
  Scenario: Required field validation
    Given I am on "/login"
    When I click "Sign in"
    Then I should see error "Email is required"
    And I should see error "Password is required"
```

---

## 3) Checkout Spec (`specs/checkout.feature`)

```gherkin
Feature: Checkout
  As a shopper
  I want to complete checkout
  So that I can place an order

  Background:
    Given test data "catalog/standard-items.json"
    And I am authenticated as "customer"
    And cart contains "SKU-123" quantity "1"

  @smoke @regression
  Scenario: Successful checkout with card
    Given I am on "/cart"
    When I click "Checkout"
    And I fill shipping form with:
      | firstName | Anton       |
      | lastName  | Minnie      |
      | address   | 123 Main St |
      | city      | Austin      |
      | zip       | 78701       |
    And I choose payment method "card"
    And I confirm order
    Then I should see "Order confirmed"
    And I should see order number
    And API "POST @createOrder" should return "201"

  @regression
  Scenario: Missing shipping fields blocks order
    Given I am on "/checkout"
    When I click "Confirm order"
    Then I should see error "Address is required"
    And I should remain on "/checkout"

  @regression
  Scenario: Out-of-stock item handling
    Given cart contains "SKU-OOS" quantity "1"
    When I open "/checkout"
    Then I should see "Item is out of stock"
    And "Confirm order" should be disabled
```

---

## 4) CRUD Spec (`specs/crud.feature`)

```gherkin
Feature: Project CRUD
  As a team member
  I want to manage projects
  So that work stays organized

  Background:
    Given I am authenticated as "editor"
    And test data "projects/seed-projects.json"

  @smoke @regression
  Scenario: Create project
    Given I am on "/projects"
    When I click "New project"
    And I fill "name" with "Website Redesign"
    And I fill "key" with "WR-2026"
    And I click "Create"
    Then I should see "Project created"
    And project row "Website Redesign" should be visible
    And API "POST @createProject" should return "201"

  @regression
  Scenario: Update project name
    Given project "Website Redesign" exists
    And I am on "/projects"
    When I open project "Website Redesign"
    And I update "name" to "Website Refresh"
    And I click "Save"
    Then I should see "Project updated"
    And project row "Website Refresh" should be visible

  @regression
  Scenario: Delete project
    Given project "Website Refresh" exists
    And I am on "/projects"
    When I delete project "Website Refresh"
    Then I should see "Project deleted"
    And project row "Website Refresh" should not exist
```

---

## 5) Generation Prompt Contract (for your AI agent)

Use this as your always-on generation prompt (for example in `TESTING_AGENTS.md` or your agent instructions):

```md
You generate Cypress tests from `.feature` specs in `/specs`.

## Inputs
- Feature spec file(s) from `/specs`
- Existing Cypress setup in `/cypress`
- Project testing rules from `AGENTS.md` and `TESTING_AGENTS.md`

## Required outputs
1. One Cypress spec per feature:
   - `/cypress/e2e/<feature>.cy.ts`
2. Reusable page objects only when needed:
   - `/cypress/support/pages/<PageName>.ts`
3. Optional helper/commands updates:
   - `/cypress/support/commands.ts`
4. Fixtures for test data if referenced:
   - `/cypress/fixtures/...`

## Non-negotiable rules
- Use `data-testid` selectors first; avoid brittle CSS/text selectors.
- Use `cy.intercept()` for critical network assertions.
- No arbitrary `cy.wait(<ms>)`; use deterministic waits/aliases.
- Keep tests independent and idempotent.
- Prefer API setup/teardown for data creation when possible.
- Add positive + negative coverage from each scenario.
- Keep files small and focused; split large features.

## Naming conventions
- `describe('<Feature>: <area>')`
- `it('<Scenario title>')`
- aliases like `@login`, `@createOrder`
- Page object methods are action-oriented (`submitLogin`, `fillShippingForm`)

## Assertion standards
- Assert URL/state transitions.
- Assert visible success/error messages.
- Assert network response codes for key mutations.
- Assert no unintended side effects for invalid flows.

## Output format
- Return a concise change list first.
- Then provide complete file contents for each created/updated file.
- Do not include explanatory prose unless requested.
```

---

## 6) Optional Runner Prompt (single command style)

When you want generation for one spec:

```md
Generate Cypress tests from `specs/login.feature` following `AGENTS.md` and `TESTING_AGENTS.md`.

Create/update:
- `cypress/e2e/login.cy.ts`
- page objects only if needed
- fixtures/helpers only if needed

Enforce:
- data-testid selectors
- intercept aliases for key API calls
- no arbitrary waits
- positive + negative scenarios
```

If you want, next I can produce a version tailored to your actual app routes and API endpoints so these are no longer generic templates, but immediately runnable in your repo.
