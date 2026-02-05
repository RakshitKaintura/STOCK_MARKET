"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { getStocksDetails } from "./finnhub.actions";

// 1. Add Stock
export const addToWatchlist = async (symbol: string, company: string) => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    const existingItem = await Watchlist.findOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    if (existingItem) {
      return { success: false, error: "Stock already in watchlist" };
    }

    // FIX: Add safety check for company name
    const safeCompanyName = (company || symbol || "Unknown").toString();

    const newItem = new Watchlist({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
      company: safeCompanyName.trim(),
    });

    await newItem.save();
    revalidatePath("/watchlist");

    return { success: true, message: "Stock added to watchlist" };
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw new Error("Failed to add stock to watchlist");
  }
};

// 2. Remove Stock
export const removeFromWatchlist = async (symbol: string) => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });
    revalidatePath("/watchlist");

    return { success: true, message: "Stock removed from watchlist" };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw new Error("Failed to remove stock from watchlist");
  }
};

// 3. Get User Watchlist
export const getUserWatchlist = async () => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    const watchlist = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(watchlist));
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};

// 4. Get Watchlist Symbols by Email
export const getWatchlistSymbolsByEmail = async (email: string) => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.email !== email) return [];

    const watchlist = await Watchlist.find({ userId: session.user.id }).select("symbol");
    return watchlist.map((item) => item.symbol);
  } catch (error) {
    return [];
  }
};

// 5. Get Watchlist with Full Data
export const getWatchlistWithData = async () => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    const watchlist = await Watchlist.find({ userId: session.user.id }).sort({ addedAt: -1 }).lean();

    if (watchlist.length === 0) return [];

    const stocksWithData = await Promise.all(
      watchlist.map(async (item) => {
        const stockData = await getStocksDetails(item.symbol);

        if (!stockData) {
          return {
             ...item,
             priceFormatted: "—",
             changeFormatted: "—",
             changePercent: 0,
             marketCap: "—",
             peRatio: "—"
          };
        }

        return {
          company: stockData.company,
          symbol: stockData.symbol,
          currentPrice: stockData.currentPrice,
          priceFormatted: stockData.priceFormatted,
          changeFormatted: stockData.changeFormatted,
          changePercent: stockData.changePercent,
          marketCap: stockData.marketCapFormatted,
          peRatio: stockData.peRatio,
        };
      })
    );

    return JSON.parse(JSON.stringify(stocksWithData));
  } catch (error) {
    console.error("Error loading watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};