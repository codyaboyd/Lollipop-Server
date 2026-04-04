# Lollipop 🍭

A lightweight Node.js CLI for:

- serving files and folders over HTTP,
- mirroring a website to local files,
- viewing live system metrics, and
- running JavaScript utilities.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Requirements](#requirements)
3. [Install](#install)
4. [Quick Start](#quick-start)
5. [CLI Reference](#cli-reference)
6. [Config File (`lolli.pop`)](#config-file-lollipop)
7. [Examples](#examples)
8. [Notes & Caveats](#notes--caveats)
9. [Contributing](#contributing)
10. [License](#license)

---

## What It Does

### 1) Static file server
- Serve a directory with a visual file browser.
- If no arguments are provided, Lollipop serves **every subfolder** in the current directory starting at port `9000`.

### 2) Password-protected server
- Add Basic Auth protection to file serving with `-p <password>`.

### 3) System monitor dashboard
- Starts an HTTP dashboard/API for CPU, memory, disks, processes, and swap usage.
- Protected by Basic Auth.

### 4) Website mirroring (`sucker`)
- Downloads a target website and saves assets locally (`img`, `js`, `css`, `fonts`).

### 5) Script execution (`js` / `execute`)
- Runs a Node.js script file through the CLI.

---

## Requirements

- **Node.js 18+**
- npm (for dependency install)

---

## Install

```bash
# Clone
git clone <your-repo-url>
cd Lollipop-Server

# Install dependencies
npm install
```

### Optional: global command
If you want to call `lollipop` directly, add a global binary mapping in `package.json` (or run via `node lollipop.js` as shown below).

---

## Quick Start

```bash
# Show help
node lollipop.js -h

# Serve a folder
node lollipop.js ./public 8080

# Serve with Basic Auth password
node lollipop.js ./public 8080 -p secret

# Monitor dashboard
node lollipop.js monitor 7000 myPassword

# Mirror a website
node lollipop.js sucker https://example.org mirror

# Run a script
node lollipop.js js ./scripts/task.js
```

---

## CLI Reference

```text
Usage: lollipop [OPTIONS] [COMMANDS]

Options:
  -c <config_file>         Use a lolli.pop configuration file
  <directory> <port>       Serve a directory at the specified port
  -p <password>            Protect the server with Basic Auth
  -h                       Show help

Commands:
  monitor <port> <pass>    Start the system monitor dashboard
  sucker <url> <folder>    Mirror a website into a folder
  js <script.js>           Execute a JavaScript file
  execute <script.js>      Alias for js
```

### Default behavior (no args)
Running `node lollipop.js` with no arguments scans the current working directory and starts one server per subdirectory, beginning at port `9000`.

---

## Config File (`lolli.pop`)

You can orchestrate multiple actions from one file:

```text
(monitor 5000 My$Up3rPass)
(sucker https://example.com backupSite)
(js ./scripts/cleanup.js)
(./siteA 4000 -p admin123)
(./docs 4100)
```

Start everything:

```bash
node lollipop.js -c lolli.pop
```

### Rules
- One declaration per parenthesized line.
- First token determines declaration type:
  - `monitor`
  - `sucker`
  - `js`
  - otherwise interpreted as `<directory> <port> [-p <password>]`
- Ports must be unique across all server/monitor declarations.

---

## Examples

| Goal | Command |
|---|---|
| Serve all subfolders in current directory | `node lollipop.js` |
| Secure server on port 9001 | `node lollipop.js ./site 9001 -p swordfish` |
| Run monitor on port 7000 | `node lollipop.js monitor 7000 myPass` |
| Mirror example.org | `node lollipop.js sucker https://example.org mirror` |
| Execute a script | `node lollipop.js execute ./scripts/maintain.js` |

---

## Notes & Caveats

- Basic Auth passwords are compared as plaintext.
- For internet-exposed usage, place behind a reverse proxy/VPN and use HTTPS.
- `sucker` relies on external pages and may fail on highly dynamic/SPA-heavy websites.
- Press `Ctrl+C` to stop; the app prints `Lollipop!` before exit.

---

## Contributing

PRs are welcome. Suggested flow:

1. Fork the repo
2. Create a branch
3. Make your changes
4. Run checks
5. Open a PR

---

## License

MIT
