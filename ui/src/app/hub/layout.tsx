'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DynamicContextProvider, DynamicWidget, useDynamicContext, useTelegramLogin } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { createConfig, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import NavBar from 'components/navbar';

const config = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [baseSepolia.id]: http()
  },
});

const queryClient = new QueryClient();


export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-full w-full bg-background-100 dark:bg-navy-900">
          <DynamicContextProvider
          settings={{
            environmentId: "8d1a0fcf-94bc-4ca7-bbe0-0d36017f8084",
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
      </DynamicContextProvider>

    </div>
  );
}