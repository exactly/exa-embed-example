# Exa App embed example

## Host integration

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
  appUrl: "http://localhost:5173/", // deep link to exa app
  clientFid: 69,                     // unique id for the integration
  platformType: "web",               // "web" or "mobile"
  request: (method, params) => {
    // wallet requests. required: `eth_chainId`, `eth_accounts`,
    // `eth_requestAccounts`, and `personal_sign`.
    // for bridging: `wallet_switchEthereumChain`, `wallet_sendCalls`.
    // forward to an authenticated backend or a wallet provider
  },
});

// later: host.cleanup()
```

- The `hostExaApp` helper is small and self‑contained. Drop it into the host and
  invoke it. Link opening works by default (via `window.open`). Pass a custom
  `openUrl` only if a different behavior is needed. Optional hooks like `ready`
  are also configured through parameters, so editing the helper isn’t necessary.
- The `request` handler is required. It must handle wallet calls:
  `eth_chainId`, `eth_accounts`, `eth_requestAccounts`, and `personal_sign`.
  For bridging, also implement `wallet_switchEthereumChain` and
  `wallet_sendCalls`. Typically forward these to an authenticated backend; for
  self‑custodial setups, call a wallet provider to sign locally.

### Dependency

The integration depends on [`@farcaster/miniapp-host`](https://www.npmjs.com/package/@farcaster/miniapp-host).
It provides the host-side interface and message wiring needed for the Exa App
to access capabilities (wallet requests, opening URLs).

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
