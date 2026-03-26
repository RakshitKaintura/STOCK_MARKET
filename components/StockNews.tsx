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
        const res = await fetch('/api/news', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await res.json();

        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setNews(data.articles);
        } else {
          setError("No news available right now");
        }
      } catch {
        setError("Error fetching news");
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