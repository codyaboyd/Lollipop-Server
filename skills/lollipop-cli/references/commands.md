# Command reference

Run every command from the repository root. Replace placeholders rather than passing the angle brackets literally.

| Purpose | Arguments after `node lollipop.js` | Behavior |
|---|---|---|
| Show help | `--help` | Print the built-in command reference and exit. |
| Serve a folder | `<directory> <port>` | Start an HTTP file browser and static server. |
| Protected folder | `<directory> <port> -p <password>` | Require HTTP Basic Auth; the username is ignored. |
| Public tunnel | `<directory> <port> [ -p <password> ] --tunnel` | Start the server and a Cloudflare quick tunnel. |
| Monitor | `monitor <port> <password>` | Start the system-monitor dashboard/API with a password. |
| Mirror website | `sucker <url> <folder>` | Save one page and its referenced assets; crawling is non-recursive. |
| Extract text | `sucker <url> --text` | Fetch a page, remove markup/non-content elements, and write useful text to stdout. |
| Save extracted text | `sucker <url> --text --save <file>` | Write useful text to the specified file. |
| Run JavaScript | `js <script.js>` | Execute a local script with Node.js. `execute` is an alias. |
| Run configuration | `-c <config-file>` | Start every parenthesized declaration in a `lolli.pop` file. |

## Multi-action configuration

Write one declaration per line:

```text
(monitor 7000 monitor-password)
(sucker https://example.org snapshot)
(sucker https://example.org --text --save example.txt)
(js ./scripts/task.js)
(./public 8080 -p server-password)
```

Use unique ports across server and monitor declarations. Paths and values containing whitespace are not supported because declarations are split on whitespace.

## Operational notes

- A server, monitor, or tunnel remains active until its process receives a termination signal.
- `--tunnel` may download a platform-specific `cloudflared` binary into `.lollipop/bin` on first use.
- Website mirroring works best for static pages; client-rendered applications may be incomplete.
- Text extraction performs an ordinary HTTP fetch and does not render client-side JavaScript.
- Basic Auth and the monitor password are lightweight protections. Do not expose sensitive data without an appropriate secure network boundary.
