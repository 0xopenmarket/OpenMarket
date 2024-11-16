// types.ts
export type MarketStatus = 'Active' | 'Resolved' | 'Disputed' | 'Cancelled';

export interface PredictionMarket {
  id: string;
  description: string;
  category: string;
  endTime: number;
  status: MarketStatus;
  totalLiquidity: bigint;
  totalVolume: bigint;
  totalParticipants: number;
  creator: string;
  tags: string[];
  yesPrice: number;
  noPrice: number;
  imageHash?: string;
}

export interface UserPosition {
  yesTokens: bigint;
  noTokens: bigint;
  totalInvested: bigint;
  limitOrders: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: React.ComponentType;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface PredictionCardProps {
  predictionId: bigint;
  usePredictionDetails: (id: bigint) => any;
  onPredict: (marketId: number, isYes: boolean, amount: number) => Promise<void>;
  contractAddress: string;
  abi: any;
}


// constants.ts
import { IoGrid, IoWallet, IoTrendingUp, IoTime, IoBulb, IoStatsChart } from 'react-icons/io5';

export const SLIDER_WIDTH = 300;
export const THUMB_WIDTH = 60;
export const CONFIRMATION_THRESHOLD = 0.8;
export const MIN_STAKE = 0.001;
export const MAX_STAKE = 100;

export const CONTRACT_ADDRESS = '0x01d2013AAE21C3708C36C71F4eC4554bC5F003Ec';
export const CREATOR_ROLE = '0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f';
export const ADMIN_ROLE = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775';
export const ORACLE_ROLE = '0x68e79a7bf1e0bc45d0a330c573bc367f9cf464fd326078812f301165fbda4ef1';

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Markets', icon: IoGrid },
  { id: 'crypto', name: 'Crypto', icon: IoWallet },
  { id: 'sports', name: 'Sports', icon: IoTrendingUp },
  { id: 'politics', name: 'Politics', icon: IoTime },
  { id: 'entertainment', name: 'Entertainment', icon: IoBulb },
  { id: 'technology', name: 'Technology', icon: IoStatsChart }
];

export const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'liquidity', label: 'Highest Liquidity' },
  { value: 'volume', label: 'Highest Volume' },
  { value: 'participants', label: 'Most Participants' }
];

export const CHART_OPTIONS = {
  chart: {
    type: 'area',
    height: 250,
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800
    },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif'
  },
  grid: {
    show: true,
    borderColor: '#1e293b40',
    strokeDashArray: 3,
    padding: { top: 0, right: 0, bottom: 0, left: 10 }
  },
  colors: ['#22c55e', '#ef4444'],
  stroke: {
    curve: 'smooth',
    width: 3,
    lineCap: 'round'
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05
    }
  },
  xaxis: {
    type: 'datetime',
    labels: {
      style: { colors: '#94a3b8' }
    }
  },
  yaxis: {
    labels: {
      style: { colors: '#94a3b8' },
      formatter: (value: number) => `${value.toFixed(1)}%`
    }
  },
  tooltip: {
    theme: 'dark',
    x: { format: 'MMM dd, HH:mm' },
    y: { formatter: (value: number) => `${value.toFixed(2)}%` }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    labels: { colors: '#94a3b8' }
  }
};


// types.ts
export interface Profile {
  username: string;
  avatarIpfsHash: string;
  bio: string;
  reputation: number;
  createdMarkets: string[];
  participatedMarkets: string[];
  totalProfits: bigint;
  creatorEarnings: bigint;
  isActive: boolean;
  isCreator: boolean;
  followers: string[];
  following: string[];
}

export interface UserPosition {
  yesTokens: bigint;
  noTokens: bigint;
  totalInvested: bigint;
  limitOrders: string[];
}

export interface MarketActivity {
  type: 'creation' | 'prediction' | 'comment' | 'dispute' | 'resolution';
  marketId: string;
  timestamp: number;
  data: any;
}

export interface TabProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  symbol?: string;
  icon: React.ReactNode;
}

export interface InfoItemProps {
  label: string;
  value: string | number;
}

import { useReadContract} from "wagmi"
export const useMarketDetails = (id: bigint, contractAddress: string, abi: any) => {
  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: abi,
    functionName: 'getMarketDetails',
    args: [id],
  });
};


// types.ts

export interface Position {
  yesTokens: bigint;
  noTokens: bigint;
  totalInvested: bigint;
  limitOrders: bigint[];
}

export interface MarketPrices {
  yes: bigint;
  no: bigint;
}

export interface PredictionCardProps {
  predictionId: bigint;
  usePredictionDetails: (id: bigint) => any;
  contractAddress: string;
  abi: any;
}

export interface PositionManagementProps {
  marketId: bigint;
  position: Position;
  currentPrices: MarketPrices;
  onUpdatePosition: () => void;
}

export interface MarketInteraction {
  takePosition: (marketId: number, isYes: boolean, amount: number, targetPrice?: number) => Promise<boolean>;
  createLimitOrder: (marketId: number, isYes: boolean, amount: number, targetPrice: number) => Promise<boolean>;
  cancelLimitOrder: (marketId: number, orderId: number) => Promise<boolean>;
  exitPosition: (marketId: number, isYes: boolean, amount: number) => Promise<boolean>;
  isProcessing: boolean;
}
