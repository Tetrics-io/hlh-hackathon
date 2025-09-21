export const CORE_WRITER_HELPER_ABI = [
  {
    inputs: [],
    type: 'error',
    name: 'CoreWriterCallFailed',
  },
  {
    inputs: [],
    type: 'error',
    name: 'InvalidBuilderAddress',
  },
  {
    inputs: [],
    type: 'error',
    name: 'InvalidFeeRate',
  },
  {
    inputs: [],
    type: 'error',
    name: 'InvalidOrderParameters',
  },
  {
    inputs: [
      { internalType: 'uint24', name: 'actionId', type: 'uint24', indexed: false },
      { internalType: 'bool', name: 'success', type: 'bool', indexed: false },
    ],
    type: 'event',
    name: 'ActionSubmitted',
    anonymous: false,
  },
  {
    inputs: [
      { internalType: 'address', name: 'builder', type: 'address', indexed: true },
      { internalType: 'uint64', name: 'maxFeeDeciBps', type: 'uint64', indexed: false },
    ],
    type: 'event',
    name: 'BuilderFeeApproved',
    anonymous: false,
  },
  {
    inputs: [
      { internalType: 'uint32', name: 'assetId', type: 'uint32', indexed: false },
      { internalType: 'bool', name: 'isBuy', type: 'bool', indexed: false },
      { internalType: 'uint64', name: 'limitPxE8', type: 'uint64', indexed: false },
      { internalType: 'uint64', name: 'szE8', type: 'uint64', indexed: false },
      { internalType: 'bool', name: 'reduceOnly', type: 'bool', indexed: false },
    ],
    type: 'event',
    name: 'IOCOrderPlaced',
    anonymous: false,
  },
  {
    inputs: [
      { internalType: 'address', name: 'builder', type: 'address' },
      { internalType: 'uint64', name: 'maxFeeDeciBps', type: 'uint64' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'approveBuilderFee',
  },
  {
    inputs: [
      { internalType: 'address', name: 'builder', type: 'address' },
      { internalType: 'uint64', name: 'maxFeeDeciBps', type: 'uint64' },
    ],
    stateMutability: 'pure',
    type: 'function',
    name: 'getEncodedBuilderFeeAction',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
  },
  {
    inputs: [
      { internalType: 'uint32', name: 'assetId', type: 'uint32' },
      { internalType: 'bool', name: 'isBuy', type: 'bool' },
      { internalType: 'uint64', name: 'limitPxE8', type: 'uint64' },
      { internalType: 'uint64', name: 'szE8', type: 'uint64' },
      { internalType: 'bool', name: 'reduceOnly', type: 'bool' },
    ],
    stateMutability: 'pure',
    type: 'function',
    name: 'getEncodedIOCAction',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
  },
  {
    inputs: [
      { internalType: 'uint32', name: 'assetId', type: 'uint32' },
      { internalType: 'bool', name: 'isBuy', type: 'bool' },
      { internalType: 'uint64', name: 'limitPxE8', type: 'uint64' },
      { internalType: 'uint64', name: 'szE8', type: 'uint64' },
      { internalType: 'bool', name: 'reduceOnly', type: 'bool' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'placeIoc',
  },
] as const

// Contract addresses
export const CORE_WRITER_HELPER_ADDRESS = '0x3577F2f2cAe036C2907eDd3D8A39f7d2F1e68362' as const
export const CORE_WRITER_SYSTEM_ADDRESS = '0x3333333333333333333333333333333333333333' as const

// Asset IDs
export const HYPE_ASSET_ID = 135
export const BTC_ASSET_ID = 0
export const ETH_ASSET_ID = 1