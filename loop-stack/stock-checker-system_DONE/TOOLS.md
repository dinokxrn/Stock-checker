# Environment Tools & Resources Map

**Status:** FRESH DISCOVERY  
**Discovered At:** 2026-11-04  
**Project Goal:** Build Stock Checker & Supplier Order System with Next.js SQLite Tailwind CSS per SRS

---

## 1. Highlighted Resources for Current Goal
The project requires building a mobile-first, finger-friendly Next.js web application backed by SQLite with Tailwind CSS, supporting 4-state stock checks, real-time supplier minimum order calculation, LINE order formatting, and PIN authentication.

- **Primary Stack:** Node.js (v22.23.4), npm (v10.9.9), npx, SQLite3 (`better-sqlite3` package & system sqlite3 CLI).
- **Design & UI Intelligence:** `ui-ux-pro-max` and `impeccable` skills for mobile touch targets (min 48px), high contrast numeric keypads, responsive progress bars, and status colors.
- **Execution Strategy:** `ponytail` for minimal dependency architecture, `verification-before-completion` for build & test verification.

---

## 2. MCP Servers
The following MCP servers are configured in the environment:

- **data-agent-kit**
  - *Description:* Google Cloud data services and active editor context tools.
  - *Tool Calls:*
    - `call_mcp_tool(ServerName="data-agent-kit", ToolName="get_active_editor_context", Arguments={})`
    - `call_mcp_tool(ServerName="data-agent-kit", ToolName="render_chart", Arguments={...})`
- **notebooks / data-agent-kit-plugin_dak-notebook**
  - *Description:* Interactive notebook creation and cell execution.
  - *Tool Calls:*
    - `call_mcp_tool(ServerName="notebooks", ToolName="create_notebook", Arguments={...})`
    - `call_mcp_tool(ServerName="notebooks", ToolName="insert_code_cell", Arguments={...})`

*(Note: MCP tools are largely cloud/data oriented; local development for this project will primarily utilize local CLI runtimes).*

---

## 3. Skills and Plugins
Installed and ready to guide execution:

- **ui-ux-pro-max** (`/Users/mac/.agents/skills/ui-ux-pro-max/SKILL.md`)
  - *Usage:* Guide mobile-first UI layout, 48px touch targets, numeric keypad UX, supplier progress bar, color contrast.
  - *Trigger:* Apply guidelines when building components.
- **impeccable** (`/Users/mac/.agents/skills/impeccable/SKILL.md`)
  - *Usage:* Frontend polish, design consistency, clean Tailwind styling, smooth transitions.
- **ponytail** (`/Users/mac/.agents/skills/ponytail/SKILL.md`)
  - *Usage:* Enforce lean, minimal dependencies. Prefer standard library / native web APIs (e.g. `navigator.clipboard` for LINE export, native HTML5 inputs, local SQLite).
- **verification-before-completion** (`/Users/mac/.gemini/config/plugins/superpowers/skills/verification-before-completion/SKILL.md`)
  - *Usage:* Mandatory validation commands (`npm run build`, `npm run lint`, functional tests) before reporting completion.
- **systematic-debugging** (`/Users/mac/.gemini/config/plugins/superpowers/skills/systematic-debugging/SKILL.md`)
  - *Usage:* Root-cause investigation when build or runtime errors arise.
- **test-driven-development** (`/Users/mac/.gemini/config/plugins/superpowers/skills/test-driven-development/SKILL.md`)
  - *Usage:* Unit and integration testing for stock calculations and database migrations.

---

## 4. Local System Tools and Runtimes

- **Node.js**: `v22.23.4` (`/opt/homebrew/bin/node`)
  - *Execution:* `node -v`, `node script.js`
- **npm**: `v10.9.9` (`/opt/homebrew/bin/npm`)
  - *Execution:* `npm install <pkg>`, `npm run dev`, `npm run build`, `npm test`
- **npx**: `v10.9.9` (`/opt/homebrew/bin/npx`)
  - *Execution:* `npx <command>` (e.g. `npx create-next-app@latest`)
- **SQLite3 CLI**: `v3.54.0` (`/usr/bin/sqlite3`)
  - *Execution:* `sqlite3 <db_file> ".tables"`, `sqlite3 <db_file> "SELECT * FROM items;"`
- **Git**: `v2.40.1` (`/opt/homebrew/bin/git`)
  - *Execution:* `git status`, `git add .`, `git commit -m "..."`, `git diff`
- **Python 3**: `3.14.6` (`/opt/homebrew/bin/python3`)
  - *Execution:* `python3 script.py` (useful for quick database seeding or data conversion if needed)
- **Curl**: `/usr/bin/curl`
  - *Execution:* `curl -I http://localhost:3000`
- **Docker**: `/usr/local/bin/docker` (available if containerized deployment is requested)
- **Make**: `/usr/bin/make`

---

## 5. Project-Specific Tooling & Commands
*Note: Run from project root `/Users/mac/Downloads/stock_checker-project`*

- **Scaffold Next.js App (if not initialized):**
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
  ```
- **Install Key Dependencies:**
  ```bash
  npm install better-sqlite3 lucide-react clsx tailwind-merge
  npm install -D @types/better-sqlite3
  ```
- **Development Server:**
  ```bash
  npm run dev
  ```
  *(Starts Next.js local server at `http://localhost:3000`)*
- **Production Build:**
  ```bash
  npm run build
  ```
- **Lint Check:**
  ```bash
  npm run lint
  ```
- **Direct Database Inspection:**
  ```bash
  sqlite3 data/stock_checker.db ".schema"
  ```

---

## 6. API Credentials Available in Environment
- **Environment variables detected:**
  - `ANTIGRAVITY_CSRF_TOKEN`
  - `AGY_BROWSER_ACTIVE_PORT_FILE`
- **External Paid APIs:** None needed. The system operates as a self-contained local SQLite application. LINE export is handled via clipboard / URI scheme (`navigator.clipboard.writeText` and `https://line.me/R/msg/text/?...`).

---

## 7. Not Relevant to This Goal (Do Not Investigate)
- Google Cloud BigQuery / AlloyDB / Dataproc / Spanner MCP tools.
- Reverse engineering tools (IDA, Ghidra, radare2, apktool, frida).
- Radio / SDR / Wireless penetration testing tools.

---

## 8. Newly Discovered Resources (Online — Unconfirmed Local)
*(Researchers will append online tools/libraries discovered during web research here if needed)*

---

## 9. Resource Usage Guide

| Resource | Exact Command / Call |
| :--- | :--- |
| **Node.js** | `node -v` |
| **npm install** | `npm install <package>` |
| **npm dev server** | `npm run dev` |
| **npm build** | `npm run build` |
| **npm lint** | `npm run lint` |
| **Scaffold Next.js** | `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes` |
| **SQLite CLI Query** | `sqlite3 <db_path> "<sql_statement>"` |
| **Git Commit** | `git add -A && git commit -m "<message>"` |
| **Verify Local URL** | `curl -s http://localhost:3000/api/health` |
