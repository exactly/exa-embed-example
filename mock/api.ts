import express from "express";
import { mnemonicToAccount } from "viem/accounts";
import * as chains from "viem/chains";

const account = mnemonicToAccount("test test test test test test test test test test test junk"); // mock account

let chainId = chains.optimism.id;

export const handler = express()
  .use(express.json())
  .post<never, unknown, { method: string; params: unknown }>("/api", async ({ body: { method, params } }, response) => {
    switch (method) {
      case "eth_chainId":
        return response.json(chainId);
      case "eth_accounts":
        return response.json([account.address]);
      case "personal_sign":
        if (!Array.isArray(params) || params.length !== 2) return response.status(400).json("bad params");
        if (params[1].toLowerCase() !== account.address.toLowerCase()) return response.status(403).json("bad account");
        return response.json(await account.signMessage({ message: { raw: params[0] } }));
      case "wallet_switchEthereumChain":
        if (!Array.isArray(params) || params.length !== 1) return response.status(400).json("bad params");
        chainId = params[0].chainId;
        return response.json({ result: null });
      case undefined:
        return response.status(400).json("method is required");
      default:
        throw new Error(`${method} not supported`);
    }
  });
