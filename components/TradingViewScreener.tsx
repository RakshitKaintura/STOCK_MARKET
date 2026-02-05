"use client";

import React, { useEffect, useRef, memo } from 'react';

function TradingViewScreener() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // strict mode check: only append if script doesn't exist yet
    if (container.current && !container.current.querySelector("script")) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
      script.type = "text/javascript";
      script.async = true;
      
      // Configuration
      script.innerHTML = JSON.stringify({
        "width": "100%",
        "height": "100%",
        "defaultColumn": "overview",
        "defaultScreen": "most_capitalized",
        "market": "india",
        "showToolbar": true,
        "colorTheme": "dark",
        "locale": "en",
        "isTransparent": true 
      });
      
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewScreener);