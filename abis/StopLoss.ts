export const StopLossAbi = [
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "OrderNotValid",
    type: "error",
  },
  {
    inputs: [{ internalType: "string", name: "reason", type: "string" }],
    name: "PollNever",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "PollTryAtBlock",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "PollTryAtEpoch",
    type: "error",
  },
  {
    inputs: [{ internalType: "string", name: "reason", type: "string" }],
    name: "PollTryNextBlock",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        components: [
          {
            internalType: "contract IConditionalOrder",
            name: "handler",
            type: "address",
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          { internalType: "bytes", name: "staticInput", type: "bytes" },
        ],
        indexed: false,
        internalType: "struct IConditionalOrder.ConditionalOrderParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "ConditionalOrderCreated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "bytes", name: "staticInput", type: "bytes" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "getTradeableOrder",
    outputs: [
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "sellToken",
            type: "address",
          },
          {
            internalType: "contract IERC20",
            name: "buyToken",
            type: "address",
          },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "uint32", name: "validTo", type: "uint32" },
          { internalType: "bytes32", name: "appData", type: "bytes32" },
          { internalType: "uint256", name: "feeAmount", type: "uint256" },
          { internalType: "bytes32", name: "kind", type: "bytes32" },
          { internalType: "bool", name: "partiallyFillable", type: "bool" },
          {
            internalType: "bytes32",
            name: "sellTokenBalance",
            type: "bytes32",
          },
          { internalType: "bytes32", name: "buyTokenBalance", type: "bytes32" },
        ],
        internalType: "struct GPv2Order.Data",
        name: "order",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "bytes32", name: "_hash", type: "bytes32" },
      { internalType: "bytes32", name: "domainSeparator", type: "bytes32" },
      { internalType: "bytes32", name: "ctx", type: "bytes32" },
      { internalType: "bytes", name: "staticInput", type: "bytes" },
      { internalType: "bytes", name: "offchainInput", type: "bytes" },
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "sellToken",
            type: "address",
          },
          {
            internalType: "contract IERC20",
            name: "buyToken",
            type: "address",
          },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "uint32", name: "validTo", type: "uint32" },
          { internalType: "bytes32", name: "appData", type: "bytes32" },
          { internalType: "uint256", name: "feeAmount", type: "uint256" },
          { internalType: "bytes32", name: "kind", type: "bytes32" },
          { internalType: "bool", name: "partiallyFillable", type: "bool" },
          {
            internalType: "bytes32",
            name: "sellTokenBalance",
            type: "bytes32",
          },
          { internalType: "bytes32", name: "buyTokenBalance", type: "bytes32" },
        ],
        internalType: "struct GPv2Order.Data",
        name: "",
        type: "tuple",
      },
    ],
    name: "verify",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
] as const;
