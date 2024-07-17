import { ponder } from "@/generated";
import { DefaultHandlerHelper, getHandlerHelper } from "./handler";
import { getHash, getUser } from "./utils";
import {
  COMPOSABLE_COW_ADDRESS,
  GP_V2_SETTLEMENT_ADDRESS,
} from "../ponder.config";
import { toHex } from "viem";
import { GPv2SettlementAbi } from "../abis/GPv2Settlement";

ponder.on("stoploss.verify()", async ({ event, context }) => {
  if (event.trace.from !== COMPOSABLE_COW_ADDRESS) return;

  const { chainId } = context.network;

  const ownerAddress = event.args[0];

  const orderHash = event.args[2];
  const orderData = event.args[7];
  const orderValidTo = orderData.validTo;

  const orderUid = `${orderHash}${ownerAddress.slice(2)}${toHex(
    orderValidTo
  ).slice(2)}` as `0x${string}`;

  const filledAmount = await context.client.readContract({
    address: GP_V2_SETTLEMENT_ADDRESS,
    abi: GPv2SettlementAbi,
    functionName: "filledAmount",
    args: [orderUid],
  });

  const orderContext = event.args[4];

  const user = await context.db.User.findMany({
    where: {
      address: ownerAddress,
      chainId,
    },
  });

  if (!user.items[0]) return;

  const orders = await context.db.Order.findMany({
    where: {
      hash: orderContext,
      chainId,
      userId: user.items[0].id,
    },
  });

  const order = orders?.items?.[0];

  if (!order || !order.stopLossDataId) return;

  const stopLossData = await context.db.StopLossOrder.findUnique({
    id: order.stopLossDataId,
  });

  if (!stopLossData) return;

  if (stopLossData.isPartiallyFillable) {
    if (stopLossData.isSellOrder) {
      await context.db.StopLossOrder.update({
        id: stopLossData.id,
        data: {
          status:
            filledAmount >= stopLossData.tokenAmountIn
              ? "executed"
              : "partially_filled",
          filledAmount,
        },
      });
    } else {
      await context.db.StopLossOrder.update({
        id: stopLossData.id,
        data: {
          status:
            filledAmount >= stopLossData.tokenAmountOut
              ? "executed"
              : "partially_filled",
          filledAmount,
        },
      });
    }
  } else {
    await context.db.StopLossOrder.update({
      id: stopLossData.id,
      data: {
        status: "executed",
        filledAmount,
      },
    });
  }
});
