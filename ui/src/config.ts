import {   baseSepolia } from 'wagmi/chains'
import {http} from 'wagmi';

import {createConfig} from '@privy-io/wagmi';

// Replace these with your app's chains


export const config = createConfig({
  chains: [  baseSepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [baseSepolia.id]: http()
  },
})


import type {PrivyClientConfig} from '@privy-io/react-auth';

// Replace this with your Privy config
export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: true,
    noPromptOnSignature: false,
  },
  loginMethods: ['wallet', 'email', 'sms'],
  appearance: {
    showWalletLoginFirst: true,
  },
};