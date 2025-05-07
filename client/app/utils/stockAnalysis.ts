import { MarketCapCategory, type CategorizedStock, type CategorizedStocksResult, type CSVRow, type ProcessResult, type StockData } from '../types';

/**
 * Find stocks within specified percentage threshold of their all-time high
 */
export const findStocksWithinThreshold = (
  data: CSVRow[], 
  priceColumn: string, 
  highColumn: string, 
  percentThreshold: number
): CSVRow[] => {
  if (!data || data.length === 0) return [];

  return data.filter(row => {
    // Handle different column name formats
    const priceKey = Object.keys(row).find(key => 
      key === priceColumn || key.toLowerCase().includes('price')
    );
    
    const highKey = Object.keys(row).find(key => 
      key === highColumn || 
      key.toLowerCase().includes('high') || 
      key.toLowerCase().includes('all time')
    );

    if (!priceKey || !highKey) return false;

    // Extract numeric values
    let currentPrice = parseFloat(String(row[priceKey]).replace(/[^0-9.-]+/g, ''));
    let highPrice = parseFloat(String(row[highKey]).replace(/[^0-9.-]+/g, ''));

    // Check if the stock is at most percentThreshold% below its all-time high
    return !isNaN(currentPrice) && 
           !isNaN(highPrice) && 
           highPrice > 0 && 
           (highPrice - currentPrice) / highPrice <= percentThreshold / 100;
  });
};

/**
 * Find stocks that are exactly at or have just made a new all-time high
 */
export const findStocksAtAllTimeHigh = (
  data: CSVRow[],
  priceColumn?: string,
  highColumn?: string,
  tolerancePercent: number = 0.1
): CSVRow[] => {
  if (!data || data.length === 0) return [];
  
  return data.filter(row => {
    // Auto-detect column names if not provided
    const priceKey = priceColumn || Object.keys(row).find(key => 
      key.toLowerCase().includes('price') || 
      key.toLowerCase() === 'price' ||
      key.toLowerCase().includes('current')
    );
    
    const highKey = highColumn || Object.keys(row).find(key => 
      key.toLowerCase().includes('high all time') || 
      key.toLowerCase().includes('all time high') || 
      key.toLowerCase().includes('ath')
    );
    
    if (!priceKey || !highKey) return false;
    
    // Extract numeric values using your existing helper function
    const currentPrice = extractNumericPrice(row[priceKey]);
    const highPrice = extractNumericPrice(row[highKey]);
    
    // A stock is considered at all-time high if the current price is at least
    // equal to the all-time high, or very slightly below it (within tolerance)
    // We allow a tiny tolerance to account for minor fluctuations or rounding errors
    return !isNaN(currentPrice) &&
           !isNaN(highPrice) &&
           highPrice > 0 &&
           ((highPrice - currentPrice) / highPrice <= tolerancePercent / 100 || currentPrice >= highPrice);
  });
};


/**
 * Sort stocks by how close they are to their all-time high
 * Returns stocks sorted from closest to ATH to furthest
 */
export const sortStocksByProximityToATH = (
  data: CSVRow[],
  priceColumn?: string,
  highColumn?: string
): CSVRow[] => {
  if (!data || data.length === 0) return [];
  
  return [...data].sort((a, b) => {
    // Auto-detect column names if not provided
    const priceKey = priceColumn || Object.keys(a).find(key => 
      key.toLowerCase().includes('price') || 
      key.toLowerCase() === 'price'
    );
    
    const highKey = highColumn || Object.keys(a).find(key => 
      key.toLowerCase().includes('high all time') || 
      key.toLowerCase().includes('all time high') || 
      key.toLowerCase().includes('ath')
    );
    
    if (!priceKey || !highKey) return 0;
    
    // Calculate percentage from high for both stocks
    const aPricePercent = calculatePercentFromHigh(
      extractNumericPrice(a[priceKey]), 
      extractNumericPrice(a[highKey])
    );
    
    const bPricePercent = calculatePercentFromHigh(
      extractNumericPrice(b[priceKey]), 
      extractNumericPrice(b[highKey])
    );
    
    // Sort by ascending percentage difference (lower is closer to ATH)
    return aPricePercent - bPricePercent;
  });
};

/**
 * Calculate percentage from high price
 */
export const calculatePercentFromHigh = (price: number, high: number): number => {
  return high > 0 ? ((high - price) / high) * 100 : 0;
};

/**
 * Extract numeric price from string
 */
export const extractNumericPrice = (value: any): number => {
  if (typeof value === 'number') return value;
  return parseFloat(String(value || '0').replace(/[^0-9.-]+/g, ''));
};

/**
 * Find appropriate column names in the data
 */
export const findColumnNames = (headers: string[]) => {
  // Try to identify the price and high columns
  const priceColumn = headers.find(h => 
    h.toLowerCase().includes('price') ||
    h.toLowerCase() === 'price'
  ) || '';
  
  const highColumn = headers.find(h => 
    h.toLowerCase().includes('high all time') || 
    h.toLowerCase().includes('all time high') ||
    h.toLowerCase().includes('ath')
  ) || '';

  const symbolColumn = headers.find(h => 
    h.toLowerCase() === 'symbol' || 
    h.toLowerCase().includes('ticker') ||
    h.toLowerCase().includes('code')
  ) || '';
  
  return { priceColumn, highColumn, symbolColumn };
};

