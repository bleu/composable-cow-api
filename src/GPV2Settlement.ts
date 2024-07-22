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
  const newFilledAmount = relatedStopLossOrder.filledAmount + tradedAmount;

  await context.db.StopLossOrder.update({
    id: relatedStopLossOrder.id,
    data: {
      filledAmount: newFilledAmount,
    },
  });
});
