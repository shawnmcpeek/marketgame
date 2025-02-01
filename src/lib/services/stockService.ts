const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  companyName: string;
  timestamp?: number;
}

export interface CachedQuote extends StockQuote {
  timestamp: number;
}

const quoteCache: Record<string, CachedQuote> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function searchStocks(query: string): Promise<StockQuote[]> {
  console.log('Searching for:', query);
  
  const response = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${API_KEY}`
  );
  const data = await response.json();
  
  if (!data.result) return [];
  
  // Filter for US stocks only (no dots in symbol)
  const usStocks = data.result.filter((match: any) => !match.symbol.includes('.'));
  
  // Get quotes for filtered results
  const quotes = await Promise.all(
    usStocks.slice(0, 5).map(async (match: any) => {
      try {
        const quote = await getStockQuote(match.symbol);
        return {
          ...quote,
          companyName: match.description
        };
      } catch (e) {
        console.error(`Error fetching quote for ${match.symbol}:`, e);
        return null;
      }
    })
  );

  return quotes.filter((q): q is StockQuote => q !== null);
}

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  // Check cache first
  const cached = quoteCache[symbol];
  const now = Date.now();
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached;
  }

  const response = await fetch(
    `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`
  );
  const data = await response.json();
  
  if (data.c) { // Current price exists
    const stockQuote = {
      symbol,
      price: data.c,
      change: data.d,
      percentChange: data.dp,
      companyName: symbol,
      timestamp: now
    };
    
    quoteCache[symbol] = stockQuote;
    return stockQuote;
  }
  
  return {
    symbol,
    price: 0,
    change: 0,
    percentChange: 0,
    companyName: symbol,
    timestamp: now
  };
} 