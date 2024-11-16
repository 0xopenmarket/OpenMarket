'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Client } from '@xmtp/browser-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
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
  XCircle
} from 'lucide-react';

const CONTRACT_ADDRESS = '0x779d7026FA2100C97AE5E2e8381f6506D5Bf31D4';

const PredictionDetailsPage = () => {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [isLoadingXMTP, setIsLoadingXMTP] = useState(false);
  const [predictionAmount, setPredictionAmount] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');

  // Mock data for charts
  const mockPriceHistory = Array.from({ length: 24 }, (_, i) => ({
    time: `${23-i}h ago`,
    value: 50 + Math.sin(i * 0.5) * 20 + Math.random() * 10,
    volume: Math.random() * 3 + 0.5
  })).reverse();

  // Contract read for prediction details
  const { data: predictionDetails } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [], // Add your contract ABI here
    functionName: 'getPredictionDetails',
    args: [params.slug],
  });

  // Initialize XMTP client
  const initializeXMTP = async () => {
    if (!address || !isConnected) return;
    
    setIsLoadingXMTP(true);
    try {
      const encryptionKey = new Uint8Array(32);
      window.crypto.getRandomValues(encryptionKey);
      
      const client = await Client.create(null, encryptionKey, {
        env: 'production'
      });
      
      setXmtpClient(client);
      
      const conversationTopic = `prediction-${params.slug}`;
      const conv = await client.conversations.newDm(CONTRACT_ADDRESS);
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

  const Overview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Volume</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">12.5 ETH</p>
            </div>
            <Wallet className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">156</p>
            </div>
            <Users className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Time Remaining</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">2d 5h</p>
            </div>
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Price History Chart */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white mb-4">Price History</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockPriceHistory}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prediction Interface */}
        <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-navy-700 dark:text-white mb-4">Make Prediction</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedPosition('yes')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors
                  ${selectedPosition === 'yes' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'}`}
              >
                <CheckCircle className="h-4 w-4" />
                Yes
              </button>
              <button
                onClick={() => setSelectedPosition('no')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors
                  ${selectedPosition === 'no' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'}`}
              >
                <XCircle className="h-4 w-4" />
                No
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={predictionAmount}
                onChange={(e) => setPredictionAmount(Number(e.target.value))}
                min="1"
                step="1"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-transparent"
              />
              <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors">
                Place Prediction
              </button>
            </div>
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-navy-700 dark:text-white mb-4">Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300">Yes</span>
                <span className="font-medium text-navy-700 dark:text-white">65%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-navy-700 h-2 rounded-full">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300">No</span>
                <span className="font-medium text-navy-700 dark:text-white">35%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-navy-700 h-2 rounded-full">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Discussion = () => (
    <div className="bg-white dark:bg-navy-800 rounded-xl shadow-lg h-[600px] flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-navy-700">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">Discussion</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Chat with other participants about this prediction</p>
      </div>
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.senderAddress === address ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.senderAddress === address
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70">
                  {new Date(message.sent).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-navy-600 bg-transparent"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            onClick={sendMessage}
            className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <button className="mb-6 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Predictions
      </button>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-navy-700 dark:text-white">
            Will ETH reach $5000 by end of 2024?
          </h1>
          <div className="flex gap-2 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300">
              <Clock className="mr-2 h-4 w-4" />
              2 days left
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300">
              <Users className="mr-2 h-4 w-4" />
              156 participants
            </span>
          </div>
        </div>

        <div>
          <div className="flex space-x-1 border-b border-gray-200 dark:border-navy-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 -mb-px font-medium text-sm flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-b-2 border-brand-500 text-brand-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
Overview
</button>
<button
onClick={() => setActiveTab('discussion')}
className={`px-4 py-2 -mb-px font-medium text-sm flex items-center gap-2 ${
  activeTab === 'discussion'
    ? 'border-b-2 border-brand-500 text-brand-500'
    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
}`}
>
<MessageCircle className="h-4 w-4" />
Discussion
</button>
</div>

<div className="mt-6">
<AnimatePresence mode="wait">
<motion.div
  key={activeTab}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.2 }}
>
  {activeTab === 'overview' ? <Overview /> : <Discussion />}
</motion.div>
</AnimatePresence>
</div>
</div>

{/* Mobile Navigation */}
<div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-navy-800 border-t border-gray-200 dark:border-navy-700 md:hidden">
<div className="flex justify-around p-4">
<button
onClick={() => setActiveTab('overview')}
className={`flex flex-col items-center gap-1 ${
  activeTab === 'overview'
    ? 'text-brand-500'
    : 'text-gray-500 dark:text-gray-400'
}`}
>
<TrendingUp className="h-5 w-5" />
<span className="text-xs">Overview</span>
</button>
<button
onClick={() => setActiveTab('discussion')}
className={`flex flex-col items-center gap-1 ${
  activeTab === 'discussion'
    ? 'text-brand-500'
    : 'text-gray-500 dark:text-gray-400'
}`}
>
<MessageCircle className="h-5 w-5" />
<span className="text-xs">Discussion</span>
</button>
</div>
</div>

{/* Loading Overlay */}
{isLoadingXMTP && (
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
<div className="bg-white dark:bg-navy-800 rounded-xl p-6 max-w-sm w-full mx-4">
<div className="flex flex-col items-center text-center">
  <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
  <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-2">
    Initializing Chat
  </h3>
  <p className="text-gray-500 dark:text-gray-400">
    Setting up secure messaging for this prediction...
  </p>
</div>
</div>
</div>
)}

{/* Error Alert */}
<AnimatePresence>
{!isConnected && (
<motion.div
initial={{ opacity: 0, y: 50 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 50 }}
className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg"
>
<div className="flex items-center gap-2">
  <Info className="h-5 w-5" />
  <p>Please connect your wallet to participate in discussions</p>
</div>
</motion.div>
)}
</AnimatePresence>
</div>
</div>
);
};

export default PredictionDetailsPage;