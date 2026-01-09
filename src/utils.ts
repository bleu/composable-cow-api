import { Address } from "viem";
import { composableCowAbi } from "../abis/ComposableCow";
import { erc20Abi } from "../abis/erc20";
import { contextType } from "./types";
import { token, user } from "ponder:schema";

export function callERC20Contract<T>(
  address: `0x${string}`,
  functionName: "symbol" | "decimals" | "name",
  context: contextType
): Promise<T> {
  return context.client.readContract({
    abi: erc20Abi,
    address,
    functionName,
  }) as Promise<T>;
}

export function getErc20Data(address: `0x${string}`, context: contextType) {
  return Promise.all([
    callERC20Contract<string>(address, "symbol", context).catch(() => ""),
    callERC20Contract<number>(address, "decimals", context).catch(() => 0),
    callERC20Contract<string>(address, "name", context).catch(() => ""),
  ]);
}

export function getHash({
  handler,
  salt,
  staticInput,
  context,
}: {
  handler: `0x${string}`;
  salt: `0x${string}`;
  staticInput: `0x${string}`;
  context: contextType;
}) {
  return context.client.readContract({
    abi: composableCowAbi,
    address: context.contracts.composable.address,
    functionName: "hash",
    args: [{ handler, salt, staticInput }],
  });
}

export function bytes32ToAddress(hex: `0x${string}`): Address {
  return `0x${hex.slice(26)}`;
}

export async function getToken(address: `0x${string}`, context: contextType) {
  const tokenId = `${address}-${context.chain.id}`;
  let tokenData = await context.db.find(token, {
    id: tokenId,
  });
  if (!tokenData) {
    const [symbol, decimals, name] = await getErc20Data(address, context);
    tokenData = await context.db.insert(token).values({
      id: tokenId,
      address,
      chainId: context.chain.id,
      symbol,
      decimals,
      name,
    });
  }
  return tokenData;
}

export async function getUser(
  address: Address,
  chainId: number,
  context: contextType
) {
  const userId = `${address}-${chainId}`;
  let userData = await context.db.find(user, {
    id: userId,
  });

  if (!userData) {
    userData = await context.db.insert(user).values({
      id: userId,
      address,
      chainId,
    });
  }
  return userData;
}
