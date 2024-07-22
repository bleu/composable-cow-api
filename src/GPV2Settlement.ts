import { ponder } from "@/generated";

ponder.on("gpv2Settlement:Trade", async ({ event, context }) => {
  const orderUid = event.args.orderUid.toLowerCase();
  const relatedStopLossOrder = await context.db.StopLossOrder.findUnique({
    id: `${orderUid}-${context.network.chainId}`,
  });
  console.log(`stoplossId: ${orderUid}-${context.network.chainId}`);
  console.log(`relatedStopLossOrder: ${relatedStopLossOrder}`);
  if (!relatedStopLossOrder) return;
  console.log(`orderUid: ${orderUid}`);

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
