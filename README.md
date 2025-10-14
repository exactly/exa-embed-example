# Exa App embed example

## Getting started

Essential steps to load the Exa App in an iframe and expose the host integration
via `hostExaApp`.

### Add the iframe

```html
<iframe
  title="Exa App"
  src="https://web.exactly.app"
  allow="clipboard-read; clipboard-write; camera">
/>
```

- Set `src` to the Exa App URL to load (production shown above).
- `allow` enables address UX: clipboard (copy/paste) and camera (QR).

### Call `hostExaApp`

```js
const host = hostExaApp({
  iframe,                            // the iframe element
  clientFid: 69,                     // unique id for the integration
  platformType: "web",               // "web" or "mobile"
  request: (method, params) => {
    // wallet requests. required: `eth_accounts` and `personal_sign`.
    // for bridging (recommended): `eth_signTransaction`.
    // forward to an authenticated backend or a wallet provider
  },
});

// later: host.cleanup()
```

## Example app

This repo includes a minimal React app to illustrate usage. This helper is
framework‑agnostic, use it with any web framework or just plain HTML.
In this example, wallet requests are simply forwarded to a mocked backend.
In production, wire these calls to a backend and handle auth, routing,
and security as needed.

### Running

```bash
pnpm install
pnpm dev
```

Open [`http://localhost:5173`](http://localhost:5173) to view the app.
