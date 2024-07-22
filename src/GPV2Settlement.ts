import { ponder } from "@/generated";

ponder.on("gpv2Settlement:Trade", async ({ event, context }) => {
  const orderUid = event.args.orderUid.toLowerCase();
  const relatedStopLossOrder = await context.db.StopLossOrder.findUnique({
    id: `${orderUid}-${context.network.chainId}`,
  });
  if (!relatedStopLossOrder) return;

  const tradedAmount = relatedStopLossOrder.isSellOrder
    ? event.args.sellAmount
    : event.args.buyAmount;
  const oldTratedAmount = relatedStopLossOrder.isSellOrder
    ? relatedStopLossOrder.executedTokenSellAmount
    : relatedStopLossOrder.executedTokenBuyAmount;

  const newFilledAmount = oldTratedAmount + tradedAmount;

  const filledPctBpt =
    (newFilledAmount * BigInt(1000000)) / relatedStopLossOrder.tokenSellAmount;

  await context.db.StopLossOrder.update({
    id: relatedStopLossOrder.id,
    data: {
      executedTokenSellAmount:
        relatedStopLossOrder.executedTokenSellAmount + event.args.sellAmount,
      executedTokenBuyAmount:
        relatedStopLossOrder.executedTokenBuyAmount + event.args.buyAmount,
      filledPctBpt,
    },
  });
});
