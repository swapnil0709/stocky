import React, { useState } from 'react';
import FileUpload from './components/FileUpload/FileUpload';
import StockAnalysis from './components/StockAnalysis/StockAnalysis';
import type { CSVRow } from './types';
import { findStocksWithinThreshold, findColumnNames, findStocksAtAllTimeHigh, sortStocksByProximityToATH } from './utils/stockAnalysis';

const PERCENT_THRESHOLD = 20;
const RECORDS_PER_PAGE = 10;
const ALL_STOCKS_PERCENT_THRESHOLD = 100;

export function AppMain(): React.ReactElement {
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Handle data parsed from uploaded file
  const handleDataParsed = (data: CSVRow[], headers: string[]) => {
    setParsedData(data);
    setHeaders(headers);
  };

  // Find AppMainropriate column names in the data
  const { priceColumn, highColumn } = findColumnNames(headers);

  // Extract stocks that are within PERCENT_THRESHOLD% of their all-time high
  const stocksWithinThreshold = React.useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];
    return findStocksWithinThreshold(parsedData, priceColumn, highColumn, PERCENT_THRESHOLD);
  }, [parsedData, priceColumn, highColumn]);

  const stocksAtAllTimeHigh= React.useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];
    return findStocksAtAllTimeHigh(parsedData, priceColumn, highColumn,ALL_STOCKS_PERCENT_THRESHOLD);
  }, [parsedData, priceColumn, highColumn]);


  return (
    <div className="w-full p-10">
      <FileUpload onDataParsed={handleDataParsed} />
      {stocksWithinThreshold.length > 0 && (
        <div className="mt-8">
          <StockAnalysis 
            data={sortStocksByProximityToATH(stocksWithinThreshold, priceColumn, highColumn)} 
            priceColumn={priceColumn}
            highColumn={highColumn}
            percentThreshold={PERCENT_THRESHOLD}
            RECORDS_PER_PAGE={RECORDS_PER_PAGE}
          />
        </div>
      )}
      {stocksAtAllTimeHigh.length > 0 && (
        <div className="mt-8">
          <StockAnalysis 
            data={sortStocksByProximityToATH(stocksAtAllTimeHigh, priceColumn, highColumn)} 
            priceColumn={priceColumn}
            highColumn={highColumn}
            percentThreshold={ALL_STOCKS_PERCENT_THRESHOLD}
            RECORDS_PER_PAGE={RECORDS_PER_PAGE}
          />
        </div>
      )}
    </div>
  );
}

export default AppMain;