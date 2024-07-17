import { createConfig } from "@ponder/core";
import { http } from "viem";
import { composableCowAbi } from "./abis/ComposableCow";
import { GPv2SettlementAbi } from "./abis/GPv2Settlement";
import { StopLossAbi } from "./abis/StopLoss";

export const COMPOSABLE_COW_ADDRESS =
  "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";

export const GP_V2_SETTLEMENT_ADDRESS =
  "0x9008D19f58AAbD9eD0D60971565AA8510560ab41";

function buildSchemaName() {
  if (!process.env.RAILWAY_SERVICE_NAME || !process.env.RAILWAY_DEPLOYMENT_ID) {
    return "dev";
  }

  return `${
    process.env.RAILWAY_SERVICE_NAME
  }_${process.env.RAILWAY_DEPLOYMENT_ID.slice(0, 8)}`;
}

export default createConfig({
  database: {
    kind: "postgres",
    publishSchema: "public",
    schema: buildSchemaName(),
  },
  networks: {
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_SEPOLIA),
    },
    gnosis: {
      chainId: 100,
      transport: http(process.env.PONDER_RPC_URL_GNOSIS),
    },
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_MAINNET),
    },
  },
  contracts: {
    stoploss: {
      abi: StopLossAbi,
      address: [
        "0xe8212f30c28b4aab467df3725c14d6e89c2eb967", // 5072748
        "0xb560a403f8450164b8b745ecca41d8ced93c50a1", // 5949979
      ],
      includeCallTraces: true,
      network: {
        sepolia: {
          startBlock: 5072748,
        },
        // gnosis: {
        //   startBlock: 31005430,
        // },
        // mainnet: {
        //   startBlock: 18937172,
        // },
      },
    },
    composable: {
      abi: composableCowAbi,
      address: COMPOSABLE_COW_ADDRESS,
      includeCallTraces: true,
      network: {
        sepolia: {
          startBlock: 5245332,
        },
        gnosis: {
          startBlock: 31005430,
        },
        mainnet: {
          startBlock: 18937172,
        },
      },
    },
  },
});
