import { ponder } from "ponder:registry";
import { stopLossOrder } from "ponder:schema";

ponder.on("gpv2Settlement:Trade", async ({ event, context }) => {
  const orderUid = event.args.orderUid.toLowerCase();

  const relatedStopLossOrder = await context.db.find(stopLossOrder, {
    id: `${orderUid}-${context.chain.id}`,
  });
  if (!relatedStopLossOrder) return;

  const tradedAmount = relatedStopLossOrder.isSellOrder
    ? event.args.sellAmount
    : event.args.buyAmount;
  const oldTratedAmount = relatedStopLossOrder.isSellOrder
    ? relatedStopLossOrder.executedTokenSellAmount
    : relatedStopLossOrder.executedTokenBuyAmount;

  const newFilledAmount = oldTratedAmount + tradedAmount;

  const filledPctBps =
    (newFilledAmount * BigInt(1_000_000)) /
    relatedStopLossOrder.tokenSellAmount;

  await context.db
    .update(stopLossOrder, {
      id: relatedStopLossOrder.id,
    })
    .set({
      executedTokenSellAmount:
        relatedStopLossOrder.executedTokenSellAmount + event.args.sellAmount,
      executedTokenBuyAmount:
        relatedStopLossOrder.executedTokenBuyAmount + event.args.buyAmount,
      filledPctBps,
    });
});
