import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAccount } from 'wagmi';
import { 
  Swords,
  Timer,
  Users,
  Trophy,
  DollarSign,
  ArrowRight,
  X
} from 'lucide-react';

const PvPGameCard = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('idle'); // idle, waiting, playing, finished
  const [gameData, setGameData] = useState(null);
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('waiting', () => {
      setGameState('waiting');
    });

    newSocket.on('gameStart', (data) => {
      setGameState('playing');
      setGameData(data);
      setTimeLeft(data.timeLeft);
    });

    newSocket.on('gameEnd', (results) => {
      setGameState('finished');
      setGameData({ ...gameData, results });
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  const handleFindGame = () => {
    if (socket && isConnected) {
      socket.emit('findGame');
      setGameState('waiting');
    }
  };

  const handleSubmitGuess = () => {
    if (socket && guess) {
      socket.emit('makeGuess', guess);
      setGuess('');
    }
  };

  return (
    <motion.div 
      className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy-700 dark:text-white flex items-center">
            <Swords className="w-5 h-5 mr-2 text-brand-500" />
            PvP Price Prediction
          </h2>
          {gameState === 'playing' && (
            <div className="flex items-center text-brand-500">
              <Timer className="w-4 h-4 mr-1" />
              <span>{Math.ceil(timeLeft / 1000)}s</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <button
                onClick={handleFindGame}
                disabled={!isConnected}
                className="py-3 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Find Match
              </button>
            </motion.div>
          )}

          {gameState === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="animate-pulse flex flex-col items-center">
                <Users className="w-8 h-8 text-brand-500 mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  Finding opponent...
                </p>
              </div>
            </motion.div>
          )}

          {gameState === 'playing' && gameData && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Initial Price
                </div>
                <div className="text-2xl font-bold text-navy-700 dark:text-white">
                  ${gameData.initialPrice.toFixed(2)}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter price prediction"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-transparent"
                />
                <button
                  onClick={handleSubmitGuess}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'finished' && gameData?.results && (
            <motion.div
              key="finished"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Final Price
                </div>
                <div className="text-2xl font-bold text-navy-700 dark:text-white">
                  ${gameData.results.finalPrice.toFixed(2)}
                </div>
              </div>

              <div className="text-center py-4">
                <Trophy className={`w-8 h-8 mx-auto mb-2 ${
                  gameData.results.winner === address ? 'text-yellow-500' : 'text-gray-400'
                }`} />
                <p className="text-lg font-medium text-navy-700 dark:text-white mb-2">
                  {gameData.results.message}
                </p>
                <button
                  onClick={handleFindGame}
                  className="mt-4 py-2 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PvPGameCard;
