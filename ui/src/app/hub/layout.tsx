'use client';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia, mantleSepoliaTestnet } from 'viem/chains';
import { http } from 'viem';
import NavBar from 'components/navbar';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
// Create configuration using getDefaultConfig

export const config = createConfig({
  chains: [baseSepolia, mantleSepoliaTestnet],
  transports: {
    [baseSepolia.id]: http(),
    [mantleSepoliaTestnet.id]: http()
  }
});

// Create Query Client
const queryClient = new QueryClient();
import type { PrivyClientConfig } from '@privy-io/react-auth';

// Replace this with your Privy config
export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: true,
    noPromptOnSignature: false,
  },
  loginMethods: ['wallet'],

  appearance: {
    theme: 'dark',
    showWalletLoginFirst: true,
    accentColor: '#8B5CF6', // Purple-500 to match your button
    variables: {
      colorBackground: '#0b1437',
      colorText: 'white',
      colorTextSecondary: '#94A3B8',
      borderRadius: '12px',
      // Modal customization
      modalBackdrop: 'rgba(0, 0, 0, 0.5)',
      modalBackground: '#1E293B',
      modalBorder: '1px solid rgba(255, 255, 255, 0.1)',
      modalShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    elements: {
      modalContent: {
        backgroundColor: '#0b1437',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      button: {
        backgroundColor: '#8B5CF6',
        border: 'none',
        borderRadius: '12px',
        '&:hover': {
          backgroundColor: '#7C3AED',
        },
      },
    },
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    document.documentElement.classList.add('dark');
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (

    <PrivyProvider appId="cm33fpagd05ok3qdugziceoud" config={privyConfig}>
      <QueryClientProvider client={queryClient}>

        <WagmiProvider config={config}>

          <div className="flex h-full w-full bg-background-100 dark:bg-navy-900">
            <NavBar isMobile={isMobile} />
            <main className={`mx-auto min-h-screen p-2 ${isMobile ? '!pt-[70px] pb-24' : '!pt-[70px]'} md:p-2`}>
              {children}
            </main>
          </div>
        </WagmiProvider>
      </QueryClientProvider>


    </PrivyProvider>

  );
}
