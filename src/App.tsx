import { sendTransactions, SequenceConnect, useOpenConnectModal, useWaasFeeOptions } from "@0xsequence/connect";
import { SequenceIndexer } from "@0xsequence/indexer";
import { getAccount, getChainId, getPublicClient, getWalletClient, signMessage, switchChain } from "@wagmi/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAccount, useDisconnect, useSendTransaction } from "wagmi";

import { ChainId, networks } from "@0xsequence/network";
import hostExaApp from "./hostExaApp"; // host SDK: expose APIs to the iframe
import { connectConfig, wagmiConfig } from "./sequence";

function App() {
  const { disconnect } = useDisconnect();
  const { setOpenConnectModal } = useOpenConnectModal();
  const { isConnected, isConnecting } = useAccount();
  const exaApp = useRef<HTMLIFrameElement>(null); // hold iframe element reference

  const { sendTransaction, isPending } = useSendTransaction();
  const { address } = useAccount();

  const deployAccount = () => {
    switchChain(wagmiConfig, { chainId: ChainId.OPTIMISM });
    sendTransaction({ to: address, value: 0n, gas: null, chainId: ChainId.OPTIMISM });
  };

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
        console.log(method, params); // TODO remove
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
            return {
              id: params[0].id,
              result: await Promise.all(
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
                ).map((send) => send()),
              ),
            };
          }
          default:
            throw new Error(`${method} not supported`);
        }
      },
    });

    return () => host.cleanup(); // teardown host SDK on unmount
  }, [setOpenConnectModal]); // run once on mount

  return (
    <div>
      <iframe
        ref={exaApp}
        title="Exa App"
        src="https://web.exactly.app"
        // src="http://localhost:8081" // local development
        // src="https://sandbox.exactly.app" // sandbox environment
        allow="clipboard-read; clipboard-write; camera" // address UX: copy/paste addresses; scan address QR codes
        loading="eager" // load immediately; primary content
        className={isConnected ? undefined : "closed"}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <FeeOptions />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => (isConnected ? disconnect() : setOpenConnectModal(true))}
          >
            {isConnected ? "Sign Out" : "Sign In"}
          </button>
          <button type="button" onClick={deployAccount}>
            {isPending ? "Deploying..." : "Deploy Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <SequenceConnect config={{ connectConfig, wagmiConfig }}>
      <App />
    </SequenceConnect>
  );
}

function FeeOptions() {
  const [pendingFeeOptionConfirmation, confirmPendingFeeOption, rejectPendingFeeOption] = useWaasFeeOptions();
  const [selectedFeeOptionTokenName, setSelectedFeeOptionTokenName] = useState<string>();

  useEffect(() => {
    if (pendingFeeOptionConfirmation && pendingFeeOptionConfirmation.options.length > 0) {
      const firstOption = pendingFeeOptionConfirmation.options[0];
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, react-hooks/set-state-in-effect
      setSelectedFeeOptionTokenName(firstOption?.token.symbol);
    }
  }, [pendingFeeOptionConfirmation]);

  const handleConfirmFee = (tokenAddress: string | null) => {
    if (pendingFeeOptionConfirmation) {
      confirmPendingFeeOption(pendingFeeOptionConfirmation.id, tokenAddress);
    }
  };

  const handleRejectFee = () => {
    if (pendingFeeOptionConfirmation) {
      rejectPendingFeeOption(pendingFeeOptionConfirmation.id);
    }
  };

  if (pendingFeeOptionConfirmation) {
    return (
      <div>
        <h2>Select Fee Payment Token</h2>
        <div>
          {pendingFeeOptionConfirmation.options.map((option) => (
            <div key={option.token.symbol || option.token.contractAddress}>
              <input
                type="radio"
                name="feeOption"
                checked={selectedFeeOptionTokenName === option.token.symbol}
                onChange={() => setSelectedFeeOptionTokenName(option.token.symbol)}
              />
              <label>
                {option.token.symbol} - {option.token.contractAddress ?? "Native Token"}
                {"balanceFormatted" in option && ` (Balance: ${option.balanceFormatted} ${option.token.symbol})`}
              </label>
            </div>
          ))}
        </div>
        <div>
          <button
            onClick={() =>
              handleConfirmFee(
                pendingFeeOptionConfirmation.options.find((opt) => opt.token.symbol === selectedFeeOptionTokenName)
                  ?.token.contractAddress || null,
              )
            }
          >
            Confirm
          </button>
          <button onClick={handleRejectFee}>Cancel</button>
        </div>
      </div>
    );
  }

  return <div>No pending fee confirmation</div>;
}
