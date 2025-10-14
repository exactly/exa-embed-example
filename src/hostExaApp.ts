import { exposeToIframe, type MiniAppHost } from "@farcaster/miniapp-host";

/** Exposes host integration to the Exa App in an iframe: client context and host‑provided capabilities. */
export default function hostExaApp({
  iframe,
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
  /** Unique id for the embedding client (per integrator). */
  clientFid: number;
  /** Identifies the host environment (`web` or `mobile`); enables platform‑specific behavior. */
  platformType: "web" | "mobile";
  /** Wallet requests: implement `eth_accounts` and `personal_sign`. To support bridging, also implement `eth_signTransaction`. */
  request: (method: string, params?: unknown) => Promise<unknown>;
  /** Optional. EIP-155 chain ID; defaults to Optimism for production hostname, fallback to OP-Sepolia. */
  chainId?: number;
  /** Optional. Should open external URLs; defaults to safe window.open. */
  openUrl?: (url: string) => void;
  /** Optional. Called when Exa signals readiness (hide splash, etc.). */
  ready?: () => void;
}) {
  return exposeToIframe({
    iframe,
    miniAppOrigin: new URL(iframe.src).origin,
    sdk: {
      context: { client: { clientFid, platformType, added: false }, user: { fid: 0 } },
      getChains: async () => [`eip155:${chainId}`],
      getCapabilities: async () => ["actions.openUrl", "actions.ready"],
      ethProviderRequestV2: async ({ id, method, params }) => {
        switch (method) {
          case "eth_chainId":
            return { jsonrpc: "2.0", id, result: `0x${chainId.toString(16)}` };
          default:
            return { jsonrpc: "2.0", id, result: await request(method, params) };
        }
      },
      openUrl,
      ready,

      // #region currently unused by exa app
      close: () => {},
      setPrimaryButton: () => {},
      addMiniApp: async () => ({}),
      viewCast: async () => {},
      viewProfile: async () => {},
      composeCast: async () => undefined as never,
      viewToken: async () => {},
      sendToken: async () => ({ success: false, reason: "send_failed" }),
      swapToken: async () => ({ success: false, reason: "swap_failed" }),
      openMiniApp: async () => {},
      signIn: async () => {
        throw new Error("unimplemented");
      },
      updateBackState: async () => {},
      impactOccurred: async () => {},
      notificationOccurred: async () => {},
      selectionChanged: async () => {},
      // #endregion

      // #region unnecessary
      eip6963RequestProvider: () => {}, // handled by miniapp-sdk's ethereum provider
      requestCameraAndMicrophoneAccess: async () => {}, // handled by web api `navigator.mediaDevices.getUserMedia()`
      addFrame: () => {
        throw new Error("deprecated");
      },
      ethProviderRequest: () => {
        throw new Error("deprecated");
      },
      signManifest: () => {
        throw new Error("unsupported");
      },
      // #endregion
    } as MiniAppHost,
  });
}
