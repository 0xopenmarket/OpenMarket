'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAdd, IoClose, IoBulb, IoWater, IoSearch, IoFilter, IoTrendingUp, IoGrid, IoList, IoStatsChart, IoWallet, IoTime, IoInformationCircle } from 'react-icons/io5';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = ({ contractAddress, abi }) => {
  // State management
  const [marketIds, setMarketIds] = useState([]);
  const [filteredMarketIds, setFilteredMarketIds] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for price history - replace with real data
  const priceHistory = [
    { time: '1h', yes: 65, no: 35 },
    { time: '2h', yes: 58, no: 42 },
    { time: '3h', yes: 70, no: 30 },
    { time: '4h', yes: 62, no: 38 },
    { time: '5h', yes: 75, no: 25 }
  ];

  // Categories
  const categories = [
    { id: 'all', name: 'All Markets', icon: IoGrid },
    { id: 'crypto', name: 'Crypto', icon: IoWallet },
    { id: 'sports', name: 'Sports', icon: IoTrendingUp },
    { id: 'politics', name: 'Politics', icon: IoTime },
    { id: 'tech', name: 'Technology', icon: IoBulb }
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'liquidity', label: 'Highest Liquidity' },
    { value: 'volume', label: 'Highest Volume' },
    { value: 'participants', label: 'Most Participants' }
  ];

  // Wagmi hooks
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  // Contract reads
  const { data: marketCount } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getMarketIds',
  });

  // Popular markets carousel
  const PopularMarketsCarousel = () => (
    <div className="relative w-full mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Popular Markets</h2>
      <div className="overflow-x-auto flex space-x-4 pb-4">
        {filteredMarketIds.slice(0, 5).map((marketId) => (
          <motion.div
            key={marketId}
            className="flex-none w-80 bg-white dark:bg-navy-800 rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.02 }}
            onClick={() => handleMarketSelect(marketId)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                <IoTrendingUp className="w-6 h-6 text-brand-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">Market #{marketId}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatLiquidity(marketId)} ETH Pool
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Market details modal
  const MarketDetailsModal = () => (
    <AnimatePresence>
      {isDetailsModalOpen && selectedMarket && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={() => setIsDetailsModalOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="inline-block w-full max-w-4xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-navy-800 rounded-2xl shadow-xl"
            >
              {/* Market Details Content */}
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Market Details #{selectedMarket}
                  </h3>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <IoClose size={24} />
                  </button>
                </div>

                {/* Price Chart */}
                <div className="h-64 bg-white dark:bg-navy-900 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory}>
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip />
                      <Line type="monotone" dataKey="yes" stroke="#10B981" strokeWidth={2} />
                      <Line type="monotone" dataKey="no" stroke="#EF4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Market Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Volume</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatEther(BigInt(0))} ETH
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">0</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Resolution</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">AI + zkTLS</div>
                  </div>
                </div>

                {/* Trading Interface */}
                <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Place Prediction
                  </h4>
                  <div className="flex gap-4">
                    <button className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                      Yes (65%)
                    </button>
                    <button className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
                      No (35%)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Effects
  useEffect(() => {
    if (marketCount !== undefined) {
      const count = Number(marketCount);
      const ids = Array.from({ length: count }, (_, i) => BigInt(i));
      setMarketIds(ids);
      setFilteredMarketIds(ids);
      setIsLoading(false);
    }
  }, [marketCount]);

  useEffect(() => {
    filterMarkets();
  }, [searchTerm, selectedCategory, sortBy, marketIds]);

  // Handlers
  const handleMarketSelect = (marketId) => {
    setSelectedMarket(marketId);
    setIsDetailsModalOpen(true);
  };

  const filterMarkets = async () => {
    let filtered = [...marketIds];

    if (searchTerm) {
      filtered = filtered.filter(id => String(id).includes(searchTerm));
    }

    if (selectedCategory !== 'all') {
      // Add category filtering logic
    }

    // Add sorting logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b) - Number(a);
        case 'oldest':
          return Number(a) - Number(b);
        default:
          return 0;
      }
    });

    setFilteredMarketIds(filtered);
  };

  const formatLiquidity = (marketId) => {
    // Add liquidity formatting logic
    return "0.00";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900">
      {/* Header */}
      <div className="bg-white dark:bg-navy-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                OpenMarket
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                AI & zkTLS Powered Prediction Markets
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2"
              >
                <IoWater className="w-5 h-5" />
                <span>Get Test Tokens</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2"
              >
                <IoAdd className="w-5 h-5" />
                <span>Create Market</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Popular Markets */}
        <PopularMarketsCarousel />

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300"
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
              className="p-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300"
            >
              {viewMode === 'grid' ? <IoGrid size={20} /> : <IoList size={20} />}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-brand-500 text-white' : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-navy-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </motion.button>
              );
            })}
          </div>
  
          {/* Markets Grid/List */}
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
                <motion.div
                  key={id.toString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Market #{id.toString()}
                      </h3>
                      <button
                        onClick={() => handleMarketSelect(id)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        <IoInformationCircle size={24} />
                      </button>
                    </div>
  
                    {/* Market Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Time Left
                        </div>
                        <div className="text-gray-900 dark:text-white font-medium">
                          24h 30m
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Pool Size
                        </div>
                        <div className="text-gray-900 dark:text-white font-medium">
                          {formatLiquidity(id)} ETH
                        </div>
                      </div>
                    </div>
  
                    {/* Prediction Controls */}
                    <div className="space-y-4">
                      <div className="relative h-2 bg-gray-200 dark:bg-navy-900 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full bg-green-500" style={{ width: '65%' }} />
                        <div className="absolute right-0 top-0 h-full bg-red-500" style={{ width: '35%' }} />
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-green-500">Yes (65%)</span>
                        <span className="text-red-500">No (35%)</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                          Yes
                        </button>
                        <button className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
  
          {/* Market Details Modal */}
          <MarketDetailsModal />
  
          {/* Create Market Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative bg-white dark:bg-navy-800 rounded-xl max-w-lg w-full m-4 p-6 shadow-xl"
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
                        placeholder="What do you want to predict?"
                        className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-900 dark:text-white"
                        rows={3}
                      />
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-900 dark:text-white">
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Initial Liquidity (ETH)
                      </label>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
  
                    <button className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors">
                      Create Market
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
  
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
      </div>
    );
  };
  
  export default Dashboard;