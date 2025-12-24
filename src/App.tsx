import { sendTransactions, SequenceConnect, useOpenConnectModal } from "@0xsequence/connect";
import { SequenceIndexer } from "@0xsequence/indexer";
import {
  getAccount,
  getCallsStatus,
  getChainId,
  getPublicClient,
  getWalletClient,
  signMessage,
  switchChain,
} from "@wagmi/core";
import { useLayoutEffect, useRef } from "react";
import { concat, numberToHex } from "viem";
import { useAccount, useDisconnect } from "wagmi";

import { ChainId, networks } from "@0xsequence/network";
import hostExaApp from "./hostExaApp"; // host SDK: expose APIs to the iframe
import { connectConfig, wagmiConfig } from "./sequence";

function App() {
  const { disconnect } = useDisconnect();
  const { setOpenConnectModal } = useOpenConnectModal();
  const { isConnected, isConnecting } = useAccount();
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
          case "wallet_sendCalls": {
            if (!Array.isArray(params) || params.length !== 1) throw new Error("bad params");
            const { address, chainId, connector } = getAccount(wagmiConfig);
            if (!address || !chainId || !connector) throw new Error("not connected");
            if (params[0].from && params[0].from !== address) throw new Error("bad account");
            if (params[0].chainId && Number(params[0].chainId) !== chainId) throw new Error("bad chain id");
            const hashes = await Promise.all(
              (
                await sendTransactions({
                  chainId,
                  connector,
                  senderAddress: address,
                  publicClient: getPublicClient(wagmiConfig)!,
                  walletClient: await getWalletClient(wagmiConfig)!,
                  indexerClient: new SequenceIndexer(
                    `https://${networks[chainId as ChainId]!.name}-indexer.sequence.app`,
                    connectConfig.projectAccessKey,
                  ),
                  transactions: (
                    params[0].calls as { to: `0x${string}`; data?: `0x${string}`; value?: `0x${string}` }[]
                  ).map(({ to, data, value }) => ({ to, data, value: value && BigInt(value) })),
                  waitConfirmationForLastTransaction: false,
                })
              ).map((send) => send() as Promise<`0x${string}`>),
            );
            return { id: concat([...hashes, numberToHex(chainId, { size: 32 }), TX_MAGIC_ID]) };
          }
          case "wallet_getCallsStatus":
            if (!Array.isArray(params) || params.length !== 1 || typeof params[0] !== "string") throw new Error("bad");
            return getCallsStatus(wagmiConfig, { id: params[0] });
          default:
            throw new Error(`${method} not supported`);
        }
      },
    });

    return () => host.cleanup(); // teardown host SDK on unmount
  }, [setOpenConnectModal]); // run once on mount

  return (
    <>
      <iframe
        ref={exaApp}
        title="Exa App"
        src="https://sandbox.exactly.app" // sandbox origin; replace with https://web.exactly.app in production
        allow="clipboard-read; clipboard-write; camera" // address UX: copy/paste addresses; scan address QR codes
        loading="eager" // load immediately; primary content
        className={isConnected ? undefined : "closed"}
      />
      <button
        type="button"
        disabled={isConnecting}
        onClick={() => (isConnected ? disconnect() : setOpenConnectModal(true))}
      >
        {isConnected ? "Sign Out" : "Sign In"}
      </button>
    </>
  );
}

export default function Layout() {
  return (
    <SequenceConnect config={{ connectConfig, wagmiConfig }}>
      <App />
    </SequenceConnect>
  );
}

const TX_MAGIC_ID = "0x5792579257925792579257925792579257925792579257925792579257925792" as const;
