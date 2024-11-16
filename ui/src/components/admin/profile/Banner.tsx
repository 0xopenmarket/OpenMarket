import React from 'react';
import Image from 'next/image';
import { useAccount, useReadContract } from 'wagmi';
import { abi } from '../../../abi'; // Make sure to import your contract ABI
import Card from 'components/card';
import banner from '/public/img/profile/banner.png';
import { MdOutlineStar, MdHowToVote, MdAttachMoney } from 'react-icons/md';

const Banner = () => {
  const { address } = useAccount();
  const contractAddress = '0x7ef2A5BBAa51FdCb732b1b30B8134FF23A303b3b' as const; // Replace with your contract address

  const { data: userStats } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getUserStats',
    args: [address],
  });

  const luck = userStats ? Number(userStats.luck) : 0;
  const totalVotes = userStats ? Number(userStats.totalVotes) : 0;
  const totalAmountWon = userStats ? Number(userStats.totalAmountWon) / 1e18 : 0; // Convert from Wei to ETH

  return (
    <Card extra={'items-center w-full h-full p-[16px] bg-cover'}>
      {/* Background and profile */}
      <div
        className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover"
        style={{ backgroundImage: `url(${banner.src})` }}
      >
        <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-pink-400 dark:!border-navy-700">
          <Image
            width={87}
            height={87}
            className="h-full w-full rounded-full"
            src={`https://robohash.org/${address}.png`}
            alt="User Avatar"
          />
        </div>
      </div>

      {/* Address and stats */}
      <div className="mt-16 flex flex-col items-center">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
        </h4>
        {/* <h5 className="text-base font-normal text-gray-600">Prediction Market Player</h5> */}
      </div>

      {/* User stats */}
      <div className="mb-3 mt-6 flex gap-4 md:!gap-14">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center">
            <MdOutlineStar className="mr-1 text-yellow-500" size={24} />
            <h4 className="text-2xl font-bold text-navy-700 dark:text-white">
              {luck}
            </h4>
          </div>
          <p className="text-sm font-normal text-gray-600">Luck Score</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center">
            <MdHowToVote className="mr-1 text-blue-500" size={24} />
            <h4 className="text-2xl font-bold text-navy-700 dark:text-white">
              {totalVotes}
            </h4>
          </div>
          <p className="text-sm font-normal text-gray-600">Total Votes</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center">
            <MdAttachMoney className="mr-1 text-green-500" size={24} />
            <h4 className="text-2xl font-bold text-navy-700 dark:text-white">
              {totalAmountWon.toFixed(2)}
            </h4>
          </div>
          <p className="text-sm font-normal text-gray-600">Total Won (ETH)</p>
        </div>
      </div>
    </Card>
  );
};

export default Banner;