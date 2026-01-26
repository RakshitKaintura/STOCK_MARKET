export const NAV_ITEMS = [
    { href: '/', label: 'Dashboard' },
    { href: '/search', label: 'Search' },
    { href: '/watchlist', label: 'Watchlist' },
];

// Sign-up form select options
export const INVESTMENT_GOALS = [
    { value: 'Growth', label: 'Growth' },
    { value: 'Income', label: 'Income' },
    { value: 'Balanced', label: 'Balanced' },
    { value: 'Conservative', label: 'Conservative' },
];

export const RISK_TOLERANCE_OPTIONS = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
];

export const PREFERRED_INDUSTRIES = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Banking', label: 'Banking' },
    { value: 'Pharmaceuticals', label: 'Pharmaceuticals' },
    { value: 'Automobiles', label: 'Automobiles' },
    { value: 'FMCG', label: 'FMCG' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Metals', label: 'Metals' },
];

export const ALERT_TYPE_OPTIONS = [
    { value: 'price', label: 'Price' },
    { value: 'volume', label: 'Volume' },
];

export const CONDITION_OPTIONS = [
    { value: 'greater', label: 'Greater than (>)' },
    { value: 'less', label: 'Less than (<)' },
];

// TradingView Charts for BSE
export const MARKET_OVERVIEW_WIDGET_CONFIG = {
    colorTheme: 'dark',
    dateRange: '12M',
    locale: 'en',
    largeChartUrl: '',
    isTransparent: true,
    showFloatingTooltip: true,
    plotLineColorGrowing: '#0FEDBE',
    plotLineColorFalling: '#0FEDBE',
    gridLineColor: 'rgba(240, 243, 250, 0)',
    scaleFontColor: '#DBDBDB',
    belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
    belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
    belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
    belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
    symbolActiveColor: 'rgba(15, 237, 190, 0.05)',
    tabs: [
        {
            title: 'Banking',
            symbols: [
                { s: 'BSE:HDFCBANK', d: 'HDFC Bank' },
                { s: 'BSE:ICICIBANK', d: 'ICICI Bank' },
                { s: 'BSE:SBIN', d: 'State Bank of India' },
                { s: 'BSE:AXISBANK', d: 'Axis Bank' },
                { s: 'BSE:KOTAKBANK', d: 'Kotak Mahindra Bank' },
                { s: 'BSE:INDUSINDBK', d: 'IndusInd Bank' },
            ],
        },
        {
            title: 'Technology',
            symbols: [
                { s: 'BSE:TCS', d: 'Tata Consultancy Services' },
                { s: 'BSE:INFY', d: 'Infosys' },
                { s: 'BSE:WIPRO', d: 'Wipro' },
                { s: 'BSE:HCLTECH', d: 'HCL Technologies' },
                { s: 'BSE:TECHM', d: 'Tech Mahindra' },
                { s: 'BSE:LTI', d: 'LTIMindtree' },
            ],
        },
        {
            title: 'FMCG & Conglomerates',
            symbols: [
                { s: 'BSE:RELIANCE', d: 'Reliance Industries' },
                { s: 'BSE:HINDUNILVR', d: 'Hindustan Unilever' },
                { s: 'BSE:ITC', d: 'ITC Limited' },
                { s: 'BSE:NESTLEIND', d: 'Nestle India' },
                { s: 'BSE:BRITANNIA', d: 'Britannia Industries' },
            ],
        },
    ],
    support_host: 'https://www.tradingview.com',
    backgroundColor: '#141414',
    width: '100%',
    height: 600,
    showSymbolLogo: true,
    showChart: true,
};

// Note: TradingView's heatmap widget has limited support for BSE
// You may need to use NSE (National Stock Exchange) instead for better widget support
export const HEATMAP_WIDGET_CONFIG = {
    dataSource: 'SENSEX', // Use SENSEX for reliable Indian map; NIFTY50 often fails in free widgets
    blockSize: 'market_cap_basic',
    blockColor: 'change',
    grouping: 'sector',
    isTransparent: true,
    locale: 'in',
    symbolUrl: '',
    colorTheme: 'dark',
    exchanges: [],
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: '100%',
    height: '600',
};

// Note: TradingView's Top Stories widget shows global market news
// It cannot be filtered to show only Indian market news
// You may want to integrate with Indian news APIs like:
// - Economic Times API
// - Moneycontrol API
// - NSE/BSE news feeds
export const TOP_STORIES_WIDGET_CONFIG = {
    displayMode: 'regular',
    feedMode: 'market',
    colorTheme: 'dark',
    isTransparent: true,
    locale: 'en',
    market: 'stock',
    width: '100%',
    height: '600',
};

