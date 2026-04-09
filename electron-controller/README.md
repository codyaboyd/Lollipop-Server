# Lollipop Electron Controller

This is an optional cross-platform desktop GUI that wraps the existing `lollipop.js` CLI.

It lets users:

- start/stop a file server,
- enable optional Basic Auth,
- enable Cloudflare tunnel with `--tunnel`, and
- start monitor mode with password.

## Requirements

- Node.js 18+
- npm

## Run locally

From the repository root:

```bash
cd electron-controller
npm install
npm start
```

## How it works

- Electron main process launches `node ../lollipop.js ...` with your selected options.
- Logs from stdout/stderr are streamed into the GUI log pane.
- Stop sends `SIGINT`, matching CLI behavior.
