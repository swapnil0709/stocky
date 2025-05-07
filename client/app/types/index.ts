// Common type definitions

export interface CSVRow {
    [key: string]: string | number | boolean | null;
  }
  
  export interface FileUploadStatus {
    status: 'idle' | 'uploading' | 'success' | 'error';
    message: string;
  }
  
  export interface SortConfig {
    key: string;
    direction: 'ascending' | 'descending';
  }
  
  export interface FilterConfig {
    [key: string]: string;
  }
  
  export interface StockAnalysisProps {
    data: CSVRow[];
    priceColumn: string;
    highColumn: string;
    percentThreshold: number;
  }

  /**
 * Interface representing stock data structure
 */
  export interface StockData {
  Symbol: string;
  Description: string;
  Price: string | number;
  "Price - Currency": string;
  "Price Change % 1 day": string | number;
  "Volume 1 day": string | number;
  "Market capitalization": string | number;
  "Market capitalization - Currency": string;
  "Price to earnings ratio": string | number;
  Sector: string;
  Exchange: string;
  Industry: string;
  "International Securities Identification Number": string;
  "Upcoming earnings date": string;
  [key: string]: any; // Allow other properties that might be present
}

/**
 * Enum representing stock market cap categories
 */
export enum MarketCapCategory {
  LARGE_CAP = "Large Cap",
  MID_CAP = "Mid Cap",
  SMALL_CAP = "Small Cap",
  MICRO_CAP = "Micro Cap",
  UNKNOWN = "Unknown"
}

/**
 * Interface representing a categorized stock
 */
export interface CategorizedStock {
  symbol: string;
  description: string;
  marketCap: string | number;
  marketCapCurrency: string;
}

/**
 * Interface representing categorized stocks result
 */
export interface CategorizedStocksResult {
  largeCap: CategorizedStock[];
  midCap: CategorizedStock[];
  smallCap: CategorizedStock[];
  microCap: CategorizedStock[];
  unknown: CategorizedStock[];
}

/**
 * Interface representing process result with summary
 */
export interface ProcessResult {
  summary: {
    total: number;
    largeCap: number;
    midCap: number;
    smallCap: number;
    microCap: number;
    unknown: number;
  };
  categorizedStocks: CategorizedStocksResult;
}