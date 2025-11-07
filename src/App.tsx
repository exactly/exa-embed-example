import { SequenceConnect, useOpenConnectModal } from "@0xsequence/connect";
import { getAccount, getChainId, signMessage, switchChain } from "@wagmi/core";
import { useLayoutEffect, useRef } from "react";

import hostExaApp from "./hostExaApp"; // host SDK: expose APIs to the iframe
import { connectConfig, wagmiConfig } from "./sequence";

function App() {
  const { setOpenConnectModal } = useOpenConnectModal();
  const exaApp = useRef<HTMLIFrameElement>(null); // hold iframe element reference

  useLayoutEffect(() => {
    const iframe = exaApp.current;
    if (!iframe) return;

    // initialize miniapp host integration
    const host = hostExaApp({
      iframe, // exa app iframe element
      appUrl: window.location.href, // deep link to exa app inside the embedding client
      clientFid: 69, // integrator client id; replace with a unique value
      platformType: "web", // integrator platform type
      request: async (method, params) => {
        switch (method) {
          case "eth_chainId":
            return getChainId(wagmiConfig);
          case "eth_accounts":
          case "eth_requestAccounts":
            return [getAccount(wagmiConfig).address];
          case "wallet_switchEthereumChain":
            if (!Array.isArray(params) || params.length !== 1) throw new Error("bad params");
            await switchChain(wagmiConfig, { chainId: Number(params[0].chainId) });
            wagmiConfig.setState((x) => ({ ...x, chainId: Number(params[0].chainId) }));
            return { result: null };
          case "personal_sign":
            if (!Array.isArray(params) || params.length !== 2) throw new Error("bad params");
            if (params[1] !== getAccount(wagmiConfig).address) throw new Error("bad account");
            return signMessage(wagmiConfig, { message: { raw: params[0] } });
          default:
            throw new Error(`${method} not supported`);
        }
      },
      ready: () => {
        if (wagmiConfig.state.status !== "connected") setOpenConnectModal(true);
      },
    });

    return () => host.cleanup(); // teardown host SDK on unmount
  }, [setOpenConnectModal]); // run once on mount

  return (
    <iframe
      ref={exaApp}
      title="Exa App"
      src="https://sandbox.exactly.app" // sandbox origin; replace with https://web.exactly.app in production
      allow="clipboard-read; clipboard-write; camera" // address UX: copy/paste addresses; scan address QR codes
      loading="eager" // load immediately; primary content
    />
  );
}

export default function Layout() {
  return (
    <SequenceConnect config={{ connectConfig, wagmiConfig }}>
      <App />
    </SequenceConnect>
  );
}
