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
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&exchange=US&token=${API_KEY}`
  );
  const data = await response.json();
  
  console.log('Search response:', data);
  
  if (!data.result) return [];
  
  // Filter for common stocks (exclude warrants, ETFs, etc)
  const usStocks = data.result
    .filter((match: any) => !match.symbol.includes('.') && match.type === 'Common Stock')
    .slice(0, 5);  // Limit to top 5 results
  
  console.log('Filtered US stocks:', usStocks);
  
  // Get quotes for filtered results
  const quotes = await Promise.all(
    usStocks.map(async (match: any) => {
      try {
        const quote = await getStockQuote(match.symbol);
        if (!quote) return null;
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

  console.log('Final quotes:', quotes);

  return quotes.filter((q): q is StockQuote => q !== null);
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
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
  
  // If we can't get a price, return null so it's filtered out
  return null;
} 