import { onchainTable, relations, index } from "ponder";

export const order = onchainTable(
  "order",
  (t) => ({
    id: t.text().primaryKey(),
    chainId: t.integer().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.bigint().notNull(),
    hash: t.hex(),
    txHash: t.hex().notNull(),
    salt: t.hex().notNull(),
    userId: t.text().notNull(),
    staticInput: t.hex().notNull(),
    decodedSuccess: t.boolean().notNull(),
    stopLossDataId: t.text(),
    orderHandlerId: t.text(),
    constantProductDataId: t.text(),
  }),
  (table) => ({
    userIdx: index().on(table.userId),
    chainIdx: index().on(table.chainId),
  })
);

export const ordersRelations = relations(order, ({ one }) => ({
  user: one(user, { fields: [order.userId], references: [user.id] }),
  stopLossData: one(stopLossOrder, {
    fields: [order.stopLossDataId],
    references: [stopLossOrder.id],
  }),
  orderHandler: one(orderHandler, {
    fields: [order.orderHandlerId],
    references: [orderHandler.id],
  }),
  constantProductData: one(constantProductData, {
    fields: [order.constantProductDataId],
    references: [constantProductData.id],
  }),
}));

export const orderHandler = onchainTable(
  "order_handlers",
  (t) => ({
    id: t.text().primaryKey(),
    type: t.text(),
    address: t.hex().notNull(),
    chainId: t.integer().notNull(),
  }),
  (table) => ({
    chainIdx: index().on(table.chainId),
  })
);

export const token = onchainTable(
  "tokens",
  (t) => ({
    id: t.text().primaryKey(),
    address: t.hex().notNull(),
    chainId: t.integer().notNull(),
    name: t.text().notNull(),
    symbol: t.text().notNull(),
    decimals: t.integer().notNull(),
  }),
  (table) => ({
    chainIdx: index().on(table.chainId),
  })
);

export const user = onchainTable(
  "users",
  (t) => ({
    id: t.text().primaryKey(),
    address: t.text().notNull(),
    chainId: t.integer().notNull(),
  }),
  (table) => ({
    chainIdx: index().on(table.chainId),
  })
);

export const usersRelations = relations(user, ({ many }) => ({
  orders: many(order),
}));

export const stopLossOrder = onchainTable(
  "stop_loss_orders",
  (t) => ({
    id: t.text().primaryKey(),
    orderId: t.text().notNull(),
    tokenSellId: t.text().notNull(),
    tokenBuyId: t.text().notNull(),
    tokenSellAmount: t.bigint().notNull(),
    tokenBuyAmount: t.bigint().notNull(),
    executedTokenSellAmount: t.bigint().notNull(),
    executedTokenBuyAmount: t.bigint().notNull(),
    filledPctBps: t.bigint().notNull(),
    appData: t.hex().notNull(),
    to: t.hex().notNull(),
    isSellOrder: t.boolean().notNull(),
    isPartiallyFillable: t.boolean().notNull(),
    validTo: t.bigint().notNull(),
    sellTokenPriceOracle: t.hex().notNull(),
    buyTokenPriceOracle: t.hex().notNull(),
    strike: t.bigint().notNull(),
    maxTimeSinceLastOracleUpdate: t.bigint().notNull(),
    orderUid: t.text().notNull(),
  }),
  (table) => ({
    orderIdx: index().on(table.orderId),
  })
);

export const stopLossOrdersRelations = relations(stopLossOrder, ({ one }) => ({
  order: one(order, {
    fields: [stopLossOrder.orderId],
    references: [order.id],
  }),
  tokenSell: one(token, {
    fields: [stopLossOrder.tokenSellId],
    references: [token.id],
  }),
  tokenBuy: one(token, {
    fields: [stopLossOrder.tokenBuyId],
    references: [token.id],
  }),
}));

export const constantProductData = onchainTable(
  "constant_product_data",
  (t) => ({
    id: t.text().primaryKey(),
    orderId: t.text().notNull(),
    token0Id: t.text().notNull(),
    token1Id: t.text().notNull(),
    minTradedToken0: t.bigint().notNull(),
    priceOracle: t.hex().notNull(),
    priceOracleData: t.hex().notNull(),
    appData: t.hex().notNull(),
  }),
  (table) => ({
    orderIdx: index().on(table.orderId),
  })
);

export const constantProductDataRelations = relations(
  constantProductData,
  ({ one }) => ({
    order: one(order, {
      fields: [constantProductData.orderId],
      references: [order.id],
    }),
    token0: one(token, {
      fields: [constantProductData.token0Id],
      references: [token.id],
    }),
    token1: one(token, {
      fields: [constantProductData.token1Id],
      references: [token.id],
    }),
  })
);
