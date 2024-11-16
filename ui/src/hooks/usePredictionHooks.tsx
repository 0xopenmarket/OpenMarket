import { useState, useEffect } from 'react';
import { writeContract, waitForTransaction } from '@wagmi/core';
import { parseEther, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import toast from 'react-hot-toast';
import { config } from 'config';
import {useReadContract} from "wagmi";


const PRICE_IMPACT_THRESHOLD = 0.05; // 5%
const MAX_PRICE_IMPACT = 0.15; // 15%
const LIQUIDITY_MULTIPLIER = 2;

export interface MarketPosition {
  yesTokens: bigint;
  noTokens: bigint;
  totalInvested: bigint;
  limitOrders: bigint[];
}

export interface PriceImpact {
  beforePrice: number;
  afterPrice: number;
  impact: number;
  isHighImpact: boolean;
}

export interface TokenBalances {
  yesTokenBalance: bigint;
  noTokenBalance: bigint;
  yesTokenDecimals: number;
  noTokenDecimals: number;
}


export const usePredictionMarket = (contractAddress: string, abi: any) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransaction = async (txConfig: any) => {
    setIsProcessing(true);
    try {
      // Execute the contract write
      const hash = await writeContract(config, {
        ...txConfig,
        address: contractAddress as `0x${string}`,
        abi,
        chain: baseSepolia,
      });

      if (hash) {
        // Show loading toast
        toast.loading('Transaction pending...', { id: hash });

        // Wait for transaction confirmation
        const receipt = await waitForTransaction(config, {
          hash,
          confirmations: 1,
        });

        if (receipt.status === 'success') {
          toast.success('Transaction successful', { id: hash });
          return true;
        } else {
          throw new Error('Transaction failed');
        }
      }
      return false;
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(error.message || 'Transaction failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };



  // Market Participation Functions
  const takePosition = async (
    marketId: number,
    isYes: boolean,
    amount: number,
    targetPrice: number = 0,
  ) => {
    return handleTransaction({
      functionName: 'takePosition',
      args: [BigInt(marketId), isYes, BigInt(targetPrice)],
      value: parseEther(amount.toString()),
    });
  };

  const createLimitOrder = async (
    marketId: number,
    isYes: boolean,
    amount: number,
    targetPrice: number,
  ) => {
    return handleTransaction({
      functionName: 'createLimitOrder',
      args: [
        BigInt(marketId),
        isYes,
        parseEther(amount.toString()),
        BigInt(targetPrice),
      ],
      value: parseEther(amount.toString()),
    });
  };

  const cancelLimitOrder = async (marketId: number, orderId: number) => {
    return handleTransaction({
      functionName: 'cancelLimitOrder',
      args: [BigInt(marketId), BigInt(orderId)],
    });
  };

  const exitPosition = async (
    marketId: number,
    isYes: boolean,
    amount: number,
  ) => {
    return handleTransaction({
      functionName: 'exitPosition',
      args: [BigInt(marketId), isYes, parseEther(amount.toString())],
    });
  };

  // Market Management Functions
  const createMarket = async (
    description: string,
    category: string,
    duration: number,
    imageIpfsHash: string,
    tags: string[],
    stake: number,
  ) => {
    return handleTransaction({
      functionName: 'createMarket',
      args: [description, category, BigInt(duration), imageIpfsHash, tags],
      value: parseEther(stake.toString()),
    });
  };

  const resolveMarket = async (marketId: number, outcome: boolean) => {
    return handleTransaction({
      functionName: 'resolveMarket',
      args: [BigInt(marketId), outcome],
    });
  };

  const cancelMarket = async (marketId: number) => {
    return handleTransaction({
      functionName: 'cancelMarket',
      args: [BigInt(marketId)],
    });
  };

  const distributeRewards = async (marketId: number) => {
    return handleTransaction({
      functionName: 'distributeRewards',
      args: [BigInt(marketId)],
    });
  };

  // Dispute Functions
  const createDispute = async (
    marketId: number,
    reason: string,
    stake: number,
  ) => {
    return handleTransaction({
      functionName: 'createDispute',
      args: [BigInt(marketId), reason],
      value: parseEther(stake.toString()),
    });
  };

  const voteOnDispute = async (marketId: number, supportDispute: boolean) => {
    return handleTransaction({
      functionName: 'voteOnDispute',
      args: [BigInt(marketId), supportDispute],
    });
  };

  // Social Functions
  const addComment = async (marketId: number, content: string) => {
    return handleTransaction({
      functionName: 'addComment',
      args: [BigInt(marketId), content],
    });
  };

  const likeComment = async (marketId: number, commentId: number) => {
    return handleTransaction({
      functionName: 'likeComment',
      args: [BigInt(marketId), BigInt(commentId)],
    });
  };

  // Profile Management
  const createProfile = async (
    username: string,
    avatarIpfsHash: string,
    bio: string,
  ) => {
    return handleTransaction({
      functionName: 'createProfile',
      args: [username, avatarIpfsHash, bio],
    });
  };

  const followUser = async (userToFollow: string) => {
    return handleTransaction({
      functionName: 'followUser',
      args: [userToFollow],
    });
  };

  return {
    // Market Participation
    takePosition,
    createLimitOrder,
    cancelLimitOrder,
    exitPosition,

    // Market Management
    createMarket,
    resolveMarket,
    cancelMarket,
    distributeRewards,

    // Dispute System
    createDispute,
    voteOnDispute,

    // Social Features
    addComment,
    likeComment,

    // Profile Management
    createProfile,
    followUser,

    // Status
    isProcessing,
  };
};

// Types
export interface MarketPosition {
  yesTokens: bigint;
  noTokens: bigint;
  totalInvested: bigint;
  limitOrders: bigint[];
}

export interface MarketPrices {
  yes: bigint;
  no: bigint;
}

export interface Profile {
  username: string;
  avatarIpfsHash: string;
  bio: string;
  reputation: bigint;
  createdMarkets: bigint[];
  participatedMarkets: bigint[];
  totalProfits: bigint;
  creatorEarnings: bigint;
  isActive: boolean;
  isCreator: boolean;
  followers: string[];
  following: string[];
}

export interface Market {
  description: string;
  category: string;
  endTime: bigint;
  status: number;
  creator: string;
  yesToken: string;
  noToken: string;
  yesPrice: bigint;
  noPrice: bigint;
  outcome: boolean;
  totalLiquidity: bigint;
  totalVolume: bigint;
  totalParticipants: bigint;
  creatorFees: bigint;
  platformFees: bigint;
  disputeStatus: number;
  imageIpfsHash: string;
  tags: string[];
}

export interface LimitOrder {
  creator: string;
  orderType: number;
  isYes: boolean;
  amount: bigint;
  targetPrice: bigint;
  isActive: boolean;
  timestamp: bigint;
}

// Read Functions Hook
export const useMarketData = (
  contractAddress: string,
  abi: any,
  marketId: bigint,
  address?: string,
) => {
  const { data: market } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getMarketDetails',
    args: [marketId],
  });

  const { data: position } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getUserPositions',
    args: [address, marketId],
  });

  const { data: yesPrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getCurrentPrice',
    args: [marketId, true],
  });

  const { data: noPrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getCurrentPrice',
    args: [marketId, false],
  });

  return {
    market,
    position,
    prices: {
      yes: yesPrice,
      no: noPrice,
    },
  };
};


