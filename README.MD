# Lollipop 🍭

Lollipop is a lightweight Node.js CLI for quickly:

- serving local folders over HTTP,
- protecting file servers with Basic Auth,
- running a live system-monitor dashboard,
- mirroring websites to local files, and
- executing JavaScript utility scripts.

It is designed for local/dev workflows where you need simple tooling with minimal setup.

---

## Table of Contents

1. [Who This Is For](#who-this-is-for)
2. [Prerequisites](#prerequisites)
3. [Install](#install)
4. [5-Minute Quick Start](#5-minute-quick-start)
5. [Command Reference](#command-reference)
6. [Configuration File (`lolli.pop`)](#configuration-file-lollipop)
7. [Common New-User Tasks](#common-new-user-tasks)
8. [Project Layout](#project-layout)
9. [Troubleshooting](#troubleshooting)
10. [Security Notes](#security-notes)
11. [Contributing](#contributing)
12. [License](#license)

---

## Who This Is For

Use Lollipop if you want a small, scriptable CLI to:

- share folders over your local network,
- expose quick internal demos,
- inspect machine metrics in a browser,
- archive static snapshots of websites,
- or run JS tasks from a single command tool.

---

## Prerequisites

- **Node.js 18+**
- **npm**

Check your versions:

```bash
node --version
npm --version
```

---

## Install

```bash
git clone <your-repo-url>
cd Lollipop-Server
npm install
```

> This project currently runs via `node lollipop.js` (there is no preconfigured global `lollipop` binary in `package.json`).

### Compile the CLI to a binary (Vercel `pkg`)

After `npm install`, you can generate standalone binaries with these **node-based** commands:

```bash
# auto-detect host target and write output into ./dist
node ./node_modules/pkg/lib-es5/bin.js . --out-path dist

# explicit targets
node ./node_modules/pkg/lib-es5/bin.js . --targets node18-linux-x64 --output dist/lollipop-linux
node ./node_modules/pkg/lib-es5/bin.js . --targets node18-macos-x64 --output dist/lollipop-macos
node ./node_modules/pkg/lib-es5/bin.js . --targets node18-win-x64 --output dist/lollipop-win.exe
```

Or run the equivalent npm scripts:

```bash
npm run build:bin
npm run build:bin:linux
npm run build:bin:macos
npm run build:bin:win
```

### Build a packaged Electron app for the current machine (embedded binaries)

This command will:

1. compile a `lollipop` CLI binary for your current OS/architecture,
2. download the matching `cloudflared` binary, and
3. package the Electron controller with both binaries embedded under `resources/bin`.

```bash
npm run build:electron:target
```

---

## 5-Minute Quick Start

### 1) Show help

```bash
node lollipop.js -h
```

### 2) Serve a folder on port 8080

```bash
node lollipop.js ./public 8080
```

### 3) Serve the same folder with password protection

```bash
node lollipop.js ./public 8080 -p secret123
```

### 4) Start system monitor dashboard (port + password required)

```bash
node lollipop.js monitor 7000 myPassword
```

### 5) Mirror a website into a local folder

```bash
node lollipop.js sucker https://example.org mirror
```

### 6) Run a JavaScript script

```bash
node lollipop.js js ./scripts/task.js
# or
node lollipop.js execute ./scripts/task.js
```

### 7) Optional desktop GUI controller (Electron)

```bash
cd electron-controller
npm install
npm start
```

This launches a cross-platform desktop app that wraps `lollipop.js` and can start file servers, monitor mode, and optional `--tunnel`.

---

## Command Reference

```text
Usage: lollipop [OPTIONS] [COMMANDS]

Options:
  -c <config_file>      Use a lolli.pop configuration file
  <directory> <port>    Serve a directory on the specified port
  -p <password>         Enable Basic Auth for folder serving
  --tunnel              Start a Cloudflare tunnel for the server
  -h                    Show help

Commands:
  monitor <port> <password>   Start the monitor dashboard/API
  sucker <url> <folder>       Mirror a website into a local folder
  js <script.js>              Execute a JavaScript file
  execute <script.js>         Alias for js
```

### Default behavior (when no args are passed)

```bash
node lollipop.js
```

Lollipop scans the **current directory** for subfolders and starts one server per folder beginning at port `9000`.

---

## Configuration File (`lolli.pop`)

You can run multiple actions from one file:

```text
(monitor 5000 My$Up3rPass)
(sucker https://example.com backupSite)
(js ./scripts/cleanup.js)
(./siteA 4000 -p admin123 --tunnel)
(./docs 4100 --tunnel)
```

Run it:

```bash
node lollipop.js -c lolli.pop
```

### Rules

- Use one parenthesized declaration per line.
- First token determines the action:
  - `monitor`
  - `sucker`
  - `js`
  - otherwise treated as `<directory> <port> [-p <password>] [--tunnel]`
- Ports must be unique across server and monitor declarations.

---

## Common New-User Tasks

| Goal | Command |
|---|---|
| Serve all subfolders in current directory | `node lollipop.js` |
| Serve a folder on port 9001 | `node lollipop.js ./site 9001` |
| Add Basic Auth to server | `node lollipop.js ./site 9001 -p swordfish` |
| Start server + Cloudflare tunnel | `node lollipop.js ./site 9001 --tunnel` |
| Start monitor on port 7000 | `node lollipop.js monitor 7000 myPass` |
| Mirror `example.org` locally | `node lollipop.js sucker https://example.org mirror` |
| Execute a script file | `node lollipop.js execute ./scripts/maintain.js` |

---

## Project Layout

```text
.
├── lollipop.js        # CLI entrypoint
├── lolli.pop          # Example config file
├── mechs/             # Command implementations (server, monitor, sucker, execute)
├── package.json
├── electron-controller/  # Optional Electron desktop GUI
└── README.MD
```

---

## Troubleshooting

- **Nothing starts / command exits immediately**
  - Check `node` version (`node --version`) and reinstall deps (`npm install`).
- **"You must provide ..." messages**
  - Re-run with required positional args shown in `node lollipop.js -h`.
- **Port already in use**
  - Pick a different port (e.g., 8081) or stop the process using the existing port.
- **Website mirror is incomplete**
  - Dynamic/SPA pages may not scrape fully with static crawling.

---

## Security Notes

- Basic Auth credentials are simple username/password checks and should be treated as lightweight protection.
- For internet-facing usage, run behind HTTPS + reverse proxy/VPN.
- Avoid exposing monitor endpoints publicly without additional controls.

---

## Contributing

PRs are welcome.

1. Fork the repo
2. Create a feature branch
3. Make changes
4. Run checks
5. Open a PR

---

## License

MIT
