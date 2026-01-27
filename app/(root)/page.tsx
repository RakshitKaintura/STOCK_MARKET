import TradingViewWidget from "@/components/TradingViewWidget";
import StockNews from "@/components/StockNews";
import TickerTape from "@/components/TickerTape"; 
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG
} from "@/lib/constants";

const Home = () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    return (
        <div className="flex flex-col min-h-screen home-wrapper">
          
          {/* 1. Ticker Tape (Full Width, touches Navbar) */}
          <TickerTape />

          {/* 2. Top Section: Market Overview & Heatmap */}
          <section className="grid w-full gap-8 home-section">
              <div className="md:col-span-1 xl:col-span-1">
                  <TradingViewWidget
                    title="Market Overview"
                    scriptUrl={`${scriptUrl}market-overview.js`}
                    config={MARKET_OVERVIEW_WIDGET_CONFIG}
                    className="custom-chart"
                    height={600}
                  />
              </div>
              
              <div className="md-col-span xl:col-span-2">
                  <TradingViewWidget
                      title="Stock Heatmap"
                      scriptUrl={`${scriptUrl}stock-heatmap.js`}
                      config={HEATMAP_WIDGET_CONFIG}
                      height={600}
                  />
              </div>
          </section>

          {/* 3. Bottom Section: News & Data Table */}
          <section className="grid w-full gap-8 home-section mt-8">
                <div className="h-full md:col-span-1 xl:col-span-1">
                    <StockNews />
                </div>
                
                <div className="h-full md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        title="Live Market Data"
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={MARKET_DATA_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
        </div>
    )
}

export default Home;