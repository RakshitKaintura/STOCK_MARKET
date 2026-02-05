"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { Star, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

interface WatchlistButtonProps {
  symbol: string;
  company: string;
  isInWatchlist: boolean;
  showTrashIcon?: boolean;
  type?: "button" | "icon";
  className?:string;
  onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
}

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);

  const label = useMemo(() => {
    if (type === "icon") return "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const toggleWatchlist = async () => {
    const result = added
      ? await removeFromWatchlist(symbol)
      : await addToWatchlist(symbol, company);

    if (result.success) {
      toast.success(added ? "Removed from Watchlist" : "Added to Watchlist", {
        description: `${company} ${added ? "removed from" : "added to"} your watchlist`,
      });
      onWatchlistChange?.(symbol, !added);
    }
  };

  const debouncedToggle = useDebounce(toggleWatchlist, 300);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAdded(!added);
    debouncedToggle();
  };

  if (type === "icon") {
    return (
      <button
        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${added ? "text-yellow-500" : "text-gray-400"}`}
        onClick={handleClick}
      >
        {showTrashIcon && added ? <Trash2 size={18} /> : <Star size={18} fill={added ? "currentColor" : "none"} />}
      </button>
    );
  }

  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        added ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
      onClick={handleClick}
    >
      {showTrashIcon && added ? <Trash2 size={16} /> : <Star size={16} fill={added ? "currentColor" : "none"} />}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;