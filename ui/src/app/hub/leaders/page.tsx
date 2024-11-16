'use client'
import React, { useState } from 'react';
import Card from 'components/card';
import { MdOutlineStar } from 'react-icons/md';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

type RowObj = {
  rank: number;
  address: string;
  luck: number;
  totalVotes: number;
  totalAmountWon: number;
};

const columnHelper = createColumnHelper<RowObj>();

// Demo data
const demoData: RowObj[] = [
  { rank: 1, address: '0x1234567890123456789012345678901234567890', luck: 95, totalVotes: 1500, totalAmountWon: 12.5 },
  { rank: 2, address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', luck: 88, totalVotes: 1200, totalAmountWon: 10.2 },
  { rank: 3, address: '0x9876543210987654321098765432109876543210', luck: 82, totalVotes: 1100, totalAmountWon: 9.8 },
  { rank: 4, address: '0xfedcbafedcbafedcbafedcbafedcbafedcbafed', luck: 75, totalVotes: 950, totalAmountWon: 8.5 },
  { rank: 5, address: '0x1111222233334444555566667777888899990000', luck: 70, totalVotes: 800, totalAmountWon: 7.2 },
  { rank: 6, address: '0xaaaabbbbccccddddeeeeffffgggghhhhiiiijjjj', luck: 65, totalVotes: 750, totalAmountWon: 6.8 },
  { rank: 7, address: '0x123abc456def789ghi012jkl345mno678pqr901', luck: 60, totalVotes: 700, totalAmountWon: 6.3 },
  { rank: 8, address: '0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', luck: 55, totalVotes: 650, totalAmountWon: 5.9 },
];

const LeaderboardTable: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    columnHelper.accessor('rank', {
      id: 'rank',
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">RANK</p>,
      cell: (info) => <p className="text-sm font-bold text-navy-700 dark:text-white">{info.getValue()}</p>,
    }),
    columnHelper.accessor('address', {
      id: 'address',
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">ADDRESS</p>,
      cell: (info) => (
        <p className="text-sm font-bold text-navy-700 dark:text-white">
          {`${info.getValue().slice(0, 6)}...${info.getValue().slice(-4)}`}
        </p>
      ),
    }),
    columnHelper.accessor('luck', {
      id: 'luck',
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">LUCK</p>,
      cell: (info) => (
        <div className="flex items-center">
          <MdOutlineStar className="mr-1 text-yellow-500" />
          <p className="text-sm font-bold text-navy-700 dark:text-white">{info.getValue()}</p>
        </div>
      ),
    }),
    columnHelper.accessor('totalVotes', {
      id: 'totalVotes',
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">TOTAL VOTES</p>,
      cell: (info) => <p className="text-sm font-bold text-navy-700 dark:text-white">{info.getValue()}</p>,
    }),
    columnHelper.accessor('totalAmountWon', {
      id: 'totalAmountWon',
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">TOTAL WON (ETH)</p>,
      cell: (info) => <p className="text-sm font-bold text-navy-700 dark:text-white">{info.getValue().toFixed(2)}</p>,
    }),
  ];

  const table = useReactTable({
    data: demoData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  return (
    <Card extra={'w-full h-full px-6 pb-6 sm:overflow-x-auto'}>
      <div className="relative flex items-center justify-between pt-4">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          User Leaderboard
        </div>
      </div>

      <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="!border-px !border-gray-400">
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer border-b border-gray-200 pb-2 pr-4 pt-4 text-start dark:border-white/30"
                    >
                      <div className="items-center justify-between text-xs text-gray-200">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table
              .getRowModel()
              .rows
              .map((row) => {
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td
                          key={cell.id}
                          className="min-w-[150px] border-white/0 py-3  pr-4"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default LeaderboardTable;