export const MARKET_DATA_WIDGET_CONFIG = {
    title: 'BSE Stocks',
    width: '100%',
    height: 600,
    locale: 'en',
    showSymbolLogo: true,
    colorTheme: 'dark',
    isTransparent: false,
    backgroundColor: '#0F0F0F',
    symbolsGroups: [
        {
            name: 'Banking',
            symbols: [
                { name: 'BSE:HDFCBANK', displayName: 'HDFC Bank' },
                { name: 'BSE:ICICIBANK', displayName: 'ICICI Bank' },
                { name: 'BSE:SBIN', displayName: 'State Bank of India' },
                { name: 'BSE:AXISBANK', displayName: 'Axis Bank' },
                { name: 'BSE:KOTAKBANK', displayName: 'Kotak Mahindra Bank' },
                { name: 'BSE:INDUSINDBK', displayName: 'IndusInd Bank' },
            ],
        },
        {
            name: 'Technology',
            symbols: [
                { name: 'BSE:TCS', displayName: 'Tata Consultancy Services' },
                { name: 'BSE:INFY', displayName: 'Infosys' },
                { name: 'BSE:WIPRO', displayName: 'Wipro' },
                { name: 'BSE:HCLTECH', displayName: 'HCL Technologies' },
                { name: 'BSE:TECHM', displayName: 'Tech Mahindra' },
                { name: 'BSE:LTI', displayName: 'LTIMindtree' },
            ],
        },
        {
            name: 'FMCG & Conglomerates',
            symbols: [
                { name: 'BSE:RELIANCE', displayName: 'Reliance Industries' },
                { name: 'BSE:HINDUNILVR', displayName: 'Hindustan Unilever' },
                { name: 'BSE:ITC', displayName: 'ITC Limited' },
                { name: 'BSE:NESTLEIND', displayName: 'Nestle India' },
                { name: 'BSE:BRITANNIA', displayName: 'Britannia Industries' },
            ],
        },
    ],
};

export const POPULAR_STOCK_SYMBOLS = [
    // Banking & Financial Services
    'HDFCBANK',
    'ICICIBANK',
    'SBIN',
    'AXISBANK',
    'KOTAKBANK',
    'INDUSINDBK',
    'BAJFINANCE',
    'BAJAJFINSV',
    'HDFCLIFE',
    'SBILIFE',

    // IT & Technology
    'TCS',
    'INFY',
    'WIPRO',
    'HCLTECH',
    'TECHM',
    'LTI',
    'MPHASIS',
    'COFORGE',
    'PERSISTENT',
    'LTTS',

    // Energy & Oil
    'RELIANCE',
    'ONGC',
    'BPCL',
    'IOC',
    'COALINDIA',
    'POWERGRID',
    'NTPC',
    'ADANIGREEN',
    'ADANIPORTS',
    'ADANITRANS',

    // FMCG & Consumer
    'HINDUNILVR',
    'ITC',
    'NESTLEIND',
    'BRITANNIA',
    'DABUR',
    'MARICO',
    'GODREJCP',
    'TATACONSUM',
    'COLPAL',
    'PIDILITIND',

    // Automobiles
    'MARUTI',
    'TATAMOTORS',
    'M&M',
    'BAJAJ-AUTO',
    'HEROMOTOCO',
    'EICHERMOT',
    'ASHOKLEY',
    'TVSMOTOR',
    'BOSCHLTD',
    'MOTHERSON',

    // Pharmaceuticals
    'SUNPHARMA',
    'DRREDDY',
    'CIPLA',
    'DIVISLAB',
    'AUROPHARMA',
    'LUPIN',
    'BIOCON',
    'TORNTPHARM',
    'ALKEM',
    'GLENMARK',

    // Metals & Mining
    'TATASTEEL',
    'HINDALCO',
    'JSWSTEEL',
    'VEDL',
    'SAIL',
    'JINDALSTEL',
    'NMDC',
    'HINDZINC',
    'NATIONALUM',
    'MOIL',

    // Infrastructure & Construction
    'LT',
    'ULTRACEMCO',
    'GRASIM',
    'SHREECEM',
    'AMBUJACEM',
    'ACC',
    'ASTRAL',
    'CERA',
    'RAMCOCEM',
    'JKCEMENT',

    // Telecom & Media
    'BHARTIARTL',
    'ZEEL',
    'SUNTV',
    'HATHWAY',
    'DEN',
    'TATACOMM',
];