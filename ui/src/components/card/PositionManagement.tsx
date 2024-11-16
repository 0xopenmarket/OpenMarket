import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { parseEther, formatEther } from 'viem';
import { IoWalletOutline, IoSwapHorizontal, IoTrashOutline } from 'react-icons/io5';
import { usePredictionMarket } from 'hooks/usePredictionHooks';
import toast from 'react-hot-toast';

const PositionManagement = ({ 
  marketId, 
  position,
  currentPrices,
  contractAddress,
  abi,
  onUpdatePosition 
}) => {
  const [exitAmount, setExitAmount] = useState(0.1);
  const [selectedPosition, setSelectedPosition] = useState('yes');
  const [showLimitOrders, setShowLimitOrders] = useState(false);
  const [limitOrderPrice, setLimitOrderPrice] = useState(50);
  const [limitOrderAmount, setLimitOrderAmount] = useState(0.1);

  // Get prediction market functions
  const {
    exitPosition,
    createLimitOrder,
    cancelLimitOrder,
    isProcessing
  } = usePredictionMarket(contractAddress, abi);

  // Format position values from wei to ETH
  const yesTokens = position?.yesTokens ? Number(formatEther(position.yesTokens)) : 0;
  const noTokens = position?.noTokens ? Number(formatEther(position.noTokens)) : 0;
  const totalInvested = position?.totalInvested ? Number(formatEther(position.totalInvested)) : 0;

  // Calculate current prices
  const yesPrice = Number(currentPrices?.yes || 0n) / 10;
  const noPrice = Number(currentPrices?.no || 0n) / 10;

  // Handle exiting a position
  const handleExitPosition = async () => {
    if (!exitAmount || exitAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    try {
      const isYes = selectedPosition === 'yes';
      const maxAmount = isYes ? yesTokens : noTokens;
      
      if (exitAmount > maxAmount) {
        toast.error(`Cannot exit more than current position (${maxAmount.toFixed(3)} tokens)`);
        return;
      }

      const success = await exitPosition(Number(marketId), isYes, exitAmount);
      
      if (success) {
        toast.success('Successfully exited position');
        onUpdatePosition?.();
        setExitAmount(0.1);
      }
    } catch (error) {
      console.error('Error exiting position:', error);
      toast.error('Failed to exit position');
    }
  };

  // Handle creating a limit order
  const handleCreateLimitOrder = async () => {
    if (!limitOrderAmount || limitOrderAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (limitOrderPrice <= 0 || limitOrderPrice >= 100) {
      toast.error('Price must be between 0 and 100');
      return;
    }

    try {
      const isYes = selectedPosition === 'yes';
      const success = await createLimitOrder(Number(marketId), isYes, limitOrderAmount, limitOrderPrice * 10);
      
      if (success) {
        toast.success('Successfully created limit order');
        onUpdatePosition?.();
        setLimitOrderAmount(0.1);
        setLimitOrderPrice(50);
      }
    } catch (error) {
      console.error('Error creating limit order:', error);
      toast.error('Failed to create limit order');
    }
  };

  // Handle canceling a limit order
  const handleCancelLimitOrder = async (orderId) => {
    try {
      const success = await cancelLimitOrder(Number(marketId), Number(orderId));
      
      if (success) {
        toast.success('Successfully canceled limit order');
        onUpdatePosition?.();
      }
    } catch (error) {
      console.error('Error canceling limit order:', error);
      toast.error('Failed to cancel limit order');
    }
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl shadow-md p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Position Management
        </h2>
      </div>

      {/* Current Position Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-100 dark:bg-navy-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Yes Position</div>
          <div className="text-xl font-bold text-green-500">
            {yesTokens.toFixed(3)} tokens
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current Price: {yesPrice.toFixed(1)}%
          </div>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-navy-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">No Position</div>
          <div className="text-xl font-bold text-red-500">
            {noTokens.toFixed(3)} tokens
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current Price: {noPrice.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Total Investment */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-navy-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Invested</div>
            <div className="text-xl font-bold text-navy-700 dark:text-white">
              {totalInvested.toFixed(3)} ETH
            </div>
          </div>
          <IoWalletOutline className="text-2xl text-gray-400" />
        </div>
      </div>

      {/* Exit Position Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Exit Position
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPosition('yes')}
              disabled={isProcessing}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedPosition === 'yes'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setSelectedPosition('no')}
              disabled={isProcessing}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedPosition === 'no'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              No
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            type="number"
            value={exitAmount}
            onChange={(e) => setExitAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 border dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            step="0.001"
            min="0"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExitPosition}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2 bg-brand-500 text-white rounded-lg disabled:opacity-50 transition-colors hover:bg-brand-600"
          >
            {isProcessing ? 'Exiting...' : 'Exit'}
          </motion.button>
        </div>

        <div className="p-4 bg-gray-100 dark:bg-navy-900 rounded-lg text-sm text-gray-600 dark:text-gray-400">
          Available to exit: {(selectedPosition === 'yes' ? yesTokens : noTokens).toFixed(3)} tokens
        </div>
      </div>

      {/* Limit Orders */}
      <div className="mb-6">
        <button
          onClick={() => setShowLimitOrders(!showLimitOrders)}
          disabled={isProcessing}
          className="w-full px-4 py-2 text-left text-sm font-medium bg-gray-100 dark:bg-navy-900 rounded-lg flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors disabled:opacity-50"
        >
          <span>Limit Orders</span>
          <IoSwapHorizontal className={`transform transition-transform ${showLimitOrders ? 'rotate-180' : ''}`} />
        </button>

        {showLimitOrders && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Amount</label>
                <input
                  type="number"
                  value={limitOrderAmount}
                  onChange={(e) => setLimitOrderAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 mt-1 border dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  step="0.001"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Target Price (%)</label>
                <input
                  type="number"
                  value={limitOrderPrice}
                  onChange={(e) => setLimitOrderPrice(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 mt-1 border dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateLimitOrder}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-brand-500 text-white rounded-lg disabled:opacity-50 transition-colors hover:bg-brand-600"
            >
              {isProcessing ? 'Creating...' : 'Create Limit Order'}
            </motion.button>

            {/* Active Limit Orders */}
            {position?.limitOrders?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Active Orders
                </h4>
                <div className="space-y-2">
                  {position.limitOrders.map((orderId) => (
                    <div
                      key={orderId.toString()}
                      className="flex items-center justify-between p-2 bg-gray-100 dark:bg-navy-900 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Order #{orderId.toString()}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCancelLimitOrder(orderId)}
                        disabled={isProcessing}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50"
                      >
                        <IoTrashOutline />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionManagement;