'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAdd, IoClose, IoDownload, IoLink, IoRefresh, IoBulb,IoWater } from 'react-icons/io5';
import PredictionCard from 'components/card/PredictionCard';
import { abi } from '../../../abi';
import { parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';

const contractAddress = '0x779d7026FA2100C97AE5E2e8381f6506D5Bf31D4';
const PREDICTOR_ROLE = '0xfe9eaad5f5acc86dfc672d62b2c2acc0fccbdc369951a11924b882e2c44ed506';

const usePredictionDetails = (id) => {
  return useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getPredictionDetails',
    args: [id],
  });
};

const Dashboard = () => {
  const [predictionIds, setPredictionIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratePopupOpen, setIsGeneratePopupOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const [isPredictorRole, setIsPredictorRole] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedPredictions, setGeneratedPredictions] = useState([]);


  const PRICE_FEED_IDS = {
    'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'BNB/USD': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
    'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
};


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

  const { writeContract } = useWriteContract();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: undefined,
  });


  const handleRequestFunds = async () => {
    if (!isConnected || !address) {
      console.error('Wallet not connected');
      return;
    }

    try {
      const response = await axios.post('https://ai-predict-fcdw.onrender.com/request-eth', { address });
      console.log('Funds requested:', response.data);
      // You might want to show a success message to the user here
    } catch (error) {
      console.error('Error requesting funds:', error);
      // You might want to show an error message to the user here
    }
  };


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

  useEffect(() => {
    if (isConfirmed) {
      refetchCount();
    }
  }, [isConfirmed, refetchCount]);

  const [newPrediction, setNewPrediction] = useState({
    description: '',
    duration: '',
    minVotes: '',
    maxVotes: '',
    predictionType: '0',
    optionsCount: '2',
    tags: '',
  });

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
      setNewPrediction({
        description: '',
        duration: '',
        minVotes: '',
        maxVotes: '',
        predictionType: '0',
        optionsCount: '2',
        tags: '',
      });
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

  const handleFinalizeWithAI = async (predictionId) => {
    try {
      const response = await axios.post(`https://ai-predict-fcdw.onrender.com/finalize-prediction/${predictionId}`);
      console.log('Prediction finalized with AI:', response.data);
      // You might want to update the UI or refetch the predictions here
    } catch (error) {
      console.error('Error finalizing prediction with AI:', error);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">

      <div className="flex flex-col space-y-4 mb-6">
  <h1 className="text-2xl font-bold text-navy-700 dark:text-white">Prediction Dashboard</h1>
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictionIds.map((id) => (
          <PredictionCard
            key={Number(id)}
            predictionId={id}
            usePredictionDetails={usePredictionDetails}
            onPredict={handlePredict}
            contractAddress={contractAddress}
            abi={abi}
          />
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-lg p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy-700 dark:text-white">Create New Prediction</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <IoClose size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newPrediction.description}
                  onChange={(e) => setNewPrediction({...newPrediction, description: e.target.value})}
                  placeholder="Description"
                  className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                />
                <input
                  type="number"
                  value={newPrediction.duration}
                  onChange={(e) => setNewPrediction({...newPrediction, duration: e.target.value})}
                  placeholder="Duration (seconds)"
                  className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                />
                <input
                  type="number"
                  value={newPrediction.minVotes}
                  onChange={(e) => setNewPrediction({...newPrediction, minVotes: e.target.value})}
                  placeholder="Min Votes"
                  className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                />
                <input
                  type="number"
                  value={newPrediction.maxVotes}
                  onChange={(e) => setNewPrediction({...newPrediction, maxVotes: e.target.value})}
                  placeholder="Max Votes"
                  className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                />
                <select
                  value={newPrediction.predictionType}
                  onChange={(e) => setNewPrediction({...newPrediction, predictionType: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                >
                  <option value="0">Binary</option>
                  <option value="1">Multiple Choice</option>
                  <option value="2">Range</option>
                  
                </select>
                <input
                  type="number"
                  value={newPrediction.optionsCount}
                  onChange={(e) => setNewPrediction({...newPrediction, optionsCount: e.target.value})}
                  placeholder="Options Count"
                  className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                />
                <input
                  type="text"
                  value={newPrediction.tags}
                  onChange={(e) => setNewPrediction({...newPrediction, tags: e.target.value})}
                  placeholder="Tags (comma-separated)"
                  className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                />
                <button
                  onClick={handleCreatePrediction}
                  className="w-full bg-brand-500 text-white rounded-lg py-2 px-4 hover:bg-brand-600 transition-colors"
                >
                  Create Prediction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isGeneratePopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-navy-800 rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy-700 dark:text-white">Generate AI Predictions</h2>
                <button onClick={() => setIsGeneratePopupOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <IoClose size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a topic for predictions"
                  className="w-full p-2 border rounded dark:bg-navy-700 dark:text-white dark:border-navy-600"
                />
                <button
                  onClick={handleGeneratePredictions}
                  disabled={isGenerating}
                  className="w-full bg-purple-500 text-white rounded-lg py-2 px-4 hover:bg-purple-600 transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate Predictions'}
                </button>
                {generatedPredictions.map((prediction, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-100 dark:bg-navy-700 p-4 rounded-lg cursor-pointer"
                    onClick={() => handleSelectPrediction(prediction)}
                  >
                    <h3 className="font-bold text-navy-700 dark:text-white mb-2">{prediction.description}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration: {prediction.duration} seconds</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tags: {prediction.tags.join(', ')}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;