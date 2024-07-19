import { Address, decodeAbiParameters } from "viem";
import { contextType } from "./types";
import { bytes32ToAddress, getToken } from "./utils";

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
        { name: "validityBucketSeconds", type: "uint256" },
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

    const StopLossOrder = await context.db.StopLossOrder.create({
      id: eventId,
      data: {
        orderId: eventId,
        tokenInId: tokenIn.id,
        tokenOutId: tokenOut.id,
        tokenAmountIn: stopLossData[2],
        tokenAmountOut: stopLossData[3],
        appData: stopLossData[4],
        to: stopLossData[5],
        isSellOrder: stopLossData[6],
        isPartiallyFillable: stopLossData[7],
        validityBucketSeconds: stopLossData[8],
        sellTokenPriceOracle: bytes32ToAddress(stopLossData[9]),
        buyTokenPriceOracle: bytes32ToAddress(stopLossData[10]),
        strike: stopLossData[11],
        status: "open",
        maxTimeSinceLastOracleUpdate: stopLossData[12],
      },
    });
    return { stopLossDataId: StopLossOrder.id, decodedSuccess: true };
  }
}

class ProductConstantHandlerHelper extends IHandlerHelper {
  type = "ProductConstant" as const;

  async decodeAndSaveOrder(
    staticInput: `0x${string}`,
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
  // if (
  //   chainId === 1 &&
  //   [
  //     "0xe8212f30c28b4aab467df3725c14d6e89c2eb967",
  //     "0x6a8898f43676d8a3e9a5de286195558c3628a6d4",
  //   ].includes(lowerCaseAddress)
  // )
  //   return new StopLossHandlerHelper();
  if (
    chainId === 100 &&
    lowerCaseAddress === "0xb148f40fff05b5ce6b22752cf8e454b556f7a851"
  )
    return new ProductConstantHandlerHelper();
  // if (
  //   chainId === 100 &&
  //   [
  //     "0xe8212f30c28b4aab467df3725c14d6e89c2eb967",
  //     "0x5951ebf7dc5ddb9fd2fd6d5c7f4bc7b7509b463b",
  //   ].includes(lowerCaseAddress)
  // )
  //   return new StopLossHandlerHelper();
  if (
    chainId === 11155111 &&
    "0x4bb23bf4802b4bbe9195637289bb4ffc835b221b" === lowerCaseAddress
  )
    return new ProductConstantHandlerHelper();
  if (
    chainId === 11155111 &&
    lowerCaseAddress === "0xe6CDbC068654C506424F7747357F51d0e7caB00e"
  )
    return new StopLossHandlerHelper();
  return new DefaultHandlerHelper();
}

export function decodeAndSaveHandler(
  handler: `0x${string}`,
  staticInput: `0x${string}`,
  context: contextType,
  eventId: string
): Promise<IOrderDecodingParameters> {
  const chainId = context.network.chainId;
  const handlerHelper = getHandlerHelper(handler, chainId);
  return handlerHelper.decodeAndSaveOrder(staticInput, context, eventId);
}
