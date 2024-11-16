'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAdd, IoClose, IoBulb, IoWater, IoSearch, IoFilter, IoTrendingUp, IoGrid, IoList, IoStatsChart, IoWallet, IoTime, IoTrendingDown, IoSwapHorizontal } from 'react-icons/io5';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import axios from 'axios';
import PredictionCard from 'components/card/PredictionCard';
import toast from 'react-hot-toast';
import {abi} from "../../../abi";
// Contract details
const contractAddress = '0x01d2013AAE21C3708C36C71F4eC4554bC5F003Ec';
const CREATOR_ROLE = '0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f';
const ADMIN_ROLE = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775';

const categories = [
  { id: 'all', name: 'All Markets', icon: IoGrid },
  { id: 'crypto', name: 'Crypto', icon: IoWallet },
  { id: 'sports', name: 'Sports', icon: IoTrendingUp },
  { id: 'politics', name: 'Politics', icon: IoTime },
  { id: 'entertainment', name: 'Entertainment', icon: IoBulb },
  { id: 'technology', name: 'Technology', icon: IoStatsChart }
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'liquidity', label: 'Highest Liquidity' },
  { value: 'volume', label: 'Highest Volume' },
  { value: 'participants', label: 'Most Participants' }
];

// Prediction details hook

export const useMarketDetails = (id: bigint, contractAddress: string, abi: any) => {
  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: abi,
    functionName: 'getMarketDetails',
    args: [id],
  });
};


