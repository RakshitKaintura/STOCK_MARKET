"use client"; // <--- This magic line fixes the error

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";
import { cn } from "@/lib/utils";

// Helper to colorize change text
function ChangeText({
  changePercent,
  changeFormatted,
  className,
}: {
  changePercent: number;
  changeFormatted: string;
  className?: string;
}) {
  const colorClass =
    changePercent > 0
      ? "text-green-500"
      : changePercent < 0
      ? "text-red-500"
      : "text-gray-500";
  return (
    <span className={cn("font-semibold", colorClass, className)}>
      {changeFormatted || "0.00%"}
    </span>
  );
}

export function WatchlistTable({ watchlist }: { watchlist: any[] }) {
  const HEADERS = [
    "Company",
    "Symbol",
    "Price",
    "Change",
    "Market Cap",
    "P/E Ratio",
    "Action",
  ];

  // EMPTY STATE
  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#161922] rounded-xl border border-[#1e2128] text-center">
        <div className="p-4 bg-[#1e2128] rounded-full mb-4">
          <Star className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-white">Your watchlist is empty</h3>
        <p className="text-gray-400 mt-2 max-w-sm">
          Start building your portfolio by adding stocks using the "Add Stock" button above.
        </p>
      </div>
    );
  }

  // TABLE STATE
  return (
    <div className="bg-[#161922] rounded-xl border border-[#1e2128] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_1fr_1fr] px-4 py-3 border-b border-[#1e2128]">
        {HEADERS.map((h) => (
          <div
            key={h}
            className="text-[#7a7f8e] text-xs font-medium uppercase tracking-wider"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {watchlist.map((item, i) => (
        <Link
          key={item.symbol + i}
          href={`/stocks/${item.symbol}`}
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_1fr_1fr] px-4 py-3 border-b border-[#1e2128] last:border-none items-center hover:bg-[#1c1f28] transition-colors cursor-pointer group"
        >
          {/* Company */}
          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
            <Star size={15} className="fill-[#d4a017] text-[#d4a017] shrink-0" />
            <span className="text-white font-medium truncate" title={item.company}>
              {item.company}
            </span>
          </div>

          {/* Symbol */}
          <span className="text-[#a0a4b0] font-medium">{item.symbol}</span>

          {/* Price */}
          <span className="text-white font-mono">
            {item.priceFormatted || "—"}
          </span>

          {/* Change */}
          <ChangeText
            changePercent={item.changePercent}
            changeFormatted={item.changeFormatted}
          />

          {/* Market Cap */}
          <span className="text-[#a0a4b0]">{item.marketCap || "—"}</span>

          {/* P/E Ratio */}
          <span className="text-[#a0a4b0]">{item.peRatio || "—"}</span>

          {/* Remove Action (Wrapped in div to stop propagation) */}
          <div 
            onClick={(e) => {
              e.preventDefault(); // Prevents Link navigation
              e.stopPropagation(); // Stops event bubbling
            }}
          >
            <WatchlistButton
              symbol={item.symbol}
              company={item.company}
              isInWatchlist={true}
              showTrashIcon={true}
              type="icon"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}