export const useTokenBalances = (
  contractAddress: string,
  abi: any,
  marketId: number,
  userAddress?: string
) => {
  const [balances, setBalances] = useState<TokenBalances>({
    yesTokenBalance: 0n,
    noTokenBalance: 0n,
    yesTokenDecimals: 18,
    noTokenDecimals: 18,
  });

  // Get token addresses
  const { data: market } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getMarketDetails',
    args: [BigInt(marketId)],
  });

  useEffect(() => {
    const fetchBalances = async () => {
      if (!market || !userAddress) return;

      const [yesTokenAddress, noTokenAddress] = [market.yesToken, market.noToken];

      // Read token balances using ERC20 interface
      const yesBalance = await useReadContract({
        address: yesTokenAddress,
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: [userAddress],
      });

      const noBalance = await useReadContract({
        address: noTokenAddress,
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: [userAddress],
      });

      setBalances({
        yesTokenBalance: yesBalance || 0n,
        noTokenBalance: noBalance || 0n,
        yesTokenDecimals: 18,
        noTokenDecimals: 18,
      });
    };

    fetchBalances();
  }, [market, userAddress]);

  return balances;
};

// Hook for market positions and prices
export const useMarketPosition = (
  contractAddress: string,
  abi: any,
  marketId: number,
  userAddress?: string
) => {
  const { data: position, refetch: refetchPosition } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getUserPositions',
    args: [userAddress, BigInt(marketId)],
    enabled: !!userAddress,
  });

  const { data: yesPrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getCurrentPrice',
    args: [BigInt(marketId), true],
  });

  const { data: noPrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getCurrentPrice',
    args: [BigInt(marketId), false],
  });

  const { data: marketDetails } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getMarketDetails',
    args: [BigInt(marketId)],
  });

  const tokenBalances = useTokenBalances(contractAddress, abi, marketId, userAddress);

  return {
    position,
    prices: {
      yes: yesPrice || 500n, // Default to 50-50 if no price
      no: noPrice || 500n,
    },
    tokenBalances,
    marketDetails,
    refetchPosition,
  };
};

// Hook for price calculations
export const useMarketPrices = (contractAddress: string, abi: any, marketId: number) => {
  const [priceHistory, setPriceHistory] = useState<{
    timestamp: number;
    yesPrice: number;
    noPrice: number;
  }[]>([]);

  // Fetch current prices
  const { data: currentYesPrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getCurrentPrice',
    args: [BigInt(marketId), true],
  });

  const { data: currentNoPrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getCurrentPrice',
    args: [BigInt(marketId), false],
  });

  // Add price to history on change
  useEffect(() => {
    if (currentYesPrice && currentNoPrice) {
      setPriceHistory(prev => [...prev, {
        timestamp: Date.now(),
        yesPrice: Number(currentYesPrice) / 10,
        noPrice: Number(currentNoPrice) / 10,
      }]);
    }
  }, [currentYesPrice, currentNoPrice]);

  return {
    currentPrices: {
      yes: Number(currentYesPrice || 500n) / 10,
      no: Number(currentNoPrice || 500n) / 10,
    },
    priceHistory: priceHistory.slice(-100), // Keep last 100 price points
  };
};
