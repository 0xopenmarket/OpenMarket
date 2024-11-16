'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther } from 'viem';
import { MdEdit, MdHistory, MdTrendingUp, MdLocalOffer, MdPeople, MdStar } from 'react-icons/md';
import Card from 'components/card';
import {abi} from "../../../abi";

const ProfileOverview = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('markets');
  const contractAddress = '0x01d2013AAE21C3708C36C71F4eC4554bC5F003Ec';

  // Contract reads
  const { data: profile } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'profiles',
    args: [address],
  });

  const { data: userMarkets } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getUserMarkets',
    args: [address],
  });

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Profile Banner */}
      <ProfileBanner profile={profile} address={address} />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Profits"
          value={profile?.totalProfits ? formatEther(profile.totalProfits) : '0'}
          symbol="ETH"
          icon={<MdTrendingUp className="text-green-500" size={24} />}
        />
        <StatsCard
          title="Markets Created"
          value={profile?.createdMarkets?.length || 0}
          icon={<MdLocalOffer className="text-blue-500" size={24} />}
        />
        <StatsCard
          title="Reputation Score"
          value={profile?.reputation || 0}
          icon={<MdStar className="text-yellow-500" size={24} />}
        />
        <StatsCard
          title="Followers"
          value={profile?.followers?.length || 0}
          icon={<MdPeople className="text-purple-500" size={24} />}
        />
      </div>

      {/* Profile Content */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-4">
          <ProfileInfo profile={profile} />
          <div className="mt-5">
            <ActivityFeed address={address} />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8">
          <Card extra="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-4">
                <TabButton 
                  active={activeTab === 'markets'} 
                  onClick={() => setActiveTab('markets')}
                >
                  My Markets
                </TabButton>
                <TabButton 
                  active={activeTab === 'positions'} 
                  onClick={() => setActiveTab('positions')}
                >
                  Active Positions
                </TabButton>
                <TabButton 
                  active={activeTab === 'history'} 
                  onClick={() => setActiveTab('history')}
                >
                  History
                </TabButton>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
              {activeTab === 'markets' && <UserMarkets markets={userMarkets} />}
              {activeTab === 'positions' && <UserPositions address={address} />}
              {activeTab === 'history' && <TransactionHistory address={address} />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Profile Banner Component
const ProfileBanner = ({ profile, address }) => {
  const nounsSeed = address ? parseInt(address.slice(2, 10), 16) : 0;
  
  return (
    <Card extra="items-center w-full h-full p-[16px] bg-cover">
      <div className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600">
        <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-white dark:!border-navy-700">
          <img
            className="h-full w-full rounded-full"
            src={`https://api.cloudnouns.com/v1/pfp`}
            alt="Profile"
          />
        </div>
      </div>
      
      <div className="mt-16 flex flex-col items-center">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {profile?.username || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
        </h4>
        <p className="text-base text-gray-600">
          {profile?.bio || 'No bio set'}
        </p>
      </div>
    </Card>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, symbol, icon }) => {
  return (
    <Card extra="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold text-navy-700 dark:text-white">
            {value} {symbol}
          </h3>
        </div>
        {icon}
      </div>
    </Card>
  );
};

// Profile Info Component
const ProfileInfo = ({ profile }) => {
  return (
    <Card extra="p-4">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-bold text-navy-700 dark:text-white">
          Profile Info
        </h5>
        <button className="text-brand-500 hover:text-brand-600">
          <MdEdit size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        {profile?.isCreator && (
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
              Verified Creator
            </span>
          </div>
        )}
        
        <InfoItem label="Username" value={profile?.username || 'Not set'} />
        <InfoItem label="Bio" value={profile?.bio || 'No bio provided'} />
        <InfoItem 
          label="Reputation" 
          value={`${profile?.reputation || 0} points`}
        />
        <InfoItem 
          label="Markets Created" 
          value={profile?.createdMarkets?.length || 0} 
        />
        <InfoItem 
          label="Creator Earnings" 
          value={`${formatEther(profile?.creatorEarnings || 0)} ETH`} 
        />
      </div>
    </Card>
  );
};

// Info Item Component
const InfoItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-navy-700 dark:text-white">{value}</span>
  </div>
);

// Tab Button Component
const TabButton = ({ active, children, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`px-4 py-2 rounded-lg transition-colors ${
      active
        ? 'bg-brand-500 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-navy-700'
    }`}
  >
    {children}
  </motion.button>
);

// Activity Feed Component
const ActivityFeed = ({ address }) => {
  // Implement activity feed logic here
  return (
    <Card extra="p-4">
      <h5 className="text-lg font-bold text-navy-700 dark:text-white mb-4">
        Recent Activity
      </h5>
      <div className="space-y-4">
        {/* Add activity items here */}
      </div>
    </Card>
  );
};

// User Markets Component
const UserMarkets = ({ markets }) => {
  // Implement user markets display logic here
  return (
    <div className="space-y-4">
      {/* Add market items here */}
    </div>
  );
};

// User Positions Component
const UserPositions = ({ address }) => {
  // Implement user positions display logic here
  return (
    <div className="space-y-4">
      {/* Add position items here */}
    </div>
  );
};

// Transaction History Component
const TransactionHistory = ({ address }) => {
  // Implement transaction history display logic here
  return (
    <div className="space-y-4">
      {/* Add transaction items here */}
    </div>
  );
};

export default ProfileOverview;
