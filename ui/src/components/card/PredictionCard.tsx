import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoAdd, 
  IoRemove, 
  IoTimeOutline, 
  IoWalletOutline, 
  IoTrailSign, 
  IoCheckmark, 
  IoClose, 
  IoCash, 
  IoBulb,
  IoInformationCircle,
  IoStatsChart,
  IoPeople,
  IoTrendingUp,
  IoChevronForward,
  IoChevronBack
} from 'react-icons/io5';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';

interface PredictionCardProps {
  predictionId: bigint;
  usePredictionDetails: (id: bigint) => any;
  onPredict: (id: number, isYes: boolean, amount: number) => void;
  contractAddress: `0x${string}`;
  abi: any;
}

const ADMIN_ROLE = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775';
const ORACLE_ROLE = '0x68e79a7bf1e0bc45d0a330c573bc37be4d8f69e2c52ed8096fdddca5aaefaa0c';

const PredictionCard: React.FC<PredictionCardProps> = ({ 
  predictionId, 
  usePredictionDetails, 
  onPredict,
  contractAddress,
  abi
}) => {
  // State management
  const [shareAmount, setShareAmount] = useState(1);
  const [isYesSelected, setIsYesSelected] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOracle, setIsOracle] = useState(false);
  const [outcome, setOutcome] = useState<number>(0);
  const [isAIFinalizing, setIsAIFinalizing] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testFinalizeData, setTestFinalizeData] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'main' | 'details' | 'predict'>('main');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'stats'>('overview');

  const { data: prediction, isLoading } = usePredictionDetails(predictionId);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
