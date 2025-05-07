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