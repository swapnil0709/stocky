import { useState } from 'react';
import type { CSVRow } from '../../types';
import { calculatePercentFromHigh, extractNumericPrice, addTradingViewSymbols } from '../../utils/stockAnalysis';

interface UseStockAnalysisProps {
  data: CSVRow[];
  priceColumn: string;
  highColumn: string;
}

const useStockAnalysis = ({ data, priceColumn, highColumn }: UseStockAnalysisProps) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Process data with TradingView symbols
  const processedData = addTradingViewSymbols(data);

  // Calculate percent from high for a row
  const calculateRowPercentFromHigh = (row: CSVRow) => {
    // Find price and high columns
    const priceKey = Object.keys(row).find(key => 
      key === priceColumn || key.toLowerCase().includes('price')
    ) || '';
    
    const highKey = Object.keys(row).find(key => 
      key === highColumn || key.toLowerCase().includes('high') || key.toLowerCase().includes('all time')
    ) || '';
    
    // Calculate distance from high
    const price = extractNumericPrice(row[priceKey]);
    const high = extractNumericPrice(row[highKey]);
    const percentFromHigh = calculatePercentFromHigh(price, high);
    
    return {
      value: `${percentFromHigh.toFixed(2)}%`,
      className: percentFromHigh <= 10 ? 'text-green-600' : 'text-yellow-600'
    };
  };

  // Copy all TradingView symbols to clipboard
  const copySymbolsToClipboard = () => {
    // Get all TV symbols
    const symbols = processedData
      .map(row => row["TV SYMBOL"])
      .filter(Boolean) // Remove any undefined values
      .join(',');
    
    navigator.clipboard.writeText(symbols)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy symbols to clipboard:', err);
      });
  };

  return {
    processedData,
    calculateRowPercentFromHigh,
    copySymbolsToClipboard,
    copySuccess
  };
};

export default useStockAnalysis;