'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1/';
// Use server-side env variable primarily; fallback only if necessary
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    if (!FINNHUB_API_KEY) throw new Error('FINNHUB API key is not configured');

    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.slice(0, 5).map(async (sym) => { // Limit symbols to prevent rate-limiting
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${FINNHUB_API_KEY}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Use index instead of .shift() to avoid mutating source during the loop
      const symbolIndices: Record<string, number> = {};
      
      for (let round = 0; round < maxArticles; round++) {
        for (const sym of cleanSymbols) {
          const list = perSymbolArticles[sym] || [];
          const currentIndex = symbolIndices[sym] || 0;
          
          if (currentIndex < list.length) {
            const article = list[currentIndex];
            collected.push(formatArticle(article, true, sym, round));
            symbolIndices[sym] = currentIndex + 1;
          }
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        return collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0)).slice(0, maxArticles);
      }
    }

    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= maxArticles) break;
    }

    return unique.map((a, idx) => formatArticle(a, false, undefined, idx));
  } catch (err) {
    console.error('getNews error:', err);
    return []; // Return empty instead of crashing the UI
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    if (!FINNHUB_API_KEY) return [];

    const trimmed = typeof query === 'string' ? query.trim() : '';
    let results: (FinnhubSearchResult & { __exchange?: string })[] = [];

    // 1. FIX INITIAL STATE: Use local constants instead of expensive API calls
    if (!trimmed) {
      // We map the first 10 symbols from your constants file directly.
      // This ensures the UI is NEVER empty when first clicking search.
      return POPULAR_STOCK_SYMBOLS.slice(0, 10).map((sym) => ({
        symbol: sym.toUpperCase(),
        name: sym.toUpperCase(), // Fallback to symbol as name for immediate display
        exchange: 'NSE',          // Defaulting to Indian exchange context
        type: 'Common Stock',
        isInWatchlist: false,
      }));
    }

    // 2. SEARCH STATE: Appending context for Indian Stocks
    // Finnhub search is global, but appending suffixes can help narrow results.
    const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${FINNHUB_API_KEY}`;
    const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
    results = Array.isArray(data?.result) ? data.result : [];

    return results
      .map((r) => {
        const symbol = (r.symbol || '').toUpperCase();
        
        // Clean up the display name: remove the suffix for the UI but keep it for the ticker
        const cleanName = r.description || symbol;
        
        return {
          symbol: symbol,
          name: cleanName,
          // If symbol is RELIANCE.NS, exchange is NSE. Otherwise default to 'US'
          exchange: symbol.includes('.') ? symbol.split('.')[1] : 'US',
          type: r.type || 'Stock',
          isInWatchlist: false,
        };
      })
      // 3. FIX DUPLICATE KEY ERROR: Ensure unique symbols for React keys
      .filter((item, index, self) => 
        index === self.findIndex((t) => t.symbol === item.symbol)
      )
      .slice(0, 15);
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});