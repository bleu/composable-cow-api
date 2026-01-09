import { createConfig } from "ponder";
import { http } from "viem";
import { composableCowAbi } from "./abis/ComposableCow";
import { GPv2SettlementAbi } from "./abis/GPv2Settlement";

export const COMPOSABLE_COW_ADDRESS =
  "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";

export const GP_V2_SETTLEMENT_ADDRESS =
  "0x9008D19f58AAbD9eD0D60971565AA8510560ab41";

export default createConfig({
  chains: {
    sepolia: {
      id: 11155111,
      rpc: http(process.env.PONDER_RPC_URL_SEPOLIA),
    },
    gnosis: {
      id: 100,
      rpc: http(process.env.PONDER_RPC_URL_GNOSIS),
    },
    mainnet: {
      id: 1,
      rpc: http(process.env.PONDER_RPC_URL_MAINNET),
    },
    arbitrum: {
      id: 42161,
      rpc: http(process.env.PONDER_RPC_URL_ARBITRUM),
    },
  },
  contracts: {
    gpv2Settlement: {
      abi: GPv2SettlementAbi,
      address: GP_V2_SETTLEMENT_ADDRESS,
      chain: {
        // using around the first week of dec 2026 as the start block for all chains
        sepolia: {
          startBlock: 9760000,
        },
        gnosis: {
          startBlock: 43445257,
        },
        mainnet: {
          startBlock: 23942260,
        },
        arbitrum: {
          startBlock: 406806968,
        },
      },
    },
    composable: {
      abi: composableCowAbi,
      address: COMPOSABLE_COW_ADDRESS,
      chain: {
        sepolia: {
          startBlock: 9760000,
        },
        gnosis: {
          startBlock: 43445257,
        },
        mainnet: {
          startBlock: 23942260,
        },
        arbitrum: {
          startBlock: 406806968,
        },
      },
    },
  },
});
