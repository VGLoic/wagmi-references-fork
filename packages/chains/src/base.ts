import { Chain } from './types'

export const base = {
  id: 8453,
  network: 'base-mainnet',
  name: 'Base Mainnet',
  nativeCurrency: { name: 'Base Mainnet', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    etherscan: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
    default: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  }
} as const satisfies Chain
