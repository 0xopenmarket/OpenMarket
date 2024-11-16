'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoAdd, 
  IoClose, 
  IoBulb, 
  IoWater, 
  IoChevronBack, 
  IoChevronForward, 
  IoInformationCircle,
  IoTrendingUp,
  IoTime,
  IoWallet,
  IoStatsChart
} from 'react-icons/io5';
import PredictionCard from 'components/card/PredictionCard';
import { abi } from '../../../abi';
import { parseEther, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PvPPredictionCard from 'components/card/PvPCard';

// Contract Constants
const contractAddress = 
'0x7ef2A5BBAa51FdCb732b1b30B8134FF23A303b3b';
const PREDICTOR_ROLE = '0xfe9eaad5f5acc86dfc672d62b2c2acc0fccbdc369951a11924b882e2c44ed506';

// Read Contract Hook
const usePredictionDetails = (id) => {
  return useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getPredictionDetails',
    args: [id],
  });
};

// Custom hook for fetching market statistics
const useMarketStats = (predictionId) => {
  const { data: details } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getPredictionDetails',
    args: [predictionId],
  });

  const [stats, setStats] = useState({
    totalVolume: BigInt(0),
    participants: 0,
    yesPercentage: 0,
    noPercentage: 0,
    endTime: 0,
    status: 'Active'
  });

  useEffect(() => {
    if (details) {
      const [description, startTime, endTime, minVotes, maxVotes, totalVotes, status] = details;
      setStats({
        totalVolume: totalVotes,
        participants: Number(maxVotes),
        yesPercentage: 65, // Example value - replace with actual calculation
        noPercentage: 35, // Example value - replace with actual calculation
        endTime: Number(endTime),
        status: status === 0 ? 'Active' : 'Completed'
      });
    }
  }, [details]);

  return stats;
};

