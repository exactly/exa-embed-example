import express from "express";
import { createWalletClient, hexToBigInt, http, nonceManager } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import * as chains from "viem/chains";

const account = mnemonicToAccount("test test test test test test test test test test test junk", { nonceManager }); // mock account

let chainId = chains.optimism.id;

export const handler = express()
  .use(express.json())
  .post<never, unknown, { method: string; params: unknown }>("/api", async ({ body: { method, params } }, response) => {
    switch (method) {
      case "eth_chainId":
        return response.json(chainId);
      case "eth_accounts":
      case "eth_requestAccounts":
        return response.json([account.address]);
      case "personal_sign":
        if (!Array.isArray(params) || params.length !== 2) return response.status(400).json("bad params");
        if (params[1] !== account.address) return response.status(403).json("bad account");
        return response.json(await account.signMessage({ message: { raw: params[0] } }));
      case "wallet_switchEthereumChain":
        if (!Array.isArray(params) || params.length !== 1) return response.status(400).json("bad params");
        chainId = params[0].chainId;
        return response.json({ result: null });
      case "wallet_sendCalls": {
        if (!Array.isArray(params) || params.length !== 1) return response.status(400).json("bad params");
        if (params[0].from && params[0].from !== account.address) return response.status(400).json("bad account");
        const walletClient = createWalletClient({
          account,
          chain: Object.values(chains).find(({ id }) => id === Number(params[0].chainId)),
          transport: http(),
        });
        for (const call of params[0].calls as { to: `0x${string}`; data?: `0x${string}`; value?: `0x${string}` }[]) {
          walletClient
            .sendTransaction({
              to: call.to,
              data: call.data,
              value: call.value && hexToBigInt(call.value),
              gas: 2_000_000n, // avoids gas estimation errors
            })
            .then(console.log)
            .catch(console.error);
        }
        return response.json({ id: params[0].id });
      }
      case undefined:
        return response.status(400).json("method is required");
      default:
        return response.status(400).json(`${method} not supported`);
    }
  });
