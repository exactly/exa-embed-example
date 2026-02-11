import { exposeToIframe, type MiniAppHost } from "@farcaster/miniapp-host";

/** Exposes host integration to the Exa App in an iframe: client context and host‑provided capabilities. */
export default function hostExaApp({
  iframe,
  appUrl,
  clientFid,
  platformType,
  request,
  chainId = { "web.exactly.app": 10 }[new URL(iframe.src).hostname] ?? 11_155_420,
  openUrl = (url) => {
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
  },
  ready = () => {}, // hide splash handled by embedding app
}: {
  /** Element that loads the app. Its src should be the Exa App url (e.g. https://web.exactly.app). */
  iframe: HTMLIFrameElement;
  /** Deep link to Exa App inside the embedding client. For redirecting users (e.g. after KYC). */
  appUrl: string;
  /** Unique id for the embedding client (per integrator). */
  clientFid: number;
  /** Identifies the host environment (`web` or `mobile`); enables platform‑specific behavior. */
  platformType: "web" | "mobile";
  /** Wallet requests: implement `eth_chainId`, `eth_accounts`, `eth_requestAccounts`, and `personal_sign`. For bridging, add `wallet_switchEthereumChain` and `wallet_sendCalls`. */
  request: (method: string, params?: unknown) => Promise<unknown>;
  /** Optional. EIP-155 chain ID; defaults to Optimism for production hostname, fallback to OP-Sepolia. */
  chainId?: number;
  /** Optional. Should open external URLs; defaults to safe window.open. */
  openUrl?: (url: string) => void;
  /** Optional. Called when Exa signals readiness (hide splash, etc.). */
  ready?: (exa: ExaHost) => void;
}) {
  return exposeToIframe({
    iframe,
    miniAppOrigin: new URL(iframe.src).origin,
    sdk: new Proxy(
      {
        context: { client: { clientFid, platformType, appUrl, added: false }, user: { fid: 0 } },
        getChains: async () => [`eip155:${chainId}`],
        getCapabilities: async () => ["actions.openUrl", "actions.ready"],
        ethProviderRequestV2: async ({ id, method, params }: { id: number; method: string; params?: unknown }) => ({
          jsonrpc: "2.0",
          id,
          result: await request(method, params),
        }),
        openUrl,
        ready: (exa?: ExaHost) => {
          if (exa) ready(exa);
        },
      } as unknown as MiniAppHost,
      { get: (target, property, receiver) => Reflect.get(target, property, receiver) ?? (() => {}) },
    ),
  });
}

export type ExaHost = { getAddress: () => Promise<string | null>; hasCard: () => Promise<boolean> };
