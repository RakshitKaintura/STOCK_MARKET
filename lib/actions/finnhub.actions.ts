"use server";

import _yahooFinance from "yahoo-finance2";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getWatchlistSymbolsByEmail } from "./watchlist.actions";

// ─── 0. Yahoo Finance Configuration ──────────────────────────────────────────
const yahooFinanceModule = (_yahooFinance as any).default || _yahooFinance;
const yahooFinance = typeof yahooFinanceModule === "function" 
  ? new yahooFinanceModule() 
  : yahooFinanceModule;

if (yahooFinance && yahooFinance.suppressNotices) {
  yahooFinance.suppressNotices(['yahooSurvey', 'validation']);
}

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  datetime: string;
  source: string;
  image: string | null;
}

// ─── Formatters ─────────────────────────────────────────────────────────────
const formatPrice = (number: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(number);
const formatMarketCap = (number: number) => !number ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 2 }).format(number);

// ─── 1. Search Stocks ───────────────────────────────────────────────────────
export const searchStocks = cache(async (query?: string) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    const userWatchlistSymbols = await getWatchlistSymbolsByEmail(session.user.email);
    const trimmed = typeof query === "string" ? query.trim() : "";
    let results: any[] = [];

    if (!trimmed) {
      const POPULAR_INDIAN_STOCKS = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "TATAMOTORS.NS", "LT.NS"];
      results = await Promise.all(POPULAR_INDIAN_STOCKS.map(async (sym) => {
         try { return await yahooFinance.quote(sym); } catch (e) { return null; }
      }));
    } else {
      const searchResult: any = await yahooFinance.search(trimmed);
      if (!searchResult.quotes) return [];
      results = searchResult.quotes.filter((q: any) => q && q.symbol && (q.symbol.endsWith(".NS") || q.symbol.endsWith(".BO") || q.exchange === "NSI" || q.exchange === "BSE"));
    }

    return results.filter((r) => r && r.symbol).map((r) => ({
      symbol: r.symbol,
      name: r.shortname || r.longname || r.symbol,
      exchange: r.exchange === "NSI" ? "NSE" : r.exchange,
      type: "Stock",
      isInWatchlist: userWatchlistSymbols.includes(r.symbol),
    })).slice(0, 15);
  } catch (error) { return []; }
});

// ─── 2. Get Stock Details ───────────────────────────────────────────────────
export const getStocksDetails = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  try {
    const quote: any = await yahooFinance.quote(cleanSymbol);
    const summary: any = await yahooFinance.quoteSummary(cleanSymbol, { modules: ["summaryDetail", "defaultKeyStatistics"] });

    if (!quote || !quote.regularMarketPrice) return null;

    const companyName = quote.longname || quote.shortname || cleanSymbol;

    return {
      symbol: cleanSymbol,
      company: companyName,
      currentPrice: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent || 0,
      priceFormatted: formatPrice(quote.regularMarketPrice),
      changeFormatted: `${(quote.regularMarketChangePercent || 0) > 0 ? "+" : ""}${(quote.regularMarketChangePercent || 0).toFixed(2)}%`,
      peRatio: summary.summaryDetail?.trailingPE?.toFixed(2) || "—",
      marketCapFormatted: formatMarketCap(quote.marketCap || 0),
    };
  } catch (error) { return null; }
});

// ─── 3. Get News (Google News RSS - High Accuracy Mode) ─────────────────────
export const getNews = async (companyNames?: string[], isFallbackAttempt = false): Promise<NewsItem[]> => {
  try {
    // 1. Build a "Financial Only" Query
    let query = "Indian Stock Market";

    if (companyNames && companyNames.length > 0) {
      // Take top 5 companies (increased from 3)
      const terms = companyNames.slice(0, 5).map(name => {
        // Clean the name slightly but keep it specific
        const clean = name
          .replace("Limited", "")
          .replace("Ltd", "")
          .replace("Corporation", "")
          .trim();
        return `"${clean}"`; // Quotes enforce exact match
      });

      // KEY CHANGE: We force the search to include financial context words.
      // Format: ("Reliance" OR "TCS") AND (stock OR share OR market OR price)
      const companiesGroup = `(${terms.join(" OR ")})`;
      const contextGroup = `(stock OR share OR market OR price OR sensex OR nifty)`;
      
      query = `${companiesGroup} AND ${contextGroup}`;
    }

    console.log(`Fetching Targeted News for: ${query}`);

    // 2. Fetch RSS Feed (India Edition)
    // 'when:7d' ensures we don't get ancient news
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:7d")}&hl=en-IN&gl=IN&ceid=IN:en`;
    
    const response = await fetch(rssUrl, { next: { revalidate: 1800 } }); // Cache for 30 mins
    if (!response.ok) {
      console.error(`Google News RSS request failed: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();

    // 3. Parse XML
    const items: NewsItem[] = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const titleRegex = /<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const sourceRegex = /<source url=".*?">(.*?)<\/source>/;
    const descRegex = /<description>([\s\S]*?)<\/description>/;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      if (items.length >= 10) break; // Limit to 10 items

      const itemBlock = match[0];
      const titleMatch = titleRegex.exec(itemBlock);
      const linkMatch = linkRegex.exec(itemBlock);
      const dateMatch = dateRegex.exec(itemBlock);
      const sourceMatch = sourceRegex.exec(itemBlock);
      const descMatch = descRegex.exec(itemBlock);

      // Try to extract an image from description HTML (Google sometimes puts it there)
      let imageUrl: string | null = null;
      if (descMatch) {
        const imgMatch = /src="(.*?)"/.exec(descMatch[1]);
        if (imgMatch) imageUrl = imgMatch[1];
      }

      if (titleMatch && linkMatch) {
        items.push({
          headline: titleMatch[1]
            .replace(" - Google News", "")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"'), 
          summary: "Click to read full coverage.", // Google RSS summaries are often messy HTML
          url: linkMatch[1],
          datetime: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          source: sourceMatch ? sourceMatch[1] : "Google News",
          image: imageUrl 
        });
      }
    }

    // 4. Fallback if empty
    if (items.length === 0) {
      if (isFallbackAttempt || !companyNames || companyNames.length === 0) {
        return [];
      }

      console.log("No specific news found. Fetching fallback...");
      return getNews([], true);
    }

    return items;

  } catch (error) {
    console.error("News Fetch Error:", error);
    return [];
  }
};