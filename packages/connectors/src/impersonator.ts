import {
  ChainNotConfiguredError,
  ConnectorNotFoundError,
  normalizeChainId,
} from '@wagmi/core'
import type { Address, Chain } from '@wagmi/core'
import { ethers } from 'ethers'

import { Connector } from './base'

type ImpersonatorConnectorOptions = {
  /**
   * [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) Ethereum Provider to target
   */
  getProvider: (chainId: number) => ethers.providers.StaticJsonRpcProvider

  /**
   * Function to get the address to impersonate
   * Fallback to a `prompt` asking for the address
   */
  getImpersonatedAddress?: () => Promise<Address>
  /**
   * Default chain id to use
   * Fallback to the first element of the `chains` array
   */
  defaultChainId?: number
}

export class ImpersonatorConnector extends Connector<
  ethers.providers.StaticJsonRpcProvider,
  ImpersonatorConnectorOptions,
  ethers.providers.JsonRpcSigner
> {
  readonly id: string = 'impersonator'
  readonly name = 'Impersonator'
  readonly ready = true

  private defaultChainId: number
  private chainId: number
  private account?: Address

  constructor({
    chains,
    options,
  }: {
    chains: Chain[]
    options: ImpersonatorConnectorOptions
  }) {
    super({ chains, options })
    const fallbackChain = chains[0]
    if (!fallbackChain) {
      throw new Error('No chains configured')
    }
    if (options.defaultChainId) {
      if (this.isChainUnsupported(options.defaultChainId)) {
        throw new ChainNotConfiguredError({
          chainId: options.defaultChainId,
          connectorId: this.id,
        })
      }
    }

    this.defaultChainId = options.defaultChainId || fallbackChain.id
    this.chainId = this.defaultChainId
  }

  async connect({ chainId }: { chainId?: number } = {}) {
    const provider = await this.getProvider({
      chainId: chainId || this.chainId,
    })
    if (!provider) throw new ConnectorNotFoundError()

    this.emit('message', { type: 'connecting' })

    if (chainId) {
      this.switchChain(chainId)
    }

    let account: Address
    if (this.options.getImpersonatedAddress) {
      account = await this.options.getImpersonatedAddress()
    } else {
      let answer
      try {
        answer = prompt('Enter an address to impersonate')
      } catch (err) {
        console.error(
          'The method `prompt` is not available. Please, provide a `getImpersonatedAddress` function in the options.',
        )
        throw err
      }
      if (!answer || !ethers.utils.isAddress(answer)) {
        throw new Error('Invalid address')
      }
      account = ethers.utils.getAddress(answer)
    }

    this.account = account

    return {
      account,
      chain: {
        id: this.chainId,
        unsupported: this.isChainUnsupported(this.chainId),
      },
      provider: this.getProvider({ chainId: this.chainId }),
    }
  }

  async disconnect() {
    this.account = undefined
    this.chainId = this.defaultChainId
  }

  async getAccount() {
    if (!this.account) throw new Error('No account connected')
    return this.account
  }

  async getChainId() {
    return this.chainId
  }

  async getProvider(cfg?: { chainId?: number }) {
    const provider = this.options.getProvider(cfg?.chainId || this.chainId)
    return provider
  }

  async getSigner(cfg: {
    chainId: number
  }): Promise<ethers.providers.JsonRpcSigner> {
    return this.getProvider(cfg).then((provider) => provider.getSigner())
  }

  async isAuthorized() {
    return Boolean(this.account)
  }

  async switchChain(chainId: number) {
    const id = normalizeChainId(chainId)
    const chain = this.chains.find((x) => x.id === id)
    if (!chain)
      throw new ChainNotConfiguredError({ chainId, connectorId: this.id })

    this.chainId = id
    this.emit('change', {
      chain: { id, unsupported: this.isChainUnsupported(id) },
    })
    return chain
  }

  async watchAsset({
    address,
    decimals = 18,
    image,
    symbol,
  }: {
    address: Address
    decimals?: number
    image?: string
    symbol: string
  }) {
    const provider = await this.getProvider()
    if (!provider) throw new ConnectorNotFoundError()
    return provider.send('wallet_watchAsset', [
      {
        type: 'ERC20',
        options: {
          address,
          decimals,
          image,
          symbol,
        },
      },
    ])
  }

  protected onAccountsChanged = () => {
    // Not applicable
    return
  }

  protected onChainChanged = () => {
    // Not applicable
    return
  }

  protected onDisconnect() {
    this.emit('disconnect')
  }
}
