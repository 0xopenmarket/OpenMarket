import React, { useState, useEffect } from 'react';
import { Home, BarChart2, User, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import {usePrivy, useWallets} from '@privy-io/react-auth';
import WalletButton from "./WalletButtons";
const NavBar = ({ isMobile }) => {
  const [activeTab, setActiveTab] = useState('predict');
  const [showTutorial, setShowTutorial] = useState(false);
  const router = useRouter();
  const {ready, user, authenticated, login, connectWallet, logout, linkWallet} = usePrivy();

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);
const ConnectButton = () => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={connectWallet}
      className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
    >
      <Wallet size={20} />
      <span>{authenticated ? 'Connected' : 'Connect Wallet'}</span>
    </motion.button>
  );
  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const handleNavigation = (route) => {
    setActiveTab(route);
    if (route === 'profile') {
      router.push('/hub/profile');
    } else if (route === 'predict') {
      router.push('/hub/dashboard');
    } else if (route === 'leaders') {
      router.push('/hub/leaders');
    } else {
      router.push(`/${route}`);
    }
  };

  const navItems = [
    { icon: <Home size={20} />, label: 'Leaders', route: 'leaders' },
    { icon: <BarChart2 size={20} />, label: 'Predict', route: 'predict' },
    { icon: <User size={20} />, label: 'Profile', route: 'profile' },
  ];

  const NavContent = ({ position }) => (
    <div className={`flex items-center ${position === 'bottom' ? 'justify-around w-full' : 'space-x-4'}`}>
      {navItems.map((item) => (
        <NavItem
          key={item.route}
          icon={item.icon}
          label={item.label}
          isActive={activeTab === item.route}
          onClick={() => handleNavigation(item.route)}
          isMobile={position === 'bottom'}
        />
      ))}
    </div>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-xl p-2 shadow-lg dark:bg-[#0b14374d] z-50"
      >
        <div className="flex justify-between items-center">
          <span className="text-white font-bold text-xl">OpenMarkets.AI</span>
          <div className="flex items-center space-x-2">
            {!isMobile && <NavContent position="top" />}
<WalletButton/>
            </div>
        </div>
      </motion.nav>

      {isMobile && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-xl p-2 shadow-lg dark:bg-[#0b14374d] z-50"
        >
          <NavContent position="bottom" />
        </motion.nav>
      )}

    </>
  );
};

const NavItem = ({ icon, label, isActive, onClick, isMobile }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className={`
      flex flex-col items-center justify-center 
      py-2 px-4 rounded-xl transition-colors
      ${isActive ? 'text-blue-500 bg-white/20' : 'text-gray-400 hover:text-gray-200'}
      ${isMobile ? 'flex-1' : ''}
    `}
    onClick={onClick}
  >
    {icon}
    <span className="text-xs mt-1 font-medium">{label}</span>
  </motion.button>
);

export default NavBar;