const router = useRouter();
  // Mock data for charts
  const priceHistory = Array.from({ length: 24 }, (_, i) => ({
    time: `${23-i}h ago`,
    yes: 50 + Math.sin(i * 0.5) * 20 + Math.random() * 10,
    no: 50 - Math.sin(i * 0.5) * 20 + Math.random() * 10,
    volume: Math.random() * 3 + 0.5
  })).reverse();

  // Contract reads
  const { data: hasAdminRole } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address as `0x${string}`],
  });

  const { data: hasOracleRole } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'hasRole',
    args: [ORACLE_ROLE, address as `0x${string}`],
  });

  // Derived state
  const [isPredictionEnded, setIsPredictionEnded] = useState(false);

  useEffect(() => {
    if (prediction) {
      const [, endTime] = prediction;
      setIsPredictionEnded(Date.now() / 1000 > Number(endTime));
    }
  }, [prediction]);

  useEffect(() => {
    setIsAdmin(!!hasAdminRole);
    setIsOracle(!!hasOracleRole);
  }, [hasAdminRole, hasOracleRole]);

  // Handlers
  const handleIncrement = () => setShareAmount(prev => prev + 1);
  const handleDecrement = () => setShareAmount(prev => Math.max(1, prev - 1));

  const handlePredict = () => {
    onPredict(Number(predictionId), isYesSelected, shareAmount);
  };

  const handleFinalize = async (useAI = false) => {
    if (!address) return;
    try {
      let finalOutcome;
      if (useAI) {
        setIsAIFinalizing(true);
        try {
          const response = await axios.post(`https://ai-predict-fcdw.onrender.com/finalize-prediction/${predictionId}`);
          finalOutcome = response.data.outcome;
        } catch (error) {
          console.error('Error finalizing with AI:', error);
          setIsAIFinalizing(false);
          return;
        }
      } else {
        finalOutcome = outcome;
      }

      await writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'finalizePrediction',
        args: [predictionId, BigInt(finalOutcome)],
        chain: baseSepolia,
        account: address
      });
    } catch (error) {
      console.error('Error finalizing prediction:', error);
    } finally {
      setIsAIFinalizing(false);
    }
  };

  const handleTestFinalize = async () => {
    if (!prediction) return;
    const [description] = prediction;
    
    try {
      setIsAIFinalizing(true);
      const response = await axios.post('https://ai-predict-fcdw.onrender.com/test/finalize-prediction', {
        description: description
      });
      setTestFinalizeData(response.data);
      setIsTestModalOpen(true);
    } catch (error) {
      console.error('Error testing finalization:', error);
    } finally {
      setIsAIFinalizing(false);
    }
  };

  const handleConfirmFinalize = async () => {
    if (!testFinalizeData || !address) return;
    try {
      await writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'finalizePrediction',
        args: [predictionId, BigInt(testFinalizeData.outcome)],
        chain: baseSepolia,
        account: address
      });
      setIsTestModalOpen(false);
    } catch (error) {
      console.error('Error finalizing prediction:', error);
    }
  };

  const handleCancel = async () => {
    if (!address) return;
    try {
      await writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'cancelPrediction',
        args: [predictionId],
        chain: baseSepolia,
        account: address
      });
    } catch (error) {
      console.error('Error cancelling prediction:', error);
    }
  };

  const handleDistributeRewards = async () => {
    if (!address) return;
    try {
      await writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'distributeRewards',
        args: [predictionId],
        chain: baseSepolia,
        account: address
      });
    } catch (error) {
      console.error('Error distributing rewards:', error);
    }
  };

  // Utility functions
  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const calculatePercentage = (votes: bigint, total: bigint) => {
    const votesNum = Number(votes) || 0;
    const totalNum = Number(total) || 0;
    return totalNum > 0 ? (votesNum / totalNum) * 100 : 50;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-64 p-4 flex items-center justify-center bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden">
        <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
          <div className="h-6 bg-gray-300 dark:bg-navy-600 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-navy-600 rounded w-1/2"></div>
          <div className="h-2 bg-gray-300 dark:bg-navy-600 rounded w-full"></div>
          <div className="flex space-x-4 w-full">
            <div className="h-8 bg-gray-300 dark:bg-navy-600 rounded w-1/2"></div>
            <div className="h-8 bg-gray-300 dark:bg-navy-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const [description, endTime, status, totalVotes, predictionOutcome, minVotes, maxVotes, predictionType, creator, creationTime, tags, optionsCount, totalBetAmount] = prediction;

  const yesVotes = totalVotes[0] ? Number(totalVotes[0]) : 0;
  const noVotes = totalVotes[1] ? Number(totalVotes[1]) : 0;
  const totalVotesCount = yesVotes + noVotes;

  const yesPercentage = calculatePercentage(BigInt(yesVotes), BigInt(totalVotesCount));
  const noPercentage = calculatePercentage(BigInt(noVotes), BigInt(totalVotesCount));

  const isActive = status === 0;
  const isFinalized = status === 1;
  const isCancelled = status === 2;
  const totalEth = Number(totalBetAmount) / 1e18;
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    router.push(`/hub/predictions/${predictionId}`);
  };

  return (
    <>
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
                {description}
              </h2>
              <button
                onClick={() => setCurrentView('details')}
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
              >
                <IoInformationCircle size={20} />
              </button>
            </div>
            <div className="px-4 pb-4">
        <button
          onClick={handleDetailsClick}
          className="w-full py-2 px-4 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Info className="h-4 w-4" />
          View Details
        </button>
      </div>
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <IoTimeOutline className="mr-1" />
                  <span>Ends {formatTime(endTime)}</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <IoWalletOutline className="mr-1" />
                  <span>{totalEth.toFixed(4)} ETH</span>
                </div>
              </div>
            </div>

            {/* Voting Distribution */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-500 font-medium">Yes {yesPercentage.toFixed(1)}%</span>
                <span className="text-red-500 font-medium">No {noPercentage.toFixed(1)}%</span>
              </div>
              <div className="relative h-2 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${yesPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            {isActive && (
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView('predict')}
                  className="flex-1 py-2 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Place Prediction
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Details View */}
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
                  Prediction Details
                </h3>
                <div className="w-8" /> {/* Spacer for alignment */}
              </div>

