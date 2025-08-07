# Lollipop 🍭

*A Swiss‑army knife CLI for lightweight file servers, website scraping, and live system monitoring—written in Node.js.*

---

## Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [CLI Usage](#cli-usage)
6. [Configuration File (](#configuration-file-lollipop)[`lolli.pop`](#configuration-file-lollipop)[)](#configuration-file-lollipop)
7. [Examples](#examples)
8. [System Monitor Dashboard](#system-monitor-dashboard)
9. [Website Mirroring ("Sucker")](#website-mirroring-sucker)
10. [Executing Scripts](#executing-scripts)
11. [Security Notes](#security-notes)
12. [Logging & Graceful Shutdown](#logging--graceful-shutdown)
13. [Contributing](#contributing)
14. [License](#license)

---

## Features

- **Static File Server** – Serve any folder on an HTTP port of your choice, or host every sub‑folder automatically starting at port `9000`.
- **Password‑Protected Server** – Add basic authentication to any server with the `-p` flag or in the config file.
- **Website Mirror ("Sucker")** – Crawl an entire site and save a fully‑offline copy to a local directory.
- **Live System Monitor** – Built‑in dashboard that exposes CPU, memory, and process info over HTTP with password protection.
- **Script Runner** – Execute arbitrary JavaScript/Node scripts via `lollipop js` or from the config file.
- **Declarative Config** – Orchestrate multiple servers, monitors, scrapers, and scripts from a single `lolli.pop` file.
- **Cross‑Platform** – Works anywhere Node ≥ 18 runs (Linux, macOS, Windows).

## Prerequisites

- **Node.js ≥ 18**\
  (ESM & native `fetch` support assumed)

## Installation

```bash
# 1. Clone the repo
$ git clone https://github.com/your‑org/lollipop.git
$ cd lollipop

# 2. Install dependencies (none besides built‑ins!)
$ npm install    # optional: only if you add extra packages

# 3. Make it global (optional)
$ npm link       # allows using the `lollipop` command anywhere
```

## Quick Start

```bash
# Serve every sub‑folder in the current directory, starting at port 9000
$ lollipop

# Serve ./public on port 8080
$ lollipop ./public 8080

# Same, but require the password "secret"
$ lollipop ./public 8080 -p secret
```

## CLI Usage

```text
Usage: lollipop [OPTIONS] [COMMANDS]

Options:
  -c <config_file>      Use a lolli.pop configuration file.
  <directory> <port>    Serve a directory on the specified port.
  -p <password>         Protect the server with Basic Auth.
  -h                    Display CLI help.

Commands:
  monitor <port> <pass>       Start the system monitor dashboard.
  sucker  <url>  <folder>     Mirror a full website locally.
  js      <script.js>         Run a JavaScript/Node script.
```

> **Tip** : Omitting all arguments fires up a server for **each** sub‑folder in the current working directory—handy for rapid prototyping multiple micro‑sites.

## Configuration File (`lolli.pop`)

Define an entire stack declaratively:

```
(monitor 5000 My$Up3rPass)
(sucker https://example.com backupSite)
(js ./scripts/cleanup.js)
(/var/www/siteA 4000 -p admin123)
(./docs 4100)
```

### Syntax Rules

- Wrap each declaration in parentheses.
- First token decides the **type**: `monitor`, `sucker`, `js`, or a **path** (for a file server).
- **Order matters**: they run sequentially from top to bottom.
- Ports must be unique across the file.

Launch all services in one go:

```bash
$ lollipop -c lolli.pop
```

## Examples

| Goal                                             | Command                                      |
| ------------------------------------------------ | -------------------------------------------- |
| Spin up a password‑protected server on port 9001 | `lollipop ./site 9001 -p swordfish`          |
| Mirror example.org into ./mirror                 | `lollipop sucker https://example.org mirror` |
| Launch the live system monitor on port 7000      | `lollipop monitor 7000 myPass`               |
| Execute a maintenance script                     | `lollipop js ./scripts/maintain.js`          |

## System Monitor Dashboard

The monitor exposes a minimal single‑page UI with:

- CPU & memory graphs (1‑, 5‑, 15‑min load)
- Disk usage per mount
- Top 5 processes by memory & CPU
- System uptime & host info

> Auth: **Basic Auth** using the password provided in the CLI or config.

## Website Mirroring ("Sucker")

`sucker` is a thin wrapper around `wget`‑like logic that:

1. Fetches the entry HTML.
2. Parses & queues discovered assets (CSS, JS, images, PDFs, etc.).
3. Rewrites links for fully‑offline browsing.
4. Stores the entire site tree under the target folder.

Great for demos or archiving docs!

## Executing Scripts

`lollipop js path/to/script.js` simply loads the file and executes it via Node in the same process.  The script may `export` a function or just run top‑level code—itʼs up to you.

Returned values (if any) are logged to stdout for quick inspection.

## Security Notes

- Passwords are **not** hashed—use a reverse proxy or VPN for production‑grade security.
- Verify mirrored sitesʼ licenses before redistributing.

## Logging & Graceful Shutdown

- All actions log to stdout.
- Press `Ctrl+C` once to stop; youʼll see the farewell message **"Lollipop!"** before the process exits.

## Contributing

Pull requests are welcome!  Please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing`)
5. Open a Pull Request 🍻

## License

MIT © 2025

