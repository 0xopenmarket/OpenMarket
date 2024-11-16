'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DynamicContextProvider, DynamicWidget, useDynamicContext, useTelegramLogin } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import NavBar from 'components/navbar';
import { config, privyConfig } from 'config';
import {PrivyProvider} from '@privy-io/react-auth';
// Make sure to import `WagmiProvider` from `@privy-io/wagmi`, not `wagmi`
import {WagmiProvider} from '@privy-io/wagmi';


const queryClient = new QueryClient();


export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    // document.documentElement.classList.add('dark');

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-full w-full bg-background-100 dark:bg-navy-900">
      {/* <DynamicContextProvider
        settings={{
          environmentId: "0fcf7f40-9eea-4961-a58e-a1367729a8ac",
          walletConnectors: [EthereumWalletConnectors],
        }}    >
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <DynamicWagmiConnector>
              <NavBar isMobile={isMobile} />
              <main className={`mx-auto min-h-screen p-2 ${isMobile ? '!pt-[70px] pb-24' : '!pt-[70px]'} md:p-2`}>
                {children}
              </main>
            </DynamicWagmiConnector>
          </QueryClientProvider>
        </WagmiProvider>
      </DynamicContextProvider> */}
    <PrivyProvider appId="clze7v7wa0bu9k5u6ndgyem1l" config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
              <NavBar isMobile={isMobile} />
              <main className={`mx-auto min-h-screen p-2 ${isMobile ? '!pt-[70px] pb-24' : '!pt-[70px]'} md:p-2`}>
                {children}
              </main>
              </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
    </div>
  );
}
