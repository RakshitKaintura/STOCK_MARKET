'use client';

import React, { useEffect, useState } from 'react';

interface NewsItem {
  title: string;
  description: string;
  source: { name: string; url: string };
  url: string;
  publishedAt: string;
}

const StockNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GNEWS_API_KEY;
        if (!apiKey) {
            setError("Missing API Key");
            setLoading(false);
            return;
        }

        const query = 'Indian Stock Market OR Sensex OR Nifty OR Reliance Industries';
        const res = await fetch(`https://gnews.io/api/v4/search?q=${query}&lang=en&country=in&max=8&apikey=${apiKey}`);
        const data = await res.json();

        if (data.articles) setNews(data.articles);
        else setError("Failed to load news");
      } catch (err) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="w-full h-[600px] flex flex-col bg-[#0F0F0F] rounded-lg border border-[#2A2E39] overflow-hidden">
      <div className="p-4 border-b border-[#2A2E39] bg-[#141414]">
        <h3 className="text-xl font-semibold text-gray-100">📰 Top Stories</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading && <p className="text-gray-400 text-center mt-10">Loading news...</p>}
        {error && <p className="text-red-400 text-center mt-10">{error}</p>}

        {!loading && !error && news.map((item, index) => (
          <a key={index} href={item.url} target="_blank" rel="noopener noreferrer"
             className="block p-4 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-transparent hover:border-blue-500/50 transition-all">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase">{item.source.name}</span>
              <span className="text-xs text-gray-500">{new Date(item.publishedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-200 mb-2">{item.title}</h4>
            <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default StockNews;