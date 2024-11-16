import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseEther, formatEther } from 'viem';
import { IoWalletOutline, IoSwapHorizontal, IoTrashOutline, IoInformationCircle, IoAdd, IoRemove } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { usePredictionMarket, useMarketPosition } from '../../hooks/usePredictionHooks';
import dynamic from 'next/dynamic';
import {useAccount} from 'wagmi'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Constants
const MIN_BET = 0.001;
const STEP_AMOUNT = 0.001;

export const PositionManagement = ({ 
  marketId, 
  position,
  currentPrices,
  contractAddress,
  abi,
  onUpdatePosition 
}) => {
  const [exitAmount, setExitAmount] = useState(MIN_BET);
  const [selectedPosition, setSelectedPosition] = useState('yes');
  const [showLimitOrders, setShowLimitOrders] = useState(false);
  const [limitOrderPrice, setLimitOrderPrice] = useState(50);
  const [limitOrderAmount, setLimitOrderAmount] = useState(MIN_BET);

  const { exitPosition, createLimitOrder, cancelLimitOrder, isProcessing } = usePredictionMarket(contractAddress, abi);

  // Format position values
  const yesTokens = position?.yesTokens ? Number(formatEther(position.yesTokens)) : 0;
  const noTokens = position?.noTokens ? Number(formatEther(position.noTokens)) : 0;
  const totalInvested = position?.totalInvested ? Number(formatEther(position.totalInvested)) : 0;

  // Calculate vote percentages
  const totalVotes = yesTokens + noTokens;
  const yesPercentage = totalVotes > 0 ? (yesTokens / totalVotes) * 100 : 50;
  const noPercentage = 100 - yesPercentage;

  const handleExitPosition = async () => {
    if (!exitAmount || exitAmount < MIN_BET) {
      toast.error(`Minimum exit amount is ${MIN_BET} ETH`);
      return;
    }

    const maxExitAmount = selectedPosition === 'yes' ? yesTokens : noTokens;
    if (exitAmount > maxExitAmount) {
      toast.error(`Maximum exit amount is ${maxExitAmount.toFixed(3)} ETH`);
      return;
    }

    try {
      const success = await exitPosition(Number(marketId), selectedPosition === 'yes', exitAmount);
      if (success) {
        toast.success('Position exited successfully');
        onUpdatePosition?.();
        setExitAmount(MIN_BET);
      }
    } catch (error) {
      console.error('Exit position error:', error);
      toast.error('Failed to exit position');
    }
  };

  const handleCreateLimitOrder = async () => {
    if (!limitOrderAmount || limitOrderAmount < MIN_BET) {
      toast.error(`Minimum order amount is ${MIN_BET} ETH`);
      return;
    }

    if (limitOrderPrice <= 0 || limitOrderPrice >= 100) {
      toast.error('Price must be between 0 and 100');
      return;
    }

    try {
      const success = await createLimitOrder(
        Number(marketId), 
        selectedPosition === 'yes',
        limitOrderAmount,
        Math.floor(limitOrderPrice * 10)
      );

      if (success) {
        toast.success('Limit order created successfully');
        onUpdatePosition?.();
        setLimitOrderAmount(MIN_BET);
        setLimitOrderPrice(50);
      }
    } catch (error) {
      console.error('Create limit order error:', error);
      toast.error('Failed to create limit order');
    }
  };

  const handleCancelLimitOrder = async (orderId) => {
    try {
      const success = await cancelLimitOrder(Number(marketId), Number(orderId));
      if (success) {
        toast.success('Order cancelled successfully');
        onUpdatePosition?.();
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('Failed to cancel order');
    }
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6 space-y-6">
      {/* Position Summary */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Position
          </h2>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Total Invested: {totalInvested.toFixed(3)} ETH
          </div>
        </div>

        {/* Vote Distribution Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-900 dark:text-white">
                Yes: {yesTokens.toFixed(3)} ({yesPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-900 dark:text-white">
                No: {noTokens.toFixed(3)} ({noPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-navy-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-600"
              style={{ width: `${yesPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Position Controls */}
      <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exit Amount (ETH)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={exitAmount}
                onChange={(e) => setExitAmount(Math.max(MIN_BET, parseFloat(e.target.value) || MIN_BET))}
                disabled={isProcessing}
                className="w-full px-3 py-2 bg-white dark:bg-navy-800 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                step={STEP_AMOUNT}
                min={MIN_BET}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPosition('yes')}
                disabled={isProcessing}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPosition === 'yes'
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setSelectedPosition('no')}
                disabled={isProcessing}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPosition === 'no'
                    ? 'bg-red-500 dark:bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleExitPosition}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Exit Position'}
          </button>
          <button
            onClick={() => setShowLimitOrders(!showLimitOrders)}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-200 dark:bg-navy-700 hover:bg-gray-300 dark:hover:bg-navy-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {showLimitOrders ? 'Hide Orders' : 'Limit Orders'}
          </button>
        </div>
      </div>

      {/* Limit Orders Panel */}
      <AnimatePresence>
        {showLimitOrders && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Amount (ETH)
                </label>
                <input
                  type="number"
                  value={limitOrderAmount}
                  onChange={(e) => setLimitOrderAmount(Math.max(MIN_BET, parseFloat(e.target.value) || MIN_BET))}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 bg-white dark:bg-navy-800 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-900 dark:text-white text-sm"
                  step={STEP_AMOUNT}
                  min={MIN_BET}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Price (%)
                </label>
                <input
                  type="number"
                  value={limitOrderPrice}
                  onChange={(e) => setLimitOrderPrice(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 bg-white dark:bg-navy-800 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-900 dark:text-white text-sm"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <button
              onClick={handleCreateLimitOrder}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Creating...' : 'Create Limit Order'}
            </button>

            {/* Active Orders */}
            {position?.limitOrders?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Active Orders
                </h3>
                <div className="space-y-2">
                  {position.limitOrders.map((orderId) => (
                    <div
                      key={orderId.toString()}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Order #{orderId.toString()}
                      </span>
                      <button
                        onClick={() => handleCancelLimitOrder(orderId)}
                        disabled={isProcessing}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50"
                      >
                        <IoTrashOutline />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const PredictionControl = ({
  marketId,
  shareAmount,
  setShareAmount,
  onPrediction,
  isProcessing
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Prediction Amount:
        </span>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShareAmount(prev => Math.max(MIN_BET, prev - STEP_AMOUNT))}
            disabled={isProcessing}
            className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-full disabled:opacity-50"
          >
            <IoRemove size={16} />
          </motion.button>
          
          <input
            type="number"
            value={shareAmount}
            onChange={(e) => setShareAmount(Math.max(MIN_BET, parseFloat(e.target.value) || MIN_BET))}
            disabled={isProcessing}
            className="w-24 text-center border border-gray-300 dark:border-navy-600 rounded-lg py-2 bg-white dark:bg-navy-900 text-gray-900 dark:text-white"
            step={STEP_AMOUNT}
            min={MIN_BET}
          />
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShareAmount(prev => prev + STEP_AMOUNT)}
            disabled={isProcessing}
            className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-full disabled:opacity-50"
          >
            <IoAdd size={16} />
          </motion.button>
        </div>
      </div>

      {/* Prediction Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => onPrediction(true)}
          disabled={isProcessing}
          className="flex-1 py-3 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Yes {shareAmount} ETH
        </button>
        <button
          onClick={() => onPrediction(false)}
          disabled={isProcessing}
          className="flex-1 py-3 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          No {shareAmount} ETH
        </button>
      </div>
    </div>
  );
};


// Constants

export const PredictionCard = ({
  predictionId,
  usePredictionDetails,
  contractAddress,
  abi
}) => {
  const [shareAmount, setShareAmount] = useState(MIN_BET);
  const [showPositionManagement, setShowPositionManagement] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { address } = useAccount();
  const { takePosition, isProcessing } = usePredictionMarket(contractAddress, abi);
  
  // Get prediction details
  const { data: predictionDetails, isLoading: isLoadingDetails } = usePredictionDetails(predictionId);
  
  const {
    position,
    prices,
    refetchPosition
  } = useMarketPosition(contractAddress, abi, predictionId, address);

  // Extract prediction details with proper null checks
  const description = predictionDetails?.[0] || 'Loading...';
  const category = predictionDetails?.[1] || '';
  const endTime = predictionDetails?.[2] || BigInt(0);
  const status = predictionDetails?.[3] || 0;
  const totalLiquidity = predictionDetails?.[4] || BigInt(0);
  const totalVolume = predictionDetails?.[5] || BigInt(0);
  const totalParticipants = predictionDetails?.[6] || BigInt(0);
  const tags = predictionDetails?.[8] || [];

  const isActive = status === 0;
  const endTimeDate = new Date(Number(endTime) * 1000);
  const hasEnded = Date.now() > Number(endTime) * 1000;

  // Calculate vote percentages
  const yesVotes = Number(prices?.yes || 500n) / 10;
  const noVotes = Number(prices?.no || 500n) / 10;

  const handlePrediction = async (isYes) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const success = await takePosition(predictionId, isYes, shareAmount);
      if (success) {
        toast.success(`Successfully predicted ${isYes ? 'Yes' : 'No'}`);
        refetchPosition();
      }
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Failed to make prediction');
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-navy-700 rounded w-3/4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 dark:bg-navy-700 rounded" />
          <div className="h-20 bg-gray-200 dark:bg-navy-700 rounded" />
          <div className="h-20 bg-gray-200 dark:bg-navy-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-navy-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
            {description}
          </h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <IoInformationCircle size={24} />
          </button>
        </div>

        {/* Market Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">Ends</div>
            <div className="text-gray-900 dark:text-white font-medium">
              {endTimeDate.toLocaleDateString()} {endTimeDate.toLocaleTimeString()}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">Liquidity</div>
            <div className="text-gray-900 dark:text-white font-medium">
              {formatEther(totalLiquidity)} ETH
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
            <div className="text-gray-900 dark:text-white font-medium">
              {totalParticipants.toString()}
            </div>
          </div>
        </div>

        {/* Vote Distribution */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Yes {yesVotes}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">No {noVotes}%</span>
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
          </div>
          <div className="relative h-4 bg-gray-200 dark:bg-navy-900 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600"
              initial={{ width: 0 }}
              animate={{ width: `${yesVotes}%` }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-600"
              initial={{ width: 0 }}
              animate={{ width: `${noVotes}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-navy-900 text-gray-600 dark:text-gray-400 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Market Controls */}
        {isActive && !hasEnded && (
          <div className="space-y-6">
            <PredictionControl
              marketId={predictionId}
              shareAmount={shareAmount}
              setShareAmount={setShareAmount}
              onPrediction={handlePrediction}
              isProcessing={isProcessing}
            />

            {address && (
              <button
                onClick={() => setShowPositionManagement(!showPositionManagement)}
                className="w-full py-3 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <IoWalletOutline className="inline-block mr-2" />
                {showPositionManagement ? 'Hide' : 'Manage'} Position
              </button>
            )}
          </div>
        )}

        {/* Position Management */}
        <AnimatePresence>
          {showPositionManagement && position && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <PositionManagement
                marketId={predictionId}
                position={position}
                currentPrices={prices}
                contractAddress={contractAddress}
                abi={abi}
                onUpdatePosition={refetchPosition}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Market Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Market Details
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Category: {category}</p>
                  <p>Status: {status === 0 ? 'Active' : 'Closed'}</p>
                  <p>Total Participants: {totalParticipants.toString()}</p>
                  <p>Total Volume: {formatEther(totalVolume)} ETH</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