const Dashboard = () => {
  // State
  const [marketIds, setMarketIds] = useState<bigint[]>([]);
  const [filteredMarketIds, setFilteredMarketIds] = useState<bigint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratePopupOpen, setIsGeneratePopupOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedMarkets, setGeneratedMarkets] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMarkets: 0,
    totalLiquidity: 0,
    activeMarkets: 0,
    totalVolume: 0
  });

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  // Contract reads
  const { data: marketCount } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getMarketIds',
  });

  const { data: hasCreatorRole } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'hasRole',
    args: [CREATOR_ROLE, address],
  });

  const { data: hasAdminRole } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address],
  });

  const { data: isVerifiedCreator } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'verifiedCreators',
    args: [address],
  });

  // State for new market creation
  const [newMarket, setNewMarket] = useState({
    description: '',
    category: '',
    duration: '7',
    imageHash: '',
    tags: '',
  });

  // Effects
  useEffect(() => {
    if (marketCount !== undefined) {
      const count = Number(marketCount);
      const ids = Array.from({ length: count }, (_, i) => BigInt(i));
      setMarketIds(ids);
      setIsLoading(false);
      setStats(prev => ({ ...prev, totalMarkets: count }));
    }
  }, [marketCount]);

  useEffect(() => {
    const hasPermission = Boolean(hasCreatorRole || hasAdminRole || isVerifiedCreator);
    setHasPermission(hasPermission);
  }, [hasCreatorRole, hasAdminRole, isVerifiedCreator]);

  useEffect(() => {
    calculateStats();
  }, [marketIds]);

  useEffect(() => {
    filterMarkets();
  }, [searchTerm, selectedCategory, sortBy, marketIds]);

  const calculateStats = async () => {
    let totalLiq = 0;
    let totalVol = 0;
    let active = 0;

    for (const id of marketIds) {
      const details = await useMarketDetails(id,contractAddress,abi);
      if (details) {
        const [,, endTime, status, liquidity, volume] = details;
        totalLiq += Number(formatEther(liquidity));
        totalVol += Number(formatEther(volume));
        if (status === 0 && Number(endTime) * 1000 > Date.now()) {
          active++;
        }
      }
    }

    setStats({
      totalMarkets: marketIds.length,
      totalLiquidity: totalLiq,
      activeMarkets: active,
      totalVolume: totalVol
    });
  };

  const filterMarkets = async () => {
    let filtered = [...marketIds];

    // Apply search filter
    if (searchTerm) {
      filtered = await Promise.all(filtered.filter(async (id) => {
        const details = await useMarketDetails(id, contractAddress, abi);
        if (!details) return false;
        const [description, category] = details;
        return description.toLowerCase().includes(searchTerm.toLowerCase()) ||
               category.toLowerCase().includes(searchTerm.toLowerCase());
      }));
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = await Promise.all(filtered.filter(async (id) => {
        const details = await useMarketDetails(id, contractAddress, abi);
        if (!details) return false;
        const [, category] = details;
        return category.toLowerCase() === selectedCategory.toLowerCase();
      }));
    }

    // Apply sorting
    filtered.sort(async (a, b) => {
      const detailsA = await useMarketDetails(a, contractAddress, abi);
      const detailsB = await useMarketDetails(b, contractAddress, abi);
      
      if (!detailsA || !detailsB) return 0;

      switch (sortBy) {
        case 'newest':
          return Number(b) - Number(a);
        case 'oldest':
          return Number(a) - Number(b);
        case 'liquidity':
          return Number(detailsB[4]) - Number(detailsA[4]);
        case 'volume':
          return Number(detailsB[5]) - Number(detailsA[5]);
        case 'participants':
          return Number(detailsB[6]) - Number(detailsA[6]);
        default:
          return 0;
      }
    });

    setFilteredMarketIds(filtered);
  };

  // Handlers
  const handleCreateMarket = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      const durationInSeconds = BigInt(Number(newMarket.duration) * 24 * 60 * 60);
      const tags = newMarket.tags.split(',').map(tag => tag.trim());

      writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'createMarket',
        args: [
          newMarket.description,
          newMarket.category,
          durationInSeconds,
          newMarket.imageHash,
          tags,
        ],
        value: parseEther('0.001'),
        chain: baseSepolia,
        account: address,
      });

      toast.success('Market created successfully');
      setIsModalOpen(false);
      setNewMarket({
        description: '',
        category: '',
        duration: '7',
        imageHash: '',
        tags: '',
      });
    } catch (error) {
      console.error('Error creating market:', error);
      toast.error('Failed to create market');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePosition = async (marketId: number, isYes: boolean, amount: number) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'takePosition',
        args: [BigInt(marketId), isYes, BigInt(0)],
        value: parseEther(amount.toString()),
        chain: baseSepolia,
        account: address,
      });
      
      toast.success('Position taken successfully');
    } catch (error) {
      console.error('Error taking position:', error);
      toast.error('Failed to take position');
    }
  };

  const handleRequestFunds = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const response = await axios.post('https://ai-predict-fcdw.onrender.com/request-eth', { address });
      toast.success('Funds requested successfully');
    } catch (error) {
      console.error('Error requesting funds:', error);
      toast.error('Failed to request funds');
    }
  };

  const handleGenerateMarkets = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post('https://ai-predict-fcdw.onrender.com/test/generate-predictions', { topic });
      setGeneratedMarkets(response.data.predictions);
      setIsGeneratePopupOpen(true);
    } catch (error) {
      console.error('Error generating markets:', error);
      toast.error('Failed to generate markets');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900">
      {/* Header */}
      <div className="bg-white dark:bg-navy-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Prediction Markets
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Explore and participate in decentralized predictions
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRequestFunds}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <IoWater className="w-5 h-5" />
                <span>Request Funds</span>
              </motion.button>

              {hasPermission && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <IoAdd className="w-5 h-5" />
                    <span>Create Market</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsGeneratePopupOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <IoBulb className="w-5 h-5" />
                    <span>Generate</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <IoStatsChart className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Markets</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.totalMarkets.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <IoWallet className="w-6 h-6 text-green-500 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Liquidity</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.totalLiquidity.toFixed(2)} ETH
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <IoTrendingUp className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Markets</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.activeMarkets.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <IoSwapHorizontal className="w-6 h-6 text-orange-500 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Volume</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.totalVolume.toFixed(2)} ETH
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
            >
              {viewMode === 'grid' ? <IoGrid size={20} /> : <IoList size={20} />}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-navy-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Markets Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="animate-pulse bg-white dark:bg-navy-800 rounded-xl h-96"
              />
            ))}
          </div>
        ) : filteredMarketIds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No markets found matching your criteria
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredMarketIds.map((id) => (
                   <PredictionCard
      key={id.toString()}
      predictionId={id}
      usePredictionDetails={(id) => useMarketDetails(id, contractAddress, abi)}
      contractAddress={contractAddress}
      abi={abi}
    />
            ))}
          </div>
        )}
      </div>

      {/* Create Market Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-xl p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create New Market
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <IoClose size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newMarket.description}
                    onChange={(e) => setNewMarket({...newMarket, description: e.target.value})}
                    placeholder="Enter market description..."
                    rows={3}
                    className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newMarket.category}
                    onChange={(e) => setNewMarket({...newMarket, category: e.target.value})}
                    className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newMarket.duration}
                    onChange={(e) => setNewMarket({...newMarket, duration: e.target.value})}
                    min="1"
                    max="365"
                    className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={newMarket.imageHash}
                    onChange={(e) => setNewMarket({...newMarket, imageHash: e.target.value})}
                    placeholder="Enter image URL or IPFS hash..."
                    className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={newMarket.tags}
                    onChange={(e) => setNewMarket({...newMarket, tags: e.target.value})}
                    placeholder="Enter tags separated by commas..."
                    className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateMarket}
                  disabled={isLoading}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <IoAdd className="w-5 h-5" />
                      <span>Create Market</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Generate Markets Modal */}
        {isGeneratePopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Generate Markets
                </h2>
                <button
                  onClick={() => setIsGeneratePopupOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <IoClose size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic or Theme
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Cryptocurrency, Sports Events, Technology..."
                      className="w-full p-3 pl-10 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600 focus:ring-2 focus:ring-brand-500"
                    />
                    <IoBulb className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateMarkets}
                  disabled={isGenerating}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <IoBulb className="w-5 h-5" />
                      <span>Generate Markets</span>
                    </>
                  )}
                </motion.button>

                {/* Generated Markets */}
                <div className="space-y-4 mt-6">
                  {generatedMarkets.map((market, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 dark:bg-navy-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                      onClick={() => handleSelectMarket(market)}
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {market.description}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {market.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {market.category && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Category: {market.category}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`p-4 rounded-lg shadow-lg ${
                toast.type === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
{/*
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 left-4 bg-black/75 text-white p-4 rounded-lg text-xs space-y-1 backdrop-blur-sm"
        >
          <div>Contract: {contractAddress}</div>
          <div>Markets: {marketIds.length}</div>
          <div>Filtered: {filteredMarketIds.length}</div>
          <div>Permission: {hasPermission ? 'Yes' : 'No'}</div>
          <div className="flex gap-2">
            <div>Creator: {hasCreatorRole ? '✓' : '×'}</div>
            <div>Admin: {hasAdminRole ? '✓' : '×'}</div>
            <div>Verified: {isVerifiedCreator ? '✓' : '×'}</div>
          </div>
        </motion.div>
      )}
        */}

      {/* Quick Actions Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-4 right-4 w-12 h-12 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center"
        onClick={() => setIsModalOpen(true)}
      >
        <IoAdd size={24} />
      </motion.button>
    </div>
  );
};

export default Dashboard;
