import { Address, decodeAbiParameters, toHex } from "viem";
import { contextType } from "./types";
import { bytes32ToAddress, getToken } from "./utils";
import { hashOrder, OrderBalance, OrderKind } from "@cowprotocol/contracts";
import { OrderSigningUtils } from "@cowprotocol/cow-sdk";

type OrderType = "StopLoss" | "ProductConstant" | undefined;

interface IOrderDecodingParameters {
  stopLossDataId?: string;
  constantProductDataId?: string;
  decodedSuccess: boolean;
}

abstract class IHandlerHelper {
  abstract type: OrderType;
  abstract decodeAndSaveOrder(
    staticInput: `0x${string}`,
    userAddress: Address,
    context: contextType,
    eventId: string
  ): Promise<IOrderDecodingParameters>;
  async getOrderHandler(address: Address, context: contextType) {
    const handlerId = `${address}-${context.network.chainId}`;
    let handler = await context.db.OrderHandler.findUnique({
      id: handlerId,
    });
    if (!handler) {
      handler = await context.db.OrderHandler.create({
        id: handlerId,
        data: {
          address,
          type: this.type,
          chainId: context.network.chainId,
        },
      });
    }
    return handler;
  }
}

export class DefaultHandlerHelper extends IHandlerHelper {
  type = undefined;

  async decodeAndSaveOrder(
    _staticInput: `0x${string}`,
    _userOwner: Address,
    _context: contextType,
    _eventId: string
  ): Promise<IOrderDecodingParameters> {
    return {
      decodedSuccess: false,
    };
  }
}

class StopLossHandlerHelper extends IHandlerHelper {
  type = "StopLoss" as const;

  async decodeAndSaveOrder(
    staticInput: `0x${string}`,
    orderOwner: Address,
    context: contextType,
    eventId: string
  ) {
    const stopLossData = decodeAbiParameters(
      [
        { name: "sellToken", type: "address" },
        { name: "buyToken", type: "address" },
        { name: "sellAmount", type: "uint256" },
        { name: "buyAmount", type: "uint256" },
        { name: "appData", type: "bytes32" },
        { name: "receiver", type: "address" },
        { name: "isSellOrder", type: "bool" },
        { name: "isPartiallyFillable", type: "bool" },
        { name: "validTo", type: "uint256" },
        { name: "sellTokenPriceOracle", type: "bytes32" },
        { name: "buyTokenPriceOracle", type: "bytes32" },
        { name: "strike", type: "int256" },
        { name: "maxTimeSinceLastOracleUpdate", type: "uint256" },
      ],
      staticInput
    );
    const [tokenIn, tokenOut] = await Promise.all([
      getToken(stopLossData[0], context),
      getToken(stopLossData[1], context),
    ]);

    const sellAmount = stopLossData[2];
    const buyAmount = stopLossData[3];
    const appData = stopLossData[4];
    const receiver = stopLossData[5];
    const isSellOrder = stopLossData[6];
    const partiallyFillable = stopLossData[7];
    const validTo = stopLossData[8];
    const feeAmount = 0n;

    const domain = await OrderSigningUtils.getDomain(context.network.chainId);

    const orderDigest = hashOrder(domain, {
      sellToken: tokenIn.address,
      buyToken: tokenOut.address,
      sellAmount,
      buyAmount,
      receiver,
      validTo: Number(validTo),
      appData,
      feeAmount,
      kind: isSellOrder ? OrderKind.SELL : OrderKind.BUY,
      partiallyFillable,
      sellTokenBalance: OrderBalance.ERC20,
      buyTokenBalance: OrderBalance.ERC20,
    });

    const orderUid = `${orderDigest}${orderOwner.slice(2)}${toHex(
      validTo
    ).slice(2)}` as `0x${string}`;

    const StopLossOrder = await context.db.StopLossOrder.create({
      id: `${orderUid.toLowerCase()}-${context.network.chainId}`,
      data: {
        orderId: eventId,
        tokenSellId: tokenIn.id,
        tokenBuyId: tokenOut.id,
        tokenSellAmount: sellAmount,
        tokenBuyAmount: buyAmount,
        appData,
        to: receiver,
        isSellOrder,
        isPartiallyFillable: partiallyFillable,
        validTo,
        sellTokenPriceOracle: bytes32ToAddress(stopLossData[9]),
        buyTokenPriceOracle: bytes32ToAddress(stopLossData[10]),
        strike: stopLossData[11],
        maxTimeSinceLastOracleUpdate: stopLossData[12],
        orderUid,
        executedTokenBuyAmount: 0n,
        executedTokenSellAmount: 0n,
        filledPctBps: 0n,
      },
    });
    return { stopLossDataId: StopLossOrder.id, decodedSuccess: true };
  }
}

class ProductConstantHandlerHelper extends IHandlerHelper {
  type = "ProductConstant" as const;

  async decodeAndSaveOrder(
    staticInput: `0x${string}`,
    _orderOwner: Address,
    context: contextType,
    eventId: string
  ) {
    // on the CoW AMM calls, the first 32 bytes aren't used by us, so we will remove them
    const usefulStaticInput = `0x${staticInput.slice(66)}` as const;
    const cowAmmData = decodeAbiParameters(
      [
        { name: "token0", type: "address" },
        { name: "token1", type: "address" },
        { name: "minTradedToken0", type: "uint256" },
        { name: "priceOracle", type: "address" },
        { name: "priceOracleData", type: "bytes" },
        { name: "appData", type: "bytes32" },
      ],
      usefulStaticInput
    );

    const [token0, token1] = await Promise.all([
      getToken(cowAmmData[0], context),
      getToken(cowAmmData[1], context),
    ]);

    const ConstantProductData = await context.db.ConstantProductData.create({
      id: eventId,
      data: {
        orderId: eventId,
        token0Id: token0.id,
        token1Id: token1.id,
        minTradedToken0: cowAmmData[2],
        priceOracle: cowAmmData[3],
        priceOracleData: cowAmmData[4],
        appData: cowAmmData[5],
      },
    });
    return {
      constantProductDataId: ConstantProductData.id,
      decodedSuccess: true,
    };
  }
}

export function getHandlerHelper(address: Address, chainId: number) {
  const lowerCaseAddress = address.toLowerCase();
  if (
    chainId === 1 &&
    lowerCaseAddress === "0x34323b933096534e43958f6c7bf44f2bb59424da"
  )
    return new ProductConstantHandlerHelper();
  if (
    chainId === 100 &&
    lowerCaseAddress === "0xb148f40fff05b5ce6b22752cf8e454b556f7a851"
  )
    return new ProductConstantHandlerHelper();
  if (
    chainId === 11155111 &&
    "0x4bb23bf4802b4bbe9195637289bb4ffc835b221b" === lowerCaseAddress
  )
    return new ProductConstantHandlerHelper();
  if (lowerCaseAddress === "0x412c36e5011cd2517016d243a2dfb37f73a242e7")
    return new StopLossHandlerHelper();
  return new DefaultHandlerHelper();
}
