import React from "react";
import TradingViewScreener from "@/components/TradingViewScreener";

export default function ScreenersPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e2e4e9] font-sans">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-7 h-screen flex flex-col">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Stock Screener</h1>
          <p className="text-[#7a7f8e] text-xs mt-1">
            Filter and analyze market data using advanced technicals.
          </p>
        </div>

        {/* Widget Container */}
        <div className="flex-1 w-full bg-[#161922] rounded-xl border border-[#1e2128] overflow-hidden">
           {/* The widget will fill this container's height */}
           <TradingViewScreener />
        </div>

      </div>
    </div>
  );
}