'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Client } from '@xmtp/browser-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract, useWriteContract, useAccount, useSignMessage } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Activity,
  MessageCircle,
  TrendingUp,
  Users,
  Wallet,
  Send,
  Info,
  Clock,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Timer,
  DollarSign,
  Percent
} from 'lucide-react';
import { abi } from "../../../../abi";

const CONTRACT_ADDRESS = '0x7ef2A5BBAa51FdCb732b1b30B8134FF23A303b3b';

interface PredictionDetailsProps {
  prediction: any;
  selectedPosition: 'yes' | 'no';
  setSelectedPosition: (position: 'yes' | 'no') => void;
  predictionAmount: number;
  setPredictionAmount: (amount: number) => void;
  onPredict: () => void;
}

const Overview: React.FC<PredictionDetailsProps> = ({
  prediction,
  selectedPosition,
  setSelectedPosition,
  predictionAmount,
  setPredictionAmount,
  onPredict
}) => {
  const [description, endTime, status, totalVotes, predictionOutcome, minVotes, maxVotes, predictionType, creator, creationTime, tags, optionsCount, totalBetAmount] = prediction;

  const yesVotes = totalVotes[0] ? Number(totalVotes[0]) : 0;
  const noVotes = totalVotes[1] ? Number(totalVotes[1]) : 0;
  const totalVotesCount = yesVotes + noVotes;
  const totalEth = Number(totalBetAmount) / 1e18;

  const yesPercentage = totalVotesCount > 0 ? (yesVotes / totalVotesCount) * 100 : 50;
  const noPercentage = totalVotesCount > 0 ? (noVotes / totalVotesCount) * 100 : 50;

  const timeUntilEnd = endTime ? Number(endTime) * 1000 - Date.now() : 0;
  const daysLeft = Math.max(0, Math.floor(timeUntilEnd / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((timeUntilEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Time Left</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {daysLeft}d {hoursLeft}h
              </p>
            </div>
            <Timer className="h-6 w-6 text-brand-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Volume</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {totalEth.toFixed(4)} ETH
              </p>
            </div>
            <DollarSign className="h-6 w-6 text-brand-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {totalVotesCount}
              </p>
            </div>
            <Users className="h-6 w-6 text-brand-500" />
          </div>
        </div>
      </div>

      {/* Prediction Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Description Card */}
          <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-3">
              Description
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Vote Distribution */}
          <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-4">
              Vote Distribution
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-green-500 font-medium">Yes</span>
                  <span className="text-green-500 font-medium">{yesPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${yesPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-red-500 font-medium">No</span>
                  <span className="text-red-500 font-medium">{noPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${noPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Place Prediction Card */}
          <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-4">
              Place Your Prediction
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPosition('yes')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    selectedPosition === 'yes'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Yes
                </button>
                <button
                  onClick={() => setSelectedPosition('no')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    selectedPosition === 'no'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  No
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Amount (ETH)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={predictionAmount}
                    onChange={(e) => setPredictionAmount(Number(e.target.value))}
                    min="0.001"
                    step="0.001"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-transparent"
                  />
                  <button
                    onClick={onPredict}
                    className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Predict
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Min: {formatEther(minVotes)} ETH | Max: {formatEther(maxVotes)} ETH
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-4">
              Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created</span>
                <span className="text-navy-700 dark:text-white">
                  {new Date(Number(creationTime) * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Creator</span>
                <span className="text-navy-700 dark:text-white">
                  {`${creator.slice(0, 6)}...${creator.slice(-4)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`font-medium ${
                  status === 0 ? 'text-green-500' : 
                  status === 1 ? 'text-blue-500' : 'text-red-500'
                }`}>
                  {status === 0 ? 'Active' : 
                   status === 1 ? 'Finalized' : 'Cancelled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PredictionDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [isLoadingXMTP, setIsLoadingXMTP] = useState(false);
  const [predictionAmount, setPredictionAmount] = useState(0.001);
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');
  const [showChat, setShowChat] = useState(false);

  // Contract interactions
  const { data: prediction, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'getPredictionDetails',
    args: [params.slug],
  });

  const { writeContract } = useWriteContract();

  const handlePredict = async () => {
    if (!isConnected || !address) {
      // Add your wallet connection logic here
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: abi,
        functionName: 'placeVotes',
        args: [
          BigInt(params.slug),
          selectedPosition === 'yes' ? BigInt(0) : BigInt(1),
          BigInt(predictionAmount)
        ],
        value: parseEther(predictionAmount.toString()),
        chain: baseSepolia,
      });
    } catch (error) {
      console.error('Error placing prediction:', error);
    }
  };

  const initializeXMTP = async () => {
    if (!address || !isConnected) return;
    
    setIsLoadingXMTP(true);
    try {
      const signer = {
        getAddress: async () => address,
        signMessage: async (message: string) => {
          const signature = await signMessage({ message });
          return new TextEncoder().encode(signature);
        }
      };
      
      const encryptionKey = new Uint8Array(32);
      window.crypto.getRandomValues(encryptionKey);
      
      const client = await Client.create(signer, encryptionKey, {
        env: 'production'
      });
      
      // Create a group conversation for the prediction
      const conv = await client.conversations.newGroup(
        [address],
        {
          metadata: {
            name: `Prediction ${params.slug} Discussion`,
            description: prediction ? prediction[0] : 'Prediction Discussion'
          }
        }
      );
      
      setConversation(conv);
      
      const existingMessages = await conv.messages();
      setMessages(existingMessages);
      
      const stream = await conv.streamMessages();
      for await (const message of stream) {
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {

        console.error('Error initializing XMTP:', error);
    } finally {
      setIsLoadingXMTP(false);
    }
  };

  const sendMessage = async () => {
    if (!conversation || !newMessage.trim()) return;
    
    try {
      await conversation.send(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      initializeXMTP();
    }
  }, [isConnected, address]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 dark:bg-navy-700 rounded w-1/4"></div>
          <div className="h-12 bg-gray-300 dark:bg-navy-700 rounded w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-navy-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 dark:bg-navy-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChatHeightClass = () => {
    if (!showChat) return 'h-12';
    return messages.length > 0 ? 'h-96' : 'h-32';
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Back Button */}
      <button 
        onClick={() => router.push('/hub/dashboard')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </button>
      
      {/* Main Content */}
      <div className="space-y-6 mb-24">
        {/* Header */}
        <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-navy-700 dark:text-white mb-4">
            {prediction[0]}
          </h1>
          <div className="flex flex-wrap gap-2">
            {prediction[10].map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Overview Content */}
        <Overview 
          prediction={prediction}
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          predictionAmount={predictionAmount}
          setPredictionAmount={setPredictionAmount}
          onPredict={handlePredict}
        />
      </div>

      {/* Fixed Discussion Panel */}
      <motion.div
        initial={false}
        animate={{ height: getChatHeightClass() }}
        transition={{ duration: 0.3 }}
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 shadow-lg z-50`}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="p-4">
            {/* Chat Header */}
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setShowChat(!showChat)}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-brand-500" />
                <h2 className="text-lg font-bold text-navy-700 dark:text-white">
                  Live Discussion
                </h2>
                {messages.length > 0 && (
                  <span className="bg-brand-500 text-white text-xs px-2 py-1 rounded-full">
                    {messages.length}
                  </span>
                )}
              </div>
              {isLoadingXMTP && (
                <div className="flex items-center text-brand-500">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  <span className="text-sm">Connecting...</span>
                </div>
              )}
            </div>
            
            {showChat && (
              <div className="space-y-4">
                {/* Messages Display */}
                <div className="h-64 overflow-y-auto px-2">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex mb-2 ${message.senderAddress === address ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2 ${
                          message.senderAddress === address
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">
                          {message.senderAddress === address ? 'You' : 
                            `${message.senderAddress.slice(0, 6)}...${message.senderAddress.slice(-4)}`}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.sent).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isConnected ? "Type your message..." : "Connect wallet to join discussion"}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-transparent"
                    disabled={!isConnected}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!isConnected || !newMessage.trim()}
                    className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Connect Wallet Prompt */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                Please connect your wallet to participate in predictions and discussions
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictionDetailsPage;