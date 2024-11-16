import React, { useState, useEffect } from 'react';
import { Wallet, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { formatEther } from 'viem';
import {getBalance} from "@wagmi/core";
import { config } from 'config';

const WalletButton = () => {
  const { ready, user, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Get the first embedded wallet or first connected wallet
  const activeWallet = wallets?.[0];
  useEffect(() => {
    const fetchBalance = async () => {
      if (activeWallet?.address) {
        try {

          const balance = getBalance(config, {
  address: activeWallet?.address,
})
          setBalance("0");
        } catch (err) {
          console.error('Error fetching balance:', err);
        }
      }
    };

    fetchBalance();
    // Set up polling for balance updates
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [activeWallet?.address]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.wallet-button-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  if (!ready) {
    return (
      <motion.button
        className="flex items-center space-x-2 bg-gray-700/50 text-gray-300 px-4 py-2 rounded-xl font-semibold"
      >
        <Loader2 className="animate-spin" size={20} />
        <span>Loading...</span>
      </motion.button>
    );
  }

  if (!authenticated) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={login}
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
      >
        <Wallet size={20} />
        <span>Connect Wallet</span>
      </motion.button>
    );
  }

  return (
    <div className="wallet-button-container relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>{activeWallet?.address ? truncateAddress(activeWallet.address) : 'Connected'}</span>
        </div>
        {balance && (
          <div className="px-2 py-0.5 bg-white/10 rounded-lg text-sm hidden md:block">
            {balance} ETH
          </div>
        )}
        <ChevronDown 
          size={16} 
          className={`ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 z-50"
          >
            {activeWallet?.address && (
              <>
                <div className="px-4 py-2 text-sm text-gray-300 border-b border-white/10">
                  {truncateAddress(activeWallet.address)}
                </div>
                <div className="px-4 py-2 text-sm text-gray-300 border-b border-white/10">
                  {balance} ETH
                </div>
              </>
            )}
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletButton;
