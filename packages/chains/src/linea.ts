import { Chain } from './types'

export const linea = {
  id: 59_144,
  name: 'Linea',
  network: 'linea',
  nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.linea.build'],
      webSocket: ['wss://rpc.linea.build'],
    },
    public: {
      http: ['https://rpc.linea.build'],
      webSocket: ['wss://rpc.linea.build'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BlockScout',
      url: 'https://explorer.goerli.linea.build',
    },
    etherscan: { name: 'LineaScan', url: 'https://lineascan.build' },
  },
} as const satisfies Chain
