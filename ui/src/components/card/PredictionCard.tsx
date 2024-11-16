import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoAdd, IoRemove, IoTimeOutline, IoWalletOutline, IoTrailSign, IoCheckmark, IoClose, IoCash, IoBulb } from 'react-icons/io5';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import axios from 'axios';

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
  const [shareAmount, setShareAmount] = useState(1);
  const [isYesSelected, setIsYesSelected] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOracle, setIsOracle] = useState(false);
  const [outcome, setOutcome] = useState<number>(0);
  const [isAIFinalizing, setIsAIFinalizing] = useState(false);
  const { data: prediction, isLoading } = usePredictionDetails(predictionId);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const [testFinalizeData, setTestFinalizeData] = useState<any>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);


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

  const [isPredictionEnded, setIsPredictionEnded] = useState(false);

  useEffect(() => {
    if (prediction) {
      const [, endTime] = prediction;
      setIsPredictionEnded(Date.now() / 1000 > Number(endTime));
    }
  }, [prediction]);

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
      
      console.log(`Prediction finalized ${useAI ? 'with AI' : 'by admin'}`);
    } catch (error) {
      console.error('Error finalizing prediction:', error);
    } finally {
      setIsAIFinalizing(false);
    }
  };

  useEffect(() => {
    setIsAdmin(!!hasAdminRole);
    setIsOracle(!!hasOracleRole);
  }, [hasAdminRole, hasOracleRole]);

  const handleIncrement = () => setShareAmount(prev => prev + 1);
  const handleDecrement = () => setShareAmount(prev => Math.max(1, prev - 1));

  const handlePredict = () => {
    onPredict(Number(predictionId), isYesSelected, shareAmount);
  };


  const handleTestFinalize = async () => {
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
      console.log('Prediction finalized based on test data');
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

  if (!prediction) {
    return null;
  }

  const [description, endTime, status, totalVotes, predictionOutcome, minVotes, maxVotes, predictionType, creator, creationTime, tags, optionsCount, totalBetAmount] = prediction;

  const yesVotes = totalVotes[0] ? Number(totalVotes[0]) : 0;
  const noVotes = totalVotes[1] ? Number(totalVotes[1]) : 0;
  const totalVotesCount = yesVotes + noVotes;

  const yesPercentage = calculatePercentage(BigInt(yesVotes), BigInt(totalVotesCount));
  const noPercentage = calculatePercentage(BigInt(noVotes), BigInt(totalVotesCount));

  const isActive = status === 0;
  const isFinalized = status === 1;
  const isCancelled = status === 2;
  const totalEth = Number(totalBetAmount) / 1e18; // Convert from Wei to ETH

  return (
    <div className="w-full h-full bg-white dark:bg-navy-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-200 dark:border-navy-700 flex flex-col">
      <div className="p-4 flex-grow">
        <h2 className=" font-bold text-navy-700 dark:text-white mb-2 line-clamp-4">
          {description}
        </h2>
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <IoTimeOutline className="mr-1" />
            <span>Ends: {formatTime(endTime)}</span>
          </div>
          <div className="flex items-center">
            <IoWalletOutline className="mr-1" />
            <span>{totalEth.toFixed(4)} ETH</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-grow">
            <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-2 overflow-hidden">
              <motion.div 
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-brand-500 dark:from-green-500 dark:to-brand-400"
                initial={{ width: 0 }}
                animate={{ width: `${yesPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-green-500 dark:text-green-400 w-12 text-right">{yesPercentage.toFixed(1)}%</span>
          <span className="text-sm font-medium text-red-500 dark:text-red-400 w-12 text-right">{noPercentage.toFixed(1)}%</span>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <IoTrailSign className="mr-1" />
          {tags.map((tag, index) => (
            <span key={index} className="mr-2 bg-gray-200 dark:bg-navy-700 px-2 py-1 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Min Votes: {Number(minVotes)}</p>
          <p>Creator: {creator.slice(0, 6)}...{creator.slice(-4)}</p>
          <p>Created: {formatTime(creationTime)}</p>
          <p>Status: {isActive ? 'Active' : isFinalized ? 'Finalized' : 'Cancelled'}</p>
          {isFinalized && <p>Outcome: {Number(predictionOutcome) === 0 ? 'Yes' : 'No'}</p>}
        </div>
      </div>

      {isActive && (
        <div className="p-4 bg-gray-50 dark:bg-navy-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 flex-grow">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsYesSelected(true)}
                className={`py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex-1 ${
                  isYesSelected 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Yes
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsYesSelected(false)}
                className={`py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex-1 ${
                  !isYesSelected 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                No
              </motion.button>
            </div>
          </div>
          <div className="flex items-center space-x-2 mb-3">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDecrement}
              className="bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-full p-1"
            >
              <IoRemove size={14} />
            </motion.button>
            <input 
              type="number" 
              value={shareAmount}
              onChange={(e) => setShareAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-center border dark:border-navy-600 rounded-lg py-1 bg-white dark:bg-navy-900 text-gray-700 dark:text-gray-300 text-sm"
            />
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleIncrement}
              className="bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-full p-1"
            >
              <IoAdd size={14} />
            </motion.button>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePredict}
            className="w-full bg-gradient-to-r from-brand-400 to-brand-500 dark:from-brand-500 dark:to-brand-400 text-white rounded-lg py-2 px-4 transition-all duration-200 text-sm font-medium"
          >
            Predict
          </motion.button>
        </div>
      )}
      {isActive && isPredictionEnded && (
                <div className="p-4 bg-gray-50 dark:bg-navy-900 border-t border-gray-200 dark:border-navy-700">
          <div className="flex flex-col space-y-2"></div>
            <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTestFinalize()}
            disabled={isAIFinalizing}
            className="w-full bg-purple-500 text-white rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center"
          >
           {isAIFinalizing ? (
             <>
               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
               Testing AI Finalization...
             </>
           ) : (
             <>
               <IoBulb className="mr-1" /> Test AI Finalization
             </>
           )}
         </motion.button>
         </div>
      )}
        {isTestModalOpen && testFinalizeData && (
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
              className="bg-white dark:bg-navy-800 p-6 rounded-lg max-w-md w-full shadow-xl"
            >
              <h3 className="text-lg font-bold mb-4 text-navy-700 dark:text-white">Test Finalization Result</h3>
              <p className="text-gray-700 dark:text-gray-300"><strong>Outcome:</strong> {testFinalizeData.outcome === 1 ? 'Yes' : 'No'}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Confidence:</strong> {(testFinalizeData.confidence * 100).toFixed(2)}%</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Explanation:</strong> {testFinalizeData.explanation}</p>
              <div className="mt-4 flex justify-end space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-navy-600 text-gray-800 dark:text-white rounded transition-colors duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmFinalize}
                  className="px-4 py-2 bg-blue-500 text-white rounded transition-colors duration-200"
                >
                  Confirm Finalization
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}



      {isAdmin && isActive && isPredictionEnded && (
        <div className="p-4 bg-gray-50 dark:bg-navy-900 border-t border-gray-200 dark:border-navy-700">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <select 
                value={outcome}
                onChange={(e) => setOutcome(parseInt(e.target.value))}
                className="flex-grow p-2 border rounded dark:bg-navy-700 dark:border-navy-600"
              >
                <option value={0}>Yes</option>
                <option value={1}>No</option>
              </select>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFinalize(false)}
                className="bg-blue-500 text-white rounded-lg py-2 px-4 text-sm font-medium flex items-center"
              >
                <IoCheckmark className="mr-1" /> Admin Finalize
              </motion.button>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFinalize(true)}
              disabled={isAIFinalizing}
              className="w-full bg-purple-500 text-white rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center"
            >
              {isAIFinalizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Finalizing with AI...
                </>
              ) : (
                <>
                  <IoBulb className="mr-1" /> Finalize with AI
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}

      {(isAdmin || isOracle) && isActive && (
        <div className="p-4 bg-gray-50 dark:bg-navy-900 border-t border-gray-200 dark:border-navy-700">
          <div className="flex flex-col space-y-2">
            {isOracle && (
              <div className="flex items-center space-x-2 mb-2">
                <select 
                  value={outcome}
                  onChange={(e) => setOutcome(parseInt(e.target.value))}
                  className="flex-grow p-2 border rounded dark:bg-navy-700 dark:border-navy-600"
                >
                  <option value={0}>Yes</option>
                  <option value={1}>No</option>
                </select>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFinalize(false)}
                  className="bg-blue-500 text-white rounded-lg py-2 px-4 text-sm font-medium flex items-center"
                >
                  <IoCheckmark className="mr-1" /> Finalize
                </motion.button>
              </div>
            )}
            {isAdmin && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="bg-red-500 text-white rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center"
              >
                <IoClose className="mr-1" /> Cancel Prediction
              </motion.button>
            )}
          </div>
        </div>
      )}

      {isAdmin && isFinalized && (
        <div className="p-4 bg-gray-50 dark:bg-navy-900 border-t border-gray-200 dark:border-navy-700">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDistributeRewards}
            className="w-full bg-green-500 text-white rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center"
          >
            <IoCash className="mr-1" /> Distribute Rewards
          </motion.button>
        </div>
      )}

      {(isFinalized || isCancelled) && !isAdmin && (
        <div className="p-4 bg-gray-50 dark:bg-navy-900 border-t border-gray-200 dark:border-navy-700">
          <div className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {isFinalized ? 'This prediction has been finalized.' : 'This prediction has been cancelled.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionCard;