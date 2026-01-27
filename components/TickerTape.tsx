'use client';

import React, { useEffect, useRef } from 'react';

const TickerTape = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent duplicate scripts
    if (!containerRef.current || containerRef.current.querySelector('script')) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.type = 'text/javascript';
    
    // Configuration object
    script.innerHTML = JSON.stringify({
      "symbols": [
   
        { "proName": "BSE:SENSEX", "title": "Sensex" },
        
        // US MARKETS
        { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" },
        { "proName": "FOREXCOM:NSXUSD", "title": "Nasdaq 100" },
        
        // GLOBAL MARKETS (Fixed Symbols)
        { "proName": "OANDA:JP225USD", "title": "Nikkei 225" },  // Works 100%
        { "proName": "FOREXCOM:HK50", "title": "Hang Seng" },      // Fixed: Free CFD ticker
        
        // COMMODITIES
        { "proName": "TVC:GOLD", "title": "Gold" },
        { "proName": "TVC:SILVER", "title": "Silver" },
        { "proName": "TVC:USOIL", "title": "Crude Oil" },
        
        // CRYPTO
        { "proName": "BITSTAMP:BTCUSD", "title": "Bitcoin" },
        { "proName": "BITSTAMP:ETHUSD", "title": "Ethereum" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "isTransparent": false,
      "displayMode": "adaptive",
      "locale": "in"
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    // CSS to force full width and touch the navbar
    <div className="relative w-screen left-1/2 -ml-[50vw] -mt-10 mb-3 z-0">
      <div className="tradingview-widget-container" ref={containerRef}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
};

export default TickerTape;