const Dashboard = () => {
  // State Management
  const [predictionIds, setPredictionIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratePopupOpen, setIsGeneratePopupOpen] = useState(false);
  const [isPredictorRole, setIsPredictorRole] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedPredictions, setGeneratedPredictions] = useState([]);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [totalPlatformVolume, setTotalPlatformVolume] = useState(BigInt(0));

  // Mock price history data - replace with real data
  const priceHistory = [
    { time: '1h', yes: 65, no: 35 },
    { time: '2h', yes: 58, no: 42 },
    { time: '3h', yes: 70, no: 30 },
    { time: '4h', yes: 62, no: 38 },
    { time: '5h', yes: 75, no: 25 }
  ];

  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  const { data: predictionCount, refetch: refetchCount } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'predictionCounter',
  });

  const { data: hasPredictorRole } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'hasRole',
    args: [PREDICTOR_ROLE, address],
  });

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: undefined,
  });

  // Default new prediction state
  const [newPrediction, setNewPrediction] = useState({
    description: '',
    duration: '',
    minVotes: '',
    maxVotes: '',
    predictionType: '0',
    optionsCount: '2',
    tags: '',
  });

  // Selected prediction stats
  const selectedStats = useMarketStats(selectedPrediction);

  // Effects
  useEffect(() => {
    if (predictionCount) {
      const count = Number(predictionCount);
      setPredictionIds(Array.from({ length: count }, (_, i) => BigInt(i)));
    }
  }, [predictionCount]);

  useEffect(() => {
    if (hasPredictorRole !== undefined) {
      setIsPredictorRole(!!hasPredictorRole);
    }
  }, [hasPredictorRole]);

  useEffect(() => {
    if (isConfirmed) {
      refetchCount();
    }
  }, [isConfirmed, refetchCount]);

  // Handlers
  const handleRequestFunds = async () => {
    if (!isConnected || !address) {
      console.error('Wallet not connected');
      return;
    }

    try {
      const response = await axios.post('https://ai-predict-fcdw.onrender.com/request-eth', { address });
      console.log('Funds requested:', response.data);
    } catch (error) {
      console.error('Error requesting funds:', error);
    }
  };

  const handlePredict = async (id, isYes, amount) => {
    if (!isConnected || !address) {
      console.error('Wallet not connected');
      return;
    }

    try {
      await writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'placeVotes',
        args: [BigInt(id), isYes ? BigInt(0) : BigInt(1), BigInt(amount)],
        value: parseEther((amount * 0.001).toString()),
        chain: baseSepolia,
        account: address
      });
    } catch (error) {
      console.error('Error making prediction:', error);
    }
  };

  const handleCreatePrediction = async () => {
    if (!isConnected || !address) {
      console.error('Wallet not connected');
      return;
    }

    try {
      await writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'createPrediction',
        args: [
          newPrediction.description,
          BigInt(newPrediction.duration),
          BigInt(newPrediction.minVotes),
          BigInt(newPrediction.maxVotes),
          parseInt(newPrediction.predictionType),
          BigInt(newPrediction.optionsCount),
          newPrediction.tags.split(',').map(tag => tag.trim())
        ],
        chain: baseSepolia,
        account: address
      });
      setIsModalOpen(false);
      resetNewPrediction();
    } catch (error) {
      console.error('Error creating prediction:', error);
    }
  };

  const handleGeneratePredictions = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post('https://ai-predict-fcdw.onrender.com/test/generate-predictions', { topic });
      setGeneratedPredictions(response.data.predictions);
      setIsGeneratePopupOpen(true);
    } catch (error) {
      console.error('Error generating predictions:', error);
    }
    setIsGenerating(false);
  };

  const handleSelectPrediction = (prediction) => {
    setNewPrediction({
      description: prediction.description,
      duration: prediction.duration.toString(),
      minVotes: prediction.minVotes.toString(),
      maxVotes: prediction.maxVotes.toString(),
      predictionType: prediction.predictionType.toString(),
      optionsCount: prediction.optionsCount.toString(),
      tags: prediction.tags.join(', '),
    });
    setIsGeneratePopupOpen(false);
    setIsModalOpen(true);
  };

  const resetNewPrediction = () => {
    setNewPrediction({
      description: '',
      duration: '',
      minVotes: '',
      maxVotes: '',
      predictionType: '0',
      optionsCount: '2',
      tags: '',
    });
  };

  // Components
  const PopularPredictionsCarousel = () => {
    const popularPredictions = predictionIds.slice(-5);
    
    return (
      <div className="relative bg-white dark:bg-navy-800 rounded-xl p-6 mb-8 shadow-lg">
        <h2 className="text-xl font-bold text-navy-700 dark:text-white mb-4">Popular Predictions</h2>
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-300" 
               style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
            {popularPredictions.map((id) => {
              const stats = useMarketStats(id);
              return (
                <div key={Number(id)} className="w-full flex-shrink-0 px-2">
                  <div 
                    className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPrediction(id)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-navy-700 dark:text-white">
                        Prediction #{Number(id)}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Volume: {formatEther(stats.totalVolume)} ETH
                      </div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <div className="text-green-500">Yes: {stats.yesPercentage}%</div>
                      <div className="text-red-500">No: {stats.noPercentage}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Carousel Controls */}
        <CarouselControls 
          currentIndex={carouselIndex}
          maxIndex={popularPredictions.length - 1}
          onPrevious={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
          onNext={() => setCarouselIndex(Math.min(popularPredictions.length - 1, carouselIndex + 1))}
        />
      </div>
    );
  };

  const CarouselControls = ({ currentIndex, maxIndex, onPrevious, onNext }) => (
    <>
      <button
        onClick={onPrevious}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-navy-700 rounded-full p-2 shadow-lg disabled:opacity-50"
        disabled={currentIndex === 0}
      >
        <IoChevronBack className="w-6 h-6 text-navy-700 dark:text-white" />
      </button>
      <button
        onClick={onNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-navy-700 rounded-full p-2 shadow-lg disabled:opacity-50"
        disabled={currentIndex === maxIndex}
      >
        <IoChevronForward className="w-6 h-6 text-navy-700 dark:text-white" />
      </button>
    </>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 mb-6">
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
          Prediction Dashboard
        </h1>
        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRequestFunds}
            className="bg-blue-400 text-white rounded-lg py-2 px-3 text-sm flex items-center justify-center flex-1 sm:flex-none"
          >
            <IoWater className="mr-1" /> Request Funds
          </motion.button>
          {isPredictorRole && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-500 text-white rounded-lg py-2 px-3 text-sm flex items-center justify-center flex-1 sm:flex-none"
              >
                <IoAdd className="mr-1" /> Create
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsGeneratePopupOpen(true)}
                className="bg-purple-500 text-white rounded-lg py-2 px-3 text-sm flex items-center justify-center flex-1 sm:flex-none"
              >
                <IoBulb className="mr-1" /> Generate
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Popular Predictions Carousel */}

<PvPPredictionCard />
<br/>
      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictionIds.map((id) => (
          <PredictionCard
            key={Number(id)}
            predictionId={id}
            usePredictionDetails={usePredictionDetails}
            onPredict={handlePredict}
            contractAddress={contractAddress}
            abi={abi}
            onInfoClick={() => {
              setSelectedPrediction(id);
              setIsInfoModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* Create Prediction Modal */}
      <CreatePredictionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newPrediction={newPrediction}
        setNewPrediction={setNewPrediction}
        handleCreate={handleCreatePrediction}
      />

      {/* Generate Predictions Modal */}
     {/* Generate Predictions Modal */}
     <GeneratePredictionsModal
        isOpen={isGeneratePopupOpen}
        onClose={() => setIsGeneratePopupOpen(false)}
        topic={topic}
        setTopic={setTopic}
        isGenerating={isGenerating}
        handleGenerate={handleGeneratePredictions}
        generatedPredictions={generatedPredictions}
        onSelectPrediction={handleSelectPrediction}
      />

      {/* Prediction Info Modal */}
      <PredictionInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        predictionId={selectedPrediction}
        stats={selectedStats}
        priceHistory={priceHistory}
        onPredict={handlePredict}
      />
    </div>
  );
};

// Modal Components
const CreatePredictionModal = ({ isOpen, onClose, newPrediction, setNewPrediction, handleCreate }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-navy-800 rounded-xl p-6 w-full max-w-lg mx-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-navy-700 dark:text-white">Create New Prediction</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <IoClose size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              value={newPrediction.description}
              onChange={(e) => setNewPrediction({...newPrediction, description: e.target.value})}
              placeholder="What would you like to predict?"
              className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600 min-h-[100px]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                value={newPrediction.duration}
                onChange={(e) => setNewPrediction({...newPrediction, duration: e.target.value})}
                placeholder="Duration (seconds)"
                className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600"
              />

              <input
                type="number"
                value={newPrediction.minVotes}
                onChange={(e) => setNewPrediction({...newPrediction, minVotes: e.target.value})}
                placeholder="Minimum Votes"
                className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600"
              />

              <input
                type="number"
                value={newPrediction.maxVotes}
                onChange={(e) => setNewPrediction({...newPrediction, maxVotes: e.target.value})}
                placeholder="Maximum Votes"
                className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600"
              />

              <select
                value={newPrediction.predictionType}
                onChange={(e) => setNewPrediction({...newPrediction, predictionType: e.target.value})}
                className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600"
              >
                <option value="0">Binary (Yes/No)</option>
                <option value="1">Multiple Choice</option>
                <option value="2">Range</option>
              </select>
            </div>

            <input
              type="text"
              value={newPrediction.tags}
              onChange={(e) => setNewPrediction({...newPrediction, tags: e.target.value})}
              placeholder="Tags (comma-separated)"
              className="w-full p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600"
            />

            <button
              onClick={handleCreate}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Prediction
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const GeneratePredictionsModal = ({ isOpen, onClose, topic, setTopic, isGenerating, handleGenerate, generatedPredictions, onSelectPrediction }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-navy-800 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-navy-700 dark:text-white">Generate AI Predictions</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <IoClose size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g., Crypto, Sports, Technology)"
                className="flex-1 p-3 border rounded-lg dark:bg-navy-700 dark:text-white dark:border-navy-600"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>

            <div className="space-y-2">
              {generatedPredictions.map((prediction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-navy-900 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelectPrediction(prediction)}
                >
                  <h3 className="font-semibold text-navy-700 dark:text-white mb-2">
                    {prediction.description}
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Duration: {prediction.duration} seconds
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Tags: {prediction.tags.join(', ')}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const PredictionInfoModal = ({ isOpen, onClose, predictionId, stats, priceHistory, onPredict }) => (
  <AnimatePresence>
    {isOpen && predictionId && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-navy-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
                Prediction #{Number(predictionId)}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Status: {stats.status}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <IoClose size={24} />
            </button>
          </div>

          {/* Price Chart */}
          <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Line type="monotone" dataKey="yes" stroke="#10B981" strokeWidth={2} name="Yes Votes" />
                <Line type="monotone" dataKey="no" stroke="#EF4444" strokeWidth={2} name="No Votes" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Volume</div>
              <div className="text-xl font-bold text-navy-700 dark:text-white">
                {formatEther(stats.totalVolume)} ETH
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
              <div className="text-xl font-bold text-navy-700 dark:text-white">
                {stats.participants}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">End Time</div>
              <div className="text-xl font-bold text-navy-700 dark:text-white">
                {new Date(stats.endTime * 1000).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Prediction Distribution */}
          <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-4">Current Distribution</h3>
            <div className="relative h-4 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden mb-2">
              <div
                className="absolute left-0 top-0 h-full bg-green-500"
                style={{ width: `${stats.yesPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-green-500">Yes: {stats.yesPercentage}%</div>
              <div className="text-red-500">No: {stats.noPercentage}%</div>
            </div>
          </div>

          {/* Prediction Interface */}
          {stats.status === 'Active' && (
            <div className="bg-gray-50 dark:bg-navy-900 rounded-xl p-6">
              <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-4">Make Prediction</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => onPredict(predictionId, true, 0.001)}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => onPredict(predictionId, false, 0.001)}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                >
                  No
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Dashboard;