{/* Tabs */}
<div className="flex border-b border-gray-200 dark:border-navy-700 mb-4">
                {['overview', 'history', 'stats'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab as any)}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      selectedTab === tab
                        ? 'text-brand-500 dark:text-brand-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {selectedTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 dark:bg-brand-400"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {selectedTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                          <div className="font-medium text-navy-700 dark:text-white">
                            {formatTime(creationTime)}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                          <div className="font-medium text-navy-700 dark:text-white">
                            {isActive ? 'Active' : isFinalized ? 'Finalized' : 'Cancelled'}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTab === 'history' && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceHistory}>
                          <XAxis dataKey="time" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="yes"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={false}
                            name="Yes"
                          />
                          <Line
                            type="monotone"
                            dataKey="no"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={false}
                            name="No"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {selectedTab === 'stats' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Volume</div>
                          <div className="text-xl font-bold text-navy-700 dark:text-white">
                            {totalEth.toFixed(4)} ETH
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Participants</div>
                          <div className="text-xl font-bold text-navy-700 dark:text-white">
                            {totalVotesCount}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Vote Distribution
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Yes</span>
                            <span className="text-sm font-medium text-green-500">{yesPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">No</span>
                            <span className="text-sm font-medium text-red-500">{noPercentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Prediction View */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-white dark:bg-navy-800"
            initial={{ x: '100%' }}
            animate={{ x: currentView === 'predict' ? 0 : '100%' }}
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
                  Place Prediction
                </h3>
                <div className="w-8" /> {/* Spacer for alignment */}
              </div>

              <div className="space-y-4">
                {/* Yes/No Selection */}
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsYesSelected(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isYesSelected
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Yes ({yesPercentage.toFixed(1)}%)
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsYesSelected(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      !isYesSelected
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    No ({noPercentage.toFixed(1)}%)
                  </motion.button>
                </div>

                {/* Amount Selection */}
                <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Amount (ETH)</span>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleDecrement}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-navy-700 rounded-full"
                      >
                        <IoRemove size={14} />
                      </motion.button>
                      <input
                        type="number"
                        value={shareAmount}
                        onChange={(e) => setShareAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center bg-transparent border-none text-navy-700 dark:text-white"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleIncrement}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-navy-700 rounded-full"
                      >
                        <IoAdd size={14} />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePredict}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Confirm Prediction
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
        {/* Admin Controls Section */}
        {isAdmin && isActive && isPredictionEnded && (
          <div className="border-t border-gray-200 dark:border-navy-700">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin Controls
                </h4>
                {isAIFinalizing && (
                  <div className="flex items-center text-brand-500">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>

              {/* Admin Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Manual Finalization */}
                <div className="flex items-center space-x-2">
                  <select 
                    value={outcome}
                    onChange={(e) => setOutcome(parseInt(e.target.value))}
                    className="flex-1 py-2 px-3 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-lg text-sm"
                  >
                    <option value={0}>Yes</option>
                    <option value={1}>No</option>
                  </select>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFinalize(false)}
                    className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center"
                  >
                    <IoCheckmark className="mr-1" /> Manual
                  </motion.button>
                </div>

                {/* AI Finalization */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTestFinalize}
                  disabled={isAIFinalizing}
                  className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center justify-center"
                >
                  <IoBulb className="mr-1" />
                  Test AI Resolution
                </motion.button>
              </div>

              {/* Cancel Button */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center"
              >
                <IoClose className="mr-1" /> Cancel Prediction
              </motion.button>
            </div>
          </div>
        )}

        {/* Oracle Controls */}
        {isOracle && isActive && isPredictionEnded && !isAdmin && (
          <div className="border-t border-gray-200 dark:border-navy-700">
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <select 
                  value={outcome}
                  onChange={(e) => setOutcome(parseInt(e.target.value))}
                  className="flex-1 py-2 px-3 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-lg text-sm"
                >
                  <option value={0}>Yes</option>
                  <option value={1}>No</option>
                </select>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFinalize(false)}
                  className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center"
                >
                  <IoCheckmark className="mr-1" /> Finalize as Oracle
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Reward Distribution Section */}
        {isAdmin && isFinalized && (
          <div className="border-t border-gray-200 dark:border-navy-700">
            <div className="p-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDistributeRewards}
                className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center"
              >
                <IoCash className="mr-1" /> Distribute Rewards
              </motion.button>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {(isFinalized || isCancelled) && (
          <div className="border-t border-gray-200 dark:border-navy-700">
            <div className={`p-4 ${
              isFinalized ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                {isFinalized ? (
                  <>
                    <IoCheckmark className="text-green-500" size={20} />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Finalized: {predictionOutcome === 0 ? 'Yes' : 'No'} was correct
                    </span>
                  </>
                ) : (
                  <>
                    <IoClose className="text-red-500" size={20} />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      This prediction has been cancelled
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* AI Test Modal */}
      <AnimatePresence>
        {isTestModalOpen && testFinalizeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsTestModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-xl max-w-lg w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                    AI Resolution Test
                  </h3>
                  <button
                    onClick={() => setIsTestModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <IoClose size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Test Results */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Predicted Outcome
                      </div>
                      <div className={`text-lg font-bold ${
                        testFinalizeData.outcome === 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {testFinalizeData.outcome === 0 ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence
                      </div>
                      <div className="text-lg font-bold text-brand-500">
                        {(testFinalizeData.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      AI Reasoning
                    </div>
                    <p className="text-navy-700 dark:text-white">
                      {testFinalizeData.explanation}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsTestModalOpen(false)}
                      className="flex-1 py-2 px-4 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirmFinalize}
                      className="flex-1 py-2 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium"
                    >
                      Confirm Resolution
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PredictionCard;