import React from "react";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { searchStocks, getNews } from "@/lib/actions/finnhub.actions";
import SearchCommand from "@/components/SearchCommand";
import { WatchlistTable } from "@/components/WatchlistTable";
import Link from "next/link";
import { ExternalLink, Newspaper, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Helper: Time Ago Formatter ─────────────────────────────────────────────
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

// ─── Main Page Component ────────────────────────────────────────────────────
export default async function WatchlistPage() {
  // 1. Fetch Watchlist Data (Server Side)
  const watchlist = await getWatchlistWithData();
  const initialStocks = await searchStocks();

  // 2. Extract Company Names for News Search
  // We use names (e.g., "Reliance Industries") instead of symbols ("RELIANCE.NS")
  // because Google News works much better with names.
  const watchlistNames = watchlist.map((item: any) => item.company);
  
  // 3. Fetch News
  const news = await getNews(watchlistNames);

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e2e4e9] font-sans text-sm pb-10">
      <div className="flex flex-col lg:flex-row gap-8 px-4 lg:px-8 py-7 max-w-[1400px] mx-auto">
        
        {/* ─── LEFT COLUMN: Watchlist Table ─── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Watchlist</h1>
              <p className="text-[#7a7f8e] text-xs mt-1">
                Tracking {watchlist.length} stock{watchlist.length !== 1 && "s"}
              </p>
            </div>
            
            {/* Search / Add Stock Button */}
            <div className="relative z-10">
               <SearchCommand 
                 initialStocks={initialStocks} 
                 renderAs="button"
                 label="Add Stock"
               />
            </div>
          </div>
          
          <WatchlistTable watchlist={watchlist} />
        </div>

        {/* ─── RIGHT COLUMN: Related News ─── */}
        <div className="w-full lg:w-[360px] shrink-0">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-4 p-1">
              <Newspaper className="text-[#d4a017] w-5 h-5" />
              <h2 className="text-[18px] font-bold text-white">Related News</h2>
            </div>
            
            <div className="flex flex-col gap-3">
              {news && news.length > 0 ? (
                news.map((item: any, i: number) => (
                  <Link
                    key={i}
                    href={item.url || "#"}
                    target="_blank"
                    className="group block bg-[#161922] border border-[#1e2128] rounded-xl p-4 hover:bg-[#1c1f28] hover:border-[#2a2e39] transition-all"
                  >
                    <div className="flex flex-col gap-2">
                      
                      {/* Source & Time */}
                      <div className="flex items-center justify-between text-xs text-[#7a7f8e]">
                        <span className="font-bold text-[#d4a017] bg-[#d4a017]/10 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider truncate max-w-[150px]">
                          {item.source}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock size={10} />
                          <span>{formatTimeAgo(item.datetime)}</span>
                        </div>
                      </div>

                      {/* Headline */}
                      <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-[#3b82f6] transition-colors line-clamp-2">
                        {item.headline}
                      </h3>

                      {/* Summary (if available) */}
                      {item.summary && !item.summary.includes("Click to read") && (
                        <p className="text-xs text-[#7a7f8e] line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-1 text-[11px] text-[#555969] mt-1 group-hover:text-[#7a7f8e]">
                        <span>Read full story</span>
                        <ExternalLink size={10} />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-[#161922] rounded-xl border border-[#1e2128] p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No recent news found for your watchlist.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}