/**
 * Add TradingView symbols to the data
 */
export const addTradingViewSymbols = (data: CSVRow[]): CSVRow[] => {
  return data.map(row => {
    const symbolKey = Object.keys(row).find(key => 
      key.toLowerCase() === 'symbol' || 
      key.toLowerCase().includes('ticker') ||
      key.toLowerCase().includes('code')
    );
    
    if (symbolKey && row[symbolKey]) {
      return {
        ...row,
        "TV SYMBOL": `NSE:${row[symbolKey]}`,
        "Category": getCategoryForStock(row)
      };
    }
    return row;
  });
};


/**
 * Categorizes stocks based on market capitalization
 * Large Cap: > 20,000 Crore INR
 * Mid Cap: 5,000 to 20,000 Crore INR
 * Small Cap: 500 to 5,000 Crore INR
 * Micro Cap: < 500 Crore INR
 * 
 * @param stocksData - Array of stock data objects
 * @returns Object with stocks categorized by market cap
 */
function categorizeStocksByMarketCap(stocksData: StockData[]): CategorizedStocksResult {
  // Define category thresholds in INR
  const LARGE_CAP_THRESHOLD: number = 200000000000; // 20,000 Crore INR
  const MID_CAP_THRESHOLD: number = 50000000000;    // 5,000 Crore INR
  const SMALL_CAP_THRESHOLD: number = 5000000000;   // 500 Crore INR
  
  // Initialize categories
  const categories: CategorizedStocksResult = {
    largeCap: [],
    midCap: [],
    smallCap: [],
    microCap: [],
    unknown: []
  };
  
  stocksData.forEach((stock: StockData) => {
    const category = determineCategory(stock);
    
    const categorizedStock: CategorizedStock = {
      symbol: stock.Symbol,
      description: stock.Description,
      marketCap: stock["Market capitalization"],
      marketCapCurrency: stock["Market capitalization - Currency"]
    };
    
    switch(category) {
      case MarketCapCategory.LARGE_CAP:
        categories.largeCap.push(categorizedStock);
        break;
      case MarketCapCategory.MID_CAP:
        categories.midCap.push(categorizedStock);
        break;
      case MarketCapCategory.SMALL_CAP:
        categories.smallCap.push(categorizedStock);
        break;
      case MarketCapCategory.MICRO_CAP:
        categories.microCap.push(categorizedStock);
        break;
      default:
        categories.unknown.push(categorizedStock);
        break;
    }
  });
  
  return categories;
  
  /**
   * Determines the category of a stock based on its market capitalization
   * @param stock - Stock data object
   * @returns Category name
   */
  function determineCategory(stock: StockData): MarketCapCategory {
    // Extract market cap value and currency
    const marketCap = stock["Market capitalization"];
    
    // Handle missing market cap
    if (!marketCap || marketCap === "" || isNaN(Number(marketCap))) {
      return MarketCapCategory.UNKNOWN;
    }
    
    // Convert market cap to number
    const marketCapValue: number = Number(marketCap);
    
    // Categorize based on thresholds
    if (marketCapValue >= LARGE_CAP_THRESHOLD) {
      return MarketCapCategory.LARGE_CAP;
    } else if (marketCapValue >= MID_CAP_THRESHOLD) {
      return MarketCapCategory.MID_CAP;
    } else if (marketCapValue >= SMALL_CAP_THRESHOLD) {
      return MarketCapCategory.SMALL_CAP;
    } else {
      return MarketCapCategory.MICRO_CAP;
    }
  }
}

/**
 * Example usage with sample data
 */
export function processStocksData(stocksData: StockData[]): ProcessResult {
  const categorizedStocks = categorizeStocksByMarketCap(stocksData);
  
  // Summary information
  const summary = {
    total: stocksData.length,
    largeCap: categorizedStocks.largeCap.length,
    midCap: categorizedStocks.midCap.length,
    smallCap: categorizedStocks.smallCap.length,
    microCap: categorizedStocks.microCap.length,
    unknown: categorizedStocks.unknown.length
  };
  
  return {
    summary,
    categorizedStocks
  };
}

/**
 * Get category for a single stock
 * @param stock - Stock data object
 * @returns The market cap category
 */
export function getCategoryForStock(stock: CSVRow): MarketCapCategory {
  const LARGE_CAP_THRESHOLD: number = 200000000000; // 20,000 Crore INR
  const MID_CAP_THRESHOLD: number = 50000000000;    // 5,000 Crore INR
  const SMALL_CAP_THRESHOLD: number = 5000000000;   // 500 Crore INR
  
  // Extract market cap value
  const marketCap = stock["Market capitalization"];
  
  // Handle missing market cap
  if (!marketCap || marketCap === "" || isNaN(Number(marketCap))) {
    return MarketCapCategory.UNKNOWN;
  }
  
  // Convert market cap to number
  const marketCapValue: number = Number(marketCap);
  
  // Categorize based on thresholds
  if (marketCapValue >= LARGE_CAP_THRESHOLD) {
    return MarketCapCategory.LARGE_CAP;
  } else if (marketCapValue >= MID_CAP_THRESHOLD) {
    return MarketCapCategory.MID_CAP;
  } else if (marketCapValue >= SMALL_CAP_THRESHOLD) {
    return MarketCapCategory.SMALL_CAP;
  } else {
    return MarketCapCategory.MICRO_CAP;
  }
}