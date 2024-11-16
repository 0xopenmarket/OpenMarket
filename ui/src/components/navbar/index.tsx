import React, { useState, useEffect } from 'react';
import { Home, BarChart2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';

const NavBar = ({ isMobile }) => {
  const [activeTab, setActiveTab] = useState('predict');
  const [showTutorial, setShowTutorial] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

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
            <DynamicWidget />
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

      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-70"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full shadow-lg dark:bg-[#0b14374d]"
            >
              <h2 className="text-xl font-bold mb-4 text-white">Welcome to OpenMarkets.AI!</h2>
              <p className="text-gray-300 mb-4">Let's quickly go through the main features of our prediction marketplace:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300 mb-6">
                <li>Leaders: See top performers</li>
                <li>Predict: Make your predictions</li>
                <li>Profile: View your activity and settings</li>
              </ul>
              <button 
                onClick={handleCloseTutorial}
                className="w-full bg-blue-500 text-white rounded-lg py-2 font-semibold hover:bg-blue-600 transition-colors"
              >
                Got it, let's start!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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