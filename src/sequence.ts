import { createConfig } from "@0xsequence/connect";
import { allNetworks, ChainId } from "@0xsequence/network";

const { connectConfig, wagmiConfig } = createConfig("waas", {
  appName: "Exa App embed example",
  defaultChainId: ChainId.OPTIMISM,
  embeddedWalletTitle: "Exa App owner wallet",
  projectAccessKey: "AQAAAAAAAKvGuTfXGGCZM2jb2kG_7W3qVGk", // cspell:ignore AQAAAAAAAKvGuTfXGGCZM2jb2kG_7W3qVGk
  googleClientId: "27593622387-9dnoiu04rvha804eeucloh6hkaqjk6hh.apps.googleusercontent.com", // cspell:ignore 9dnoiu04rvha804eeucloh6hkaqjk6hh.apps.googleusercontent.com
  waasConfigKey: "eyJwcm9qZWN0SWQiOjQzOTc0LCJycGNTZXJ2ZXIiOiJodHRwczovL3dhYXMuc2VxdWVuY2UuYXBwIn0=",
  enableConfirmationModal: true,
  hideExternalConnectOptions: true,
  hideConnectedWallets: true,
  coinbase: false,
  metaMask: false,
  wagmiConfig: { multiInjectedProviderDiscovery: false },
  chainIds: Object.values(allNetworks)
    .filter(({ type, deprecated }) => type === "mainnet" && !deprecated)
    .map(({ chainId }) => chainId),
});

export { connectConfig, wagmiConfig };
