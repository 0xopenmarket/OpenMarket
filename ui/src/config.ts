import { http, createConfig } from 'wagmi'
import {   baseSepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [  baseSepolia],
  multiInjectedProviderDiscovery: false,

  transports: {
    [baseSepolia.id]: http()
  },
})