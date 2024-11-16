import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAccount } from 'wagmi';
import {
  IoGameController,
  IoTimer,
  IoPeople,
  IoTrophy,
  IoCash,
  IoArrowForward,
  IoClose,
  IoTimeOutline,
  IoWalletOutline,
  IoStatsChart,
  IoChevronBack,
  IoChevronForward
} from 'react-icons/io5';

const PvPPredictionCard = () => {
  // State
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('idle');
  const [gameData, setGameData] = useState(null);
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(30000); // 30 seconds default
  const [currentView, setCurrentView] = useState('main');
  const [matchHistory, setMatchHistory] = useState([]);

  const { address, isConnected } = useAccount();

  // Socket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL_MULTIPLAYER);
    setSocket(newSocket);

    newSocket.on('waiting', () => {
      setGameState('waiting');
      setGameData(null); // Reset game data
    });

    newSocket.on('gameStart', (data) => {
      setGameState('playing');
      setGameData(data);
      setTimeLeft(data.timeLeft || 30000);
    });

    newSocket.on('gameEnd', (results) => {
      setGameState('finished');
      setGameData(prev => ({
        ...prev,
        results
      }));

      // Only add to history if we have valid data
      if (guess && results.finalPrice) {
        setMatchHistory(prev => [...prev, {
          initialPrice: gameData?.initialPrice || 0,
          finalPrice: results.finalPrice,
          guess: parseFloat(guess),
          won: results.winners.includes(address),
          timestamp: Date.now()
        }]);
      }
    });

    return () => newSocket.disconnect();
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  // Handlers
  const handleFindGame = () => {
    if (socket && isConnected) {
      socket.emit('findGame');
      setGameState('waiting');
      setGameData(null); // Reset game data
      setGuess(''); // Reset guess
    }
  };

  const handleSubmitGuess = () => {
    if (socket && guess && !isNaN(parseFloat(guess))) {
      socket.emit('makeGuess', parseFloat(guess));
    }
  };

  // Render game content based on state
  const renderGameContent = () => {
    switch (gameState) {
      case 'idle':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-6 space-y-4"
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-navy-700 dark:text-white mb-2">
                Ready to Challenge?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Predict ETH price against other players
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFindGame}
              disabled={!isConnected}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isConnected ? 'Find Match' : 'Connect Wallet to Play'}
            </motion.button>
          </motion.div>
        );

      case 'waiting':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6"
          >
            <div className="animate-pulse flex flex-col items-center">
              <IoPeople className="w-8 h-8 text-brand-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Finding opponent...</p>
            </div>
          </motion.div>
        );

      case 'playing':
        return gameData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Current ETH Price
              </div>
              <div className="text-2xl font-bold text-navy-700 dark:text-white">
                ${gameData.initialPrice?.toFixed(2) || '0.00'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Your Prediction</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter predicted price"
                  step="0.01"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-600 rounded-lg"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitGuess}
                  disabled={!guess}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Submit
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : null;

        case 'finished':
          return gameData?.results ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-4"
            >
              <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Final Price</span>
                    <span className="text-lg font-bold text-navy-700 dark:text-white">
                      ${gameData.results.finalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Your Guess</span>
                    <span className="text-lg font-bold text-navy-700 dark:text-white">
                      ${gameData.results.yourGuess?.toFixed(2) || 'No guess'}
                    </span>
                  </div>
                  {gameData.results.isWinner && (
                    <div className="mt-2 flex items-center justify-center text-yellow-500">
                      <IoTrophy className="w-6 h-6 mr-2" />
                      <span className="font-medium">Winner!</span>
                    </div>
                  )}
                </div>
              </div>
        
              {/* Results Breakdown */}
              <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Results Breakdown
                </h4>
                <div className="space-y-3">
                  {gameData.results.details.map((detail, index) => (
                    <div 
                      key={index}
                      className={`flex justify-between items-center ${
                        detail.isWinner ? 'text-green-500 font-medium' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="text-sm">
                        {detail.playerId === address ? 'You' : `Player ${index + 1}`}
                      </span>
                      <span className="text-sm">
                        ${detail.guess.toFixed(2)}
                      </span>
                      <span className="text-sm">
                        {((Math.abs(gameData.results.finalPrice - detail.guess) / gameData.results.finalPrice) * 100).toFixed(1)}% off
                      </span>
                    </div>
                  ))}
                </div>
              </div>
        
              {/* Result Message */}
              <div className="text-center">
                <p className="text-lg font-medium text-navy-700 dark:text-white mb-4">
                  {gameData.results.message}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFindGame}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium"
                >
                  Play Again
                </motion.button>
              </div>
            </motion.div>
          ) : null;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="w-full bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200 dark:border-navy-700"
      layout
    >
      <div className="relative">
        {/* Main Content */}
        <motion.div
          className="p-4"
          animate={{ x: currentView === 'main' ? 0 : '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-bold text-navy-700 dark:text-white line-clamp-2 flex-grow">
              PvP Price Prediction Challenge
            </h2>
            <button
              onClick={() => setCurrentView('details')}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
            >
              <IoStatsChart size={20} />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <IoTimeOutline className="mr-1" />
                <span>
                  {gameState === 'playing' 
                    ? `${Math.ceil(timeLeft / 1000)}s left`
                    : 'Game Length: 30s'
                  }
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <IoPeople className="mr-1" />
                <span>2 Players Required</span>
              </div>
            </div>
          </div>

          {/* Game Content */}
          <AnimatePresence mode="wait">
            {renderGameContent()}
          </AnimatePresence>
        </motion.div>

        {/* History View */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-white dark:bg-navy-800"
          initial={{ x: '100%' }}
          animate={{ x: currentView === 'details' ? 0 : '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentView('main')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
              >
                <IoChevronBack size={20} />
              </button>
              <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                Match History
              </h3>
              <div className="w-8" />
            </div>

            <div className="space-y-4">
              {matchHistory.map((match, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${
                      match.won ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {match.won ? 'Won' : 'Lost'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(match.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Initial: ${match.initialPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Final: ${match.finalPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Guess: ${match.guess.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              
              {matchHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No matches played yet
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PvPPredictionCard;
