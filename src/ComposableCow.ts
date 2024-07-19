import { ponder } from "@/generated";
import { getHandlerHelper } from "./handler";
import { getHash, getUser } from "./utils";
import { Address } from "viem";

ponder.on("composable:ConditionalOrderCreated", async ({ event, context }) => {
  const handlerHelper = getHandlerHelper(
    event.args.params.handler,
    context.network.chainId
  );

  const [user, hash, orderHandler] = await Promise.all([
    getUser(event.args.owner, context.network.chainId, context),
    getHash({
      salt: event.args.params.salt,
      staticInput: event.args.params.staticInput,
      handler: event.args.params.handler,
      context,
    }).catch((e) => {
      console.error(e);
      return undefined;
    }),
    handlerHelper.getOrderHandler(event.args.params.handler, context),
  ]);

  if (!hash) return;

  await handlerHelper
    .decodeAndSaveOrder(
      event.args.params.staticInput,
      hash,
      user.address as Address,
      context,
      event.log.id
    )
    .then(async (handlerData) => {
      if (!handlerData.decodedSuccess) return;
      await context.db.Order.create({
        id: event.log.id,
        data: {
          hash: hash,
          txHash: event.transaction.hash,
          salt: event.args.params.salt,
          chainId: context.network.chainId,
          blockNumber: event.block.number,
          blockTimestamp: event.block.timestamp,
          staticInput: event.args.params.staticInput,
          userId: user.id,
          orderHandlerId: orderHandler.id,
          ...handlerData,
        },
      });
    })
    .catch(async () => {
      return;
    });

  return;
});
