import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoTrendingUp, IoTrendingDown, IoTime, IoWalletOutline, IoTrailSign, IoBarChart } from 'react-icons/io5';

const FinancialPredictionCard = ({ 
  pair, 
  currentPrice, 
  endTime, 
  onPredict,
  totalBetAmount,
  upVotes,
  downVotes,
  tags
}) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isUpSelected, setIsUpSelected] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePredict = () => {
    onPredict(isUpSelected);
  };

  const totalVotes = upVotes + downVotes;
  const upPercentage = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 50;
  const downPercentage = totalVotes > 0 ? (downVotes / totalVotes) * 100 : 50;

  return (
    <div className="w-full bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-200 dark:border-navy-700">
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-navy-700 dark:text-white">
            {pair}
          </h2>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            ${currentPrice.toFixed(2)}
          </span>
        </div>
        
        <div className="relative w-full h-2 bg-gray-200 dark:bg-navy-700 rounded-full mb-4">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 60) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <IoTime className="mr-1" />
            <span>{timeLeft}s</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <IoWalletOutline className="mr-1" />
            <span>{totalBetAmount.toFixed(4)} ETH</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-grow">
            <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-2 overflow-hidden">
              <motion.div 
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-brand-500 dark:from-green-500 dark:to-brand-400"
                initial={{ width: 0 }}
                animate={{ width: `${upPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-green-500 dark:text-green-400 w-12 text-right">{upPercentage.toFixed(1)}%</span>
          <span className="text-sm font-medium text-red-500 dark:text-red-400 w-12 text-right">{downPercentage.toFixed(1)}%</span>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <IoTrailSign className="mr-1" />
          {tags.map((tag, index) => (
            <span key={index} className="mr-2 bg-gray-200 dark:bg-navy-700 px-2 py-1 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>

        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          Will {pair.split('/')[0]} go up or down?
        </div>

        <div className="flex space-x-2 mb-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsUpSelected(true)}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center ${
              isUpSelected 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <IoTrendingUp className="mr-1" /> Up
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsUpSelected(false)}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center ${
              !isUpSelected 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <IoTrendingDown className="mr-1" /> Down
          </motion.button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <p>Total Votes: {totalVotes}</p>
          <p>Up Votes: {upVotes}</p>
          <p>Down Votes: {downVotes}</p>
        </div>
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePredict}
        className="w-full bg-gradient-to-r from-brand-400 to-brand-500 dark:from-brand-500 dark:to-brand-400 text-white py-3 transition-all duration-200 text-sm font-medium flex items-center justify-center"
      >
        <IoBarChart className="mr-2" /> Place Prediction
      </motion.button>
    </div>
  );
};

export default FinancialPredictionCard;